import { Alert, Drawer } from 'antd';
import { query } from '../api';
import { athleteName, useLabels, useResource } from '../context';
import type {
  Athlete,
  Game,
  Membership,
  Paged,
  PerformanceStatistic,
  Roster,
  Team,
} from '../types';
import { AthleteDetails } from './details/AthleteDetails';
import { GameDetails } from './details/GameDetails';
import { MembershipHistory } from './details/MembershipHistory';
import { PerformanceHistory } from './details/PerformanceHistory';
import { TeamDetails } from './details/TeamDetails';

type RecordDrawerProps = { onClose: () => void } & (
  | { kind: 'team'; record: Team | null }
  | { kind: 'athlete'; record: Athlete | null }
  | { kind: 'game'; record: Game | null }
);

export function RecordDrawer(props: RecordDrawerProps) {
  const labels = useLabels();
  const id =
    props.kind === 'team'
      ? props.record?.team_id
      : props.kind === 'athlete'
        ? props.record?.athlete_id
        : props.record?.game_id;
  const memberships = useResource<Paged<Membership>>(
    props.record && props.kind !== 'game'
      ? `/memberships${query({ [`${props.kind}_id`]: id, page_size: 200 })}`
      : null,
  );
  const rosters = useResource<Paged<Roster>>(
    props.record && props.kind === 'team'
      ? `/rosters${query({ team_id: id, page_size: 200 })}`
      : null,
  );
  const statistics = useResource<Paged<PerformanceStatistic>>(
    props.record && props.kind !== 'team'
      ? `/performance-statistics${query({ [`${props.kind}_id`]: id, page_size: 200 })}`
      : null,
  );
  const title =
    props.kind === 'team'
      ? props.record?.team_name
      : props.kind === 'athlete'
        ? athleteName(props.record)
        : props.record
          ? labels.game(id)
          : '';
  const hasMoreRecords = [memberships, rosters, statistics].some(
    (resource) => (resource.data?.total ?? 0) > 200,
  );

  return (
    <Drawer
      title={title || 'Record details'}
      open={Boolean(props.record)}
      onClose={props.onClose}
      width={900}
    >
      {props.record && (
        <>
          {props.kind === 'team' && <TeamDetails team={props.record} rosters={rosters} />}
          {props.kind === 'athlete' && <AthleteDetails athlete={props.record} />}
          {props.kind !== 'game' && <MembershipHistory kind={props.kind} resource={memberships} />}
          {props.kind === 'game' && <GameDetails game={props.record} />}
          {props.kind !== 'team' && <PerformanceHistory kind={props.kind} resource={statistics} />}
          {hasMoreRecords && (
            <Alert
              type="info"
              message="This detail view shows the first 200 records. Use the main statistics or management page to browse further."
            />
          )}
        </>
      )}
    </Drawer>
  );
}
