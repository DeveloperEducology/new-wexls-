import { NextResponse } from 'next/server';
import {
  createAdditionTopicTemplate,
  generateAdditionTopicQuestion
} from '../../../lib/practice/generators/math/topics/addition';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get('difficulty') || 'adaptive';
  const correctStreak = parseInt(searchParams.get('correctStreak') || '0', 10);
  const lastResult = searchParams.get('lastResult') || 'none';
  const seed = searchParams.get('seed') || Date.now().toString();
  const logicType = searchParams.get('logic_type')
    || searchParams.get('forcedTask')
    || 'addition-g1-e3-model-match-to-10';

  const config = {
    difficulty,
    logic_type: logicType,
    forcedTask: logicType,
    history: {
      correctStreak,
      lastResult
    },
    variables: {
      seed
    }
  };

  try {
    const question = generateAdditionTopicQuestion(config);
    const template = createAdditionTopicTemplate(logicType);

    return NextResponse.json({
      success: true,
      question,
      seed,
      template: {
        logicType,
        template,
        resolved: question.resolvedConfig,
        config
      }
    });
  } catch (error) {
    console.error('Addition Topic API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
