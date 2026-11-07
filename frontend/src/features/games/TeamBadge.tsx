import type { CSSProperties } from 'react';
import type { GameSide } from './types';

export function TeamBadge({ side }: { side: GameSide }) {
  return (
    <span
      className="team-badge"
      style={{ '--team-color': side.color } as CSSProperties}
      aria-hidden="true"
    >
      {side.initials}
    </span>
  );
}
