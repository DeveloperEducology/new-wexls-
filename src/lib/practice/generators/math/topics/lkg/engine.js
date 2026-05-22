import { lkgCountingObjects } from './assets.js';

/**
 * Question Type 1: Counting items up to 5
 */
export function generateLkgQuestion(config = {}) {
  const seed = config.seed || Date.now();
  const objects = config.objects || lkgCountingObjects;

  const count = Math.floor(Math.random() * 5) + 1;
  const item = objects[Math.floor(Math.random() * objects.length)];

  const instruction = `Count the ${item.plural}. Click each ${item.name} to keep track as you count.`;
  const subInstruction = `How many ${item.plural} are there?`;

  return {
    id: `lkg_counting_${seed}_${count}`,
    type: 'mcq',
    questionText: subInstruction,
    parts: [
      {
        type: 'interactive_counting',
        instruction: instruction,
        subInstruction: subInstruction,
        image: item.image,
        count: count,
        itemLabel: item.name,
      }
    ],
    options: [
      { id: '1', label: '1', value: 1 },
      { id: '2', label: '2', value: 2 },
      { id: '3', label: '3', value: 3 },
      { id: '4', label: '4', value: 4 },
      { id: '5', label: '5', value: 5 }
    ],
    correctAnswerIndex: count - 1,
    answer: count - 1,
    solution: {
      sections: [
        {
          type: 'text',
          content: `There are exactly ${count} ${count === 1 ? item.name : item.plural}.`
        }
      ]
    },
    layoutConfig: { variant: 'capsule' },
    submitButtonText: 'Submit',
    submitButtonStyle: {
      background: '#52b800',
      padding: '12px 36px',
      borderRadius: '8px',
      fontSize: '18px',
      fontWeight: 'bold',
      boxShadow: '0 4px 10px rgba(82, 184, 0, 0.3)',
      border: 'none',
      color: '#ffffff'
    },
    metadata: {
      topic: 'lkg',
      templateId: 'lkg.count.objects_up_to_5',
      subject: 'math',
      grade: 'LKG',
      competencyId: 'lkg_counting_5'
    }
  };
}

/**
 * Question Type 2: Comparing quantities (More vs Less)
 */
export function generateLkgCompareQuestion(config = {}) {
  const seed = config.seed || Date.now();
  const objects = config.objects || lkgCountingObjects;

  const comparisonType = Math.random() > 0.5 ? 'more' : 'fewer';
  const shuffledObjects = [...objects].sort(() => Math.random() - 0.5);
  const itemA = shuffledObjects[0];
  const itemB = shuffledObjects[1];

  let countA = Math.floor(Math.random() * 5) + 1;
  let countB = Math.floor(Math.random() * 5) + 1;
  while (countA === countB) {
    countB = Math.floor(Math.random() * 5) + 1;
  }

  const instruction = `Look at both groups. Which group has ${comparisonType} items?`;
  const questionText = `Which group has ${comparisonType}?`;

  let correctAnswerIndex = comparisonType === 'more' 
    ? (countA > countB ? 0 : 1) 
    : (countA < countB ? 0 : 1);

  return {
    id: `lkg_compare_${seed}_${countA}_vs_${countB}`,
    type: 'mcq',
    questionText: questionText,
    parts: [
      {
        type: 'text',
        content: instruction,
        style: { fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }
      },
      {
        type: 'side_by_side_display',
        groupA: { itemLabel: itemA.plural, image: itemA.image, count: countA },
        groupB: { itemLabel: itemB.plural, image: itemB.image, count: countB }
      }
    ],
    options: [
      {
        id: 'group_a',
        label: `Group of ${countA} ${countA === 1 ? itemA.name : itemA.plural}`,
        value: 'A',
        displayImage: itemA.image,
        displayCount: countA
      },
      {
        id: 'group_b',
        label: `Group of ${countB} ${countB === 1 ? itemB.name : itemB.plural}`,
        value: 'B',
        displayImage: itemB.image,
        displayCount: countB
      }
    ],
    correctAnswerIndex: correctAnswerIndex,
    answer: correctAnswerIndex,
    solution: {
      sections: [
        {
          type: 'text',
          content: `Group A has ${countA} ${itemA.plural} and Group B has ${countB} ${itemB.plural}. Therefore, the group with ${comparisonType} is the ${correctAnswerIndex === 0 ? 'first' : 'second'} option.`
        }
      ]
    },
    layoutConfig: { variant: 'split-card', columns: 2 },
    submitButtonText: 'Check Answer',
    submitButtonStyle: {
      background: '#ff9f43',
      padding: '12px 36px',
      borderRadius: '8px',
      fontSize: '18px',
      fontWeight: 'bold',
      boxShadow: '0 4px 10px rgba(255, 159, 67, 0.3)',
      border: 'none',
      color: '#ffffff'
    },
    metadata: {
      topic: 'lkg',
      templateId: 'lkg.compare.objects_up_to_5',
      subject: 'math',
      grade: 'LKG',
      competencyId: 'lkg_comparison_5'
    }
  };
}