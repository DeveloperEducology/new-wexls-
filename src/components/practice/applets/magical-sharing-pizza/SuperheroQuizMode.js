import PizzaVisualizer from './PizzaVisualizer';

const QUESTIONS = [
  {
    prompt: 'Which pizza shows one whole?',
    parts: [1, 2, 4],
    answer: 1
  },
  {
    prompt: 'Which pizza is cut into halves?',
    parts: [4, 1, 2],
    answer: 2
  },
  {
    prompt: 'Which pizza has quarters?',
    parts: [2, 4, 1],
    answer: 4
  },
  {
    prompt: 'Which piece is smaller?',
    parts: [2, 4],
    answer: 4
  }
];

export default function SuperheroQuizMode({
  quizIndex,
  quizScore,
  quizChoice,
  quizComplete,
  onAnswer,
  onNext,
  onRestart
}) {
  if (quizComplete) {
    return (
      <section className="celebrationBoard">
        <div className="confetti">✦ ✧ ✦ ✧ ✦</div>
        <h2>Fraction Superhero!</h2>
        <p>You scored {quizScore} out of {QUESTIONS.length}. You shared fairly and bravely.</p>
        <button type="button" className="primaryButton" onClick={onRestart}>Play Again</button>
      </section>
    );
  }

  const question = QUESTIONS[quizIndex];

  return (
    <section className="quizPanel">
      <div className="quizHeader">
        <span className="actBadge">Question {quizIndex + 1} of {QUESTIONS.length}</span>
        <h2>{question.prompt}</h2>
      </div>
      <div className="quizChoices">
        {question.parts.map((parts) => {
          const selected = quizChoice === parts;
          return (
            <button
              key={parts}
              type="button"
              className={selected ? 'quizCard selected' : 'quizCard'}
              onClick={() => onAnswer(parts)}
            >
              <PizzaVisualizer parts={parts} toppings={['pepperoni']} compact />
              <span>{parts === 1 ? 'Whole' : parts === 2 ? 'Halves' : 'Quarters'}</span>
            </button>
          );
        })}
      </div>
      <div className="quizFooter">
        <span>Score: {quizScore}</span>
        <button type="button" className="primaryButton" onClick={onNext} disabled={quizChoice === null}>Check</button>
      </div>
    </section>
  );
}
