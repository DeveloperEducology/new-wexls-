'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import LessonStoryMode from './LessonStoryMode';
import SandboxKitchenMode from './SandboxKitchenMode';
import SuperheroQuizMode from './SuperheroQuizMode';
import { MODES } from './types';
import { playTone, setPizzaAppletMuted, speakLine } from './soundEffects';
import './magical-sharing-pizza.css';

const QUIZ_ANSWERS = [1, 2, 4, 4];

export default function MagicalSharingPizzaApplet({ question, onAnswer }) {
  const lastReportedAnswerRef = useRef('');
  const [mode, setMode] = useState(question?.defaultMode || MODES.lesson);
  const [muted, setMuted] = useState(false);

  const [act, setAct] = useState(0);
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [fedSlices, setFedSlices] = useState([]);
  const [coasterSpeed, setCoasterSpeed] = useState(0);

  const [sandboxParts, setSandboxParts] = useState(2);
  const [sandboxToppings, setSandboxToppings] = useState(['pepperoni', 'mushroom']);
  const [monsterStates, setMonsterStates] = useState({});
  const [monsterSpeech, setMonsterSpeech] = useState({});

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizChoice, setQuizChoice] = useState(null);
  const [quizComplete, setQuizComplete] = useState(false);

  const availableModes = useMemo(() => question?.modes || [MODES.lesson, MODES.sandbox, MODES.quiz], [question]);

  useEffect(() => {
    setPizzaAppletMuted(muted);
  }, [muted]);

  useEffect(() => {
    const nextAnswer = {
      appletType: 'magical_sharing_pizza',
      mode,
      lessonAct: act + 1,
      sandboxParts,
      quizScore,
      quizComplete
    };
    const serialized = JSON.stringify(nextAnswer);
    if (serialized === lastReportedAnswerRef.current) return;
    lastReportedAnswerRef.current = serialized;
    onAnswer?.(nextAnswer);
  }, [act, mode, onAnswer, quizComplete, quizScore, sandboxParts]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSelectedSlice(null);
    playTone('pop');
  };

  const handleSliceClick = (sliceIndex) => {
    setSelectedSlice(sliceIndex);
    playTone('pop');
  };

  const feedMonster = (monsterId) => {
    if (selectedSlice === null) {
      playTone('fail');
      speakLine('Choose a pizza slice first.', 'teacher');
      return;
    }

    setFedSlices((current) => current.includes(selectedSlice) ? current : [...current, selectedSlice]);
    setMonsterStates((current) => ({ ...current, [monsterId]: 'eating' }));
    setMonsterSpeech((current) => ({ ...current, [monsterId]: 'Crunch crunch. Thank you!' }));
    playTone('munch');
    speakLine('Crunch crunch. Thank you!', 'monster');

    window.setTimeout(() => {
      setMonsterStates((current) => ({ ...current, [monsterId]: 'happy' }));
      setMonsterSpeech((current) => ({ ...current, [monsterId]: 'Yum!' }));
    }, 650);

    setSelectedSlice(null);
  };

  const changeSandboxParts = (count) => {
    setSandboxParts(count);
    setSelectedSlice(null);
    setFedSlices([]);
    playTone('pop');
  };

  const toggleTopping = (toppingId) => {
    setSandboxToppings((current) => {
      if (current.includes(toppingId)) {
        const next = current.filter((id) => id !== toppingId);
        return next.length ? next : current;
      }
      return [...current, toppingId];
    });
  };

  const nextAct = () => {
    setAct((current) => (current + 1) % 4);
    setSelectedSlice(null);
    setFedSlices([]);
    playTone('success');
  };

  const prevAct = () => {
    setAct((current) => Math.max(0, current - 1));
    setSelectedSlice(null);
    setFedSlices([]);
  };

  const answerQuiz = (choice) => {
    setQuizChoice(choice);
    playTone('pop');
  };

  const checkQuiz = () => {
    if (quizChoice === null) return;
    const correct = quizChoice === QUIZ_ANSWERS[quizIndex];
    if (correct) {
      setQuizScore((score) => score + 1);
      playTone('success');
      speakLine('Correct. Super sharing!', 'teacher');
    } else {
      playTone('fail');
      speakLine('Try the next one. Look for equal parts.', 'teacher');
    }
    if (quizIndex >= QUIZ_ANSWERS.length - 1) {
      setQuizComplete(true);
      return;
    }
    setQuizIndex((index) => index + 1);
    setQuizChoice(null);
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizChoice(null);
    setQuizComplete(false);
  };

  return (
    <div className="pizzaApplet">
      <header className="pizzaHeader">
        <div>
          <p className="eyebrow">{question?.eyebrow || 'Kindergarten Fractions'}</p>
          <h1>{question?.title || 'The Magical Sharing Pizza'}</h1>
        </div>
        <button
          type="button"
          className={muted ? 'muteButton muted' : 'muteButton'}
          onClick={() => setMuted((value) => !value)}
        >
          {muted ? 'Sound Off' : 'Sound On'}
        </button>
      </header>

      <nav className="pizzaTabs" aria-label="Pizza applet modes">
        {availableModes.map((tab) => (
          <button
            key={tab}
            type="button"
            className={mode === tab ? 'tabButton active' : 'tabButton'}
            onClick={() => switchMode(tab)}
          >
            {tab === MODES.lesson ? 'Lesson Story' : tab === MODES.sandbox ? 'Sandbox Pizza Kitchen' : 'Fractions Superhero Quiz'}
          </button>
        ))}
      </nav>

      <main className="pizzaStage">
        {mode === MODES.lesson ? (
          <LessonStoryMode
            act={act}
            fedSlices={fedSlices}
            selectedSlice={selectedSlice}
            coasterSpeed={coasterSpeed}
            onSliceClick={handleSliceClick}
            onFeedMonster={feedMonster}
            onNextAct={nextAct}
            onPrevAct={prevAct}
            onCoasterClick={() => {
              setCoasterSpeed((speed) => speed + 1);
              playTone('success');
              speakLine('Woooo!', 'monster');
            }}
          />
        ) : null}

        {mode === MODES.sandbox ? (
          <SandboxKitchenMode
            parts={sandboxParts}
            toppings={sandboxToppings}
            selectedSlice={selectedSlice}
            fedSlices={fedSlices}
            monsterStates={monsterStates}
            monsterSpeech={monsterSpeech}
            onPartsChange={changeSandboxParts}
            onToppingToggle={toggleTopping}
            onSliceClick={handleSliceClick}
            onFeedMonster={feedMonster}
          />
        ) : null}

        {mode === MODES.quiz ? (
          <SuperheroQuizMode
            quizIndex={quizIndex}
            quizScore={quizScore}
            quizChoice={quizChoice}
            quizComplete={quizComplete}
            onAnswer={answerQuiz}
            onNext={checkQuiz}
            onRestart={restartQuiz}
          />
        ) : null}
      </main>
    </div>
  );
}
