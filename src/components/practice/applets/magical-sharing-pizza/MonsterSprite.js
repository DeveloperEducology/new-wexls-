export default function MonsterSprite({
  monster,
  state = 'idle',
  speech = '',
  onClick,
  disabled = false
}) {
  const isEating = state === 'eating';
  const isHappy = state === 'happy';
  const isGrumpy = state === 'grumpy' || monster?.mood === 'grumpy';
  const bodyColor = monster?.color || '#8A9A5B';

  return (
    <button
      type="button"
      className={`monsterButton ${isEating ? 'eating' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Feed ${monster?.name || 'monster'}`}
    >
      {speech ? <span className="monsterSpeech">{speech}</span> : null}
      <svg viewBox="0 0 160 150" className="monsterSvg" role="img" aria-label={monster?.name}>
        <path d="M35 135 C18 94 26 38 70 28 C119 16 148 62 129 133 Z" fill={bodyColor} stroke="#43403A" strokeWidth="4" />
        <path d="M47 33 L36 13 L62 27 Z" fill={bodyColor} stroke="#43403A" strokeWidth="4" />
        <path d="M101 27 L127 12 L116 39 Z" fill={bodyColor} stroke="#43403A" strokeWidth="4" />
        <circle cx="60" cy="70" r="16" fill="#FDFCF8" stroke="#43403A" strokeWidth="4" />
        <circle cx="101" cy="70" r="16" fill="#FDFCF8" stroke="#43403A" strokeWidth="4" />
        {isHappy ? (
          <>
            <path d="M53 70 Q60 60 67 70" fill="none" stroke="#43403A" strokeWidth="4" strokeLinecap="round" />
            <path d="M94 70 Q101 60 108 70" fill="none" stroke="#43403A" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : isGrumpy ? (
          <>
            <line x1="50" y1="63" x2="69" y2="73" stroke="#43403A" strokeWidth="5" strokeLinecap="round" />
            <line x1="110" y1="63" x2="91" y2="73" stroke="#43403A" strokeWidth="5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="61" cy="72" r="6" fill="#43403A" />
            <circle cx="100" cy="72" r="6" fill="#43403A" />
          </>
        )}
        {isEating ? (
          <path d="M58 103 Q80 126 105 103 Q88 112 58 103Z" fill="#FDFCF8" stroke="#43403A" strokeWidth="4" />
        ) : isHappy ? (
          <path d="M58 100 Q80 122 105 100" fill="none" stroke="#43403A" strokeWidth="5" strokeLinecap="round" />
        ) : (
          <path d="M61 105 Q80 94 101 105" fill="none" stroke="#43403A" strokeWidth="5" strokeLinecap="round" />
        )}
        <circle cx="45" cy="92" r="5" fill="#E6D5B8" opacity="0.85" />
        <circle cx="116" cy="92" r="5" fill="#E6D5B8" opacity="0.85" />
      </svg>
      <span className="monsterName">{monster?.name}</span>
    </button>
  );
}
