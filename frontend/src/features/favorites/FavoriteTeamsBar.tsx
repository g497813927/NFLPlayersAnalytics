import { Select } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useData } from '../../context';
import { FavoriteButton } from './FavoriteButton';
import { useFavoriteTeams } from './useFavoriteTeams';

export function FavoriteTeamsBar() {
  const { lookups } = useData();
  const { teamIds, toggle, storageAvailable } = useFavoriteTeams();
  const favorites = lookups.teams.filter((team) => teamIds.includes(team.team_id));

  return (
    <section
      className="favorite-teams-bar"
      aria-label="Favorite teams"
    >
      <div className="favorite-teams-label">
        <StarFilled />
        <div>
          <strong>My teams</strong>
          <small>
            {storageAvailable
              ? 'Saved on this browser'
              : 'For this visit only · storage unavailable'}
          </small>
        </div>
      </div>
      <div className="favorite-team-chips">
        {favorites.map((team) => (
          <span
            className="favorite-team-chip"
            key={team.team_id}
          >
            {team.team_name}
            <FavoriteButton
              teamId={team.team_id}
              teamName={team.team_name}
            />
          </span>
        ))}
        {!favorites.length && <span className="muted">Keep your teams a little closer.</span>}
      </div>
      <Select<number>
        className="follow-team-select"
        aria-label="Add a favorite team"
        placeholder="＋ Follow a team"
        showSearch
        optionFilterProp="label"
        value={null}
        onChange={toggle}
        options={lookups.teams
          .filter((team) => !teamIds.includes(team.team_id))
          .map((team) => ({ value: team.team_id, label: team.team_name }))}
        notFoundContent="No more teams to follow"
      />
    </section>
  );
}
