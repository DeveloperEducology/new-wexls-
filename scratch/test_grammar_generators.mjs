import { resolveGrammarGenerator } from '../src/lib/practice/generators/english/topics/grammar/engine.js';
import { grammarSkillsByGrade } from '../src/lib/practice/generators/english/topics/grammar/skills/index.js';

console.log('Testing grammar generators...');

let totalTests = 0;
let passedTests = 0;

for (const [grade, skills] of Object.entries(grammarSkillsByGrade)) {
  console.log(`\n--- Grade ${grade} ---`);
  for (const skill of skills) {
    totalTests++;
    try {
      const generator = resolveGrammarGenerator(skill.id);
      if (!generator) {
        throw new Error(`Failed to resolve generator for skill: ${skill.id}`);
      }
      
      const question = generator.generate({ seed: 'test-seed-123' });
      if (!question) {
        throw new Error(`Generator returned null/undefined question for skill: ${skill.id}`);
      }
      
      console.log(`[PASS] ${skill.code} (${skill.id})`);
      console.log(`      Question: "${question.questionText}"`);
      if (question.parts) {
        console.log(`      Parts: ${JSON.stringify(question.parts.map(p => p.content))}`);
      }
      console.log(`      Options: ${JSON.stringify(question.options)}`);
      console.log(`      Answer Index: ${question.correctAnswerIndex}`);
      console.log(`      MetaConfig: ${JSON.stringify(question.metaConfig)}`);
      passedTests++;
    } catch (error) {
      console.error(`[FAIL] ${skill.code} (${skill.id}):`, error.message);
    }
  }
}

console.log(`\nSummary: ${passedTests}/${totalTests} generators passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
