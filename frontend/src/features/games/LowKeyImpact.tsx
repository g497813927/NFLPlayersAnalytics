import { BulbOutlined } from '@ant-design/icons';
import type { GameSide } from './types';
import { lowKeyMoments } from './lowKeyMoments';

export function LowKeyImpact({ step, sides }: { step: number; sides: GameSide[] }) {
  const moment = [...lowKeyMoments].reverse().find((item) => item.step <= step) || lowKeyMoments[0];
  const team = sides.find((side) => side.participant_role === moment.team);

  return (
    <section
      className="low-key-impact"
      aria-label="Low-key impact"
    >
      <div className="low-key-heading">
        <BulbOutlined />
        <h2>Low-key impact</h2>
        <span>SIMULATED</span>
      </div>
      <p className="low-key-role">
        {team?.name} · {moment.role}
      </p>
      <h3>{moment.title}</h3>
      <p>{moment.description}</p>
      <div className="low-key-reason">
        <strong>Why it matters</strong> {moment.reason}
      </div>
    </section>
  );
}
