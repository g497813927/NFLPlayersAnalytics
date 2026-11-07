import { useRef, useState } from 'react';
import { Button, Empty, Pagination, Skeleton } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ErrorNotice, PageHeading } from '../components';
import { useData } from '../context';
import type { Game } from '../types';
import { FavoriteTeamsBar } from '../features/favorites/FavoriteTeamsBar';
import { useFavoriteTeams } from '../features/favorites/useFavoriteTeams';
import { GameExperience } from '../features/games/GameExperience';
import { GameCard } from '../features/games/GameCard';
import { GameFiltersBar } from '../features/games/GameFiltersBar';
import { EMPTY_GAME_FILTERS, filterGames } from '../features/games/filterGames';
import type { GameFilters } from '../features/games/types';
import { RecordDrawer } from './RecordDrawer';
import '../features/games/games.css';

const PAGE_SIZE = 12;

export function GamesPage() {
  const { lookups, connecting, connectionError, refresh, revision } = useData();
  const { teamIds } = useFavoriteTeams();
  const [filters, setFilters] = useState<GameFilters>(EMPTY_GAME_FILTERS);
  const [pagination, setPagination] = useState({ key: '', page: 1 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Game | null>(null);
  const spotlight = useRef<HTMLDivElement>(null);
  const games = filterGames(lookups.games, filters, teamIds);
  const selectionKey = JSON.stringify([
    filters,
    filters.view === 'favorites' ? teamIds : [],
    revision,
  ]);
  const page =
    pagination.key === selectionKey
      ? Math.min(pagination.page, Math.max(1, Math.ceil(games.length / PAGE_SIZE)))
      : 1;
  const selected =
    games.find((game) => game.game_id === selectedId) ||
    games.find((game) => game.status === 'completed') ||
    games[0];

  function selectGame(game: Game) {
    setSelectedId(game.game_id);
    spotlight.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  return (
    <div className="game-center">
      <PageHeading
        eyebrow="YOUR FRONT-ROW SEAT"
        title="Game center"
        description="The scores. The turning points. The little things that change everything."
        action={
          <Button
            icon={<ReloadOutlined />}
            loading={connecting}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        }
      />
      <FavoriteTeamsBar />
      <ErrorNotice
        error={connectionError}
        retry={() => void refresh()}
      />
      {connecting ? (
        <Skeleton
          active
          className="game-loading"
          paragraph={{ rows: 8 }}
        />
      ) : (
        !connectionError && (
          <div
            ref={spotlight}
            className="game-spotlight-anchor"
          >
            {selected && (
              <GameExperience
                key={`${selected.game_id}:${revision}`}
                game={selected}
                onDetails={() => setDetails(selected)}
              />
            )}
          </div>
        )
      )}
      <section
        className="schedule-section"
        aria-label="Schedule and saved results"
      >
        <div className="schedule-heading">
          <div>
            <span className="eyebrow">AROUND THE LEAGUE</span>
            <h2>
              Schedule & results <span>{connectionError ? '—' : games.length}</span>
            </h2>
          </div>
          <p>Saved games · times in your local timezone</p>
        </div>
        <GameFiltersBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_GAME_FILTERS)}
        />
        {!connecting && !connectionError && (
          <>
            <div className="schedule-grid">
              {games.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((game) => (
                <GameCard
                  key={game.game_id}
                  game={game}
                  selected={selected?.game_id === game.game_id}
                  onSelect={() => selectGame(game)}
                />
              ))}
            </div>
            {!games.length && (
              <Empty
                className="game-empty"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filters.view === 'favorites' && !teamIds.length
                    ? 'Follow a team above to build your own scoreboard.'
                    : 'No games match these filters. Try another season or team.'
                }
              />
            )}
            {games.length > PAGE_SIZE && (
              <Pagination
                className="game-pagination"
                current={page}
                pageSize={PAGE_SIZE}
                total={games.length}
                showSizeChanger={false}
                onChange={(nextPage) => setPagination({ key: selectionKey, page: nextPage })}
              />
            )}
          </>
        )}
      </section>
      <RecordDrawer
        kind="game"
        record={details}
        onClose={() => setDetails(null)}
      />
    </div>
  );
}
