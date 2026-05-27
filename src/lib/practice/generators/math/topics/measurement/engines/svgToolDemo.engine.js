const TOOL_CONFIGS = {
  inch_ruler: {
    prompt: 'What length is shown on the inch ruler?',
    unit: 'inches',
    makeProps: (rng) => ({ length: rng.pick([1, 1.5, 2, 2.25, 2.5, 3, 3.75, 4, 4.5, 5, 5.5]), showLabel: false }),
    getAnswer: (props) => props.length,
    valKey: 'length',
    min: 0,
    max: 6,
    step: 0.25,
    setVerb: 'measure',
    objectName: 'pencil'
  },
  centimeter_ruler: {
    prompt: 'What length is shown on the centimeter ruler?',
    unit: 'centimeters',
    makeProps: (rng) => ({ length: rng.pick([2, 3, 4.5, 5, 6, 7.5, 8, 9, 10, 11.5, 12, 13.5, 14]), showLabel: false }),
    getAnswer: (props) => props.length,
    valKey: 'length',
    min: 0,
    max: 15,
    step: 0.5,
    setVerb: 'measure',
    objectName: 'crayon'
  },
  measuring_tape: {
    prompt: 'What length is shown on the measuring tape?',
    unit: 'feet',
    makeProps: (rng) => ({ length: rng.int(1, 12), unit: 'ft', showLabel: false }),
    getAnswer: (props) => props.length,
    valKey: 'length',
    min: 1,
    max: 12,
    step: 1,
    setVerb: 'show',
    objectName: 'tape'
  },
  protractor: {
    prompt: 'What angle is shown on the protractor?',
    unit: 'degrees',
    makeProps: (rng) => ({ angle: rng.pick([20, 30, 45, 60, 75, 90, 120, 135, 150]), showLabel: false }),
    getAnswer: (props) => props.angle,
    valKey: 'angle',
    min: 0,
    max: 180,
    step: 5,
    setVerb: 'measure',
    objectName: 'angle'
  },
  compass: {
    prompt: 'What radius is shown for the compass circle?',
    unit: 'centimeters',
    makeProps: (rng) => ({ radius: rng.pick([2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8]), showLabel: false }),
    getAnswer: (props) => props.radius,
    valKey: 'radius',
    min: 2,
    max: 8,
    step: 0.5,
    setVerb: 'draw a circle with radius',
    objectName: 'circle'
  },
  thermometer: {
    prompt: 'What temperature is shown on the thermometer?',
    unit: 'degrees Celsius',
    makeProps: (rng) => ({ temperature: rng.int(5, 55), unit: 'C', min: 0, max: 60, showLabel: false }),
    getAnswer: (props) => props.temperature,
    valKey: 'temperature',
    min: 0,
    max: 60,
    step: 1,
    setVerb: 'read',
    objectName: 'temperature'
  },
  thermometer_dial: {
    prompt: 'What temperature is shown on the dial thermometer?',
    unit: 'degrees Celsius',
    makeProps: (rng) => ({ temperature: rng.int(5, 55), unit: 'C', min: 0, max: 60, showLabel: false }),
    getAnswer: (props) => props.temperature,
    valKey: 'temperature',
    min: 0,
    max: 60,
    step: 1,
    setVerb: 'read',
    objectName: 'temperature'
  },
  balance_scale: {
    prompt: 'How many units are on the right side of the balance scale?',
    unit: 'units',
    makeProps: (rng) => ({ leftWeight: rng.int(1, 9), rightWeight: rng.int(1, 9), leftLabel: 'L', rightLabel: 'R', showLabel: false }),
    getAnswer: (props) => props.rightWeight,
    valKey: null // not interactive
  },
  measuring_cup: {
    prompt: 'How many milliliters are in the measuring cup?',
    unit: 'milliliters',
    makeProps: (rng) => {
      const capacity = rng.pick([250, 500, 1000]);
      const step = capacity === 250 ? 25 : capacity === 500 ? 50 : 100;
      return { level: rng.int(1, Math.floor(capacity / step)) * step, capacity, unit: 'ml', showLabel: false };
    },
    getAnswer: (props) => props.level,
    valKey: 'level',
    min: 0,
    maxKey: 'capacity',
    setVerb: 'fill',
    objectName: 'liquid level'
  },
  liter_jug: {
    prompt: 'How many milliliters are in the liter jug?',
    unit: 'milliliters',
    makeProps: (rng) => {
      const capacity = 1000;
      const step = 100;
      return { level: rng.int(1, Math.floor(capacity / step)) * step, capacity, unit: 'ml', showLabel: false };
    },
    getAnswer: (props) => props.level,
    valKey: 'level',
    min: 0,
    maxKey: 'capacity',
    setVerb: 'fill',
    objectName: 'liquid level'
  },
  graduated_cylinder: {
    prompt: 'How many milliliters are in the graduated cylinder?',
    unit: 'milliliters',
    makeProps: (rng) => {
      const capacity = 100;
      const step = 10;
      return { level: rng.int(1, Math.floor(capacity / step)) * step, capacity, unit: 'ml', showLabel: false };
    },
    getAnswer: (props) => props.level,
    valKey: 'level',
    min: 0,
    maxKey: 'capacity',
    setVerb: 'fill',
    objectName: 'liquid level'
  },
  beaker: {
    prompt: 'How many milliliters are in the beaker?',
    unit: 'milliliters',
    makeProps: (rng) => {
      const capacity = 250;
      const step = 25;
      return { level: rng.int(1, Math.floor(capacity / step)) * step, capacity, unit: 'ml', showLabel: false };
    },
    getAnswer: (props) => props.level,
    valKey: 'level',
    min: 0,
    maxKey: 'capacity',
    setVerb: 'fill',
    objectName: 'liquid level'
  },
  stopwatch: {
    prompt: 'How many seconds are shown on the stopwatch?',
    unit: 'seconds',
    makeProps: (rng) => ({ seconds: rng.int(5, 59), showLabel: false }),
    getAnswer: (props) => props.seconds,
    valKey: 'seconds',
    min: 0,
    max: 60,
    step: 1,
    setVerb: 'set',
    objectName: 'time'
  },
  number_line: {
    prompt: 'What number is highlighted on the number line?',
    unit: '',
    makeProps: (rng) => {
      const min = rng.pick([0, 2, 5, 10]);
      const step = rng.pick([1, 2, 5]);
      const max = min + step * 5;
      return { min, max, step, highlight: min + step * rng.int(1, 4), showLabel: false };
    },
    getAnswer: (props) => props.highlight,
    valKey: 'highlight',
    minKey: 'min',
    maxKey: 'max',
    stepKey: 'step',
    setVerb: 'highlight',
    objectName: 'point'
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

export const SVG_TOOL_DEMO_IDS = Object.keys(TOOL_CONFIGS);

export function generateSvgToolDemoQuestion(rng, config = {}) {
  const toolId = config.toolId || config.forcedTask?.replace(/^svg_tool_demo_/, '') || 'thermometer';
  const tool = TOOL_CONFIGS[toolId] || TOOL_CONFIGS.thermometer;
  const props = tool.makeProps(rng);
  
  const targetAnswerVal = tool.getAnswer(props);
  const unitText = tool.unit ? ` ${tool.unit}` : '';

  const isInteractive = !!tool.valKey;
  const isSetMode = isInteractive && rng.int(0, 1) === 0;

  let finalProps = { ...props };
  let finalPrompt = '';
  let correctAnswer = String(targetAnswerVal);

  if (isSetMode) {
    const valKey = tool.valKey;
    const min = typeof tool.min === 'number' ? tool.min : (props[tool.minKey] ?? 0);
    const max = typeof tool.max === 'number' ? tool.max : (props[tool.maxKey] ?? 100);
    
    let step = 1;
    if (tool.stepKey && props[tool.stepKey]) {
      step = props[tool.stepKey];
    } else if (tool.step) {
      step = tool.step;
    } else if (valKey === 'level') {
      const capacity = props.capacity ?? 1000;
      step = capacity === 250 ? 25 : capacity === 500 ? 50 : 100;
    }

    let initialValue = targetAnswerVal;
    while (initialValue === targetAnswerVal) {
      const stepsCount = Math.floor((max - min) / step);
      initialValue = min + rng.int(0, stepsCount) * step;
    }

    finalProps[valKey] = initialValue;

    let targetUnitSymbol = '';
    if (toolId === 'thermometer' || toolId === 'thermometer_dial') targetUnitSymbol = '°C';
    else if (toolId === 'protractor') targetUnitSymbol = '°';
    else if (toolId === 'inch_ruler') targetUnitSymbol = ' inches';
    else if (toolId === 'centimeter_ruler') targetUnitSymbol = ' cm';
    else if (toolId === 'measuring_tape') targetUnitSymbol = ' ft';
    else if (toolId === 'compass') targetUnitSymbol = ' cm';
    else if (toolId === 'measuring_cup' || toolId === 'liter_jug' || toolId === 'graduated_cylinder' || toolId === 'beaker') targetUnitSymbol = ' mL';
    else if (toolId === 'stopwatch') targetUnitSymbol = ' seconds';
    
    if (toolId === 'inch_ruler' || toolId === 'centimeter_ruler') {
      finalPrompt = `Use the ruler to measure the object. Drag the pencil/crayon tip to make the object exactly **${targetAnswerVal}${targetUnitSymbol}** long.`;
    } else if (toolId === 'protractor') {
      finalPrompt = `Drag the red pointer to set the protractor angle to exactly **${targetAnswerVal}${targetUnitSymbol}**.`;
    } else if (toolId === 'compass') {
      finalPrompt = `Drag the compass pencil to set the circle radius to exactly **${targetAnswerVal}${targetUnitSymbol}**.`;
    } else if (toolId === 'measuring_cup') {
      finalPrompt = `Fill the measuring cup to exactly **${targetAnswerVal}${targetUnitSymbol}** by dragging the liquid level.`;
    } else if (toolId === 'liter_jug') {
      finalPrompt = `Fill the liter jug to exactly **${targetAnswerVal}${targetUnitSymbol}** by dragging the liquid level.`;
    } else if (toolId === 'graduated_cylinder') {
      finalPrompt = `Fill the graduated cylinder to exactly **${targetAnswerVal}${targetUnitSymbol}** by dragging the liquid level.`;
    } else if (toolId === 'beaker') {
      finalPrompt = `Fill the beaker to exactly **${targetAnswerVal}${targetUnitSymbol}** by dragging the liquid level.`;
    } else if (toolId === 'stopwatch') {
      finalPrompt = `Set the stopwatch to exactly **${targetAnswerVal}${targetUnitSymbol}** by dragging the hand.`;
    } else if (toolId === 'number_line') {
      finalPrompt = `Highlight the number **${targetAnswerVal}** on the number line by dragging the marker.`;
    } else {
      finalPrompt = `Set the thermometer to exactly **${targetAnswerVal}${targetUnitSymbol}** by dragging the level.`;
    }
  } else {
    finalPrompt = tool.prompt;
    if (isInteractive) {
      finalProps[tool.valKey] = targetAnswerVal;
    }
  }

  return {
    type: 'fillInTheBlank',
    questionText: finalPrompt,
    showOverlayTools: false,
    parts: [
      {
        type: 'svg',
        toolSvg: toolId,
        toolProps: finalProps,
        draggable: isSetMode,
        style: {
          justifyContent: 'center',
          maxWidth: 640,
          margin: '0 auto'
        }
      },
      {
        type: 'text',
        content: `Answer: [blank:ans]${unitText}`
      }
    ],
    answer: { ans: correctAnswer },
    correctAnswer,
    explanation: {
      sections: [
        { content: `The correct target value is **${correctAnswer}${unitText}**.` },
        { content: isSetMode 
            ? `In this interactive task, you drag the tool control to adjust it to the target value of **${correctAnswer}**.` 
            : `By looking at the tool scale, we can see the level or indicator points directly to **${correctAnswer}**.`
        }
      ]
    },
    remediation: isSetMode
      ? `Drag the interactive control until the displayed number matches **${correctAnswer}**.`
      : `Observe the tick marks carefully. The value shown is **${correctAnswer}${unitText}**.`,
    metadata: {
      task: 'svg_tool_demo',
      toolId,
      toolProps: finalProps,
      isSetMode
    }
  };
}
