import type { EditableResource } from '../types';
import type { FieldProps } from './fieldTypes';
import { TeamFields } from './fields/TeamFields';
import { AthleteFields } from './fields/AthleteFields';
import { RosterFields } from './fields/RosterFields';
import { MembershipFields } from './fields/MembershipFields';
import { GameFields } from './fields/GameFields';
import { StatisticFields } from './fields/StatisticFields';

export function EntityFields({ entity, ...props }: FieldProps & { entity: EditableResource }) {
  switch (entity) {
    case 'teams':
      return <TeamFields {...props} />;
    case 'athletes':
      return <AthleteFields />;
    case 'rosters':
      return <RosterFields {...props} />;
    case 'memberships':
      return <MembershipFields {...props} />;
    case 'games':
      return <GameFields {...props} />;
    case 'performance-statistics':
      return <StatisticFields {...props} />;
  }
}
