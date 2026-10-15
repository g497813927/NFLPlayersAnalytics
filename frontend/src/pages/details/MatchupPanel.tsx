import { useLabels } from '../../context';
import type { GameParticipant } from '../../types';

export function MatchupPanel({ participants }: { participants: GameParticipant[] }) {
  const labels = useLabels();
  const orderedParticipants = [...participants].sort((left, right) => {
    if (left.participant_role === 'away') return -1;
    if (right.participant_role === 'away') return 1;
    return 0;
  });

  return (
    <div className="matchup-panel">
      {orderedParticipants.map((participant) => (
        <div key={participant.team_id}>
          <span className="eyebrow">{participant.participant_role}</span>
          <h3>{labels.team(participant.team_id)}</h3>
          <strong>{participant.score ?? '—'}</strong>
        </div>
      ))}
    </div>
  );
}
