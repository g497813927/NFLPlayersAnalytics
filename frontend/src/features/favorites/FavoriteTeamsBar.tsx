import { Alert, Button, Select } from 'antd';
import { Link } from 'react-router-dom';
import { StarFilled } from '@ant-design/icons';
import { useData } from '../../context';
import { FavoriteButton } from './FavoriteButton';
import { useFavoriteTeams } from './useFavoriteTeams';
import { useAuth } from '../auth/useAuth';

export function FavoriteTeamsBar() {
  const { lookups } = useData();
  const { teamIds, toggle, storageAvailable, loading, error, retry } = useFavoriteTeams();
  const { user } = useAuth();
  const favorites = lookups.teams.filter((team) => teamIds.includes(team.team_id));

  return (
    <>
      {error && (
        <Alert
          className="error-notice"
          type="warning"
          showIcon
          message={error}
          action={<Button onClick={retry}>Retry</Button>}
        />
      )}
      <section
        className="favorite-teams-bar"
        aria-label="Favorite teams"
      >
        <div className="favorite-teams-label">
          <StarFilled />
          <div>
            <strong>My teams</strong>
            <small>
              {user
                ? loading
                  ? 'Syncing your account…'
                  : 'Saved to your account'
                : storageAvailable
                  ? 'Saved on this browser'
                  : 'For this visit only · storage unavailable'}
            </small>
            {!user && <Link to="/login">Sign in to sync</Link>}
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
          disabled={loading}
          loading={loading}
          options={lookups.teams
            .filter((team) => !teamIds.includes(team.team_id))
            .map((team) => ({ value: team.team_id, label: team.team_name }))}
          notFoundContent="No more teams to follow"
        />
      </section>
    </>
  );
}
