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
    const isPickFromSentence = poolDoc.interaction === 'pick_from_sentence'
      || poolDoc.metadata?.interaction === 'pick_from_sentence'
      || poolDoc.mode === 'pick_from_sentence';

    if (isPickFromSentence) {
      const poolKeys = Object.keys(poolDoc.pools).filter(k => k !== 'correctPool' && k !== 'distractorPool');
      const configuredCategory = poolDoc.targetCategory || poolDoc.metadata?.targetCategory || poolDoc.category || poolKeys[0] || '';
      const shouldRandomizeCategory = configuredCategory === '[random]'
        || poolDoc.randomizeTargetCategory === true
        || poolDoc.metadata?.randomizeTargetCategory === true;
      const eligiblePoolKeys = poolKeys.filter(key => Array.isArray(poolDoc.pools[key]) && poolDoc.pools[key].length > 0);
      const resolvedCategory = shouldRandomizeCategory
        ? (eligiblePoolKeys[Math.floor(prng() * eligiblePoolKeys.length)] || poolKeys[0] || '')
        : configuredCategory;
      const sentencePool = poolDoc.pools[resolvedCategory] || [];

      if (sentencePool.length === 0) {
        throw new Error(`Sentence pool category '${resolvedCategory}' is empty.`);
      }

      // Pick a random sentence from the pool
      const selectedSentence = sentencePool[Math.floor(prng() * sentencePool.length)];
      if (!selectedSentence || typeof selectedSentence !== 'object') {
        throw new Error(`Invalid sentence object selected from category '${resolvedCategory}'.`);
      }

      const sentenceText = selectedSentence.text || selectedSentence.sentence || "";
      const skillId = poolDoc.skillId || poolDoc.metadata?.skillId;
      const targetKey = poolDoc.targetKey 
        || poolDoc.metadata?.targetKey 
        || (
          skillId?.includes('verb') ? 'verbs' : 
          skillId?.includes('adjective') ? 'adjectives' : 
          skillId?.includes('vowel') ? 'vowels' : 
          skillId?.includes('consonant') ? 'consonants' : 
          'nouns'
        );
      const targetWords = selectedSentence[targetKey] || selectedSentence.nouns || selectedSentence.targets || selectedSentence.correctAnswer || [];

      // Tokenize the sentence text
      const normalizeWord = (value) => String(value || '').toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
      const targetSet = new Set(targetWords.map(normalizeWord));

      const tokens = sentenceText.split(/\s+/).map((rawWord, index) => {
        const leading = rawWord.match(/^[^A-Za-z0-9]*/)?.[0] || '';
        const trailing = rawWord.match(/[^A-Za-z0-9]*$/)?.[0] || '';
        const text = rawWord.slice(leading.length, rawWord.length - trailing.length);
        const normalized = normalizeWord(text);

        return {
          id: `word_${index}_${normalized || 'token'}`,
          text,
          display: text,
          leading,
          trailing,
          selectable: true,
          isTarget: targetSet.has(normalized)
        };
      });

      const targetTokenIds = tokens.filter(t => t.isTarget).map(t => t.id).join('|');
      const targetCount = tokens.filter(t => t.isTarget).length;
      
      const questionText = poolDoc.questionText || (targetCount > 1 ? 'Select the correct words in the sentence.' : 'Select the correct word in the sentence.');
      const questionAudioUrl = poolDoc.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(questionText)}`;

      const parts = [
        {
          type: 'text',
          content: questionText,
          isVertical: true,
          style: {
            fontSize: '28px',
            fontWeight: 400,
            color: '#000',
            textAlign: 'left'
          }
        },
        {
          type: 'pick_from_sentence',
          answerKey: 'selectedTokens',
          sentence: sentenceText,
          tokens,
          multiSelect: targetCount > 1,
          fontSize: 42,
          isVertical: true,
          style: {
            marginTop: 18,
            marginBottom: 8
          }
        }
      ];

      const answer = {
        selectedTokens: targetTokenIds
      };

      const wordList = targetWords.join(' and ');
      const explanation = poolDoc.explanation || `The correct word${targetCount > 1 ? 's are' : ' is'} **${wordList}**.`;

      return {
        id: `${poolDoc.id || 'pick_from_sentence_pool'}_${seed}_${Math.floor(prng() * 1000000)}`,
        type: 'fillInTheBlank',
        interaction: 'pick_from_sentence',
        targetKey,
        questionText,
        audioUrl: questionAudioUrl,
        voice,
        answer,
        correctAnswer: answer,
        correctAnswerText: JSON.stringify(answer),
        metaConfig: {
          ...(poolDoc.metaConfig || {}),
          readable: true,
          readOptions: true,
          hasClickToFill: true
        },
        explanation,
        solution: poolDoc.solution || {
          sections: [
            { type: 'text', content: explanation }
          ]
        },
        parts,
        metadata: {
          ...(poolDoc.metadata || {}),
          subject: poolDoc.subject || 'english',
          topic: poolDoc.topic || 'grammar',
          skillId,
          difficulty,
          targetKey,
          targetCategory: resolvedCategory,
          configuredTargetCategory: configuredCategory,
          randomizeTargetCategory: shouldRandomizeCategory,
          templateId: poolDoc.metadata?.templateId || 'grammar.sentence.select',
          engine: 'dynamic_pool_pick_from_sentence',
          sentence: sentenceText,
          targets: targetWords,
          interaction: 'pick_from_sentence'
        }
      };
    }

    const isWordCompletion = poolDoc.layoutMode === 'word_completion'
      || poolDoc.metadata?.layoutMode === 'word_completion'
      || poolDoc.mode === 'word_completion';

    if (isWordCompletion) {
      const resolveMissingLetterMode = () => {
        const configured = poolDoc.missingLetterMode || poolDoc.metadata?.missingLetterMode;
        const validConfigured = ['beginning', 'middle', 'ending'].includes(configured) ? configured : '';
        const modeText = [
          poolDoc.skillId,
          poolDoc.metadata?.skillId,
          poolDoc.id,
          poolDoc.title,
          poolDoc.metadata?.title,
          poolDoc.questionText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const inferred = modeText.includes('ending')
          ? 'ending'
          : modeText.includes('middle')
            ? 'middle'
            : '';

        if (validConfigured && validConfigured !== 'beginning') return validConfigured;
        if (inferred) return inferred;
        return validConfigured || 'beginning';
      };
      const missingLetterMode = resolveMissingLetterMode();
      const getWordCompletionFields = (word) => {
        const label = String(word?.label || word?.id || '').trim().toLowerCase();
        const initial = word?.initial || label[0] || '';
        const ending = word?.ending || label.slice(1);
        const middle = word?.middle || (label.length >= 3 ? label[1] : label[0]) || '';
        const endingLetter = word?.endingLetter || label[label.length - 1] || '';

        if (missingLetterMode === 'middle') {
          return {
            answer: middle,
            prefix: word?.middlePrefix || initial,
            suffix: word?.middleSuffix || label.slice(2),
            pattern: word?.middlePattern || `${initial}_${label.slice(2)}`,
          };
        }

        if (missingLetterMode === 'ending') {
          return {
            answer: endingLetter,
            prefix: word?.endingPrefix || label.slice(0, -1),
            suffix: word?.endingSuffix || '',
            pattern: word?.endingPattern || `${label.slice(0, -1)}_`,
          };
        }

        return {
          answer: initial,
          prefix: word?.beginningPrefix || '',
          suffix: word?.beginningSuffix || ending,
          pattern: word?.beginningPattern || `_${ending}`,
        };
      };
      const poolKeys = Object.keys(poolDoc.pools).filter(k => k !== 'correctPool' && k !== 'distractorPool');
      const configuredCategory = poolDoc.targetCategory || poolDoc.metadata?.targetCategory || poolDoc.category || poolKeys[0] || '';
      const eligiblePoolKeys = poolKeys.filter((key) => (
        (poolDoc.pools[key] || [])
          .filter(option => option?.active !== false)
          .filter(option => option?.label && getWordCompletionFields(option).answer)
          .length >= 2
      ));
      const shouldRandomizeCategory = configuredCategory === '[random]'
        || poolDoc.randomizeTargetCategory === true
        || poolDoc.metadata?.randomizeTargetCategory === true;
      const resolvedCategory = shouldRandomizeCategory
        ? (eligiblePoolKeys[Math.floor(prng() * eligiblePoolKeys.length)] || eligiblePoolKeys[0] || poolKeys[0] || '')
        : configuredCategory;
      const wordPool = (poolDoc.pools[resolvedCategory] || [])
        .filter(option => option?.active !== false)
        .filter(option => option?.label && getWordCompletionFields(option).answer);

      if (wordPool.length < 2) {
        throw new Error(`Word completion pool needs at least 2 words with labels and ${missingLetterMode} letter data.`);
      }

      const requestedWordCount = Math.max(2, Number(poolDoc.wordCount || poolDoc.itemsPerCategory || 2) || 2);
      const shuffledWords = seededShuffle(wordPool, prng);
      const selectedWords = [];
      const usedAnswers = new Set();

      for (const word of shuffledWords) {
        const answerKey = String(getWordCompletionFields(word).answer || '').toLowerCase();
        if (!usedAnswers.has(answerKey) || selectedWords.length >= requestedWordCount - 1) {
          selectedWords.push(word);
          usedAnswers.add(answerKey);
        }
        if (selectedWords.length >= requestedWordCount) break;
      }

      if (selectedWords.length < requestedWordCount) {
        shuffledWords.forEach(word => {
          if (selectedWords.length < requestedWordCount && !selectedWords.some(selected => selected.id === word.id)) {
            selectedWords.push(word);
          }
        });
      }

      const wordFields = selectedWords.map(getWordCompletionFields);

      const items = selectedWords.map((word, index) => {
        const answer = wordFields[index].answer;
        return {
          id: `letter_${index + 1}`,
          content: answer,
          label: answer,
          audioUrl: word.audioUrl && word.assetStatus?.audio !== 'needs_review'
            ? word.audioUrl
            : `/api/tts?voice=${voice}&text=${encodeURIComponent(answer)}`,
        };
      });

      const wordCards = selectedWords.map((word, index) => ({
        id: `slot_${index + 1}`,
        label: word.label,
        imageUrl: word.imageUrl || '',
        audioUrl: word.audioUrl && word.assetStatus?.audio !== 'needs_review'
          ? word.audioUrl
          : `/api/tts?voice=${voice}&text=${encodeURIComponent(word.label)}`,
        initial: word.initial,
        middle: word.middle,
        endingLetter: word.endingLetter,
        ending: wordFields[index].suffix,
        prefix: wordFields[index].prefix,
        pattern: wordFields[index].pattern,
        answer: wordFields[index].answer,
        missingLetterMode,
      }));

      const answer = Object.fromEntries(wordCards.map((card, index) => [card.id, items[index].id]));
      const shuffledItems = seededShuffle(items, prng);
      const questionText = poolDoc.questionText || 'Complete the words.';
      const questionAudioUrl = poolDoc.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(questionText)}`;
      const parts = [
        ...(poolDoc.parts || [{ type: 'text', content: questionText }]).filter(part => part.type !== 'categorizationv2' && part.type !== 'categorization'),
        {
          type: 'categorizationv2',
          layoutMode: 'word_completion',
          renderer: 'html5',
          items: shuffledItems,
          wordCards,
          answerKey: answer,
        }
      ];

      const skillId = poolDoc.skillId || poolDoc.metadata?.skillId;
      return {
        id: `${poolDoc.id || 'word_completion_pool'}_${seed}_${selectedWords.map(word => word.id || word.label).join('_')}`,
        type: 'categorizationv2',
        interaction: 'categorizationv2',
        layoutMode: 'word_completion',
        questionText,
        audioUrl: questionAudioUrl,
        voice,
        items: shuffledItems,
        wordCards,
        answer,
        correctAnswer: answer,
        explanation: poolDoc.explanation || `The missing ${missingLetterMode} sounds are ${wordFields.map(field => field.answer).join(' and ')}.`,
        solution: poolDoc.solution || {
          sections: [
            { type: 'text', content: poolDoc.explanation || `Complete each word by matching the missing ${missingLetterMode} sound to the picture.` }
          ]
        },
        parts,
        metadata: {
          ...(poolDoc.metadata || {}),
          subject: poolDoc.subject || 'english',
          topic: poolDoc.topic || 'phonics',
          skillId,
          difficulty,
          targetCategory: resolvedCategory,
          configuredTargetCategory: configuredCategory,
          randomizeTargetCategory: shouldRandomizeCategory,
          missingLetterMode,
          templateId: poolDoc.metadata?.templateId || 'phonics.word_completion',
          engine: 'dynamic_pool_word_completion',
        }
      };
    }

    const isCategorization = poolDoc.interaction === 'categorization' || poolDoc.type === 'categorization' || poolDoc.interaction === 'categorizationv2';
    if (isCategorization) {
      let categories = poolDoc.categories;
      if (!categories || categories.length === 0) {
        const poolKeys = Object.keys(poolDoc.pools).filter(k => k !== 'correctPool' && k !== 'distractorPool');
        categories = poolKeys.map(key => ({
          id: key,
          label: key.charAt(0).toUpperCase() + key.slice(1)
        }));
      } else {
        categories = categories.map(cat => (typeof cat === 'string' ? { id: cat, label: cat } : cat));
      }

      const params = getDifficultyParameters(history, difficulty, grade);
      const resolvedDifficulty = params.level;

      const rules = (poolDoc.difficultyRules && poolDoc.difficultyRules[resolvedDifficulty]) || 
                    (poolDoc.difficultyRules && poolDoc.difficultyRules.easy) || 
                    {};

      // Fallback defaults for categorization difficulty scaling
      const defaultMaxCategories = resolvedDifficulty === 'easy' ? 2 : 3;
      const defaultItemsPerCategory = resolvedDifficulty === 'hard' ? 3 : 2;

      const maxCategories = rules.maxCategories || rules.categoryCount || defaultMaxCategories;
      let activeCategories = [...categories];
      if (maxCategories < activeCategories.length) {
        activeCategories = seededShuffle(activeCategories, prng).slice(0, maxCategories);
        activeCategories.sort((a, b) => categories.findIndex(c => c.id === a.id) - categories.findIndex(c => c.id === b.id));
      }

      const itemsPerCategory = rules.itemsPerCategory || rules.itemCount || poolDoc.itemsPerCategory || defaultItemsPerCategory;
      const activeMode = poolDoc.mode || 'identify_text';
      const needsImages = poolDoc.mode === 'identify_visual' || (poolDoc.hideOptionLabel && !poolDoc.hideOptionImages);

      let items = [];
      const answer = {};

      activeCategories.forEach(cat => {
        let catPool = poolDoc.pools[cat.id] || [];
        catPool = catPool.filter(option => isAllowedForMode(option, activeMode));
        if (needsImages) {
          catPool = catPool.filter(o => o.imageUrl && o.assetStatus?.image !== 'needs_review');
        }

        const shuffledCatPool = seededShuffle(catPool, prng);
        const chosenForCat = shuffledCatPool.slice(0, Math.min(itemsPerCategory, shuffledCatPool.length));

        chosenForCat.forEach((opt, idx) => {
          items.push({
            id: opt.id || `item_${cat.id}_${idx}`,
            content: opt.label,
            label: opt.label,
            ...(opt.imageUrl ? { imageUrl: opt.imageUrl } : {}),
            ...(opt.audioUrl && opt.assetStatus?.audio !== 'needs_review'
              ? { audioUrl: opt.audioUrl }
              : { audioUrl: `/api/tts?voice=${voice}&text=${encodeURIComponent(opt.label)}` }),
            target: cat.id,
            categoryId: cat.id
          });
          answer[opt.id || `item_${cat.id}_${idx}`] = cat.id;
        });
      });

      const shuffledItems = seededShuffle(items, prng);
      if (shuffledItems.length === 0) {
        throw new Error('Items pool for categorization is empty.');
      }

      const questionText = poolDoc.questionText || 'Sort the items into the correct categories.';
      const questionAudioUrl = poolDoc.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(questionText)}`;

      const explanation = poolDoc.explanation || 'Drag each item into its correct group.';
      const solution = poolDoc.solution || {
        sections: [
          { type: 'text', content: explanation }
        ]
      };

      const isCatV2 = poolDoc.type === 'categorizationv2' || poolDoc.interaction === 'categorizationv2';
      
      const parts = poolDoc.parts ? poolDoc.parts.map(part => {
        const newPart = { ...part };
        if (newPart.content) {
          newPart.content = newPart.content.replace(/\{\{questionText\}\}/g, questionText);
        }
        return newPart;
      }) : [
        { type: 'text', content: questionText }
      ];

      if (!parts.some(p => p.type === 'categorization' || p.type === 'categorizationv2')) {
        parts.push({
          type: isCatV2 ? 'categorizationv2' : 'categorization',
          categories: activeCategories,
          items: shuffledItems,
          answerKey: answer,
          isVertical: true
        });
      } else {
        const catPartIdx = parts.findIndex(p => p.type === 'categorization' || p.type === 'categorizationv2');
        parts[catPartIdx] = {
          ...parts[catPartIdx],
          categories: activeCategories,
          items: shuffledItems,
          answerKey: answer
        };
      }

      const skillId = poolDoc.skillId || poolDoc.metadata?.skillId;

      return {
        id: `${poolDoc.id || 'dynamic_pool'}_${seed}_sort`,
        type: isCatV2 ? 'categorizationv2' : 'categorization',
        interaction: isCatV2 ? 'categorizationv2' : 'categorization',
        questionText,
        audioUrl: questionAudioUrl,
        voice,
        categories: activeCategories,
        items: shuffledItems,
        answer,
        correctAnswer: answer,
        explanation,
        solution,
        parts,
        metadata: {
          ...(poolDoc.metadata || {}),
          subject: poolDoc.subject || 'science',
          topic: poolDoc.topic || 'general',
          skillId,
          difficulty: resolvedDifficulty,
          templateId: poolDoc.metadata?.templateId || 'dynamic.categorization',
          engine: 'generator',
          activeCategories: activeCategories.map(c => c.id)
        }
      };
    }

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
        .replace(/\{\{voice\}\}/g, voice)
        .replace(/\{\{targetCategory\}\}/g, resolvedTargetCategory || '');
    };

    const questionText = interpolate(poolDoc.questionText || "Click on the button. Which word do you hear?");
    const questionAudioUrl = poolDoc.audioUrl || `/api/tts?voice=${voice}&text=${encodeURIComponent(questionText)}`;

    const soundText = poolDoc.soundText
      ? interpolate(poolDoc.soundText)
      : (targetOption.soundText || targetWord);
    const soundUrl = poolDoc.soundText
      ? `/api/tts?voice=${voice}&text=${encodeURIComponent(soundText)}`
      : (targetOption.audioUrl && targetOption.assetStatus?.audio !== 'needs_review'
          ? targetOption.audioUrl
          : `/api/tts?voice=${voice}&text=${encodeURIComponent(soundText)}`);

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
        newPart.audioUrl = interpolate(newPart.audioUrl.replace(/\{\{targetAudio\}\}/g, targetOption.audioUrl || ''));
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
