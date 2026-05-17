import { getRandomInt, simplifyFraction, uid } from '../shared/mathCore.js';

export const geometryEngine = {
  generate: (params, random) => {
    const subType = params.subType;
    if (subType === 'area_perimeter_rectangle') return generateAreaPerimeterRectangle(params, random);
    if (subType === 'volume_prism') return generateVolumePrism(params, random);
    return generateAreaPerimeterRectangle(params, random);
  }
};

function generateAreaPerimeterRectangle(params, random) {
  const isArea = random() > 0.5;
  const unit = ['cm', 'm', 'in', 'ft'][getRandomInt(0, 3, random)];
  const denomPool = params.denominatorPool || [2, 3, 4, 5, 8, 10];
  
  const d1 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n1 = getRandomInt(1, d1 * (params.maxWhole || 3), random);
  
  const d2 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n2 = getRandomInt(1, d2 * (params.maxWhole || 3), random);

  const formatLatex = (n, d) => {
    if (n > d && params.maxWhole > 0) return `${Math.floor(n/d)} \\frac{${n%d}}{${d}}`;
    return `\\frac{${n}}{${d}}`;
  };

  const lLatex = formatLatex(n1, d1);
  const wLatex = formatLatex(n2, d2);
  
  const questionText = `A rectangle has a length of $$${lLatex}$$ ${unit} and a width of $$${wLatex}$$ ${unit}. What is its ${isArea ? 'area' : 'perimeter'}?`;
  
  const ansUnit = isArea ? `${unit}²` : unit;

  return {
    id: `q_frac_geo_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'text', content: 'Simplify your answer.', isVertical: true, style: { fontStyle: 'italic', marginBottom: '1rem' } },
      { 
        type: 'group', direction: 'row', style: { alignItems: 'center', gap: '0.5rem' },
        parts: [
          { type: 'input', id: 'ans', size: 'small' },
          { type: 'text', content: ` ${ansUnit}` }
        ]
      }
    ],
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }), // Can add actual math logic if needed
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}

function generateVolumePrism(params, random) {
  const unit = ['cm', 'm', 'in', 'ft'][getRandomInt(0, 3, random)];
  const d = [2, 3, 4][getRandomInt(0, 2, random)];
  
  const n1 = getRandomInt(1, d * 2, random);
  const n2 = getRandomInt(1, d * 2, random);
  const n3 = getRandomInt(1, d * 2, random);

  const lLatex = `\\frac{${n1}}{${d}}`;
  const wLatex = `\\frac{${n2}}{${d}}`;
  const hLatex = `\\frac{${n3}}{${d}}`;
  
  const questionText = `A rectangular prism has a length of $$${lLatex}$$ ${unit}, a width of $$${wLatex}$$ ${unit}, and a height of $$${hLatex}$$ ${unit}. What is its volume?`;

  return {
    id: `q_frac_geo_vol_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'text', content: 'Write your answer as a fraction or mixed number.', isVertical: true, style: { fontStyle: 'italic', marginBottom: '1rem' } },
      { 
        type: 'group', direction: 'row', style: { alignItems: 'center', gap: '0.5rem' },
        parts: [
          { type: 'input', id: 'ans', size: 'small' },
          { type: 'text', content: ` ${unit}³` }
        ]
      }
    ],
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }),
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}
