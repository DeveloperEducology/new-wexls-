import { getGrammarTemplate } from './templates/index.js';
import { grammarSkillsByGrade } from './skills/index.js';
import { generateNounQuestion } from './engines/noun.engine.js';
import { generatePronounQuestion } from './engines/pronoun.engine.js';
import { generateVerbQuestion } from './engines/verb.engine.js';
import { generateAdjectiveQuestion } from './engines/adjective.engine.js';
import { generateArticleQuestion } from './engines/article.engine.js';
import { generateSentenceQuestion } from './engines/sentence.engine.js';

const ENGINES = {
  noun: generateNounQuestion,
  pronoun: generatePronounQuestion,
  verb: generateVerbQuestion,
  adjective: generateAdjectiveQuestion,
  article: generateArticleQuestion,
  sentence: generateSentenceQuestion
};

export function resolveGrammarGenerator(skillId, config = {}) {
  // Find the skill definition to get its templateId
  let skillDef = null;
  for (const gradeSkills of Object.values(grammarSkillsByGrade)) {
    const found = gradeSkills.find(s => s.id === skillId);
    if (found) {
      skillDef = found;
      break;
    }
  }

  const templateId = skillDef?.templateId || skillId;
  const template = getGrammarTemplate(templateId);
  
  if (!template) {
    console.warn(`Template not found for: ${templateId}`);
    return null;
  }

  const engineFn = ENGINES[template.engine];
  if (!engineFn) {
    console.warn(`Engine not found for template: ${template.engine}`);
    return null;
  }

  return {
    template,
    generate: (variables = {}) => {
      // Merge skill definition config if available
      const mergedConfig = {
        ...template.defaultConfig,
        ...(skillDef?.config || {}),
        ...config
      };
      
      const newTemplate = {
        ...template,
        config: mergedConfig
      };
      
      const question = engineFn(newTemplate, {
        ...variables,
        difficulty: config.difficulty || variables.difficulty
      });

      if (question) {
        question.metaConfig = {
          ...question.metaConfig,
          readable: true,
          readOptions: true
        };
      }

      return question;
    }
  };
}
export { getGrammarTemplate };
