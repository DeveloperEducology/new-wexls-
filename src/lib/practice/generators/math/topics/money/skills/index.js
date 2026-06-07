export const moneyMicroSkills = [
  // ── LKG ───────────────────────────────────────────────────────────────────
  {
    id: 'lkg-money-coin-values',
    code: 'J.1',
    grade: 'LKG',
    chapter: 'Money',
    title: 'Coin values',
    topic: 'money',
    templateId: 'money.coin_values',
    config: {
      allowedDenominations: [1, 2, 5],
      maxCoins: 1,
      minVal: 1,
      maxVal: 5
    }
  },
  {
    id: 'lkg-money-count-coins',
    code: 'J.2',
    grade: 'LKG',
    chapter: 'Money',
    title: 'Count 1-rupee coins',
    topic: 'money',
    templateId: 'money.count',
    config: {
      allowedDenominations: [1],
      maxCoins: 4,
      minCoins: 1
    }
  },

  // ── UKG ───────────────────────────────────────────────────────────────────
  {
    id: 'ukg-money-coin-values',
    code: 'P.1',
    grade: 'UKG',
    chapter: 'Money',
    title: 'Coin values',
    topic: 'money',
    templateId: 'money.coin_values',
    config: {
      allowedDenominations: [1, 2, 5, 10],
      maxCoins: 1,
      minVal: 1,
      maxVal: 10
    }
  },
  {
    id: 'ukg-money-count-1',
    code: 'P.2',
    grade: 'UKG',
    chapter: 'Money',
    title: 'Count money - 1-rupee coins only',
    topic: 'money',
    templateId: 'money.count',
    config: {
      allowedDenominations: [1],
      maxCoins: 10,
      minCoins: 1
    }
  },
  {
    id: 'ukg-money-count-1-2',
    code: 'P.3',
    grade: 'UKG',
    chapter: 'Money',
    title: 'Count money - 1- and 2-rupee coins',
    topic: 'money',
    templateId: 'money.count',
    config: {
      allowedDenominations: [1, 2],
      maxCoins: 7,
      minCoins: 2
    }
  },
  {
    id: 'ukg-money-count-1-2-5',
    code: 'P.4',
    grade: 'UKG',
    chapter: 'Money',
    title: 'Count money - 1-, 2- and 5-rupee coins',
    topic: 'money',
    templateId: 'money.count',
    config: {
      allowedDenominations: [1, 2, 5],
      maxCoins: 6,
      minCoins: 2
    }
  },
  {
    id: 'ukg-money-equivalent-groups',
    code: 'P.5',
    grade: 'UKG',
    chapter: 'Money',
    title: 'Equivalent groups of coins',
    topic: 'money',
    templateId: 'money.equivalent_groups',
    config: {
      allowedDenominations: [1, 2, 5, 10],
      maxVal: 20
    }
  },
  {
    id: 'ukg-money-compare-groups',
    code: 'P.6',
    grade: 'UKG',
    chapter: 'Money',
    title: 'Compare two groups of coins',
    topic: 'money',
    templateId: 'money.compare_groups',
    config: {
      allowedDenominations: [1, 2, 5, 10, 20],
      maxVal: 30
    }
  },

  // ── Grade 1 ───────────────────────────────────────────────────────────────
  {
    id: 'g1-money-count-to-20',
    code: 'M.1',
    grade: '1',
    chapter: 'Money',
    title: 'Count money - up to ₹20',
    topic: 'money',
    templateId: 'money.count',
    config: {
      allowedDenominations: [1, 2, 5, 10, 20],
      maxCoins: 5,
      maxVal: 20
    }
  },
  {
    id: 'g1-money-count-to-50',
    code: 'M.2',
    grade: '1',
    chapter: 'Money',
    title: 'Count money - up to ₹50',
    topic: 'money',
    templateId: 'money.count',
    config: {
      allowedDenominations: [1, 2, 5, 10, 20, 50],
      maxCoins: 7,
      maxVal: 50
    }
  },
  {
    id: 'g1-money-equivalent-groups-20',
    code: 'M.3',
    grade: '1',
    chapter: 'Money',
    title: 'Equivalent groups of coins and notes - up to ₹20',
    topic: 'money',
    templateId: 'money.equivalent_groups',
    config: {
      allowedDenominations: [1, 2, 5, 10, 20],
      maxVal: 20
    }
  },
  {
    id: 'g1-money-compare-groups-50',
    code: 'M.4',
    grade: '1',
    chapter: 'Money',
    title: 'Compare groups of coins and notes - up to ₹50',
    topic: 'money',
    templateId: 'money.compare_groups',
    config: {
      allowedDenominations: [1, 2, 5, 10, 20, 50],
      maxVal: 50
    }
  },

  // ── Grade 2 ───────────────────────────────────────────────────────────────
  {
    id: 'g2-money-count-to-100',
    code: 'N.1',
    grade: '2',
    chapter: 'Money',
    title: 'Count money - up to ₹100',
    topic: 'money',
    templateId: 'money.count',
    config: {
      allowedDenominations: [1, 2, 5, 10, 20, 50, 100],
      maxCoins: 8,
      maxVal: 100
    }
  },
  {
    id: 'g2-money-count-to-500',
    code: 'N.2',
    grade: '2',
    chapter: 'Money',
    title: 'Count money - up to ₹500',
    topic: 'money',
    templateId: 'money.count',
    config: {
      allowedDenominations: [1, 2, 5, 10, 20, 50, 100, 200, 500],
      maxCoins: 8,
      maxVal: 500
    }
  },
  {
    id: 'g2-money-making-change',
    code: 'N.3',
    grade: '2',
    chapter: 'Money',
    title: 'Making change',
    topic: 'money',
    templateId: 'money.making_change',
    config: {
      maxPrice: 200,
      notesPaid: [10, 20, 50, 100, 200, 500]
    }
  },
  {
    id: 'g2-money-word-problems',
    code: 'N.4',
    grade: '2',
    chapter: 'Money',
    title: 'Money word problems',
    topic: 'money',
    templateId: 'money.word_problems',
    config: {
      maxVal: 100
    }
  }
];

export const moneySkillsByGrade = moneyMicroSkills.reduce((acc, skill) => {
  acc[skill.grade] = acc[skill.grade] || [];
  acc[skill.grade].push(skill);
  return acc;
}, {});

export const moneySkillMap = Object.fromEntries(
  moneyMicroSkills.map((skill) => [skill.id, skill])
);

export function getMoneySkill(id) {
  return moneySkillMap[id] || null;
}
