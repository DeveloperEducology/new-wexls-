import { FRACTION_LABELS, TOPPINGS } from './types';
import { describeSlice, deterministicToppings, polarToCartesian, sliceCenter } from './pizzaMath';

const toppingById = Object.fromEntries(TOPPINGS.map((topping) => [topping.id, topping]));

export default function PizzaVisualizer({
  parts = 1,
  toppings = ['pepperoni'],
  selectedSlice = null,
  fedSlices = [],
  onSliceClick,
  compact = false
}) {
  const cx = 150;
  const cy = 150;
  const radius = 112;
  const explode = parts > 1 ? 8 : 0;
  const toppingPlan = deterministicToppings(parts, toppings);
  const step = 360 / parts;

  return (
    <svg
      viewBox="0 0 300 300"
      className={compact ? 'pizzaSvg pizzaSvgCompact' : 'pizzaSvg'}
      role="img"
      aria-label={`Pizza divided into ${parts} ${parts === 1 ? 'part' : 'parts'}`}
    >
      <defs>
        <filter id="pizzaSoftShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#43403A" floodOpacity="0.08" />
        </filter>
      </defs>

      {Array.from({ length: parts }, (_, index) => {
        const startAngle = index * step;
        const endAngle = startAngle + step;
        const active = selectedSlice === index;
        const fed = fedSlices.includes(index);
        const path = describeSlice(cx, cy, radius, startAngle, endAngle, explode + (active ? 8 : 0));
        const badge = sliceCenter(cx, cy, radius, startAngle, endAngle, explode + (active ? 8 : 0), 0.48);
        const label = FRACTION_LABELS[parts] || `1/${parts}`;

        return (
          <g key={index} className={active ? 'pizzaSlice active' : 'pizzaSlice'}>
            <path
              d={path}
              fill={fed ? '#E6D5B8' : '#F6C66B'}
              stroke="#43403A"
              strokeWidth="3"
              filter="url(#pizzaSoftShadow)"
              onClick={() => onSliceClick?.(index)}
              tabIndex={0}
              role="button"
              aria-label={`Select slice ${index + 1}, ${label}`}
            />
            <path
              d={path}
              fill="none"
              stroke="#D27D56"
              strokeWidth="10"
              strokeLinejoin="round"
              pointerEvents="none"
              opacity={fed ? 0.35 : 0.9}
            />

            {toppingPlan[index].map((topping, toppingIndex) => {
              const angle = startAngle + step / 2 + topping.angularJitter;
              const p = polarToCartesian(cx, cy, radius * topping.radial, angle);
              const emoji = toppingById[topping.toppingId]?.emoji || '🍕';
              return (
                <text
                  key={`${index}-${toppingIndex}`}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={parts === 4 ? 15 : 18}
                  pointerEvents="none"
                >
                  {emoji}
                </text>
              );
            })}

            <g pointerEvents="none">
              <circle cx={badge.x} cy={badge.y} r="22" fill="#FDFCF8" stroke="#43403A" strokeWidth="2" />
              <text
                x={badge.x}
                y={badge.y + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Georgia, serif"
                fontSize="20"
                fontWeight="700"
                fill="#43403A"
              >
                {fed ? '✓' : label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
