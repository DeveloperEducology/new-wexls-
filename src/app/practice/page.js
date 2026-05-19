'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuestionRenderer from '../../components/practice/QuestionRenderer';
import LabLayout from '../../components/practice/LabLayout';
import PracticeFeedback from '../../components/practice/PracticeFeedback';
import styles from '../../components/practice/FactoryLayout.module.css';
import { isAnswerCorrect } from '../../lib/practice/answerValidation';
import { resolveCompetency } from '../../lib/competency';
import {
  appendAttempt,
  calculateSmartScore,
  createAttempt,
  loadMasteryState,
  saveMasteryState,
  updateMasteryState,
} from '../../lib/mastery';
import { additionSkillsByGrade } from '../../lib/practice/generators/math/topics/addition/skills/index.js';
import { multiplicationSkillsByGrade } from '../../lib/practice/generators/math/topics/multiplication/skills/index.js';

import { subtractionSkillsByGrade } from '../../lib/practice/generators/math/topics/subtraction/skills/index.js';
import { unitsMeasurementSkillsByGrade } from '../../lib/practice/generators/science/topics/units-measurement/skills/index.js';
import { grammarSkillsByGrade } from '../../lib/practice/generators/english/topics/grammar/skills/index.js';

const UNITS_MEASUREMENT_OPTIONS = Object.entries(unitsMeasurementSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const ENGLISH_GRAMMAR_OPTIONS = Object.entries(grammarSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const MULTIPLICATION_OPTIONS = Object.entries(multiplicationSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const gradeLabel = (grade) => {
  if (grade === 'remediation') return 'Remediation';
  if (grade === 'prek') return 'Pre-K';
  return `Grade ${grade}`;
};

const ADDITION_TOPIC_OPTIONS = Object.entries(additionSkillsByGrade).flatMap(([grade, skills]) => (
  skills.map((skill) => ({
    group: gradeLabel(grade),
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
));

const SUBTRACTION_TOPIC_OPTIONS = Object.entries(subtractionSkillsByGrade).flatMap(([grade, skills]) => (
  skills.map((skill) => ({
    group: gradeLabel(grade),
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
));

const TIME_OPTIONS = [
  { group: 'Calendar', label: 'Days of the week', value: 'v1_days_of_week' },
  { group: 'Calendar', label: 'Order days of the week', value: 'order_days' },
  { group: 'Calendar', label: 'Seasons of the year', value: 'v2_seasons' },
  { group: 'Calendar', label: 'Order seasons', value: 'order_seasons' },
  { group: 'Calendar', label: 'Read a calendar', value: 'v3_calendar' },
  { group: 'Calendar', label: 'Months of the year', value: 'v4_months' },
  { group: 'Calendar', label: 'Days in each month', value: 'm5_days_in_month' },
  { group: 'Units', label: 'Relate time units', value: 'm6_relate_time_units' },
  { group: 'Clocks', label: 'A.M. or P.M.', value: 'v5_am_pm' },
  { group: 'Clocks', label: 'Match analogue clocks and times', value: 'match_analog_clock_words' },
  { group: 'Clocks', label: 'Match digital clocks and times', value: 'match_digital_clock' },
  { group: 'Clocks', label: 'Read clocks and write times', value: 'o3_read_clock' },
  { group: 'Clocks', label: 'Elapsed time', value: 'o5_elapsed_time' },
  { group: 'Clocks', label: 'Time patterns', value: 'o7_time_patterns' },
];

const FRACTIONS_OPTIONS = [
  { group: 'Visual Models', label: 'Identify fractions from shapes', value: 'visual_models_identify' },
  { group: 'Visual Models', label: 'Write fractions from shapes', value: 'visual_models_write_fraction' },
  { group: 'Visual Models', label: 'Equal parts', value: 'visual_models_equal_parts' },
  { group: 'Visual Models', label: 'Fraction of a set', value: 'visual_models_fraction_of_set' },
  { group: 'Visual Models', label: 'Mixed numbers from models', value: 'visual_models_mixed_numbers' },
  { group: 'Interactive Models', label: 'Remove parts from a circle', value: 'visual_models_remove_fraction_pie' },
  { group: 'Interactive Models', label: 'Remove parts from a square', value: 'visual_models_remove_fraction_square' },
  { group: 'Interactive Models', label: 'Remove parts from a rectangle', value: 'visual_models_remove_fraction_rectangle' },
  { group: 'Interactive Models', label: 'Remove parts from a fraction bar', value: 'visual_models_remove_fraction_bar' },
  { group: 'Interactive Models', label: 'Fill parts of a circle', value: 'visual_models_fill_fraction_pie' },
  { group: 'Interactive Models', label: 'Fill parts of a square', value: 'visual_models_fill_fraction_square' },
  { group: 'Interactive Models', label: 'Fill parts of a rectangle', value: 'visual_models_fill_fraction_rectangle' },
  { group: 'Operations', label: 'Add and subtract fractions with unlike denominators', value: 'fractions-g5-add-subtract-unlike-denominators' },
];

const PLACE_VALUE_OPTIONS = [
  { group: 'Grade 1', label: 'Identify numbers from tens and ones blocks', value: 'pv-g1-blocks-units' },
  { group: 'Grade 1', label: 'Name the place value of a digit', value: 'pv-g1-place-name' },
  { group: 'Grade 1', label: 'Which model shows the number?', value: 'pv-g1-match-blocks-to-number' },
  { group: 'Grade 2', label: 'Identify hundreds, tens, and ones blocks', value: 'pv-g2-blocks-hundreds' },
  { group: 'Grade 2', label: 'Write numbers in expanded form', value: 'pv-g2-expanded-form' },
  { group: 'Grade 2', label: 'Break down numbers in a table', value: 'pv-g2-breakdown-table' },
  { group: 'Grade 3', label: 'Identify thousands blocks', value: 'pv-g3-blocks-thousands' },
  { group: 'Grade 3', label: 'Write word form as a number', value: 'pv-g3-word-to-number' },
];

const SOCIAL_GK_OPTIONS = [
  { group: 'People', label: 'Identify famous persons', value: 'gk_identify_person_v1' },
  { group: 'People', label: 'Identify from images', value: 'gk_identify_image_v1' },
  { group: 'Facts', label: 'Personality trivia', value: 'gk_trivia_v1' },
  { group: 'Facts', label: 'Fill in the blanks', value: 'gk_fill_blanks_v1' },
  { group: 'Sorting', label: 'Political vs sports', value: 'gk_sort_people_v1' },
  { group: 'Reasoning', label: 'True or false', value: 'gk_true_false_v1' },
  { group: 'Reasoning', label: 'Spot the truth', value: 'gk_misconception_v1' },
  { group: 'Reasoning', label: 'Inference questions', value: 'gk_inference_v1' },
];

const TESTING_OPTIONS = [
  { group: 'Interactive', label: 'Interactive protractor', value: 'testing-protractor' },
  { group: 'Interactive', label: 'Copy drag/drop', value: 'testing-copy-drag-drop' },
  { group: 'Interactive', label: 'Categorization', value: 'testing-categorization' },
  { group: 'Visual Parts', label: 'Number line', value: 'testing-number-line' },
  { group: 'Visual Parts', label: 'Base-ten blocks', value: 'testing-base-ten-blocks' },
  { group: 'Visual Parts', label: 'Clock', value: 'testing-clock' },
  { group: 'Visual Parts', label: 'Missing time pattern', value: 'testing-clock-pattern' },
  { group: 'Visual Parts', label: 'Fraction model', value: 'testing-fraction-model' },
  { group: 'Composition', label: 'Mixed text/SVG/blank', value: 'testing-mixed-parts' },
  { group: 'Composition', label: 'Inputs + options', value: 'testing-doubles-plus-one-mixed' },
];

const SOURCE_CONFIGS = {
  'addition-topic': {
    label: 'Addition Practice',
    api: '/api/practice',
    badge: 'TOPIC',
    description: 'Topic-wise Addition engines, templates, and grade micro-skills.',
    defaultLogicType: 'addition-g1-e3-model-match-to-10',
    subject: 'math',
    topic: 'addition',
    options: ADDITION_TOPIC_OPTIONS,
    tips: [
      { label: 'Generator boundary', text: 'Engines create question JSON only.' },
      { label: 'Reusable skills', text: 'Grade skills pass config into shared template families.' },
    ],
  },
  subtraction: {
    label: 'Subtraction Practice',
    api: '/api/practice',
    badge: 'TOPIC',
    description: 'Topic-wise Subtraction engines, templates, and grade micro-skills.',
    defaultLogicType: 'subtraction-g1-c1-remove-cubes-to-10',
    subject: 'math',
    topic: 'subtraction',
    options: SUBTRACTION_TOPIC_OPTIONS,
    tips: [
      { label: 'Inverse model', text: 'Subtraction reuses the shared tool pattern, but students remove cubes from a row.' },
      { label: 'Generator boundary', text: 'Subtraction engines create question JSON only.' },
    ],
  },
  multiplication: {
  label: 'Multiplication Practice',
  api: '/api/practice',
  badge: 'TOPIC',
  description: 'Multiplication engines, templates, and grade micro-skills.',
  defaultLogicType: 'multiplication-g2-a1-facts-to-5',
  subject: 'math',
  topic: 'multiplication',
  options: MULTIPLICATION_OPTIONS,
  tips: [
    { label: 'Template families', text: 'Skills reuse multiplication templates.' },
    { label: 'Generator boundary', text: 'Engines create question JSON only.' },
  ],
},
  time: {
    label: 'Time Practice',
    api: '/api/practice',
    badge: 'TIME',
    description: 'Calendar, seasons, time units, clock reading, elapsed time, and time patterns.',
    defaultLogicType: 'v1_days_of_week',
    subject: 'math',
    topic: 'time',
    options: TIME_OPTIONS,
    tips: [
      { label: 'Shared shell', text: 'Time questions reuse the same renderers and feedback component.' },
      { label: 'Generator boundary', text: 'The time engine is normalized at the API boundary.' },
    ],
  },
  fractions: {
    label: 'Fractions Practice',
    api: '/api/practice',
    badge: 'FRAC',
    description: 'Fraction visual models integrated into the shared practice shell.',
    defaultLogicType: 'visual_models_identify',
    subject: 'math',
    topic: 'fractions',
    options: FRACTIONS_OPTIONS,
    tips: [
      { label: 'Starter-safe', text: 'Only stable fraction visual model skills are shown first.' },
      { label: 'Shared renderer', text: 'SVG models, MCQ choices, and blanks use the same practice shell.' },
    ],
  },
  'place-values': {
    label: 'Place Value Practice',
    api: '/api/practice',
    badge: 'PV',
    description: 'Base-ten blocks, place names, expanded form, word form, tables, and remediation-ready scaffolds.',
    defaultLogicType: 'pv-g1-blocks-units',
    subject: 'math',
    topic: 'place-values',
    options: PLACE_VALUE_OPTIONS,
    tips: [
      { label: 'Topic families', text: 'Blocks, place names, expanded form, and word form use separate family engines.' },
      { label: 'Markdown ready', text: 'Tables and highlighted text render directly from generator JSON.' },
    ],
  },
  'social-gk': {
    label: 'GK Practice',
    api: '/api/practice',
    badge: 'GK',
    description: 'General knowledge questions for people, facts, images, and reasoning prompts.',
    defaultLogicType: 'gk_identify_person_v1',
    subject: 'social',
    topic: 'gk',
    options: SOCIAL_GK_OPTIONS,
    tips: [
      { label: 'Subject-ready', text: 'Social topics use the same API and practice shell as math topics.' },
      { label: 'Interaction-ready', text: 'Sorting tasks are JSON-driven categorization questions.' },
      { label: 'Content governance', text: 'GK facts should stay versioned with source, locale, and review metadata.' },
    ],
  },
  'units-measurement': {
    label: 'Units & Measurement Practice',
    api: '/api/practice',
    badge: 'SCI',
    description: 'Units, temperature, measuring tools, metric/customary units, and conversions.',
    defaultLogicType: 'science-g2-p6-read-thermometer-celsius',
    subject: 'science',
    topic: 'units-measurement',
    options: UNITS_MEASUREMENT_OPTIONS,
    tips: [
      { label: 'IXL Quality', text: 'SVG thermometers scale responsively across all screens.' },
      { label: 'Interactive MCQ', text: 'Compare temperatures using multiple SVGs side by side.' },
    ],
  },
  'english-grammar': {
    label: 'Grammar Practice',
    api: '/api/practice',
    badge: 'ENG',
    description: 'Topic-wise Grammar engines, templates, and grade micro-skills.',
    defaultLogicType: 'english-g1-n1-identify-nouns',
    subject: 'english',
    topic: 'grammar',
    options: ENGLISH_GRAMMAR_OPTIONS,
    tips: [
      { label: 'Clean Generator', text: 'Engines create clean question JSON.' },
      { label: 'Responsive Layouts', text: 'Sentence, pronoun, and noun options adapt.' },
    ],
  },
  testing: {
    label: 'Testing Practice',
    api: '/api/practice',
    badge: 'TEST',
    description: 'Static JSON examples for testing reusable parts and interactive tools.',
    defaultLogicType: 'testing-copy-drag-drop',
    subject: 'math',
    topic: 'testing',
    options: TESTING_OPTIONS,
    tips: [
      { label: 'Part registry', text: 'Tools are called by name inside question parts.' },
      { label: 'Reusable JSON', text: 'Examples use the same practice API and shared shell.' },
    ],
  },
};

function resolveSearchValue(searchParams, key, fallback = null) {
  const raw = searchParams?.get(key);
  return raw && String(raw).trim() ? String(raw).trim() : fallback;
}

function getSourceConfig(sourceKey) {
  return SOURCE_CONFIGS[sourceKey] || SOURCE_CONFIGS['addition-topic'];
}

function sourceFromSubjectTopic(subject, topic, fallback) {
  if (subject === 'math' && topic === 'time') return 'time';
  if (subject === 'math' && topic === 'fractions') return 'fractions';
  if (subject === 'math' && topic === 'place-values') return 'place-values';
  if (subject === 'math' && topic === 'addition') return 'addition-topic';
  if (subject === 'math' && topic === 'subtraction') return 'subtraction';
  if (subject === 'math' && topic === 'testing') return 'testing';
  if (subject === 'social' && topic === 'gk') return 'social-gk';
  if (subject === 'science' && topic === 'units-measurement') return 'units-measurement';
  if (subject === 'english' && topic === 'grammar') return 'english-grammar';
  return fallback;
}

function CorrectPraiseCard({ praiseMessage }) {
  return (
    <div className={styles.correctPraiseCard}>
      <div className={styles.correctPraiseBadge}>✓</div>
      <h2>{praiseMessage?.title || 'Well done!'}</h2>
      <p>{praiseMessage?.subtitle || 'Getting the next question ready.'}</p>
    </div>
  );
}

function PracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSubject = resolveSearchValue(searchParams, 'subject');
  const urlTopic = resolveSearchValue(searchParams, 'topic');
  const urlSkill = resolveSearchValue(searchParams, 'skill');
  const initialSource = resolveSearchValue(searchParams, 'source', 'addition-topic');
  const resolvedInitialSource = sourceFromSubjectTopic(urlSubject, urlTopic, initialSource);
  const initialLogicType = urlSkill
    || resolveSearchValue(searchParams, 'forcedTask')
    || resolveSearchValue(searchParams, 'logic_type');

  const [sourceKey, setSourceKey] = useState(resolvedInitialSource);
  const [logicType, setLogicType] = useState(initialLogicType || getSourceConfig(resolvedInitialSource).defaultLogicType);
  const [question, setQuestion] = useState(null);
  const [templateJson, setTemplateJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [smartScore, setSmartScore] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [practiceLevel, setPracticeLevel] = useState(1);
  const [levelStreak, setLevelStreak] = useState(0);
  const [levelModal, setLevelModal] = useState(null);
  const [lastResult, setLastResult] = useState('none');
  const [difficulty, setDifficulty] = useState('adaptive');
  const [history, setHistory] = useState([]);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [jsonCopyStatus, setJsonCopyStatus] = useState('Copy');
  const [transitionState, setTransitionState] = useState('idle');
  const [praiseMessage, setPraiseMessage] = useState(null);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());

  const sourceConfig = useMemo(() => getSourceConfig(sourceKey), [sourceKey]);
  const questionJson = useMemo(() => (
    JSON.stringify({ question, template: templateJson }, null, 2)
  ), [question, templateJson]);
  const currentCompetency = useMemo(() => (
    resolveCompetency({
      subject: urlSubject || sourceConfig.subject,
      topic: urlTopic || sourceConfig.topic,
      skillId: logicType,
      templateId: question?.metadata?.templateId,
    })
  ), [logicType, question?.metadata?.templateId, sourceConfig.subject, sourceConfig.topic, urlSubject, urlTopic]);
  const prerequisiteLinks = useMemo(() => {
    const prerequisites = currentCompetency?.prerequisites || [];
    if (!prerequisites.length) return [];

    return prerequisites.map((competencyId) => {
      const matchingOption = sourceConfig.options.find((option) => {
        const optionCompetency = resolveCompetency({
          subject: urlSubject || sourceConfig.subject,
          topic: urlTopic || sourceConfig.topic,
          skillId: option.value,
        });
        return optionCompetency?.id === competencyId;
      });

      return {
        competencyId,
        label: matchingOption?.label || competencyId.replaceAll('_', ' '),
        skillId: matchingOption?.value || null,
      };
    });
  }, [currentCompetency?.prerequisites, sourceConfig.options, sourceConfig.subject, sourceConfig.topic, urlSubject, urlTopic]);

  const syncRoute = useCallback((nextSource, nextLogicType) => {
    const params = new URLSearchParams();
    const nextConfig = getSourceConfig(nextSource);

    if (urlSubject || urlTopic || urlSkill) {
      params.set('subject', nextConfig.subject);
      params.set('topic', nextConfig.topic);
      params.set('skill', nextLogicType);
    } else {
      params.set('source', nextSource);
      params.set('forcedTask', nextLogicType);
    }

    router.replace(`/practice?${params.toString()}`, { scroll: false });
  }, [router, urlSkill, urlSubject, urlTopic]);

  const fetchQuestion = useCallback(async (resetSession = false, sessionOverride = {}) => {
    setLoading(!sessionOverride.keepTransition);
    setLastResult('none');
    setUserAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
    if (!sessionOverride.keepTransition) {
      setTransitionState('idle');
      setPraiseMessage(null);
    }

    if (resetSession) {
      setSmartScore(0);
      setCorrectStreak(0);
      setPracticeLevel(1);
      setLevelStreak(0);
      setLevelModal(null);
      setHistory([]);
    }

    try {
      const url = new URL(sourceConfig.api, window.location.origin);
      url.searchParams.set('subject', urlSubject || sourceConfig.subject);
      url.searchParams.set('topic', urlTopic || sourceConfig.topic);
      url.searchParams.set('skill', logicType);
      url.searchParams.set('forcedTask', logicType);
      url.searchParams.set('difficulty', difficulty);
      url.searchParams.set('correctStreak', String(sessionOverride.correctStreak ?? correctStreak));
      url.searchParams.set('practiceLevel', String(sessionOverride.practiceLevel ?? practiceLevel));
      url.searchParams.set('levelStreak', String(sessionOverride.levelStreak ?? levelStreak));
      url.searchParams.set('lastResult', sessionOverride.lastResult ?? lastResult);
      const competency = resolveCompetency({
        subject: urlSubject || sourceConfig.subject,
        topic: urlTopic || sourceConfig.topic,
        skillId: logicType,
      });
      const storedMastery = loadMasteryState({
        subject: urlSubject || sourceConfig.subject,
        topic: urlTopic || sourceConfig.topic,
        skillId: logicType,
        competencyId: competency?.id,
      });
      const remediationNeeded = sessionOverride.remediationNeeded ?? storedMastery?.remediationNeeded ?? false;
      url.searchParams.set('remediationActive', remediationNeeded ? 'true' : 'false');
      url.searchParams.set('remediationStep', remediationNeeded ? '1' : '0');
      url.searchParams.set('seed', String(Date.now()));

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data?.success && data?.question) {
        setQuestion(data.question);
        setTemplateJson(data.template || null);
        setQuestionStartedAt(Date.now());
        if (sessionOverride.slideIn) {
          setTransitionState('slideIn');
          window.setTimeout(() => setTransitionState('idle'), 520);
        }
      } else {
        setQuestion(null);
        setTemplateJson(data?.error || null);
      }
    } catch (error) {
      console.error('Practice fetch error:', error);
      setQuestion(null);
      setTemplateJson(error.message);
    } finally {
      setLoading(false);
    }
  }, [correctStreak, difficulty, lastResult, levelStreak, logicType, practiceLevel, sourceConfig, urlSubject, urlTopic]);

  useEffect(() => {
    const nextSource = sourceFromSubjectTopic(urlSubject, urlTopic, initialSource);
    const nextLogicType = urlSkill
      || resolveSearchValue(searchParams, 'forcedTask')
      || resolveSearchValue(searchParams, 'logic_type')
      || getSourceConfig(nextSource).defaultLogicType;
    setSourceKey(nextSource);
    setLogicType(nextLogicType);
  }, [urlSubject, urlTopic, urlSkill, searchParams, initialSource]);

  useEffect(() => {
    const competency = resolveCompetency({
      subject: urlSubject || sourceConfig.subject,
      topic: urlTopic || sourceConfig.topic,
      skillId: logicType,
    });
    const storedMastery = loadMasteryState({
      subject: urlSubject || sourceConfig.subject,
      topic: urlTopic || sourceConfig.topic,
      skillId: logicType,
      competencyId: competency?.id,
    });

    if (storedMastery) {
      setSmartScore(Number(storedMastery.smartScore || 0));
      setCorrectStreak(Number(storedMastery.correctStreak || 0));
      setPracticeLevel(Number(storedMastery.practiceLevel || 1));
      setLevelStreak(Number(storedMastery.levelStreak || 0));
      setLastResult(storedMastery.lastResult || 'none');
      fetchQuestion(false, {
        correctStreak: Number(storedMastery.correctStreak || 0),
        practiceLevel: Number(storedMastery.practiceLevel || 1),
        levelStreak: Number(storedMastery.levelStreak || 0),
        lastResult: storedMastery.lastResult || 'none',
      });
      return;
    }

    setSmartScore(0);
    setCorrectStreak(0);
    setPracticeLevel(1);
    setLevelStreak(0);
    setLastResult('none');
    fetchQuestion(false, {
      correctStreak: 0,
      practiceLevel: 1,
      levelStreak: 0,
      lastResult: 'none',
    });
  }, [sourceKey, logicType, difficulty, urlSubject, urlTopic]);

  const handleSubmit = (answerOverride = undefined) => {
    const answerToCheck = answerOverride === undefined ? userAnswer : answerOverride;
    if (!question || answerToCheck === null || answerToCheck === undefined || isAnswered) return;

    const correct = isAnswerCorrect(question, answerToCheck);
    const newSmartScore = calculateSmartScore(smartScore, correct);
    const competency = question.metadata?.competency || currentCompetency;
    const attempt = createAttempt({
      question: {
        ...question,
        metadata: {
          ...(question.metadata || {}),
          competencyId: competency?.id || question.metadata?.competencyId || null,
          competency: competency || question.metadata?.competency || null,
        },
      },
      userAnswer: answerToCheck,
      isCorrect: correct,
      difficulty,
      practiceLevel,
      smartScoreBefore: smartScore,
      smartScoreAfter: newSmartScore,
      startedAt: questionStartedAt,
    });
    const previousMastery = loadMasteryState(attempt);
    const nextMastery = updateMasteryState(previousMastery, attempt);
    saveMasteryState(attempt, nextMastery);
    appendAttempt(attempt);

    const nextCorrectStreak = nextMastery.correctStreak;
    const nextLevelStreak = correct ? levelStreak + 1 : 0;
    const nextPracticeLevel = nextMastery.practiceLevel;
    const finalLevelStreak = nextMastery.levelStreak;
    const didLevelUp = correct && nextLevelStreak >= 5;

    setSmartScore(nextMastery.smartScore);
    setCorrectStreak(nextCorrectStreak);
    if (didLevelUp) {
      setPracticeLevel(nextPracticeLevel);
      setLevelStreak(finalLevelStreak);
      setLevelModal({
        level: nextPracticeLevel,
        isMaxLevel: nextPracticeLevel === 5,
      });
    } else {
      setPracticeLevel(nextPracticeLevel);
      setLevelStreak(finalLevelStreak);
    }
    setLastResult(correct ? 'correct' : 'incorrect');
    setIsCorrect(correct);
    setIsAnswered(true);
    setHistory((prev) => [{
      type: question.metadata?.skillId || logicType,
      isCorrect: correct,
      scoreChange: nextMastery.smartScore - smartScore,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev].slice(0, 5));

    if (correct) {
      const praisePool = didLevelUp
        ? ['Level up!', 'Brilliant streak!', 'You are moving up!']
        : nextCorrectStreak >= 4
          ? ['Fantastic!', 'Sharp work!', 'Great streak!']
          : ['Well done!', 'Nice work!', 'Correct!'];

      setPraiseMessage({
        title: praisePool[nextCorrectStreak % praisePool.length],
        subtitle: didLevelUp
          ? `Five in a row. Now Level ${nextPracticeLevel}.`
          : `${finalLevelStreak}/5 correct toward Level ${nextPracticeLevel < 5 ? nextPracticeLevel + 1 : 5}.`,
      });
      setTransitionState('praise');

      window.setTimeout(() => {
        fetchQuestion(false, {
          correctStreak: nextCorrectStreak,
          practiceLevel: nextPracticeLevel,
          levelStreak: finalLevelStreak,
          lastResult: 'correct',
          remediationNeeded: false,
          keepTransition: true,
          slideIn: true,
        });
      }, 950);
    }
  };

  const copyQuestionJson = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(questionJson);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = questionJson;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setJsonCopyStatus('Copied');
      window.setTimeout(() => setJsonCopyStatus('Copy'), 1400);
    } catch (error) {
      console.error('Question JSON copy failed:', error);
      setJsonCopyStatus('Failed');
      window.setTimeout(() => setJsonCopyStatus('Copy'), 1400);
    }
  }, [questionJson]);

  const inlineFeedback = isAnswered && !isCorrect ? (
    <PracticeFeedback
      question={question}
      isCorrect={isCorrect}
      onNext={() => fetchQuestion()}
    />
  ) : null;

  const leftPanel = (
    <div className={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 className={styles.panelTitle} style={{ margin: 0 }}>{sourceConfig.label}</h4>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#0f766e', background: '#ccfbf1', borderRadius: 999, padding: '4px 8px' }}>
          {sourceConfig.badge}
        </div>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b', fontWeight: 700, lineHeight: 1.5 }}>
        {sourceConfig.description}
      </p>
      <select
        value={sourceKey}
        onChange={(event) => {
          const nextSource = event.target.value;
          const nextLogicType = getSourceConfig(nextSource).defaultLogicType;
          setSourceKey(nextSource);
          setLogicType(nextLogicType);
          syncRoute(nextSource, nextLogicType);
        }}
        style={{
          width: '100%',
          marginBottom: 18,
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid #dbeafe',
          background: '#ffffff',
          color: '#0f172a',
          fontWeight: 800,
        }}
      >
        {Object.entries(SOURCE_CONFIGS).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Array.from(new Set(sourceConfig.options.map((opt) => opt.group))).map((group) => (
          <div key={group}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sourceConfig.options.filter((opt) => opt.group === group).map((opt) => {
                const isActive = logicType === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setLogicType(opt.value);
                      syncRoute(sourceKey, opt.value);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: isActive ? '#0f172a' : '#ffffff',
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: isActive ? '#0f172a' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#1e293b',
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 650,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const rightPanel = (
    <>
      <div style={{ background: '#ffffff', padding: 18, borderRadius: 20, border: '1px solid #dbeafe', marginBottom: 20, boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Level
            </div>
            <div style={{ fontSize: 28, fontWeight: 950, color: '#0f172a', lineHeight: 1 }}>
              {practiceLevel}
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 4 }}>/5</span>
            </div>
          </div>
          <div style={{ minWidth: 72, textAlign: 'right', color: '#16a34a', fontSize: 12, fontWeight: 900 }}>
            {levelStreak}/5 correct
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: '#eef2ff', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, (levelStreak / 5) * 100)}%`,
              height: '100%',
              borderRadius: 999,
              background: '#4ade80',
              transition: 'width 220ms ease',
            }}
          />
        </div>
      </div>

      {prerequisiteLinks.length ? (
        <div style={{ background: '#f8fafc', padding: 18, borderRadius: 20, border: '1px solid #dbeafe', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Prerequisites
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prerequisiteLinks.map((item) => (
              item.skillId ? (
                <button
                  key={item.competencyId}
                  type="button"
                  onClick={() => {
                    setLogicType(item.skillId);
                    syncRoute(sourceKey, item.skillId);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: '1px solid #dbeafe',
                    background: '#ffffff',
                    color: '#2563eb',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 850,
                    lineHeight: 1.25,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ) : (
                <div
                  key={item.competencyId}
                  style={{
                    border: '1px dashed #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    lineHeight: 1.25,
                    textTransform: 'capitalize',
                  }}
                >
                  {item.label}
                </div>
              )
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ background: '#ecfeff', padding: 20, borderRadius: 20, border: '1px solid #cffafe', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 900, color: '#155e75', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Architecture
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sourceConfig.tips.map((item) => (
            <div key={item.label} style={{ background: '#ffffff', padding: 12, borderRadius: 12, color: '#155e75' }}>
              <div style={{ fontSize: 12, fontWeight: 900 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 650, lineHeight: 1.45 }}>{item.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.darkPanel}>
        <h3 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Session History
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((h) => (
            <div key={`${h.timestamp}-${h.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '12px 14px', borderRadius: 12, border: '1px solid #334155' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{h.type}</span>
              <span style={{ fontWeight: 900, color: h.isCorrect ? '#4ade80' : '#f87171', fontSize: 14 }}>
                {h.isCorrect ? `+${h.scoreChange}` : h.scoreChange}
              </span>
            </div>
          ))}
          {history.length === 0 ? (
            <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No answers yet.</p>
          ) : null}
        </div>
      </div>

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 900, fontSize: 12, color: '#334155' }}>
          <span>Question JSON</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              copyQuestionJson();
            }}
            style={{
              float: 'right',
              marginTop: -3,
              border: '1px solid rgba(15, 23, 42, 0.12)',
              background: jsonCopyStatus === 'Copied' ? '#dcfce7' : '#ffffff',
              color: jsonCopyStatus === 'Copied' ? '#166534' : '#0f172a',
              borderRadius: 999,
              padding: '5px 10px',
              fontSize: 10,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
            }}
          >
            {jsonCopyStatus}
          </button>
        </summary>
        <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', fontSize: 11, lineHeight: 1.5, background: '#0f172a', color: '#cbd5e1', padding: 12, borderRadius: 12, maxHeight: 360, overflow: 'auto' }}>
          {questionJson}
        </pre>
      </details>
    </>
  );

  return (
    <>
      <LabLayout
        title={sourceConfig.label}
        grade="Shared Practice Shell"
        smartScore={smartScore}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onReset={() => fetchQuestion(true)}
        loading={loading}
        question={question}
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        feedback={inlineFeedback}
        isAnswered={isAnswered}
        handleSubmit={handleSubmit}
        userAnswer={userAnswer}
        autoSubmit={autoSubmit}
        setAutoSubmit={setAutoSubmit}
        practiceLevel={practiceLevel}
        levelStreak={levelStreak}
      >
        {question ? (
          <div className={transitionState === 'slideIn' ? styles.questionSlideIn : undefined} style={{ width: '100%' }}>
            {transitionState === 'praise' ? (
              <CorrectPraiseCard praiseMessage={praiseMessage} />
            ) : (
              <QuestionRenderer
                key={`${sourceKey}:${logicType}:${question.id}`}
                question={question}
                userAnswer={userAnswer}
                isAnswered={isAnswered}
                isCorrect={isCorrect}
                onAnswer={(answer) => {
                  setUserAnswer(answer);
                  if (
                    autoSubmit
                    && !isAnswered
                    && (question.type === 'mcq' || question.type === 'multipleChoice' || question.type === 'multiplechoice')
                  ) {
                    window.setTimeout(() => handleSubmit(answer), 0);
                  }
                }}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        ) : (
          <div style={{ color: '#991b1b', fontWeight: 800 }}>
            No question could be loaded.
          </div>
        )}
      </LabLayout>

      {levelModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Level streak"
          onClick={() => setLevelModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(15, 23, 42, 0.22)',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(340px, 100%)',
              borderRadius: 22,
              background: '#ffffff',
              border: '1px solid #dcfce7',
              boxShadow: '0 26px 70px rgba(15, 23, 42, 0.22)',
              padding: 22,
              textAlign: 'center',
            }}
          >
            <div style={{ width: 54, height: 54, margin: '0 auto 12px', borderRadius: 999, background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 950 }}>
              {levelModal.level}
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 22, lineHeight: 1.15 }}>
              {levelModal.isMaxLevel ? 'Level 5 reached' : `Level ${levelModal.level} unlocked`}
            </h3>
            <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }}>
              Five correct answers in a row. The next set can step up in challenge.
            </p>
            <button
              type="button"
              onClick={() => setLevelModal(null)}
              style={{
                border: 0,
                borderRadius: 999,
                background: '#4fb77a',
                color: '#ffffff',
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 12px 24px rgba(34, 197, 94, 0.22)',
              }}
            >
              Keep practicing
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontWeight: 800 }}>Loading practice...</div>}>
      <PracticePageContent />
    </Suspense>
  );
}
