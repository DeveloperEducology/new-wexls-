import { NextResponse } from 'next/server';
import {
  createAdditionTopicTemplate,
  generateAdditionTopicQuestion,
} from '../../../lib/practice/generators/math/topics/addition';
import {
  createSubtractionTopicTemplate,
  generateSubtractionTopicQuestion,
} from '../../../lib/practice/generators/math/topics/subtraction';
import {
  getTimeTemplateConfig,
} from '../../../lib/practice/generators/math/topics/time';
import { timeGenerator } from '../../../lib/practice/generators/math/topics/time/registry.js';
import {
  generateFractionsV2Question,
  getFractionsV2TemplateConfig,
} from '../../../lib/practice/generators/math/topics/fractions/index.js';
import {
  getPlaceValueTemplateConfig,
} from '../../../lib/practice/generators/math/topics/place-values/index.js';
import { placeValueGenerator } from '../../../lib/practice/generators/math/topics/place-values/registry.js';
import {
  generateTestingQuestion,
  getTestingTemplateConfig,
} from '../../../lib/practice/generators/math/topics/testing/index.js';
import {
  generateSOMTopicQuestion,
  getSOMSkill,
} from '../../../lib/practice/generators/math/topics/standard-object-measurement/index.js';

import { generateSmartGKQuestion } from '../../../lib/practice/generators/social/topics/gk/index.js';
import { gkGenerators } from '../../../lib/practice/generators/social/topics/gk/registry.js';
import { resolveCompetency } from '../../../lib/competency/index.js';
import {
  createMultiplicationTemplate,
  generateMultiplicationQuestion,
} from '../../../lib/practice/generators/math/topics/multiplication';
import { resolveUnitsMeasurementGenerator } from '../../../lib/practice/generators/science/topics/units-measurement/index.js';
import { resolveSolarSystemGenerator } from '../../../lib/practice/generators/science/topics/solar-system/index.js';
import { resolveChemicalReactionsGenerator } from '../../../lib/practice/generators/science/topics/chemical-reactions/registry.js';
import {
  generateRatioQuestion,
} from '../../../lib/practice/generators/math/topics/ratio/index.js';
import { resolveStoredPracticePayload } from '../../../lib/practice/questionBank/questionResolver.js';
import { getCurriculumNode, listCurriculumNodes } from '../../../lib/curriculum/index.js';
import { findTopicContract } from '../../../lib/practice/topicContracts.js';

function resolveSkill(searchParams) {
  return searchParams.get('skill')
    || searchParams.get('forcedTask')
    || searchParams.get('logic_type')
    || 'addition-g1-e3-model-match-to-10';
}

const PRACTICE_CACHE_TTL_MS = 5 * 60 * 1000;
const PRACTICE_CACHE_MAX_ENTRIES = 400;
const practiceQuestionCache = new Map();

function makePracticeCacheKey(searchParams, fallbackSeed) {
  const entries = Array.from(searchParams.entries());
  if (!searchParams.has('seed')) {
    entries.push(['seed', fallbackSeed]);
  }
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function readPracticeCache(cacheKey) {
  if (process.env.NODE_ENV === 'development') return null;
  const entry = practiceQuestionCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > PRACTICE_CACHE_TTL_MS) {
    practiceQuestionCache.delete(cacheKey);
    return null;
  }
  return entry.payload;
}

function writePracticeCache(cacheKey, payload) {
  if (!payload?.success || !payload?.question) return;
  practiceQuestionCache.set(cacheKey, {
    createdAt: Date.now(),
    payload,
  });
  if (practiceQuestionCache.size > PRACTICE_CACHE_MAX_ENTRIES) {
    const oldestKey = practiceQuestionCache.keys().next().value;
    practiceQuestionCache.delete(oldestKey);
  }
}

async function resolveTemplatePools(templateDoc) {
  const copy = JSON.parse(JSON.stringify(templateDoc));
  const { findVocabularyPool } = await import('../../../lib/practice/questionBank/questionRepository.js');
  
  // Collect all unique poolIds
  const poolIds = new Set();
  if (Array.isArray(copy.variables)) {
    copy.variables.forEach(v => {
      if (v.type === 'pool_selection' && v.poolId) {
        poolIds.add(v.poolId);
      }
    });
  }
  if (Array.isArray(copy.dataSources)) {
    copy.dataSources.forEach(ds => {
      if (ds.type === 'pool_selection' && ds.poolId) {
        poolIds.add(ds.poolId);
      }
    });
  }
  
  // Fetch all pools
  const loadedPools = {};
  for (const poolId of poolIds) {
    try {
      const poolDoc = await findVocabularyPool(poolId);
      if (poolDoc) {
        loadedPools[poolId] = poolDoc;
      }
    } catch (err) {
      console.error(`Failed to fetch vocabulary pool ${poolId}:`, err);
    }
  }
  
  const matchesPropertyFilter = (option, property, value) => {
    const prop = String(property || '').trim();
    const expected = String(value || '').trim();
    if (!prop || !expected) return true;
    const actual = option?.[prop];
    if (Array.isArray(actual)) {
      return actual.map(entry => String(entry).toLowerCase()).includes(expected.toLowerCase());
    }
    return String(actual ?? '').toLowerCase() === expected.toLowerCase();
  };

  // Inject variable lists from loadedPools
  if (Array.isArray(copy.variables)) {
    copy.variables = copy.variables.map(v => {
      if (v.type === 'pool_selection' && v.poolId) {
        const poolDoc = loadedPools[v.poolId];
        if (poolDoc) {
          const targetCats = v.targetCategories?.length > 0 ? v.targetCategories 
                            : v.category ? [v.category] 
                            : ['targets'];
          let words = targetCats.flatMap(cat => poolDoc.pools?.[cat] || []);
          if (v.targetProperty && v.targetValue) {
            words = words.filter(item => matchesPropertyFilter(item, v.targetProperty, v.targetValue));
          }
          return {
            ...v,
            items: words
          };
        }
      }
      return v;
    });
  }
  
  // Inject dataSources lists from loadedPools
  if (Array.isArray(copy.dataSources)) {
    copy.dataSources = copy.dataSources.map(ds => {
      if (ds.type === 'pool_selection' && ds.poolId) {
        const poolDoc = loadedPools[ds.poolId];
        if (poolDoc) {
          const targetCats = ds.targetCategories?.length > 0 ? ds.targetCategories 
                            : ds.category ? [ds.category] 
                            : ['targets'];
          let correctItems = targetCats.flatMap(cat => poolDoc.pools?.[cat] || []);
          const targetSet = new Set(targetCats);
          let distractorItems = Object.entries(poolDoc.pools || {})
            .filter(([cat]) => !targetSet.has(cat) && cat !== 'correctPool' && cat !== 'distractorPool')
            .flatMap(([, items]) => items);
          const categoryLabel = poolDoc.categoryLabels?.[targetCats[0]] || targetCats[0] || '';
          
          if (ds.targetProperty && ds.targetValue) {
            correctItems = correctItems.filter(item => matchesPropertyFilter(item, ds.targetProperty, ds.targetValue));
          }
          if (ds.distractorProperty && ds.distractorValue) {
            distractorItems = distractorItems.filter(item => matchesPropertyFilter(item, ds.distractorProperty, ds.distractorValue));
          }

          return {
            ...ds,
            items: correctItems,
            _distractorItems: distractorItems,
            _categoryLabel: categoryLabel
          };
        }
      }
      return ds;
    });
  }
  
  return copy;
}

async function evaluateUniversalOrPoolTemplate({
  resolvedTemplateDoc,
  seed,
  difficulty,
  searchParams,
  grade
}) {
  if (searchParams) {
    const seenItems = (searchParams.get('seenItems') || '').split(',').filter(Boolean);
    resolvedTemplateDoc._seenItemIds = seenItems;
  }

  if (resolvedTemplateDoc.templateId === 'ordinal_picture_identification') {
    const { generateOrdinalQuestion } = await import('../../../lib/practice/generators/math/topics/ordinal-numbers/ordinalGenerator.js');
    return generateOrdinalQuestion(resolvedTemplateDoc, seed);
  }

  if (resolvedTemplateDoc.templateId === 'template-writing-numbers-in-words' || resolvedTemplateDoc.templateId === 'write_number_words_to_digits_single_select') {
    const { generateNumberWordsQuestion } = await import('../../../lib/practice/generators/math/topics/ordinal-numbers/numberWordsGenerator.js');
    return generateNumberWordsQuestion(resolvedTemplateDoc, seed);
  }

  if (resolvedTemplateDoc.templateId === 'g1-sequences-100') {
    const { generateSequencesQuestion } = await import('../../../lib/practice/generators/math/topics/ordinal-numbers/sequencesGenerator.js');
    return generateSequencesQuestion(resolvedTemplateDoc, seed);
  }

  if (resolvedTemplateDoc.templateId && resolvedTemplateDoc.templateId.startsWith('adding-')) {
    const { generateAdditionBuilderQuestion } = await import('../../../lib/practice/generators/math/topics/ordinal-numbers/additionBuildersGenerator.js');
    return generateAdditionBuilderQuestion(resolvedTemplateDoc, seed);
  }

  const additionFactTemplates = new Set([
    'addition-facts-10', 'ways-make-number-addition', 'make-number-addition-10',
    'complete-addition-sentence-10', 'addition-word-problems-10', 'addition-sentences-word-problems-10',
    'addition-facts-18', 'addition-sentences-numlines-18', 'addition-word-problems-18',
    'addition-sentences-word-problems-18', 'addition-facts-20', 'make-number-addition-20',
    'addition-sentences-word-problems-20', 'related-addition-facts', 'addition-sentences-true-false',
    'add-1digit-2digit-noregroup', 'add-1digit-2digit-regroup'
  ]);

  if (resolvedTemplateDoc.templateId && additionFactTemplates.has(resolvedTemplateDoc.templateId)) {
    const { generateAdditionFactQuestion } = await import('../../../lib/practice/generators/math/topics/ordinal-numbers/additionFactsGenerator.js');
    return generateAdditionFactQuestion(resolvedTemplateDoc, seed);
  }

  if (resolvedTemplateDoc.type === 'dynamic_pool') {
    const { findVocabularyPool } = await import('../../../lib/practice/questionBank/questionRepository.js');
    const { generateFromDynamicPool } = await import('../../../lib/practice/engine/DynamicPoolGenerator.js');
    
    if (resolvedTemplateDoc.poolId) {
      const poolDoc = await findVocabularyPool(resolvedTemplateDoc.poolId);
      if (poolDoc) {
        resolvedTemplateDoc.pools = poolDoc.pools;
        resolvedTemplateDoc.categoryLabels = poolDoc.categoryLabels;
      }
    }
    
    const historyContext = {
      correctStreak: Number(searchParams.get('correctStreak') || 0),
      practiceLevel: Number(searchParams.get('practiceLevel') || 1),
      levelStreak: Number(searchParams.get('levelStreak') || 0),
      lastResult: searchParams.get('lastResult') || 'none',
      remediationActive: searchParams.get('remediationActive') === 'true',
      remediationStep: Number(searchParams.get('remediationStep') || 0),
    };
    
    return generateFromDynamicPool(
      resolvedTemplateDoc,
      seed,
      difficulty,
      historyContext,
      grade
    );
  }
  
  const { evaluateTemplate } = await import('../../../lib/practice/generators/universalEvaluator.js');
  const historyContext = {
    correctStreak: Number(searchParams.get('correctStreak') || 0),
    practiceLevel: Number(searchParams.get('practiceLevel') || 1),
    levelStreak: Number(searchParams.get('levelStreak') || 0),
    lastResult: searchParams.get('lastResult') || 'none',
    remediationActive: searchParams.get('remediationActive') === 'true',
    remediationStep: Number(searchParams.get('remediationStep') || 0),
  };
  return evaluateTemplate(resolvedTemplateDoc, seed, { difficulty, historyContext, searchParams });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject') || 'math';
  const topic = searchParams.get('topic') || 'addition';
  const skill = resolveSkill(searchParams);
  const seed = searchParams.get('seed') || Date.now().toString();
  const source = searchParams.get('source');
  const difficulty = searchParams.get('difficulty') || 'adaptive';
  const cacheKey = makePracticeCacheKey(searchParams, seed);
  const cachedPayload = readPracticeCache(cacheKey);
  if (cachedPayload) {
    return NextResponse.json(cachedPayload, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=1200, stale-while-revalidate=86400',
        'X-Practice-Cache': 'HIT',
      },
    });
  }
  const respond = (payload, init = {}) => {
    writePracticeCache(cacheKey, payload);
    return NextResponse.json(payload, {
      ...init,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=1200, stale-while-revalidate=86400',
        'X-Practice-Cache': 'MISS',
        ...(init.headers || {}),
      },
    });
  };

  // Pre-resolve the skill node in the DB if available to determine the correct subject/topic
  let skillNode = null;
  let matchingNodes = null;
  let nodeBySkill = null;
  let nodeByCombined = null;
  try {
    const results = await Promise.all([
      listCurriculumNodes({ skillId: skill }),
      getCurriculumNode(skill),
      getCurriculumNode(`${subject}-${topic}-${skill}`)
    ]);
    matchingNodes = results[0];
    nodeBySkill = results[1];
    nodeByCombined = results[2];
    if (matchingNodes && matchingNodes.length > 0) {
      skillNode = matchingNodes[0];
    } else if (nodeBySkill) {
      skillNode = nodeBySkill;
    } else if (nodeByCombined) {
      skillNode = nodeByCombined;
    }
  } catch (error) {
    console.error('Practice DB skill node lookup error:', error);
  }

  if (!skillNode) {
    try {
      const isIit = searchParams.get('iit') === 'true';
      const isImo = searchParams.get('imo') === 'true';
      if (isIit) {
        const { listIitNodes } = await import('../../../lib/curriculum/storeIit.js');
        const iitSkills = await listIitNodes('skill', { id: skill });
        if (iitSkills && iitSkills.length > 0) {
          const iitSkill = iitSkills[0];
          
          let gradeId = '6';
          let topicId = topic;
          if (iitSkill.chapterId) {
            const iitChapters = await listIitNodes('chapter', { id: iitSkill.chapterId });
            if (iitChapters && iitChapters.length > 0) {
              gradeId = iitChapters[0].gradeId || '6';
              topicId = iitChapters[0].unitId || topic;
            }
          }

          skillNode = {
            ...iitSkill,
            topicId,
            grade: gradeId,
            metadata: {
              ...iitSkill,
              templateId: iitSkill.templateId,
              engine: iitSkill.engine,
              grade: gradeId,
              subject,
              topic: topicId,
              iit: true,
            }
          };
        }
      } else if (isImo) {
        const { listImoNodes } = await import('../../../lib/curriculum/storeImo.js');
        const imoSkills = await listImoNodes('skill', { id: skill });
        if (imoSkills && imoSkills.length > 0) {
          const imoSkill = imoSkills[0];
          
          let gradeId = '3';
          let topicId = topic;
          if (imoSkill.chapterId) {
            const imoChapters = await listImoNodes('chapter', { id: imoSkill.chapterId });
            if (imoChapters && imoChapters.length > 0) {
              gradeId = imoChapters[0].gradeId || '3';
              topicId = imoChapters[0].unitId || topic;
            }
          }

          skillNode = {
            ...imoSkill,
            topicId,
            grade: gradeId,
            metadata: {
              ...imoSkill,
              templateId: imoSkill.templateId,
              engine: imoSkill.engine,
              grade: gradeId,
              subject,
              topic: topicId,
              imo: true,
            }
          };
        }
      } else {
        const { listV2Nodes } = await import('../../../lib/curriculum/storeV2.js');
        const v2Skills = await listV2Nodes('skill', { id: skill });
        if (v2Skills && v2Skills.length > 0) {
          const v2Skill = v2Skills[0];
          
          // Resolve parent chapter to get grade and topic (unit)
          let gradeId = '1';
          let topicId = topic;
          if (v2Skill.chapterId) {
            const v2Chapters = await listV2Nodes('chapter', { id: v2Skill.chapterId });
            if (v2Chapters && v2Chapters.length > 0) {
              gradeId = v2Chapters[0].gradeId || '1';
              topicId = v2Chapters[0].unitId || topic;
            }
          }

          skillNode = {
            ...v2Skill,
            topicId,
            grade: gradeId,
            metadata: {
              ...v2Skill,
              templateId: v2Skill.templateId,
              engine: v2Skill.engine,
              grade: gradeId,
              subject,
              topic: topicId,
            }
          };
        }
      }
    } catch (err) {
      console.warn('Error fetching skill fallback:', err);
    }
  }

  const resolvedSubject = skillNode?.subjectId || subject;
  const resolvedTopic = skillNode?.topicId || topic;

  // ── Single Question Lookup by ID ──────────────────────────────────────────
  const qnId = searchParams.get('qn') || searchParams.get('questionId') || searchParams.get('id');
  if (qnId) {
    try {
      const { findStoredQuestionById, findStoredPracticeQuestion, normalizeStoredQuestion } = await import('../../../lib/practice/questionBank/questionRepository.js');
      
      let questionDoc = null;
      if (resolvedSubject && resolvedTopic && skill) {
        questionDoc = await findStoredPracticeQuestion({
          subject: resolvedSubject,
          topic: [resolvedTopic, skillNode?.chapterId].filter(Boolean),
          skill,
          qn: qnId,
          isStatic: true
        });
      }
      if (!questionDoc) {
        questionDoc = await findStoredQuestionById(qnId);
      }

      if (questionDoc) {
        const qSubject = questionDoc.subject || questionDoc.metadata?.subject || resolvedSubject;
        const qTopic = questionDoc.topic || questionDoc.metadata?.topic || resolvedTopic;
        const qSkill = questionDoc.skillId || questionDoc.metadata?.skillId || skill;

        let qSkillNode = null;
        try {
          const matchingNodes = await listCurriculumNodes({ skillId: qSkill });
          if (matchingNodes && matchingNodes.length > 0) {
            qSkillNode = matchingNodes[0];
          }
        } catch (err) {
          console.error('Error fetching node for ID lookup:', err);
        }

        const qResolvedTopic = qSkillNode?.topicId || qTopic;
        const qResolvedSkillId = qSkillNode?.skillId || qSkill;
        const qStreakThreshold = Number(qSkillNode?.metadata?.streakThreshold || qSkillNode?.streakThreshold || 5);

        const normalized = normalizeStoredQuestion(questionDoc, { subject: qSubject, topic: qTopic, skill: qSkill });

        return respond(normalizeWithCompetency({
          success: true,
          source: 'mongodb',
          question: normalized,
          seed,
          template: {
            logicType: qSkill,
            logic_type: qSkill,
            templateId: normalized.metadata?.templateId,
            engine: normalized.metadata?.engine,
            resolved: normalized.resolvedConfig,
            source: 'mongodb',
          }
        }, {
          subject: qSubject,
          topic: qResolvedTopic,
          skill: qResolvedSkillId,
          streakThreshold: qStreakThreshold
        }));
      }
    } catch (error) {
      console.error('Error loading question by ID:', error);
    }
  }

  if (skillNode && skillNode.status && skillNode.status !== 'active') {
    return NextResponse.json(
      { success: false, error: `Skill "${skillNode.title || skill}" is currently ${skillNode.status}.` },
      { status: 403 }
    );
  }

  // Centralized template and topic resolution
  // ─── Difficulty-scaled multi-template pool ────────────────────────────────
  // If the skill node has metadata.templateLevels, pick templateId by:
  //   1. Map correctStreak / difficulty param → level number (1-3)
  //   2. Within that level's pool, pick by: seedHash % pool.length
  // Falls back to single templateId for backward-compatibility.
  let resolvedTemplateId = skillNode?.templateId || skillNode?.metadata?.templateId || skill;

  // Handle templateId being an array, JSON array, or comma-separated string
  if (typeof resolvedTemplateId === 'string') {
    const trimmed = resolvedTemplateId.trim();
    resolvedTemplateId = trimmed;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          resolvedTemplateId = parsed;
        }
      } catch (e) {}
    }
  }

  if (Array.isArray(resolvedTemplateId)) {
    if (resolvedTemplateId.length > 0) {
      const seedStr = String(seed || Date.now());
      let seedHash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        seedHash = (seedHash * 31 + seedStr.charCodeAt(i)) >>> 0;
      }
      resolvedTemplateId = resolvedTemplateId[seedHash % resolvedTemplateId.length];
    } else {
      resolvedTemplateId = skill;
    }
  } else if (typeof resolvedTemplateId === 'string' && resolvedTemplateId.includes(',')) {
    const list = resolvedTemplateId.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length > 0) {
      const seedStr = String(seed || Date.now());
      let seedHash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        seedHash = (seedHash * 31 + seedStr.charCodeAt(i)) >>> 0;
      }
      resolvedTemplateId = list[seedHash % list.length];
    }
  }

  const templateLevels = skillNode?.metadata?.templateLevels;
  if (Array.isArray(templateLevels) && templateLevels.length > 0) {
    const correctStreak = Number(searchParams.get('correctStreak') || 0);
    const smartScore = Number(searchParams.get('smartScore') || 0);
    let targetLevel = 1;
    if (!isNaN(Number(difficulty)) && Number(difficulty) > 0) {
      targetLevel = Number(difficulty);
    } else {
      const isFourLevels = templateLevels.length >= 4 || templateLevels.some(l => l.level === 4);
      if (difficulty === 'hard' || smartScore >= 80) {
        targetLevel = isFourLevels ? 4 : 3;
      } else if (correctStreak >= 9) {
        targetLevel = isFourLevels ? 4 : 3;
      } else if (correctStreak >= 6 || smartScore >= 60) {
        targetLevel = 3;
      } else if (difficulty === 'medium' || smartScore >= 30 || correctStreak >= 3) {
        targetLevel = 2;
      } else {
        targetLevel = 1;
      }
    }

    // Find pool for target level (fall back to highest available)
    let levelEntry = templateLevels.find(l => l.level === targetLevel);
    if (!levelEntry) levelEntry = templateLevels[templateLevels.length - 1];

    const pool = Array.isArray(levelEntry?.templateIds) ? levelEntry.templateIds.filter(Boolean) : [];
    if (pool.length > 0) {
      // Deterministic pick from pool using seed hash
      const seedStr = String(seed || Date.now());
      let seedHash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        seedHash = (seedHash * 31 + seedStr.charCodeAt(i)) >>> 0;
      }
      resolvedTemplateId = pool[seedHash % pool.length];
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const targetTopic = (skillNode?.engine && skillNode.engine !== 'questionBank' && skillNode.engine !== 'universal-template') ? skillNode.engine : resolvedTopic;
  let resolvedSkillId = skillNode?.skillId || skill;

  if (resolvedSkillId && resolvedSkillId.endsWith('-legacy')) {
    resolvedSkillId = resolvedSkillId.slice(0, -7);
  }

  const topicContract = findTopicContract(subject, targetTopic);

  const streakThreshold = Number(
    skillNode?.metadata?.streakThreshold ||
    skillNode?.streakThreshold ||
    topicContract?.streakThreshold ||
    topicContract?.metadata?.streakThreshold ||
    5
  );

  const isStaticSkill = skillNode?.isStatic === true || 
                        skillNode?.metadata?.isStatic === true || 
                        skillNode?.static === true ||
                        skillNode?.progressionConfig?.enabled === false ||
                        searchParams.get('mode') === 'static' ||
                        searchParams.get('isStatic') === 'true';

  const withCompetency = (payload, ctx) => normalizeWithCompetency(payload, {
    ...ctx,
    topic: resolvedTopic,
    skill: resolvedSkillId,
    streakThreshold,
    isStatic: isStaticSkill,
  });

  // Check stored/DB questions first to support dynamic curriculum/topics
  try {
    const mixWithGenerator = skillNode?.metadata?.mixWithGenerator === true;
    const generatorProbability = Number(skillNode?.metadata?.generatorProbability ?? 0.5);
    
    // Hash seed deterministically between 0 and 1
    const seedVal = (() => {
      const text = String(seed || Date.now());
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
      }
      return (hash % 100) / 100;
    })();

    const skipDbForGenerator = mixWithGenerator && (seedVal < generatorProbability);

    if (!skipDbForGenerator) {
      const skillQueryList = [resolvedSkillId];
      if (skillNode?.id && !skillQueryList.includes(skillNode.id)) {
        skillQueryList.push(skillNode.id);
      }
      if (skill && !skillQueryList.includes(skill)) {
        skillQueryList.push(skill);
      }

      const isStaticSkill = skillNode?.isStatic === true || skillNode?.metadata?.isStatic === true || skillNode?.static === true;

      const storedPayload = await resolveStoredPracticePayload({
        subject: resolvedSubject,
        topic: [resolvedTopic, skillNode?.chapterId].filter(Boolean),
        skill: skillQueryList,
        difficulty,
        seed,
        source,
        history: {
          correctStreak: Number(searchParams.get('correctStreak') || 0),
          practiceLevel: Number(searchParams.get('practiceLevel') || 1),
          levelStreak: Number(searchParams.get('levelStreak') || 0),
          lastResult: searchParams.get('lastResult') || 'none',
          remediationActive: searchParams.get('remediationActive') === 'true',
          remediationStep: Number(searchParams.get('remediationStep') || 0),
        },
        grade: skillNode?.grade || skillNode?.metadata?.grade || '1',
        qn: searchParams.get('qn'),
        isStatic: isStaticSkill,
      });

      if (storedPayload) {
        return respond(withCompetency(storedPayload, { subject: resolvedSubject, topic: resolvedTopic, skill: resolvedSkillId, isStatic: isStaticSkill }));
      }
    }
  } catch (error) {
    console.error('Practice DB Pre-fetch error:', error);
  }

  if (skillNode?.metadata?.generatorFallback === false) {
    return NextResponse.json(
      {
        success: false,
        error: `No stored questions found for manual-only skill: ${resolvedSkillId}`,
        needsQuestion: true,
        subject: resolvedSubject,
        topic: resolvedTopic,
        skill: resolvedSkillId,
      },
      { status: 404 },
    );
  }
  
  const isLkgTemplate = resolvedTemplateId && String(resolvedTemplateId).startsWith('lkg.english.');

  // ── Dynamic Pool Engine (option-pooling) ──────────────────────────────────
  if (skillNode?.engine === 'dynamic_pool') {
    try {
      const { findVocabularyPool } = await import('../../../lib/practice/questionBank/questionRepository.js');
      const { generateFromDynamicPool } = await import('../../../lib/practice/engine/DynamicPoolGenerator.js');
      
      const poolId = skillNode.poolId || resolvedTemplateId;
      const poolDoc = await findVocabularyPool(poolId);
      if (!poolDoc) {
        return NextResponse.json(
          { success: false, error: `Vocabulary pool not found: ${poolId}` },
          { status: 404 }
        );
      }

      const historyContext = {
        correctStreak: Number(searchParams.get('correctStreak') || 0),
        practiceLevel: Number(searchParams.get('practiceLevel') || 1),
        levelStreak: Number(searchParams.get('levelStreak') || 0),
        lastResult: searchParams.get('lastResult') || 'none',
        remediationActive: searchParams.get('remediationActive') === 'true',
        remediationStep: Number(searchParams.get('remediationStep') || 0),
      };

      const rawQuestion = generateFromDynamicPool(
        poolDoc,
        seed,
        difficulty,
        historyContext,
        skillNode?.grade || skillNode?.metadata?.grade || 'ukg'
      );

      const question = {
        ...rawQuestion,
        id: `dynamic-pool-${resolvedSkillId}-${seed}`,
        metadata: {
          subject: resolvedSubject,
          topic: resolvedTopic,
          skillId: resolvedSkillId,
          poolId,
          engine: 'dynamic_pool',
          grade: skillNode?.grade || skillNode?.metadata?.grade || 'ukg',
          seed
        }
      };

      const responsePayload = {
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedSkillId,
          logic_type: resolvedSkillId,
          templateId: poolId,
          engine: 'dynamic_pool'
        }
      };

      return respond(withCompetency(responsePayload, { subject: resolvedSubject, topic: resolvedTopic, skill: resolvedSkillId }));
    } catch (err) {
      console.error('Error generating question via dynamic_pool engine:', err);
      return NextResponse.json(
        { success: false, error: `Dynamic pool engine error: ${err.message}` },
        { status: 500 }
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  if ((skillNode?.engine === 'universal-template' || skillNode?.engine === 'universal-templete') && !isLkgTemplate) {
    try {
      const { findDynamicTemplateById } = await import('../../../lib/practice/questionBank/dynamicTemplatesRepository.js');
      
      const templateDoc = await findDynamicTemplateById(resolvedTemplateId);
      if (!templateDoc) {
        return NextResponse.json(
          { success: false, error: `Dynamic template not found: ${resolvedTemplateId}` },
          { status: 404 }
        );
      }
      
      const resolvedTemplateDoc = await resolveTemplatePools(templateDoc);
      const rawQuestion = await evaluateUniversalOrPoolTemplate({
        resolvedTemplateDoc,
        seed,
        difficulty,
        searchParams,
        grade: skillNode?.grade || skillNode?.metadata?.grade || '1'
      });
      
      // Normalize metadata to match expectations
      const question = {
        ...rawQuestion,
        id: `universal-template-${resolvedSkillId}-${seed}`,
        metadata: {
          subject: resolvedSubject,
          topic: resolvedTopic,
          skillId: resolvedSkillId,
          templateId: resolvedTemplateId,
          engine: 'universal-template',
          grade: skillNode?.grade || skillNode?.metadata?.grade || '1',
          seed
        }
      };

      const responsePayload = {
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedSkillId,
          logic_type: resolvedSkillId,
          templateId: resolvedTemplateId,
          engine: 'universal-template'
        }
      };
      if (question.pickedItemIds) {
        responsePayload.pickedItemIds = question.pickedItemIds;
      }

      return respond(withCompetency(responsePayload, { subject: resolvedSubject, topic: resolvedTopic, skill: resolvedSkillId }));
    } catch (err) {
      console.error('Error generating question via universal-template:', err);
      return NextResponse.json(
        { success: false, error: `Universal template engine error: ${err.message}` },
        { status: 500 }
      );
    }
  }

  // Direct dynamic-template fallback: lets a newly saved template run by using
  // skill=<templateId> even before a curriculum node is wired to it.
  try {
    const { findDynamicTemplateById } = await import('../../../lib/practice/questionBank/dynamicTemplatesRepository.js');
    const templateDoc = await findDynamicTemplateById(resolvedTemplateId);

    if (templateDoc && !isLkgTemplate) {
      const resolvedTemplateDoc = await resolveTemplatePools(templateDoc);
      const rawQuestion = await evaluateUniversalOrPoolTemplate({
        resolvedTemplateDoc,
        seed,
        difficulty,
        searchParams,
        grade: templateDoc.grade || templateDoc.templateInfo?.grade || skillNode?.grade || skillNode?.metadata?.grade || '1'
      });
      const question = {
        ...rawQuestion,
        id: `universal-template-${resolvedTemplateId}-${seed}`,
        metadata: {
          subject: templateDoc.subject || templateDoc.templateInfo?.subject || resolvedSubject,
          topic: templateDoc.topic || templateDoc.templateInfo?.topic || resolvedTopic,
          skillId: templateDoc.skillId || templateDoc.templateInfo?.skillId || resolvedSkillId,
          templateId: resolvedTemplateId,
          engine: 'universal-template',
          grade: templateDoc.grade || templateDoc.templateInfo?.grade || skillNode?.grade || skillNode?.metadata?.grade || '1',
          seed
        }
      };

      const responsePayload = {
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          logic_type: resolvedTemplateId,
          templateId: resolvedTemplateId,
          engine: 'universal-template'
        }
      };
      if (question.pickedItemIds) {
        responsePayload.pickedItemIds = question.pickedItemIds;
      }

      return respond(withCompetency(responsePayload, { subject: question.metadata.subject, topic: question.metadata.topic, skill: question.metadata.skillId }));
    }
  } catch (err) {
    console.error('Error generating direct dynamic template:', err);
  }

  // Second fallback: look up from the `templates` collection (saved via Template Masterclass / Admin)
  try {
    const db = await (await import('../../../lib/db/mongo.js')).getMongoDb();
    if (db) {
      const tmplDoc = await db.collection('templates').findOne({
        $or: [{ _id: resolvedTemplateId }, { id: resolvedTemplateId }]
      });

      if (tmplDoc && !isLkgTemplate) {
        const cfg = tmplDoc.config || tmplDoc;
        // Convert to universal-template format expected by evaluateUniversalOrPoolTemplate
        const universalDoc = {
          id: resolvedTemplateId,
          subject: tmplDoc.section || resolvedSubject,
          topic: tmplDoc.topic || resolvedTopic,
          questionText: cfg.questionTemplate || cfg.questionText || '',
          answer: cfg.answer || null,
          explanation: cfg.explanationTemplate ? { sections: [{ type: 'text', content: cfg.explanationTemplate }] } : null,
          options: cfg.options || null,
          optionsType: cfg.interaction?.inputMode === 'choice' ? 'multipleChoice' : 'fillInTheBlank',
          interaction: cfg.interaction || { engine: 'mcq', inputMode: 'choice' },
          variables: cfg.variables || {},
          derivations: cfg.derivations || {},
          constraints: cfg.constraints || {},
          visuals: cfg.visuals || [],
          templateInfo: {
            subject: tmplDoc.section || resolvedSubject,
            topic: tmplDoc.topic || resolvedTopic,
            grade: cfg.grade || '6',
          }
        };

        const resolvedTemplateDoc = await resolveTemplatePools(universalDoc);
        const rawQuestion = await evaluateUniversalOrPoolTemplate({
          resolvedTemplateDoc,
          seed,
          difficulty,
          searchParams,
          grade: cfg.grade || '6'
        });
        const question = {
          ...rawQuestion,
          id: `exam-template-${resolvedTemplateId}-${seed}`,
          metadata: {
            subject: universalDoc.subject,
            topic: universalDoc.topic,
            skillId: resolvedSkillId || resolvedTemplateId,
            templateId: resolvedTemplateId,
            engine: 'universal-template',
            grade: cfg.grade || '6',
            seed
          }
        };

        const responsePayload = {
          success: true,
          question,
          seed,
          template: {
            logicType: resolvedTemplateId,
            logic_type: resolvedTemplateId,
            templateId: resolvedTemplateId,
            engine: 'universal-template'
          }
        };
        if (question.pickedItemIds) responsePayload.pickedItemIds = question.pickedItemIds;

        return respond(withCompetency(responsePayload, {
          subject: universalDoc.subject,
          topic: universalDoc.topic,
          skill: resolvedSkillId || resolvedTemplateId
        }));
      }
    }
  } catch (err) {
    console.error('Error generating template from `templates` collection:', err);
  }

  let isDbTopicActive = false;
  try {
    let topicNode = await getCurriculumNode(targetTopic);
    if (!topicNode && !targetTopic.includes('-')) {
      topicNode = await getCurriculumNode(`${subject}-${targetTopic}`);
    }
    isDbTopicActive = topicNode && topicNode.type === 'topic' && topicNode.status === 'active';
  } catch (error) {
    console.error('Practice DB node check error:', error);
  }

  const isMathTopic = subject === 'math' || subject === 'arithmetic' || resolvedSubject === 'math';
  const isSocialTopic = subject === 'social' || subject === 'gk' || subject === 'general_knowledge' || subject === 'general_awareness' || subject === 'intelligence' || resolvedSubject === 'social';
  const isScienceTopic = subject === 'science' || resolvedSubject === 'science';
  const isEnglishTopic = subject === 'english' || subject === 'language' || resolvedSubject === 'english';

  if (!topicContract && !isMathTopic && !isSocialTopic && !isScienceTopic && !isEnglishTopic) {
    if (isDbTopicActive) {
      return NextResponse.json(
        { success: false, error: `No stored questions found for database-fetched skill: ${skill}` },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: `Unsupported practice route: ${subject}/${topic}` },
      { status: 404 },
    );
  }

  const config = {
    difficulty,
    logic_type: resolvedTemplateId,
    forcedTask: resolvedTemplateId,
    history: {
      correctStreak: Number(searchParams.get('correctStreak') || 0),
      practiceLevel: Number(searchParams.get('practiceLevel') || 1),
      levelStreak: Number(searchParams.get('levelStreak') || 0),
      lastResult: searchParams.get('lastResult') || 'none',
      remediationActive: searchParams.get('remediationActive') === 'true',
      remediationStep: Number(searchParams.get('remediationStep') || 0),
    },
    variables: { seed },
  };

  try {
    if (topicContract) {
      const generatorSkillId = resolvedSkillId || resolvedTemplateId;
      const topicConfig = {
        ...config,
        logic_type: generatorSkillId,
        forcedTask: generatorSkillId,
        skillId: generatorSkillId,
        templateId: resolvedTemplateId,
      };

      const rawQuestion = topicContract.generateQuestion(topicConfig);
      const question = topicContract.normalizeQuestion(rawQuestion, {
        subject,
        topic: targetTopic,
        skill: generatorSkillId,
        seed,
      });

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: topicContract.getTemplate(generatorSkillId, question),
      }, { subject, topic, skill: resolvedSkillId }));
    }

    if (subject === 'social' && targetTopic === 'gk') {
      const question = normalizeGenericTopicQuestion(
        generateSmartGKQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'gk', subject: 'social' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logic_type: resolvedTemplateId,
          ...(gkGenerators[resolvedTemplateId] || {}),
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'time') {
      const question = normalizeTimeQuestion(
        timeGenerator(config),
        { skill: resolvedTemplateId, seed },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getTimeTemplateConfig(resolvedTemplateId, question),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'testing') {
      const question = normalizeGenericTopicQuestion(
        generateTestingQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'testing' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getTestingTemplateConfig(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'standard-object-measurement') {
      const question = normalizeGenericTopicQuestion(
        generateSOMTopicQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'standard-object-measurement' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getSOMSkill(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'fractions') {
      const question = normalizeFractionsQuestion(
        generateFractionsV2Question(config),
        { skill: resolvedTemplateId, seed },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getFractionsV2TemplateConfig(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'place-values') {
      const question = normalizeGenericTopicQuestion(
        placeValueGenerator(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'place-values' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getPlaceValueTemplateConfig(question.metadata?.task || resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'subtraction') {
      const question = generateSubtractionTopicQuestion(config);
      const template = createSubtractionTopicTemplate(resolvedTemplateId);

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          template,
          resolved: question.resolvedConfig,
          config,
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'division') {
      const { generateDivisionTopicQuestion, createDivisionTopicTemplate } = await import('../../../lib/practice/generators/math/topics/division/index.js');
      const question = generateDivisionTopicQuestion(config);
      const template = createDivisionTopicTemplate(resolvedTemplateId);

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          template,
          resolved: question.resolvedConfig,
          config,
        },
      }, { subject, topic, skill }));
    }

    if (subject === 'science' && targetTopic === 'units-measurement') {
      const generator = resolveUnitsMeasurementGenerator(resolvedTemplateId, config);
      if (!generator) {
        throw new Error(`Could not resolve generator for ${resolvedTemplateId}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: generator.template.engine, subject }
      );
      
      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (subject === 'science' && targetTopic === 'solar-system') {
      const generator = resolveSolarSystemGenerator(resolvedTemplateId, config);
      if (!generator) {
        throw new Error(`Could not resolve generator for ${resolvedTemplateId}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: generator.template.engine, subject }
      );
      
      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (subject === 'science' && targetTopic === 'chemical-reactions') {
      const generator = resolveChemicalReactionsGenerator(resolvedSkillId, config);
      if (!generator) {
        throw new Error(`Could not resolve chemical-reactions generator for ${resolvedSkillId}`);
      }

      const questionData = generator.generate({
        ...config.variables,
        difficulty: config.difficulty,
        recentIds: config.recentIds || [],
      });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic: targetTopic, skill: resolvedSkillId, seed, engine: 'chemicalReactions', subject }
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    const isLkgTemplate = resolvedTemplateId && String(resolvedTemplateId).startsWith('lkg.english.');
    if (subject === 'english' && (isLkgTemplate || ['grammar', 'lkg', 'english-lkg'].includes(targetTopic) || resolvedTopic === 'lkg' || resolvedTopic === 'english-lkg' || topic === 'english-lkg' || topic === 'lkg')) {
      const isLkg = isLkgTemplate || targetTopic === 'lkg' || targetTopic === 'english-lkg' || resolvedTopic === 'lkg' || resolvedTopic === 'english-lkg' || topic === 'english-lkg' || topic === 'lkg';
      const generator = isLkg
        ? await (await import('../../../lib/practice/generators/english/topics/lkg/engine.js')).resolveLkgGenerator(resolvedSkillId, config)
        : await (await import('../../../lib/practice/generators/english/topics/grammar/engine.js')).resolveGrammarGenerator(resolvedSkillId, config);

      if (!generator) {
        throw new Error(`Could not resolve generator for ${resolvedSkillId}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic: isLkg ? 'lkg' : targetTopic, skill: resolvedSkillId, seed, engine: generator.template.engine, subject }
      );
      
      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'lkg') {
      const { generateLkgQuestion } = await import('../../../lib/practice/generators/math/topics/lkg/index.js');
      const question = normalizeGenericTopicQuestion(
        generateLkgQuestion({
          ...config,
          logic_type: resolvedSkillId,
          forcedTask: resolvedSkillId
        }),
        { topic: targetTopic, skill: resolvedSkillId, seed, engine: 'lkg' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          title: question.metadata?.templateId || resolvedTemplateId,
          description: "LKG Practice Topic"
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'shapes') {
      const { shapesGenerator, getShapesTemplate } = await import('../../../lib/practice/generators/math/topics/shapes/index.js');
      const question = normalizeGenericTopicQuestion(
        shapesGenerator(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'shapes' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getShapesTemplate(question.metadata?.templateId || resolvedTemplateId) || {
          id: resolvedTemplateId,
          family: 'shapes',
          engine: 'shapes',
          questionType: 'mcq'
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'measurement') {
      const { generateMeasurementQuestion } = await import('../../../lib/practice/generators/math/topics/measurement/index.js');
      const question = normalizeGenericTopicQuestion(
        generateMeasurementQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'measurement' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          title: question.metadata?.templateId || resolvedTemplateId,
          description: "Measurement Practice Topic"
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'story-math') {
      const { generateStoryMathQuestion, getStoryMathTemplate } = await import('../../../lib/practice/generators/math/topics/story-math/index.js');
      const question = normalizeGenericTopicQuestion(
        generateStoryMathQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'story-math' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getStoryMathTemplate(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'interactive-tools') {
      const { generateInteractiveToolsQuestion, getInteractiveToolsTemplate } = await import('../../../lib/practice/generators/math/topics/interactive-tools/index.js');
      const question = normalizeGenericTopicQuestion(
        generateInteractiveToolsQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'interactive-tools' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getInteractiveToolsTemplate(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'cube-tools') {
      const { generateCubeToolsQuestion, getCubeToolsTemplate } = await import('../../../lib/practice/generators/math/topics/cube-tools/index.js');
      const question = normalizeGenericTopicQuestion(
        generateCubeToolsQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'cube-tools' },
      );

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: getCubeToolsTemplate(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'ratio' || targetTopic === 'ratios') {
      const question = normalizeGenericTopicQuestion(
        generateRatioQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'ratio' },
      );


      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: question.metadata?.templateId || resolvedTemplateId,
          title: question.metadata?.templateId || resolvedTemplateId,
          description: "Ratio topic template practice",
          competency: {
            id: "ratio_competency",
            title: "Ratio comparison and calculations"
          }
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'multiplication') {
      const question = generateMultiplicationQuestion(config);

      const template = createMultiplicationTemplate(resolvedTemplateId);

      return respond(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          template,
          resolved: question.resolvedConfig,
          config,
        },
      }, { subject, topic, skill }));
    }

    const question = generateAdditionTopicQuestion(config);
    const template = createAdditionTopicTemplate(resolvedTemplateId);

    return respond(withCompetency({
      success: true,
      question,
      seed,
      template: {
        logicType: resolvedTemplateId,
        template,
        resolved: question.resolvedConfig,
        config,
      },
    }, { subject, topic, skill }));
  } catch (error) {
    console.error('Practice API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function normalizeWithCompetency(payload, { subject, topic, skill, streakThreshold, isStatic }) {
  const payloadWithSource = {
    source: 'generator',
    ...payload,
  };

  if (!payloadWithSource.question) {
    return payloadWithSource;
  }

  const finalStreakThreshold = Number(
    payloadWithSource.question.metadata?.streakThreshold ||
    payloadWithSource.question.streakThreshold ||
    streakThreshold ||
    5
  );

  const competency = resolveCompetency({
    subject,
    topic,
    skillId: skill,
    templateId: payloadWithSource.question.metadata?.templateId,
  });

  const questionMetadata = {
    ...(payloadWithSource.question.metadata || {}),
    streakThreshold: finalStreakThreshold,
    isStatic: isStatic || payloadWithSource.question.metadata?.isStatic || undefined,
  };

  if (competency) {
    questionMetadata.competencyId = competency.id;
    questionMetadata.competency = competency;
  }

  return {
    ...payloadWithSource,
    competency: competency || undefined,
    question: {
      ...payloadWithSource.question,
      metadata: questionMetadata,
    },
    template: payloadWithSource.template
      ? {
          ...payloadWithSource.template,
          competency: competency || undefined,
        }
      : payloadWithSource.template,
  };
}

function normalizeGenericTopicQuestion(question, { topic, skill, seed, engine, subject = 'math' }) {
  if (!question) {
    throw new Error(`No question generated for ${subject}/${topic}/${skill}`);
  }

  const parts = Array.isArray(question.parts) ? question.parts : [];
  const normalizedParts = question.type === 'fillInTheBlank' && question.questionText
    ? [{ type: 'text', content: question.questionText }, ...parts]
    : parts;
  const answer = question.answer
    ?? question.validation?.answer
    ?? parseAnswer(question.correctAnswerText)
    ?? question.correctAnswer
    ?? question.correct_answer_indices
    ?? question.correct_answer_index
    ?? null;

  const rawCategories = Array.isArray(question.categories) ? question.categories : undefined;
  const rawItems = Array.isArray(question.items) ? question.items : undefined;

  let categories = rawCategories;
  let items = rawItems;

  if (question.type === 'matching' && Array.isArray(question.pairs)) {
    const uniqueRights = Array.from(new Set(question.pairs.map(p => p.right?.content || p.right?.label || p.right)));
    categories = uniqueRights.map(val => ({ id: val, label: val }));
    items = question.pairs.map((p, index) => {
      const id = p.left?.content || p.left?.label || p.left?.id || p.id || `left_${index}`;
      return {
        id: id,
        content: p.left?.content || p.left?.label || p.left || '',
        imageUrl: p.left?.imageUrl || undefined
      };
    });
  }
  const normalizedAnswer = answer ?? (
    question.type === 'matching' && Array.isArray(question.pairs)
      ? Object.fromEntries(question.pairs.map((p, index) => {
          const leftId = p.left?.content || p.left?.label || p.left?.id || p.id || `left_${index}`;
          const rightId = p.right?.content || p.right?.label || p.right?.id || p.right;
          return [leftId, rightId];
        }).filter(([leftId, rightId]) => leftId !== undefined && rightId !== undefined))
      : null
  );

  return {
    id: question.id || `${topic}-${skill}-${seed}`,
    type: question.type,
    appletType: question.appletType,
    storyId: question.storyId,
    title: question.title,
    eyebrow: question.eyebrow,
    modes: question.modes,
    defaultMode: question.defaultMode,
    toolId: question.toolId,
    toolVersion: question.toolVersion,
    toolConfig: question.toolConfig,
    validation: question.validation,
    feedback: question.feedback,
    validationRules: question.validationRules,
    feedbackRules: question.feedbackRules,
    difficultyRules: question.difficultyRules,
    analyticsConfig: question.analyticsConfig,
    adaptiveRules: question.adaptiveRules,
    schema: question.schema,
    universalSchema: question.universalSchema,
    layout: question.layout,
    accessibility: question.accessibility,
    manipulativeType: question.manipulativeType,
    initialState: question.initialState,
    interaction: question.interaction,
    layoutMode: question.layoutMode,
    layoutConfig: question.layoutConfig,
    questionText: question.questionText || question.text || '',
    audioUrl: question.audioUrl,
    voice: question.voice,
    soundUrl: question.soundUrl,
    soundText: question.soundText,
    metaConfig: question.metaConfig,
    parts: normalizedParts,
    options: Array.isArray(question.options) ? question.options : [],
    categories,
    items,
    targets: Array.isArray(question.targets) ? question.targets : undefined,
    grid: question.grid,
    columns: question.columns,
    canvas: question.canvas,
    connectors: Array.isArray(question.connectors) ? question.connectors : undefined,
    behavior: question.behavior,
    sourceTray: question.sourceTray,
    cardStyle: question.cardStyle,
    itemCardStyle: question.itemCardStyle,
    imageCardStyle: question.imageCardStyle,
    cardVariant: question.cardVariant,
    hideItemLabels: question.hideItemLabels,
    pairs: Array.isArray(question.pairs) ? question.pairs : undefined,
    poolPosition: question.poolPosition,
    isCopiable: question.isCopiable,
    answer: normalizedAnswer,
    correctAnswerIndex: normalizeIndex(question.correctAnswerIndex) ?? normalizeIndex(question.correct_answer_index),
    correctAnswerIndices: question.correctAnswerIndices,
    multiSelect: question.multiSelect,
    shownLetter: question.shownLetter,
    shownLetterSvg: question.shownLetterSvg,
    backgroundUrl: question.backgroundUrl,
    backgroundImage: question.backgroundImage,
    cognitiveLevel: question.cognitiveLevel || null,
    solution: normalizeSolution(question.solution || question.explanation),
    metadata: {
      ...(question.metadata || {}),
      subject,
      topic,
      skillId: skill,
      templateId: question.metadata?.templateId || question.metadata?.task || skill,
      engine,
      seed,
    },
  };
}

function normalizeSolution(solution) {
  if (!solution) return { sections: [] };
  if (Array.isArray(solution)) {
    return {
      sections: solution.flatMap((section) => {
        if (Array.isArray(section?.parts)) return section.parts;
        return section;
      }),
    };
  }
  if (!Array.isArray(solution.sections)) {
    const sections = [];
    if (solution.text) sections.push({ type: 'text', content: solution.text });
    if (solution.explanation) sections.push({ type: 'text', content: solution.explanation });
    return { sections };
  }
  return solution;
}

function normalizeIndex(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : null;
}

function parseAnswer(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeFractionsQuestion(question, { skill, seed }) {
  const answer = question.answer
    ?? question.validation?.answer
    ?? parseAnswer(question.correctAnswerText)
    ?? question.correctAnswer
    ?? question.correctAnswerId
    ?? null;

  return {
    id: question.id || `fractions-${skill}-${seed}`,
    type: question.type,
    interaction: question.interaction,
    questionText: question.questionText || '',
    audioUrl: question.audioUrl,
    voice: question.voice,
    metaConfig: question.metaConfig,
    parts: Array.isArray(question.parts) ? question.parts : [],
    options: Array.isArray(question.options) ? question.options : [],
    answer,
    correctAnswerIndex: normalizeIndex(question.correctAnswerIndex),
    solution: normalizeSolution(question.solution || question.explanation),
    metadata: {
      ...(question.metadata || {}),
      subject: 'math',
      topic: 'fractions',
      skillId: skill,
      templateId: question.adaptiveConfig?.logic_type || question.metadata?.logic_type || skill,
      engine: 'fractions',
      seed,
    },
  };
}

function normalizeTimeQuestion(question, { skill, seed }) {
  const metadata = {
    ...(question.metadata || {}),
    subject: 'math',
    topic: 'time',
    skillId: skill,
    templateId: question.metadata?.task || skill,
    engine: 'time',
    seed,
  };
  const answer = question.answer ?? question.correctAnswer ?? question.correctAnswerText ?? null;
  const solution = question.solution || question.explanation || { sections: [] };

  const parts = Array.isArray(question.parts) ? question.parts : [];
  const normalizedParts = question.type === 'fillInTheBlank' && question.questionText
    ? [{ type: 'text', content: question.questionText }, ...parts]
    : parts;

  return {
    id: question.id || `time-${skill}-${seed}`,
    type: question.type,
    interaction: question.interaction,
    questionText: question.questionText || '',
    audioUrl: question.audioUrl,
    voice: question.voice,
    metaConfig: question.metaConfig,
    parts: normalizedParts,
    options: Array.isArray(question.options) ? question.options : [],
    answer,
    correctAnswerIndex: normalizeIndex(question.correctAnswerIndex),
    solution,
    metadata,
  };
}
