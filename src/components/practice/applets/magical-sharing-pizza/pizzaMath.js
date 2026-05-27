export function polarToCartesian(cx, cy, radius, angleDegrees) {
  const angleRadians = (angleDegrees - 90) * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(angleRadians),
    y: cy + radius * Math.sin(angleRadians)
  };
}

export function describeSlice(cx, cy, radius, startAngle, endAngle, explode = 0) {
  const midAngle = (startAngle + endAngle) / 2;
  const offset = polarToCartesian(0, 0, explode, midAngle);
  const start = polarToCartesian(cx + offset.x, cy + offset.y, radius, endAngle);
  const end = polarToCartesian(cx + offset.x, cy + offset.y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${cx + offset.x} ${cy + offset.y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z'
  ].join(' ');
}

export function sliceCenter(cx, cy, radius, startAngle, endAngle, explode = 0, distance = 0.58) {
  const midAngle = (startAngle + endAngle) / 2;
  const offset = polarToCartesian(0, 0, explode, midAngle);
  const point = polarToCartesian(cx + offset.x, cy + offset.y, radius * distance, midAngle);
  return point;
}

export function deterministicToppings(parts, toppingIds) {
  const base = toppingIds.length ? toppingIds : ['pepperoni'];
  return Array.from({ length: parts }, (_, sliceIndex) => (
    Array.from({ length: parts === 1 ? 10 : parts === 2 ? 5 : 3 }, (_, dotIndex) => ({
      toppingId: base[(sliceIndex + dotIndex) % base.length],
      radial: 0.26 + ((sliceIndex * 17 + dotIndex * 11) % 42) / 100,
      angularJitter: -18 + ((sliceIndex * 23 + dotIndex * 29) % 36)
    }))
  ));
}
