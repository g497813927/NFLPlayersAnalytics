import { StarFilled, StarOutlined } from '@ant-design/icons';
import { useFavoriteTeams } from './useFavoriteTeams';

interface Props {
  teamId: number;
  teamName: string;
}

export function FavoriteButton({ teamId, teamName }: Props) {
  const { teamIds, toggle, loading } = useFavoriteTeams();
  const selected = teamIds.includes(teamId);

  return (
    <button
      type="button"
      className={`favorite-button${selected ? ' is-favorite' : ''}`}
      aria-label={`${selected ? 'Unfollow' : 'Follow'} ${teamName}`}
      aria-pressed={selected}
      disabled={loading}
      title={`${selected ? 'Unfollow' : 'Follow'} ${teamName}`}
      onClick={() => toggle(teamId)}
    >
      {selected ? <StarFilled /> : <StarOutlined />}
    </button>
  );
}
