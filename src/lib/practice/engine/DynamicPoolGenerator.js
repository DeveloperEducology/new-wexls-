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
  const hasExplicitLabelDisplay = Object.prototype.hasOwnProperty.call(poolDoc, 'hideOptionLabel')
    || Object.prototype.hasOwnProperty.call(poolDoc.metadata || {}, 'hideOptionLabel');
  const configuredHideOptionLabel = Boolean(
    Object.prototype.hasOwnProperty.call(poolDoc, 'hideOptionLabel')
      ? poolDoc.hideOptionLabel
      : poolDoc.metadata?.hideOptionLabel
  );
  const isAllowedForMode = (option, mode) => {
    if (option?.active === false) return false;
    if (!Array.isArray(option?.allowedModes) || option.allowedModes.length === 0) return true;
    return option.allowedModes.includes(mode);
  };

  // If the poolDoc has the new 'pools' property, use the new structure
  if (poolDoc.pools) {
    let correctPool = [];
    let distractorPool = [];

    let resolvedTargetCategory = poolDoc.targetCategory || '';
    const poolKeys = Object.keys(poolDoc.pools).filter(k => k !== 'correctPool' && k !== 'distractorPool');
    const shouldRandomize = poolDoc.randomizeTargetCategory || poolDoc.targetCategory === '[random]' || (!poolDoc.targetCategory && poolKeys.length > 1);

    if (shouldRandomize && poolKeys.length > 0) {
      const randIdx = Math.floor(prng() * poolKeys.length);
      resolvedTargetCategory = poolKeys[randIdx];
    }

    if (resolvedTargetCategory) {
      correctPool = poolDoc.pools[resolvedTargetCategory] || [];
      const distCats = (poolDoc.distractorCategories && poolDoc.distractorCategories.length > 0)
        ? poolDoc.distractorCategories.filter(cat => cat !== resolvedTargetCategory)
        : poolKeys.filter(cat => cat !== resolvedTargetCategory);

      distCats.forEach(cat => {
        const items = poolDoc.pools[cat] || [];
        distractorPool = [...distractorPool, ...items];
      });
    } else {
      correctPool = poolDoc.pools.correctPool || [];
      distractorPool = poolDoc.pools.distractorPool || [];
    }

    const activeMode = poolDoc.mode || 'identify_text';
    correctPool = correctPool.filter(option => isAllowedForMode(option, activeMode));
    distractorPool = distractorPool.filter(option => isAllowedForMode(option, activeMode));

    // Filter pools for image-only options (when mode is identify_visual or when hideOptionLabel is true and hideOptionImages is not true)
    const needsImages = poolDoc.mode === 'identify_visual' || (poolDoc.hideOptionLabel && !poolDoc.hideOptionImages);
    if (needsImages) {
      correctPool = correctPool.filter(o => o.imageUrl && o.assetStatus?.image !== 'needs_review');
      distractorPool = distractorPool.filter(o => o.imageUrl && o.assetStatus?.image !== 'needs_review');
    }

    if (correctPool.length === 0) {
      throw new Error('Correct options pool in dynamic_pool document is empty.');
    }

    const baseIsMultiSelect = poolDoc.interaction === 'multi_select' || poolDoc.multiSelect === true;

    // 2. Fetch difficulty rules
    const params = getDifficultyParameters(history, difficulty, grade);
    const resolvedDifficulty = params.level;

    const rules = (poolDoc.difficultyRules && poolDoc.difficultyRules[resolvedDifficulty]) || 
                  (poolDoc.difficultyRules && poolDoc.difficultyRules.easy) || 
                  { optionCount: baseIsMultiSelect ? 4 : 3, correctCount: baseIsMultiSelect ? 2 : 1, distractorCount: 2, distractorSimilarity: 'medium', showLabels: true };

    const isMultiSelect = baseIsMultiSelect || rules.interaction === 'multi_select' || (rules.correctCount && rules.correctCount > 1);

    const targetOptionCount = rules.optionCount || (isMultiSelect ? 4 : 3);
    const neededCorrectCount = isMultiSelect 
      ? Math.max(2, Math.min(rules.correctCount || 2, correctPool.length, targetOptionCount - 1)) 
      : 1;
    const neededDistractorCount = Math.max(1, targetOptionCount - neededCorrectCount);

    // 1. Pick target correct options
    const shuffledCorrect = seededShuffle(correctPool, prng);
    const targetOptions = shuffledCorrect.slice(0, neededCorrectCount);
    if (targetOptions.length === 0) {
      throw new Error('Correct options pool in dynamic_pool document is empty.');
    }
    const targetOption = targetOptions[0];
    const targetWord = targetOption.label;
    const targetPrompt = targetOption.prompt || targetWord;
    const targetImage = targetOption.imageUrl || '';

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

    // Prioritize thematic distractors defined on any of the selected target options
    targetOptions.forEach(tOpt => {
      if (Array.isArray(tOpt.distractors) && tOpt.distractors.length > 0) {
        tOpt.distractors.forEach(lbl => {
          const matched = distractorPool.find(d => d.label.toLowerCase().trim() === lbl.toLowerCase().trim());
          if (matched && !selectedDistractors.some(sel => sel.id === matched.id)) {
            selectedDistractors.push({ ...matched });
          }
        });
      }
    });

    // Inject matching misconception distractor if student has a weakness
    if (targetWeakness) {
      const remediationDistractor = distractorPool.find(
        d => d.misconceptionType === targetWeakness && !selectedDistractors.some(sel => sel.id === d.id)
      );
      if (remediationDistractor) {
        selectedDistractors.push({ ...remediationDistractor });
      }
    }

    // Filter remaining candidates from distractorPool
    let remainingCandidates = distractorPool.filter(
      d => !targetOptions.some(to => to.id === d.id) && !selectedDistractors.some(sel => sel.id === d.id)
    );

    // Fallback: if we don't have enough distractors, pull candidates from correctPool
    if (remainingCandidates.length + selectedDistractors.length < neededDistractorCount) {
      const extraCandidates = correctPool
        .filter(c => !targetOptions.some(to => to.id === c.id) && !selectedDistractors.some(sel => sel.id === c.id))
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

    // Combine and shuffle correct targets with distractors
    const rawOptions = [...targetOptions, ...selectedDistractors];
    const activeOptions = seededShuffle(rawOptions, prng);

    // 5. Interpolation helper
    const interpolate = (templateStr) => {
      if (typeof templateStr !== 'string') return templateStr;
      return templateStr
        .replace(/\{\{target\}\}/g, targetWord)
        .replace(/\{\{targetWord\}\}/g, targetWord)
        .replace(/\{\{targetPrompt\}\}/g, targetPrompt)
        .replace(/\{\{targetImage\}\}/g, targetImage)
        .replace(/\{\{targetCategory\}\}/g, resolvedTargetCategory || '');
    };

    const questionText = interpolate(poolDoc.questionText || "Click on the button. Which word do you hear?");
    const questionAudioUrl = poolDoc.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(questionText)}`;

    const soundText = targetOption.soundText || targetWord;
    const soundUrl = targetOption.audioUrl && targetOption.assetStatus?.audio !== 'needs_review'
      ? targetOption.audioUrl
      : `/api/tts?voice=${voice}&text=${encodeURIComponent(soundText)}`;

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
          .replace(/\{\{targetImage\}\}/g, targetImage)
          .replace(/\{\{targetCategory\}\}/g, resolvedTargetCategory || '');
      }
      if (newPart.imageUrl) {
        newPart.imageUrl = newPart.imageUrl.replace(/\{\{targetImage\}\}/g, targetImage);
      }
      if (newPart.audioUrl) {
        newPart.audioUrl = newPart.audioUrl.replace(/\{\{targetAudio\}\}/g, targetOption.audioUrl || '');
      }
      return newPart;
    });

    // An author-selected Option Display mode takes precedence over adaptive
    // difficulty rules. Older pool documents without this field keep the
    // existing difficulty-driven label behavior.
    const hideLabels = hasExplicitLabelDisplay
      ? configuredHideOptionLabel
      : rules.showLabels === false;

    const options = activeOptions.map((opt, idx) => ({
      id: opt.id || `opt_${idx}`,
      label: hideLabels ? '' : opt.label,
      audioUrl: opt.audioUrl && opt.assetStatus?.audio !== 'needs_review'
        ? opt.audioUrl
        : `/api/tts?voice=${voice}&text=${encodeURIComponent(opt.label)}`,
      imageUrl: poolDoc.hideOptionImages || opt.assetStatus?.image === 'needs_review'
        ? null
        : (opt.imageUrl || null),
      isCorrect: targetOptions.some(to => to.id === opt.id),
      hideLabel: hasExplicitLabelDisplay ? hideLabels : (hideLabels || opt.hideLabel || false),
      misconceptionType: opt.misconceptionType || null
    }));

    const feedbackCorrect = poolDoc.feedback?.correct 
      ? interpolate(poolDoc.feedback.correct) 
      : (isMultiSelect ? `Great! You selected all correct words.` : `Great! **${targetWord}** is correct.`);

    const feedbackIncorrect = poolDoc.feedback?.incorrect 
      ? interpolate(poolDoc.feedback.incorrect) 
      : `Not quite correct.`;

    const explanation = targetOption.explanation 
      ? interpolate(targetOption.explanation) 
      : (poolDoc.explanation
          ? interpolate(poolDoc.explanation)
          : (isMultiSelect
              ? `The correct words are: ${targetOptions.map(to => `**${to.label}**`).join(', ')}.`
              : `The correct answer is **${targetWord}**.`));

    const skillId = poolDoc.skillId || poolDoc.metadata?.skillId;

    const correctAnswerIndices = activeOptions
      .map((opt, idx) => (options[idx].isCorrect ? idx : null))
      .filter(idx => idx !== null);
    const correctAnswerIndex = correctAnswerIndices[0] ?? -1;

    return {
      id: `${poolDoc.id || 'dynamic_pool'}_${seed}_${targetWord}`,
      type: 'mcq',
      interaction: isMultiSelect ? 'multi_select' : (poolDoc.interaction || 'choice'),
      questionText,
      audioUrl: questionAudioUrl,
      voice,
      generateAudio: poolDoc.generateAudio || 'none',
      soundText,
      soundUrl,
      options,
      correctAnswerIndex,
      correctAnswerIndices,
      answer: isMultiSelect ? correctAnswerIndices : correctAnswerIndex,
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
        targetMisconception: targetWeakness,
        targetCategory: resolvedTargetCategory
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

  // Select target correct options
  const targetCandidates = pool.filter(opt => !opt.isDistractorOnly && opt.role !== 'distractor');
  if (targetCandidates.length === 0) {
    throw new Error('No valid target correct options found in legacy pool.');
  }

  const baseIsMultiSelect = poolDoc.interaction === 'multi_select' || poolDoc.multiSelect === true;
  const isMultiSelect = baseIsMultiSelect || params.interaction === 'multi_select' || (params.correctCount && params.correctCount > 1);
  const targetOptionCount = params.optionCount || (isMultiSelect ? 4 : 3);
  const neededCorrectCount = isMultiSelect
    ? Math.max(2, Math.min(params.correctCount || 2, targetCandidates.length, targetOptionCount - 1))
    : 1;

  const shuffledTargetCandidates = seededShuffle(targetCandidates, prng);
  const targetOptions = shuffledTargetCandidates.slice(0, neededCorrectCount);
  const targetOption = targetOptions[0];
  const targetWord = targetOption.label;
  const targetPrompt = targetOption.prompt || targetWord;
  const targetImage = targetOption.imageUrl || '';

  // Select distractors
  let distractorCandidates = [];
  // Prioritize distractors from target options
  targetOptions.forEach(tOpt => {
    if (Array.isArray(tOpt.distractors) && tOpt.distractors.length > 0) {
      tOpt.distractors.forEach(d => {
        if (typeof d === 'string') {
          const matchedOpt = pool.find(p => p.label.toLowerCase().trim() === d.toLowerCase().trim());
          if (matchedOpt && !distractorCandidates.some(dc => dc.label === matchedOpt.label)) {
            distractorCandidates.push({ ...matchedOpt });
          } else if (!distractorCandidates.some(dc => dc.label === d)) {
            distractorCandidates.push({ label: d });
          }
        } else if (!distractorCandidates.some(dc => dc.label === d.label)) {
          distractorCandidates.push(d);
        }
      });
    }
  });

  // If we don't have enough from targets' explicit distractors, pull the rest from pool
  const otherCandidates = pool.filter(opt => !targetOptions.some(to => to.label === opt.label) && !distractorCandidates.some(dc => dc.label === opt.label));
  const shuffledOther = seededShuffle(otherCandidates, prng);
  distractorCandidates = [...distractorCandidates, ...shuffledOther];

  const neededDistractorCount = Math.max(1, targetOptionCount - neededCorrectCount);
  const selectedDistractors = distractorCandidates.slice(0, Math.min(neededDistractorCount, distractorCandidates.length));

  // Combine and shuffle
  const rawOptions = [...targetOptions, ...selectedDistractors];
  const activeOptions = seededShuffle(rawOptions, prng);

  const interpolate = (templateStr) => {
    if (typeof templateStr !== 'string') return templateStr;
    return templateStr
      .replace(/\{\{target\}\}/g, targetWord)
      .replace(/\{\{targetWord\}\}/g, targetWord)
      .replace(/\{\{targetPrompt\}\}/g, targetPrompt)
      .replace(/\{\{targetImage\}\}/g, targetImage)
      .replace(/\{\{targetCategory\}\}/g, poolDoc.targetCategory || '');
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
        .replace(/\{\{targetImage\}\}/g, targetImage)
        .replace(/\{\{targetCategory\}\}/g, poolDoc.targetCategory || '');
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
    isCorrect: targetOptions.some(to => to.label === opt.label),
    hideLabel: opt.hideLabel ?? poolDoc.hideOptionLabel ?? false
  }));

  const explanation = poolDoc.explanation 
    ? interpolate(poolDoc.explanation)
    : (isMultiSelect
        ? `The correct words are: ${targetOptions.map(to => `**${to.label}**`).join(', ')}.`
        : `The word you hear is **${targetWord}**.`);

  const skillId = poolDoc.skillId || poolDoc.metadata?.skillId;

  const correctAnswerIndices = activeOptions
    .map((opt, idx) => (options[idx].isCorrect ? idx : null))
    .filter(idx => idx !== null);
  const correctAnswerIndex = correctAnswerIndices[0] ?? -1;

  return {
    id: `${poolDoc.id || 'dynamic_pool'}_${seed}_${targetWord}`,
    type: 'mcq',
    interaction: isMultiSelect ? 'multi_select' : (poolDoc.interaction || 'choice'),
    questionText,
    audioUrl: questionAudioUrl,
    voice,
    generateAudio: poolDoc.generateAudio || 'none',
    soundText,
    soundUrl,
    options,
    correctAnswerIndex,
    correctAnswerIndices,
    answer: isMultiSelect ? correctAnswerIndices : correctAnswerIndex,
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
