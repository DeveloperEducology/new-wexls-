// standalone Money Question Generator Engine
// Renders vector SVG coins and real Indian notes dynamically

import { NOTE_IMAGES, coinsGroupSvg } from '../shared/moneyAssets.js';

function seededRandom(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return function () {
    h += 0xe207fba5;
    let t = Math.imul(h ^ (h >>> 15), 15 | (h >>> 24));
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | (t >>> 14));
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeFillQuestion(questionText, parts, answer, solutionText) {
  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [{ type: 'text', content: questionText, hasAudio: true }, ...parts],
    answer,
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify(answer),
    solution: { sections: [{ type: 'text', content: solutionText }] }
  };
}

export function generateMoneyQuestion(template, variables) {
  const seed = variables.seed || String(Date.now());
  const random = seededRandom(seed);
  const config = template.config || {};
  const { mode } = config;

  if (mode === 'coin_values') {
    const allowed = config.allowedDenominations || [1, 2, 5, 10];
    const targetVal = allowed[Math.floor(random() * allowed.length)];
    const svgContent = coinsGroupSvg([targetVal]);
    
    const isNote = targetVal >= 10;
    const questionText = isNote ? "How much is this note worth?" : "How much is this coin worth?";
    
    return makeFillQuestion(
      questionText,
      [
        {
          type: 'svg',
          content: svgContent,
          isVertical: true,
          style: { maxWidth: '180px', margin: '15px auto', justifyContent: 'center' }
        },
        {
          type: 'text',
          content: `₹ [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left', margin: '10px 0' }
        }
      ],
      { ans: String(targetVal) },
      `It has a value of ₹${targetVal}.`
    );
  }

  if (mode === 'count') {
    const difficulty = config.difficulty || 'easy';
    let allowed = config.allowedDenominations || [1, 2, 5];
    let minCoins = config.minCoins || 1;
    let maxCoins = config.maxCoins || 6;
    let maxVal = config.maxVal || 500;

    if (difficulty === 'easy') {
      maxCoins = Math.min(maxCoins, Math.max(minCoins, 3));
      maxVal = Math.min(maxVal, Math.max(10, Math.floor(maxVal * 0.4)));
      if (allowed.length > 2) {
        allowed = allowed.slice(0, Math.ceil(allowed.length / 2));
      }
    } else if (difficulty === 'medium') {
      minCoins = Math.max(minCoins, Math.min(maxCoins, 2));
      maxCoins = Math.min(maxCoins, Math.max(minCoins, 5));
      maxVal = Math.min(maxVal, Math.max(20, Math.floor(maxVal * 0.7)));
    } else {
      minCoins = Math.max(minCoins, Math.min(maxCoins, 3));
    }

    let targetCoins = [];
    let sum = 0;
    
    let attempts = 0;
    while (attempts < 50) {
      attempts++;
      const count = minCoins + Math.floor(random() * (maxCoins - minCoins + 1));
      const tempCoins = [];
      let tempSum = 0;
      for (let i = 0; i < count; i++) {
        const c = allowed[Math.floor(random() * allowed.length)];
        tempCoins.push(c);
        tempSum += c;
      }
      if (tempSum <= maxVal) {
        targetCoins = tempCoins;
        sum = tempSum;
        break;
      }
    }
    
    if (targetCoins.length === 0) {
      targetCoins = [1];
      sum = 1;
    }

    targetCoins.sort((a, b) => b - a); // largest notes first
    const svgContent = coinsGroupSvg(targetCoins);
    
    const questionText = "How much money is there?";
    return makeFillQuestion(
      questionText,
      [
        {
          type: 'svg',
          content: svgContent,
          isVertical: true,
          style: { maxWidth: '100%', margin: '15px 0', justifyContent: 'left' }
        },
        {
          type: 'text',
          content: `₹ [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left', margin: '10px 0' }
        }
      ],
      { ans: String(sum) },
      `The coins and notes add up to ${targetCoins.map(c => `₹${c}`).join(' + ')}, which equals ₹${sum}.`
    );
  }

  if (mode === 'equivalent_groups') {
    const allowed = config.allowedDenominations || [1, 2, 5, 10];
    const maxVal = config.maxVal || 20;
    const difficulty = config.difficulty || 'easy';
    
    let targetVal;
    if (difficulty === 'easy') {
      const limit = Math.max(4, Math.floor(maxVal * 0.4));
      targetVal = 2 + Math.floor(random() * (limit - 1));
    } else if (difficulty === 'medium') {
      const min = Math.max(2, Math.floor(maxVal * 0.3));
      const max = Math.floor(maxVal * 0.7);
      targetVal = min + Math.floor(random() * (max - min + 1));
    } else {
      const min = Math.max(2, Math.floor(maxVal * 0.6));
      targetVal = min + Math.floor(random() * (maxVal - min + 1));
    }

    const generateDistinctGroup = (val, excludeList = []) => {
      const excludeStrings = excludeList.map(arr => arr.slice().sort().join(','));
      let attempts = 0;
      while (attempts < 40) {
        attempts++;
        let t = val;
        const group = [];
        while (t > 0) {
          const opts = allowed.filter(c => c <= t);
          if (opts.length === 0) break;
          const chosen = opts[Math.floor(random() * opts.length)];
          group.push(chosen);
          t -= chosen;
        }
        const str = group.slice().sort().join(',');
        if (!excludeStrings.includes(str) && t === 0) {
          return group;
        }
      }
      let rem = val;
      const fallback = [];
      while (rem > 0) {
        const opts = allowed.filter(c => c <= rem);
        const chosen = opts.length > 0 ? Math.max(...opts) : 1;
        fallback.push(chosen);
        rem -= chosen;
      }
      return fallback;
    };

    const targetCoins = generateDistinctGroup(targetVal);
    const targetSvg = coinsGroupSvg(targetCoins);
    
    const correctCoins = generateDistinctGroup(targetVal, [targetCoins]);
    const decoy1Coins = generateDistinctGroup(targetVal + (random() > 0.5 ? 1 : -1), [targetCoins, correctCoins]);
    const decoy2Coins = generateDistinctGroup(targetVal + (random() > 0.5 ? 2 : -2), [targetCoins, correctCoins, decoy1Coins]);
    
    const choices = [
      { id: 'correct', svg: coinsGroupSvg(correctCoins), label: 'Correct Group', value: targetVal },
      { id: 'decoy1', svg: coinsGroupSvg(decoy1Coins), label: 'Decoy Group 1', value: targetVal + 1 },
      { id: 'decoy2', svg: coinsGroupSvg(decoy2Coins), label: 'Decoy Group 2', value: targetVal + 2 }
    ];

    choices.sort(() => random() - 0.5);
    const correctIdx = choices.findIndex(c => c.id === 'correct');
    const answerId = choices[correctIdx].id;
    
    const questionText = "Which group shows the same amount?";
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: "Look at this money:" },
        { type: 'svg', content: targetSvg },
        { type: 'text', content: questionText }
      ],
      options: choices.map(c => ({
        id: c.id,
        label: c.label,
        svg: c.svg,
        hideLabel: true
      })),
      answer: answerId,
      correctAnswerIndex: correctIdx,
      layoutConfig: {
        columns: 1
      },
      solution: {
        sections: [
          { type: 'text', content: `The target group adds up to ₹${targetVal}. The correct option also adds up to ₹${targetVal}.` }
        ]
      }
    };
  }

  if (mode === 'compare_groups') {
    const allowed = config.allowedDenominations || [1, 2, 5, 10, 20, 50, 100];
    const maxVal = config.maxVal || 50;
    const difficulty = config.difficulty || 'easy';
    
    let limitMax = maxVal;
    let limitMin = 2;
    if (difficulty === 'easy') {
      limitMax = Math.max(5, Math.floor(maxVal * 0.4));
    } else if (difficulty === 'medium') {
      limitMin = Math.max(2, Math.floor(maxVal * 0.3));
      limitMax = Math.floor(maxVal * 0.7);
    } else {
      limitMin = Math.max(2, Math.floor(maxVal * 0.5));
    }
    
    const valA = limitMin + Math.floor(random() * (limitMax - limitMin + 1));
    let valB = 2 + Math.floor(random() * (maxVal - 1));
    const minDiff = Math.max(1, Math.floor(maxVal * 0.05));
    while (Math.abs(valA - valB) < minDiff || valA === valB) {
      valB = 2 + Math.floor(random() * (maxVal - 1));
    }

    const generateCoinsForVal = (val) => {
      let t = val;
      const list = [];
      while (t > 0) {
        const opts = allowed.filter(c => c <= t);
        if (opts.length === 0) break;
        const chosen = opts[Math.floor(random() * opts.length)];
        list.push(chosen);
        t -= chosen;
      }
      return list.sort((a, b) => b - a);
    };

    const coinsA = generateCoinsForVal(valA);
    const coinsB = generateCoinsForVal(valB);
    
    const svgA = coinsGroupSvg(coinsA);
    const svgB = coinsGroupSvg(coinsB);
    
    const isCompareMore = random() > 0.5;
    const questionText = isCompareMore ? "Which is more?" : "Which is less?";
    
    const isAMore = valA > valB;
    const isACorrect = isCompareMore ? isAMore : !isAMore;
    
    const choices = [
      { id: 'group_a', svg: svgA, label: 'Group A', isCorrect: isACorrect },
      { id: 'group_b', svg: svgB, label: 'Group B', isCorrect: !isACorrect }
    ];
    
    const answerId = choices.find(c => c.isCorrect).id;
    const correctIdx = choices.findIndex(c => c.isCorrect);
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: choices.map(c => ({
        id: c.id,
        label: c.label,
        svg: c.svg,
        hideLabel: true
      })),
      answer: answerId,
      correctAnswerIndex: correctIdx,
      layoutConfig: {
        columns: 1
      },
      solution: {
        sections: [
          { type: 'text', content: `Group A shows ₹${valA} and Group B shows ₹${valB}. The ${isCompareMore ? 'larger' : 'smaller'} amount is ${isACorrect ? 'Group A' : 'Group B'}.` }
        ]
      }
    };
  }

  if (mode === 'making_change') {
    const difficulty = config.difficulty || 'easy';
    const items = [
      { name: 'toy car', prices: [45, 65, 80, 120, 150] },
      { name: 'notebook', prices: [25, 35, 45, 75] },
      { name: 'box of crayons', prices: [15, 35, 55, 95] },
      { name: 'pencil box', prices: [40, 60, 85, 110] },
      { name: 'soccer ball', prices: [140, 180, 240, 350] }
    ];
    
    const item = items[Math.floor(random() * items.length)];
    let maxPrice = config.maxPrice || 200;
    if (difficulty === 'easy') {
      maxPrice = Math.min(maxPrice, 50);
    } else if (difficulty === 'medium') {
      maxPrice = Math.min(maxPrice, 120);
    }
    const allowedPrices = item.prices.filter(p => p <= maxPrice);
    const price = allowedPrices.length > 0 ? allowedPrices[Math.floor(random() * allowedPrices.length)] : 35;
    
    const billsPaidOpts = [10, 20, 50, 100, 200, 500].filter(b => b > price);
    const billPaid = billsPaidOpts.length > 0 ? billsPaidOpts[0] : 50; // closest larger note
    
    const change = billPaid - price;
    const billPaidSvg = coinsGroupSvg([billPaid]);

    const questionText = `Arjun buys a ${item.name} for ₹${price}. He pays with a ₹${billPaid} note. How much change does he get?`;
    
    return makeFillQuestion(
      questionText,
      [
        {
          type: 'svg',
          content: billPaidSvg,
          isVertical: true,
          style: { maxWidth: '180px', margin: '15px auto', justifyContent: 'center' }
        },
        {
          type: 'text',
          content: `₹ [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left', margin: '10px 0' }
        }
      ],
      { ans: String(change) },
      `Arjun paid ₹${billPaid} and the price was ₹${price}. The change is ₹${billPaid} - ₹${price} = ₹${change}.`
    );
  }

  if (mode === 'word_problems') {
    const difficulty = config.difficulty || 'easy';
    let maxVal = config.maxVal || 100;
    if (difficulty === 'easy') {
      maxVal = Math.min(maxVal, 20);
    } else if (difficulty === 'medium') {
      maxVal = Math.min(maxVal, 50);
    }
    
    const scenarios = [
      // Scenario 1: Addition (Aarav has X, gets Y more)
      () => {
        const x = 5 + Math.floor(random() * (maxVal / 2 - 5));
        const y = 5 + Math.floor(random() * (maxVal / 2 - 5));
        const sum = x + y;
        return {
          text: `Aarav has ₹${x}. His sister gives him ₹${y} more. How much money does Aarav have now?`,
          ans: String(sum),
          sol: `Aarav has ₹${x} + ₹${y} = ₹${sum} in total.`
        };
      },
      // Scenario 2: Subtraction (Ishaan has X, spends Y)
      () => {
        const x = 20 + Math.floor(random() * (maxVal - 20));
        const y = 5 + Math.floor(random() * (x - 10));
        const diff = x - y;
        return {
          text: `Ishaan has ₹${x}. He spends ₹${y} to buy a book. How much money does Ishaan have left?`,
          ans: String(diff),
          sol: `Ishaan had ₹${x} and spent ₹${y}. He has ₹${x} - ₹${y} = ₹${diff} left.`
        };
      },
      // Scenario 3: Equal Groups Multiplication (Sanya buys N pencils for X each)
      () => {
        const count = 2 + Math.floor(random() * 4); // 2 to 5 items
        const price = [2, 5, 10, 20][Math.floor(random() * 4)];
        const total = count * price;
        return {
          text: `Sanya buys ${count} pencils. Each pencil costs ₹${price}. How much does Sanya pay in total?`,
          ans: String(total),
          sol: `${count} pencils at ₹${price} each costs ${count} × ₹${price} = ₹${total} in total.`
        };
      },
      // Scenario 4: Sharing Division (Kabir shares X among N friends)
      () => {
        const friends = [2, 3, 4, 5][Math.floor(random() * 4)];
        const perFriend = [2, 5, 10, 20][Math.floor(random() * 4)];
        const total = friends * perFriend;
        return {
          text: `Kabir has ₹${total}. He shares it equally among his ${friends} friends. How much money does each friend get?`,
          ans: String(perFriend),
          sol: `₹${total} shared equally among ${friends} friends is ₹${total} ÷ ${friends} = ₹${perFriend} each.`
        };
      }
    ];

    const chosen = scenarios[Math.floor(random() * scenarios.length)]();
    return makeFillQuestion(
      chosen.text,
      [
        {
          type: 'text',
          content: `₹ [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left', margin: '15px 0' }
        }
      ],
      { ans: chosen.ans },
      chosen.sol
    );
  }

  // default empty question fallback
  return makeFillQuestion("How much is ₹1?", [], { ans: "1" }, "1");
}
