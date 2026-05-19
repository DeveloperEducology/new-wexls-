export const grammarTemplates = {
  'grammar.noun.identify': {
    id: 'grammar.noun.identify',
    topic: 'grammar',
    engine: 'noun',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      renderer: 'pick_from_sentence',
      multiSelect: true
    }
  },
  'grammar.noun.classify': {
    id: 'grammar.noun.classify',
    topic: 'grammar',
    engine: 'noun',
    questionType: 'mcq'
  },
  'grammar.noun.sort': {
    id: 'grammar.noun.sort',
    topic: 'grammar',
    engine: 'noun',
    questionType: 'categorization'
  },
  'grammar.pronoun.choose': {
    id: 'grammar.pronoun.choose',
    topic: 'grammar',
    engine: 'pronoun',
    questionType: 'mcq'
  },
  'grammar.pronoun.replace': {
    id: 'grammar.pronoun.replace',
    topic: 'grammar',
    engine: 'pronoun',
    questionType: 'mcq'
  },
  'grammar.verb.identify': {
    id: 'grammar.verb.identify',
    topic: 'grammar',
    engine: 'verb',
    questionType: 'mcq'
  },
  'grammar.verb.tense': {
    id: 'grammar.verb.tense',
    topic: 'grammar',
    engine: 'verb',
    questionType: 'mcq'
  },
  'grammar.adjective.identify': {
    id: 'grammar.adjective.identify',
    topic: 'grammar',
    engine: 'adjective',
    questionType: 'mcq'
  },
  'grammar.article.choose': {
    id: 'grammar.article.choose',
    topic: 'grammar',
    engine: 'article',
    questionType: 'mcq'
  },
  'grammar.article.sentence': {
    id: 'grammar.article.sentence',
    topic: 'grammar',
    engine: 'article',
    questionType: 'mcq'
  },
  'grammar.sentence.type': {
    id: 'grammar.sentence.type',
    topic: 'grammar',
    engine: 'sentence',
    questionType: 'mcq'
  },
  'grammar.sentence.punctuation': {
    id: 'grammar.sentence.punctuation',
    topic: 'grammar',
    engine: 'sentence',
    questionType: 'mcq'
  },
  'grammar.sentence.capitalization': {
    id: 'grammar.sentence.capitalization',
    topic: 'grammar',
    engine: 'sentence',
    questionType: 'mcq'
  }
};

export function getGrammarTemplate(templateId) {
  return grammarTemplates[templateId] || null;
}
