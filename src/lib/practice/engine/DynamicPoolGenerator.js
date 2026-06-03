import { createSeededRandom, seededShuffle } from './VariantGenerator.js';
import { getDifficultyParameters } from './DifficultyEngine.js';

/**
 * Generates an MCQ question variant dynamically from a single pool document.
 * 
 * @param {Object} poolDoc - The pool document fetched from the database
 * @param {string|number} seed - Seed for deterministic random generation
 * @param {string} difficulty - Difficulty override ('easy' | 'medium' | 'hard' | 'adaptive')
 * @param {Object} history - Student practice history for adaptive difficulty scaling
 * @param {string} grade - Current grade (default 'lkg')
 * @returns {Object} Hydrated MCQ question payload compatible with standard WEXLS rendering
 */
export function generateFromDynamicPool(poolDoc, seed, difficulty, history = {}, grade = 'lkg') {
  const prng = createSeededRandom(seed);
  const voice = poolDoc.voice || 'Puck';

  // If the poolDoc has the new 'pools' property, use the new structure
  if (poolDoc.pools) {
    let correctPool = poolDoc.pools.correctPool || [];
    let distractorPool = poolDoc.pools.distractorPool || [];

    // Filter pools for image-only options (when hideOptionLabel is true and hideOptionImages is not true)
    if (poolDoc.hideOptionLabel && !poolDoc.hideOptionImages) {
      correctPool = correctPool.filter(o => o.imageUrl);
      distractorPool = distractorPool.filter(o => o.imageUrl);
    }

    if (correctPool.length === 0) {
      throw new Error('Correct options pool in dynamic_pool document is empty.');
    }

    // 1. Pick a target correct option
    const targetOption = correctPool[Math.floor(prng() * correctPool.length)];
    const targetWord = targetOption.label;
    const targetPrompt = targetOption.prompt || targetWord;
    const targetImage = targetOption.imageUrl || '';
    
    // 2. Fetch difficulty rules
    const params = getDifficultyParameters(history, difficulty, grade);
    const resolvedDifficulty = params.level;

    const rules = (poolDoc.difficultyRules && poolDoc.difficultyRules[resolvedDifficulty]) || 
                  (poolDoc.difficultyRules && poolDoc.difficultyRules.easy) || 
                  { optionCount: 3, correctCount: 1, distractorCount: 2, distractorSimilarity: 'medium', showLabels: true };

    const targetOptionCount = rules.optionCount || 3;
    const neededDistractorCount = Math.max(1, targetOptionCount - 1);

    // 3. Telemetry/Remediation check: find active misconception with highest error count
    let targetWeakness = null;
    const weaknesses = history?.weaknesses || history?.misconceptions || history || {};
    const sortedWeaknesses = Object.entries(weaknesses)
      .filter(([key, val]) => typeof val === 'number' && val > 0)
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedWeaknesses.length > 0) {
      targetWeakness = sortedWeaknesses[0][0]; // E.g., 'movement_confusion'
    }

    // 4. Select distractors from distractor pool
    let selectedDistractors = [];

    // Inject matching misconception distractor if student has a weakness
    if (targetWeakness) {
      const remediationDistractor = distractorPool.find(d => d.misconceptionType === targetWeakness);
      if (remediationDistractor) {
        selectedDistractors.push({ ...remediationDistractor });
      }
    }

    // Filter remaining candidates from distractorPool
    let remainingCandidates = distractorPool.filter(
      d => d.id !== targetOption.id && !selectedDistractors.some(sel => sel.id === d.id)
    );

    // Fallback: if we don't have enough distractors, pull candidates from correctPool
    if (remainingCandidates.length + selectedDistractors.length < neededDistractorCount) {
      const extraCandidates = correctPool
        .filter(c => c.id !== targetOption.id && !selectedDistractors.some(sel => sel.id === c.id))
        .map(c => ({
          ...c,
          isDistractorOnly: true // Treat as distractor for this dynamic variant
        }));
      remainingCandidates = [...remainingCandidates, ...extraCandidates];
    }

    // Filter candidates by similarity if rule is active
    let filteredCandidates = remainingCandidates;
    if (rules.distractorSimilarity) {
      filteredCandidates = remainingCandidates.filter(d => {
        if (rules.distractorSimilarity === 'high') {
          return d.similarity === 'high' || d.similarity === 'medium';
        } else if (rules.distractorSimilarity === 'low') {
          return d.similarity === 'low';
        }
        return d.similarity === 'medium' || d.similarity === 'low';
      });
    }

    // Fallback if similarity filter is too restrictive
    if (filteredCandidates.length === 0) {
      filteredCandidates = remainingCandidates;
    }

    const shuffledCandidates = seededShuffle(filteredCandidates, prng);
    const slotsNeeded = Math.max(0, neededDistractorCount - selectedDistractors.length);
    const additionalDistractors = shuffledCandidates.slice(0, Math.min(slotsNeeded, shuffledCandidates.length));
    
    selectedDistractors = [...selectedDistractors, ...additionalDistractors];

    // Combine and shuffle correct target with distractors
    const rawOptions = [targetOption, ...selectedDistractors];
    const activeOptions = seededShuffle(rawOptions, prng);
    const correctAnswerIndex = activeOptions.findIndex(opt => opt.id === targetOption.id);

    // 5. Interpolation helper
    const interpolate = (templateStr) => {
      if (typeof templateStr !== 'string') return templateStr;
      return templateStr
        .replace(/\{\{target\}\}/g, targetWord)
        .replace(/\{\{targetWord\}\}/g, targetWord)
        .replace(/\{\{targetPrompt\}\}/g, targetPrompt)
        .replace(/\{\{targetImage\}\}/g, targetImage);
    };

    const questionText = interpolate(poolDoc.questionText || "Click on the button. Which word do you hear?");
    const questionAudioUrl = poolDoc.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(questionText)}`;

    const soundText = targetOption.soundText || targetWord;
    const soundUrl = targetOption.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(soundText)}`;

    // Interpolate parts
    const parts = (poolDoc.parts || [
      { type: 'text', content: '{{questionText}}' },
      { type: 'play_sound_card' }
    ]).map(part => {
      const newPart = { ...part };
      if (newPart.content) {
        newPart.content = newPart.content
          .replace(/\{\{questionText\}\}/g, questionText)
          .replace(/\{\{target\}\}/g, targetWord)
          .replace(/\{\{targetWord\}\}/g, targetWord)
          .replace(/\{\{targetPrompt\}\}/g, targetPrompt)
          .replace(/\{\{targetImage\}\}/g, targetImage);
      }
      if (newPart.imageUrl) {
        newPart.imageUrl = newPart.imageUrl.replace(/\{\{targetImage\}\}/g, targetImage);
      }
      if (newPart.audioUrl) {
        newPart.audioUrl = newPart.audioUrl.replace(/\{\{targetAudio\}\}/g, targetOption.audioUrl || '');
      }
      return newPart;
    });

    const hideLabels = (rules.showLabels === false);

    const options = activeOptions.map((opt, idx) => ({
      id: opt.id || `opt_${idx}`,
      label: hideLabels ? '' : opt.label,
      audioUrl: opt.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(opt.label)}`,
      imageUrl: poolDoc.hideOptionImages ? null : (opt.imageUrl || null),
      isCorrect: opt.id === targetOption.id,
      hideLabel: hideLabels || opt.hideLabel || poolDoc.hideOptionLabel || false,
      misconceptionType: opt.misconceptionType || null
    }));

    const feedbackCorrect = poolDoc.feedback?.correct 
      ? interpolate(poolDoc.feedback.correct) 
      : `Great! **${targetWord}** is correct.`;

    const feedbackIncorrect = poolDoc.feedback?.incorrect 
      ? interpolate(poolDoc.feedback.incorrect) 
      : `Not quite correct.`;

    const explanation = targetOption.explanation 
      ? interpolate(targetOption.explanation) 
      : (poolDoc.explanation ? interpolate(poolDoc.explanation) : `The correct answer is **${targetWord}**.`);

    const skillId = poolDoc.skillId || poolDoc.metadata?.skillId;

    return {
      id: `${poolDoc.id || 'dynamic_pool'}_${seed}_${targetWord}`,
      type: 'mcq',
      interaction: poolDoc.interaction || 'choice',
      questionText,
      audioUrl: questionAudioUrl,
      voice,
      generateAudio: poolDoc.generateAudio || 'none',
      soundText,
      soundUrl,
      options,
      correctAnswerIndex,
      correctAnswerIndices: [correctAnswerIndex],
      answer: correctAnswerIndex,
      explanation,
      feedback: {
        correct: feedbackCorrect,
        incorrect: feedbackIncorrect
      },
      parts,
      metadata: {
        ...(poolDoc.metadata || {}),
        subject: poolDoc.subject || 'english',
        topic: poolDoc.topic || 'lkg',
        skillId,
        difficulty: resolvedDifficulty,
        explanation,
        microSkillId: skillId,
        templateId: poolDoc.metadata?.templateId || 'lkg.english.word_recognition',
        engine: 'generator',
        remediationActive: !!targetWeakness,
        targetMisconception: targetWeakness
      }
    };
  }

  // --- LEGACY FALLBACK BLOCK ---
  const params = getDifficultyParameters(history, difficulty, grade);
  
  let pool = poolDoc.options || poolDoc.pool || [];
  if (poolDoc.hideOptionLabel && !poolDoc.hideOptionImages) {
    pool = pool.filter(o => o.imageUrl);
  }
  if (pool.length === 0) {
    throw new Error('Options pool in legacy dynamic_pool document is empty.');
  }

  // Select target correct option
  const targetCandidates = pool.filter(opt => !opt.isDistractorOnly && opt.role !== 'distractor');
  if (targetCandidates.length === 0) {
    throw new Error('No valid target correct options found in legacy pool.');
  }
  const targetOption = targetCandidates[Math.floor(prng() * targetCandidates.length)];
  const targetOriginalIdx = pool.findIndex(opt => opt.label === targetOption.label);

  // Select distractors
  let distractorCandidates = [];
  if (Array.isArray(targetOption.distractors) && targetOption.distractors.length > 0) {
    distractorCandidates = targetOption.distractors.map(d => {
      if (typeof d === 'string') {
        const matchedOpt = pool.find(p => p.label.toLowerCase().trim() === d.toLowerCase().trim());
        if (matchedOpt) {
          return { ...matchedOpt };
        }
        return { label: d };
      }
      return d;
    });
  } else {
    distractorCandidates = pool.filter((_, idx) => idx !== targetOriginalIdx);
  }
  const shuffledDistractors = seededShuffle(distractorCandidates, prng);

  const targetOptionCount = params.optionCount || 3;
  const neededDistractorCount = Math.min(targetOptionCount - 1, shuffledDistractors.length);
  const selectedDistractors = shuffledDistractors.slice(0, neededDistractorCount);

  // Combine and shuffle
  const rawOptions = [targetOption, ...selectedDistractors];
  const activeOptions = seededShuffle(rawOptions, prng);
  const correctAnswerIndex = activeOptions.findIndex(opt => opt.label === targetOption.label);

  const targetWord = targetOption.label;
  const targetPrompt = targetOption.prompt || targetWord;
  const targetImage = targetOption.imageUrl || '';

  const interpolate = (templateStr) => {
    if (typeof templateStr !== 'string') return templateStr;
    return templateStr
      .replace(/\{\{target\}\}/g, targetWord)
      .replace(/\{\{targetWord\}\}/g, targetWord)
      .replace(/\{\{targetPrompt\}\}/g, targetPrompt)
      .replace(/\{\{targetImage\}\}/g, targetImage);
  };

  const questionText = interpolate(poolDoc.questionText || "Click on the button. Which word do you hear?");
  const questionAudioUrl = poolDoc.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(questionText)}`;

  const soundText = targetOption.soundText || targetWord;
  const soundUrl = targetOption.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(soundText)}`;

  const parts = (poolDoc.parts || [
    { type: 'text', content: '{{questionText}}' },
    { type: 'play_sound_card' }
  ]).map(part => {
    const newPart = { ...part };
    if (newPart.content) {
      newPart.content = newPart.content
        .replace(/\{\{questionText\}\}/g, questionText)
        .replace(/\{\{target\}\}/g, targetWord)
        .replace(/\{\{targetWord\}\}/g, targetWord)
        .replace(/\{\{targetPrompt\}\}/g, targetPrompt)
        .replace(/\{\{targetImage\}\}/g, targetImage);
    }
    if (newPart.imageUrl) {
      newPart.imageUrl = newPart.imageUrl.replace(/\{\{targetImage\}\}/g, targetImage);
    }
    if (newPart.audioUrl) {
      newPart.audioUrl = newPart.audioUrl.replace(/\{\{targetAudio\}\}/g, targetOption.audioUrl || '');
    }
    return newPart;
  });

  const options = activeOptions.map((opt, idx) => ({
    id: `opt_${idx}`,
    label: opt.label,
    audioUrl: opt.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(opt.label)}`,
    imageUrl: poolDoc.hideOptionImages ? null : (opt.imageUrl || null),
    isCorrect: opt.label === targetWord,
    hideLabel: opt.hideLabel ?? poolDoc.hideOptionLabel ?? false
  }));

  const explanation = poolDoc.explanation 
    ? interpolate(poolDoc.explanation)
    : `The word you hear is **${targetWord}**.`;

  const skillId = poolDoc.skillId || poolDoc.metadata?.skillId;

  return {
    id: `${poolDoc.id || 'dynamic_pool'}_${seed}_${targetWord}`,
    type: 'mcq',
    interaction: poolDoc.interaction || 'choice',
    questionText,
    audioUrl: questionAudioUrl,
    voice,
    generateAudio: poolDoc.generateAudio || 'none',
    soundText,
    soundUrl,
    options,
    correctAnswerIndex,
    correctAnswerIndices: [correctAnswerIndex],
    answer: correctAnswerIndex,
    explanation,
    parts,
    metadata: {
      ...(poolDoc.metadata || {}),
      subject: poolDoc.subject || 'english',
      topic: poolDoc.topic || 'lkg',
      skillId,
      difficulty: params.level,
      explanation,
      microSkillId: skillId,
      templateId: poolDoc.metadata?.templateId || 'lkg.english.word_recognition',
      engine: 'generator'
    }
  };
}
