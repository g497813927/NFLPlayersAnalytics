import type { ParticipantRole } from '../../types';

interface LowKeyMoment {
  step: number;
  team: ParticipantRole;
  role: string;
  title: string;
  description: string;
  reason: string;
}

/** Editorial examples in the scripted drive, not claims about recorded athletes. */
export const lowKeyMoments: LowKeyMoment[] = [
  {
    step: 0,
    team: 'away',
    role: 'Offensive line',
    title: 'The work before the highlight.',
    description:
      'Watch the quieter contributions as the demo unfolds: protection, blocks, and catches that keep a drive alive.',
    reason: 'The biggest score often begins with a small, decisive play.',
  },
  {
    step: 1,
    team: 'away',
    role: 'Run blocking',
    title: 'Eight yards. One crucial block.',
    description:
      'In this simulated play, the edge blocker seals the outside defender and opens a lane for the runner.',
    reason: 'Second-and-two gives the offense more options than second-and-ten.',
  },
  {
    step: 4,
    team: 'home',
    role: 'Pass defense',
    title: 'A fingertip changes the drive.',
    description: 'A well-timed pass breakup denies the completion without changing the score.',
    reason: 'The offense has to use another down to move the chains.',
  },
  {
    step: 6,
    team: 'away',
    role: 'Third-down receiving',
    title: 'The catch that keeps hope alive.',
    description:
      'An 11-yard third-down catch extends the possession and takes the offense into the red zone.',
    reason: 'The conversion creates the opportunity for the go-ahead touchdown.',
  },
  {
    step: 7,
    team: 'away',
    role: 'Pass protection',
    title: 'Time to make the winning throw.',
    description:
      'In the scripted touchdown play, the protection holds long enough for the receiver’s route to develop.',
    reason: 'The touchdown gets the headline; the protection makes it possible.',
  },
];
