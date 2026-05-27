import PizzaVisualizer from './PizzaVisualizer';
import MonsterSprite from './MonsterSprite';
import { MONSTERS } from './types';

const ACTS = [
  {
    title: 'Act 1: The Whole Pizza',
    text: 'This pizza is one whole. It has not been shared yet.',
    parts: 1,
    monsters: ['henry']
  },
  {
    title: 'Act 2: Break It in Half',
    text: 'Now the pizza is split into two equal halves. Tap a half to feed Hungry Henry.',
    parts: 2,
    monsters: ['henry']
  },
  {
    title: 'Act 3: Quarter Party',
    text: 'Two more friends arrived. Four equal pieces are called quarters.',
    parts: 4,
    monsters: ['henry', 'gaby', 'greg']
  },
  {
    title: 'Act 4: Brain Rollercoaster',
    text: 'Tap the handles to make your fraction brain zoom. WOOO!',
    parts: 4,
    monsters: ['henry', 'gaby', 'greg', 'mimi']
  }
];

export default function LessonStoryMode({
  act,
  fedSlices,
  selectedSlice,
  coasterSpeed,
  onSliceClick,
  onFeedMonster,
  onNextAct,
  onPrevAct,
  onCoasterClick
}) {
  const current = ACTS[act];
  const visibleMonsters = MONSTERS.filter((monster) => current.monsters.includes(monster.id));

  return (
    <div className="modeGrid">
      <section className="storyPanel">
        <div className="storyBubble">
          <span className="actBadge">{current.title}</span>
          <p>{current.text}</p>
        </div>
        <PizzaVisualizer
          parts={current.parts}
          toppings={['pepperoni', 'mushroom']}
          selectedSlice={selectedSlice}
          fedSlices={fedSlices}
          onSliceClick={act === 0 ? undefined : onSliceClick}
        />
        {act === 3 ? (
          <div className="coasterBox">
            <div className="coasterTrack">
              <div className="coasterCart" style={{ transform: `translateX(${Math.min(78, coasterSpeed * 13)}%)` }}>WOOO!</div>
            </div>
            <button type="button" className="primaryButton" onClick={onCoasterClick}>
              Tap the handle
            </button>
          </div>
        ) : null}
      </section>

      <aside className="monsterPanel">
        {visibleMonsters.map((monster) => (
          <MonsterSprite
            key={monster.id}
            monster={monster}
            state={fedSlices.length ? 'happy' : monster.mood}
            speech={fedSlices.length ? 'Yum, thank you!' : act === 0 ? 'Is it all mine?' : 'Can I have a fair piece?'}
            onClick={() => onFeedMonster(monster.id)}
          />
        ))}
        <div className="navButtons">
          <button type="button" className="softButton" onClick={onPrevAct} disabled={act === 0}>Back</button>
          <button type="button" className="primaryButton" onClick={onNextAct}>{act === ACTS.length - 1 ? 'Restart Story' : 'Next Act'}</button>
        </div>
      </aside>
    </div>
  );
}
