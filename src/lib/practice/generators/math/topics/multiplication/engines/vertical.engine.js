let uidCounter = 0;

function createSeededRandom(seedInput = 'multiplication-vertical') {
  const str = String(seedInput);
  let seed = 0;
  for (let i = 0; i < str.length; i += 1) {
    seed = (seed * 31 + str.charCodeAt(i)) % 2147483647;
  }
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
}

function randInt(min, max, random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function numberWithDigits(digits, random) {
  const width = Math.max(1, Number(digits || 1));
  if (width === 1) return randInt(2, 9, random);
  return randInt(10 ** (width - 1), (10 ** width) - 1, random);
}

function hasCarryInMultiplication(top, bottom) {
  let carry = 0;
  const bottomDigits = String(bottom).split('').reverse().map(Number);
  const topDigits = String(top).split('').reverse().map(Number);

  for (let bottomIndex = 0; bottomIndex < bottomDigits.length; bottomIndex += 1) {
    carry = 0;
    for (let topIndex = 0; topIndex < topDigits.length; topIndex += 1) {
      const product = topDigits[topIndex] * bottomDigits[bottomIndex] + carry;
      if (product >= 10) return true;
      carry = Math.floor(product / 10);
    }
    if (carry > 0) return true;
  }

  return false;
}

function pickFactors({ topDigits, bottomDigits, regrouping }, random) {
  const wantsCarry = regrouping === true;
  const avoidsCarry = regrouping === false;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const top = numberWithDigits(topDigits, random);
    const bottom = numberWithDigits(bottomDigits, random);
    const hasCarry = hasCarryInMultiplication(top, bottom);
    if ((wantsCarry && hasCarry) || (avoidsCarry && !hasCarry) || (!wantsCarry && !avoidsCarry)) {
      return { top, bottom, hasCarry };
    }
  }

  const top = numberWithDigits(topDigits, random);
  const bottom = numberWithDigits(bottomDigits, random);
  return { top, bottom, hasCarry: hasCarryInMultiplication(top, bottom) };
}

function formatIndianNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function generateVerticalMultiplicationQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || Date.now());
  const config = template.config || {};
  const topDigits = Number(config.topDigits || config.digits || 2);
  const bottomDigits = Number(config.bottomDigits || 1);
  const { top, bottom, hasCarry } = pickFactors(
    { topDigits, bottomDigits, regrouping: config.regrouping },
    random
  );
  const product = top * bottom;
  const productDigits = String(product).split('');
  const maxColumns = Math.max(String(top).length, String(bottom).length, productDigits.length);
  const answerCells = productDigits.map((digit, index) => ({
    id: `ans_${index}`,
    type: 'digit',
    expected: digit
  }));
  const answer = Object.fromEntries(answerCells.map((cell) => [cell.id, cell.expected]));

  return {
    id: `multiplication_vertical_${Date.now()}_${++uidCounter}`,
    type: 'fillInTheBlank',
    questionText: 'Multiply.',
    parts: [
      {
        type: 'text',
        content: 'Multiply.',
        isVertical: true,
        style: {
          fontSize: '28px',
          fontWeight: 400,
          color: '#000'
        }
      },
      {
        type: 'arithmeticLayout',
        layout: {
          variant: 'verticalMultiplicationReplica',
          rows: [
            { kind: 'number', text: String(top).padStart(maxColumns, ' ') },
            { kind: 'number', text: `×${String(bottom).padStart(maxColumns, ' ')}` },
            { kind: 'divider' },
            {
              kind: 'answer',
              variant: 'joined',
              cells: answerCells
            }
          ]
        }
      }
    ],
    answer,
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify(answer),
    solution: {
      sections: [
        { type: 'text', content: `${formatIndianNumber(top)} × ${formatIndianNumber(bottom)} = ${formatIndianNumber(product)}.` }
      ]
    },
    metadata: {
      subject: 'math',
      topic: 'multiplication',
      templateId: template.id,
      engine: 'vertical',
      top,
      bottom,
      product,
      topDigits,
      bottomDigits,
      regrouping: Boolean(hasCarry),
      requestedRegrouping: config.regrouping ?? null,
      numberSystem: 'indian',
      formattedTop: formatIndianNumber(top),
      formattedBottom: formatIndianNumber(bottom),
      formattedProduct: formatIndianNumber(product)
    }
  };
}
