import type { GameSide, MockPlay } from './types';

interface Props {
  frame: MockPlay;
  sides: GameSide[];
}

export function DriveField({ frame, sides }: Props) {
  const attacking = sides.find((side) => side.participant_role === frame.possession);
  const forward = frame.possession === 'away';
  const yard = forward ? frame.yard : 100 - frame.yard;
  const ballX = 50 + yard * 5;
  const targetYard = Math.min(100, frame.yard + (frame.toGain || 0));
  const targetX = 50 + (forward ? targetYard : 100 - targetYard) * 5;
  const position =
    frame.yard === 100
      ? 'End zone'
      : frame.yard <= 50
        ? `Own ${frame.yard}`
        : `Opponent ${100 - frame.yard}`;

  return (
    <section
      className="drive-tracker"
      aria-label="Simulated drive tracker"
    >
      <div className="drive-heading">
        <div>
          <span className="eyebrow">ON THE FIELD · SIMULATED</span>
          <h3>
            {frame.down} <span>{!frame.final && `at ${position}`}</span>
          </h3>
        </div>
        <span className="drive-direction">
          {attacking?.initials} {forward ? '→' : '←'}
        </span>
      </div>
      <svg
        className="drive-field"
        viewBox="0 0 600 170"
        role="img"
        aria-label={`${attacking?.name || 'Team'}: ${frame.down}, ${position}. ${forward ? 'Attacking right.' : 'Attacking left.'}`}
      >
        <rect
          x="1"
          y="1"
          width="598"
          height="168"
          rx="12"
          fill="#edf3ef"
        />
        <rect
          x="1"
          y="1"
          width="49"
          height="168"
          rx="10"
          fill="#d9e5df"
        />
        <rect
          x="550"
          y="1"
          width="49"
          height="168"
          rx="10"
          fill="#d9e5df"
        />
        <text
          x="25"
          y="88"
          textAnchor="middle"
          transform="rotate(-90 25 88)"
        >
          {sides[0]?.initials}
        </text>
        <text
          x="575"
          y="88"
          textAnchor="middle"
          transform="rotate(90 575 88)"
        >
          {sides[1]?.initials}
        </text>
        {Array.from({ length: 11 }, (_, index) => (
          <g key={index}>
            <line
              x1={50 + index * 50}
              x2={50 + index * 50}
              y1="8"
              y2="162"
              stroke="#bbcec2"
            />
            {index > 0 && index < 10 && (
              <>
                <text
                  x={50 + index * 50}
                  y="30"
                  textAnchor="middle"
                >
                  {Math.min(index, 10 - index) * 10}
                </text>
                <text
                  x={50 + index * 50}
                  y="152"
                  textAnchor="middle"
                >
                  {Math.min(index, 10 - index) * 10}
                </text>
              </>
            )}
          </g>
        ))}
        {Array.from({ length: 49 }, (_, index) => (
          <path
            key={index}
            d={`M${60 + index * 10} 53v7 M${60 + index * 10} 110v7`}
            stroke="#cad8ce"
            strokeWidth="1.5"
          />
        ))}
        <line
          x1={forward ? 175 : 425}
          x2={ballX}
          y1="85"
          y2="85"
          stroke={attacking?.color || '#147c79'}
          strokeWidth="14"
          strokeOpacity=".18"
          strokeLinecap="round"
        />
        {frame.toGain !== null && (
          <line
            x1={targetX}
            x2={targetX}
            y1="7"
            y2="163"
            stroke="#bb8818"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        )}
        <g
          className="field-ball"
          style={{ transform: `translateX(${ballX}px)` }}
        >
          <line
            x1="0"
            x2="0"
            y1="7"
            y2="163"
            stroke={attacking?.color || '#147c79'}
            strokeWidth="2"
          />
          <circle
            cy="85"
            r="14"
            fill={attacking?.color || '#147c79'}
            stroke="white"
            strokeWidth="3"
          />
          <path
            d="M-7 88Q-5 77 7 82Q5 93 -7 88Z"
            fill="white"
          />
          <path
            d="M-3 85h6"
            stroke={attacking?.color || '#147c79'}
          />
        </g>
      </svg>
      <div className="field-legend">
        <span>
          <i className="ball-key" /> Ball position
        </span>
        <span>
          <i className="gain-key" /> First-down line
        </span>
        <strong>
          {frame.possession === 'away' ? `${frame.yard - 25} yards this drive` : 'New possession'}
        </strong>
      </div>
    </section>
  );
}
