import { Empty, Skeleton } from 'antd';
import { ErrorNotice } from '../../components';
import { useResource } from '../../context';
import type { Game, Paged, PerformanceStatistic } from '../../types';
import type { GameSide } from './types';

export function SavedGameStats({ game, sides }: { game: Game; sides: GameSide[] }) {
  const resource = useResource<Paged<PerformanceStatistic>>(
    `/performance-statistics?game_id=${game.game_id}&page_size=200`,
  );
  const [away, home] = sides;
  const rows = resource.data?.items || [];
  const comparisons =
    away && home
      ? rows
          .filter((row) => row.team_id === away.team_id)
          .flatMap((left) => {
            const right = rows.find(
              (row) =>
                row.team_id === home.team_id && row.stat_definition_id === left.stat_definition_id,
            );
            return right ? [{ left, right }] : [];
          })
      : [];

  return (
    <section className="saved-game-stats">
      <span className="eyebrow">FROM THE DATABASE</span>
      <h2>Team comparison</h2>
      <p>Recorded team totals for this game.</p>
      <ErrorNotice
        error={resource.error}
        retry={resource.retry}
      />
      {resource.loading ? (
        <Skeleton
          active
          paragraph={{ rows: 3 }}
        />
      ) : (
        <>
          {!resource.error && !comparisons.length && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No comparable team statistics recorded yet."
            />
          )}
          <div className="comparison-team-labels">
            <span>{away?.initials}</span>
            <span>{home?.initials}</span>
          </div>
          {comparisons.map(({ left, right }) => {
            const max = Math.max(Math.abs(left.stat_value), Math.abs(right.stat_value), 1);
            return (
              <div
                className="stat-comparison"
                key={left.stat_definition_id}
              >
                <div>
                  <strong>{left.stat_value}</strong>
                  <span>{left.stat_name || `Statistic ${left.stat_definition_id}`}</span>
                  <strong>{right.stat_value}</strong>
                </div>
                {left.stat_value >= 0 && right.stat_value >= 0 && (
                  <div
                    className="comparison-bars"
                    aria-hidden="true"
                  >
                    <span>
                      <i
                        style={{
                          width: `${(left.stat_value / max) * 100}%`,
                          background: away?.color,
                        }}
                      />
                    </span>
                    <span>
                      <i
                        style={{
                          width: `${(right.stat_value / max) * 100}%`,
                          background: home?.color,
                        }}
                      />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {(resource.data?.total || 0) > 200 && (
            <p>First 200 statistics shown. Use the Statistics page to browse further.</p>
          )}
        </>
      )}
    </section>
  );
}
