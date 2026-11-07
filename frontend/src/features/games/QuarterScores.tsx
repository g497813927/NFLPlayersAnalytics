import type { GameSide, MockPlay } from './types';

export function QuarterScores({ sides, frame }: { sides: GameSide[]; frame: MockPlay }) {
  return (
    <div className="quarter-scores">
      <table aria-label="Simulated scores by quarter">
        <thead>
          <tr>
            <th scope="col">Demo score</th>
            {['1', '2', '3', '4', 'T'].map((quarter) => (
              <th
                scope="col"
                key={quarter}
              >
                {quarter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sides.map((side) => {
            const away = side.participant_role === 'away';
            const score = away ? frame.awayScore : frame.homeScore;
            return (
              <tr key={side.team_id}>
                <th scope="row">{side.initials}</th>
                <td>7</td>
                <td>7</td>
                <td>{away ? 3 : 7}</td>
                <td>{away ? score - 17 : 0}</td>
                <td>
                  <strong>{score}</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
