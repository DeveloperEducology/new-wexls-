import PizzaVisualizer from './PizzaVisualizer';
import MonsterSprite from './MonsterSprite';
import { MONSTERS, TOPPINGS } from './types';

export default function SandboxKitchenMode({
  parts,
  toppings,
  selectedSlice,
  fedSlices,
  monsterStates,
  monsterSpeech,
  onPartsChange,
  onToppingToggle,
  onSliceClick,
  onFeedMonster
}) {
  return (
    <div className="sandboxGrid">
      <aside className="kitchenControls">
        <h3>Pizza Kitchen</h3>
        <p>Choose toppings and cut the pizza into fair shares.</p>
        <div className="controlGroup">
          <span className="controlLabel">Slice tool</span>
          {[1, 2, 4].map((count) => (
            <button
              key={count}
              type="button"
              className={parts === count ? 'chip active' : 'chip'}
              onClick={() => onPartsChange(count)}
            >
              {count === 1 ? 'Whole' : count === 2 ? 'Halves' : 'Quarters'}
            </button>
          ))}
        </div>
        <div className="controlGroup">
          <span className="controlLabel">Toppings</span>
          {TOPPINGS.map((topping) => (
            <button
              key={topping.id}
              type="button"
              className={toppings.includes(topping.id) ? 'chip active' : 'chip'}
              onClick={() => onToppingToggle(topping.id)}
            >
              {topping.emoji} {topping.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="pizzaWorktop">
        <PizzaVisualizer
          parts={parts}
          toppings={toppings}
          selectedSlice={selectedSlice}
          fedSlices={fedSlices}
          onSliceClick={onSliceClick}
        />
        <div className="instructionStrip">
          {selectedSlice === null ? 'Tap a slice first.' : `Slice ${selectedSlice + 1} selected. Now feed a monster.`}
        </div>
      </section>

      <section className="monsterRow">
        {MONSTERS.map((monster) => (
          <MonsterSprite
            key={monster.id}
            monster={monster}
            state={monsterStates[monster.id] || monster.mood}
            speech={monsterSpeech[monster.id] || 'Pizza?'}
            onClick={() => onFeedMonster(monster.id)}
          />
        ))}
      </section>
    </div>
  );
}
