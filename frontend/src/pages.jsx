import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, CalendarOutlined, DatabaseOutlined, TeamOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Descriptions, Drawer, Input, Row, Select, Space, Statistic, Table, Tag } from 'antd';
import { query } from './api';
import { athleteName, gameDate, shortDate, useData, useLabels, useResource } from './context';
import { ErrorNotice, FilterSelect, PageHeading, ResourceTable, StatusTag } from './components';

const options = (rows, key, label) => rows.map((row) => ({ value: row[key], label: row[label] }));

function useList(name, filters) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const filterKey = JSON.stringify(filters);
  useEffect(() => setPage(1), [filterKey]);
  const resource = useResource(`/${name}${query({ ...filters, page, page_size: pageSize })}`);
  return { resource, page, pageSize, onPageChange: (next, size) => { setPage(next); setPageSize(size); } };
}

function useGameColumns(onOpen) {
  const labels = useLabels();
  return [
    { title: 'Matchup', key: 'matchup', render: (_, row) => {
      const participants = row.participants || [];
      const away = participants.find((item) => item.participant_role === 'away');
      const home = participants.find((item) => item.participant_role === 'home');
      const title = home && away ? `${labels.team(away.team_id)} at ${labels.team(home.team_id)}` : row.matchup || `Game #${row.game_id}`;
      return <button className="text-button" onClick={() => onOpen(row)}>{title}</button>;
    } },
    { title: 'Date & time', dataIndex: 'game_time', render: gameDate },
    { title: 'Season', dataIndex: 'season_id', render: labels.season },
    { title: 'Result', key: 'result', render: (_, row) => {
      const participants = row.participants || [];
      const away = participants.find((item) => item.participant_role === 'away');
      const home = participants.find((item) => item.participant_role === 'home');
      return home?.score != null && away?.score != null ? <span className="score">{away.score} – {home.score}</span> : <span className="muted">Pending</span>;
    } },
    { title: 'Status', dataIndex: 'status', render: (value) => <StatusTag status={value} /> },
  ];
}

function useStatisticColumns() {
  const labels = useLabels();
  return [
    { title: 'Subject', key: 'subject', render: (_, row) => <><Tag>{row.athlete_id != null ? 'Athlete' : 'Team'}</Tag>{row.athlete_id != null ? labels.athlete(row.athlete_id) : labels.team(row.team_id)}</> },
    { title: 'Statistic', dataIndex: 'stat_definition_id', render: labels.stat },
    { title: 'Value', dataIndex: 'stat_value', align: 'right', render: (value) => <strong className="score">{value}</strong> },
    { title: 'Game', dataIndex: 'game_id', render: labels.game },
  ];
}

export function HomePage() {
  const navigate = useNavigate();
  const overview = useResource('/overview');
  const { health } = useData();
  const [selected, setSelected] = useState(null);
  const gameColumns = useGameColumns(setSelected);
  const counts = overview.data?.counts || {};
  const countValue = (plural, singular) => counts[plural] ?? counts[singular] ?? '—';
  return <>
    <div className="overview-hero"><div><div className="eyebrow">NFL PLAYERS ANALYTICS · LOCAL PROTOTYPE</div><h1>Every player.<br /><span>A bigger picture.</span></h1><p>Explore the teams, follow the season, and connect performance to the people behind it.</p><Button type="primary" size="large" onClick={() => navigate('/athletes')}>Explore athletes <ArrowRightOutlined /></Button></div><div className="field-art" aria-hidden="true"><div className="field-midline" /><span className="field-label">NFL ANALYTICS</span><span className="field-marker m1">20</span><span className="field-marker m2">40</span><span className="field-marker m3">40</span><span className="field-marker m4">20</span><div className="field-circle" /><div className="field-dot d1" /><div className="field-dot d2" /><div className="field-dot d3" /><div className="field-path" /></div></div>
    <ErrorNotice error={overview.error} retry={overview.retry} />
    <Row gutter={[16, 16]} className="metric-row">{[
      ['Teams', countValue('teams', 'team'), <TeamOutlined />, '/teams'],
      ['Athletes', countValue('athletes', 'athlete'), <UserOutlined />, '/athletes'],
      ['Games', countValue('games', 'game'), <CalendarOutlined />, '/games'],
      ['Statistics', counts.performance_statistics ?? counts.statistics ?? counts.performance_statistic ?? '—', <TrophyOutlined />, '/statistics'],
    ].map(([title, value, icon, path]) => <Col xs={12} lg={6} key={title}><Card className="metric-card" loading={overview.loading} onClick={() => navigate(path)} hoverable><span className="metric-icon">{icon}</span><Statistic title={title} value={value} /><span className="metric-footer">Explore records <ArrowRightOutlined /></span></Card></Col>)}</Row>
    <Row gutter={[20, 20]}><Col xs={24} xl={17}><Card title="Recent games" extra={<Link to="/games">All games <ArrowRightOutlined /></Link>} className="section-card"><Table rowKey="game_id" columns={gameColumns.filter((column) => column.dataIndex !== 'season_id')} dataSource={overview.data?.recent_games || []} loading={overview.loading} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Seed the database to explore game results.' }} /></Card></Col><Col xs={24} xl={7}><Card title="Your demo workspace" className="section-card workspace-card"><div className="workspace-status"><DatabaseOutlined /><div><strong>{health?.initialized ? 'Database connected' : 'Database setup required'}</strong><span>{health?.database || 'SQLite'} · local development</span></div></div><p>All people, teams, and results in this prototype are synthetic. Browse records or use Data Management to try changes.</p><Button block onClick={() => navigate('/manage')}>Manage records <ArrowRightOutlined /></Button><div className="future-note"><span className="eyebrow">COMING LATER</span><p>Sign-in, favorites, comparisons, imports, and exports.</p></div></Card></Col></Row>
    <RecordDrawer kind="game" record={selected} onClose={() => setSelected(null)} />
  </>;
}

export function TeamsPage() {
  const { lookups } = useData();
  const labels = useLabels();
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(null);
  const listing = useList('teams', filters);
  const columns = [
    { title: 'Team', dataIndex: 'team_name', render: (value, row) => <button className="text-button" onClick={() => setSelected(row)}><span className="record-avatar">{value?.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>{value}</button> },
    { title: 'City', dataIndex: 'city' },
    { title: 'League', dataIndex: 'league_id', render: labels.league },
    { title: '', key: 'view', render: (_, row) => <Button type="text" onClick={() => setSelected(row)} icon={<ArrowRightOutlined />} aria-label={`View ${row.team_name}`} /> },
  ];
  return <><PageHeading title="Teams" description="Meet the league. Open a team to see its seasonal rosters and players." /><Card className="data-card"><div className="filter-bar"><Input.Search allowClear placeholder="Search team or city" aria-label="Search team or city" onSearch={(q) => setFilters((value) => ({ ...value, q }))} /><FilterSelect label="All leagues" options={options(lookups.leagues, 'league_id', 'league_name')} onChange={(league_id) => setFilters((value) => ({ ...value, league_id }))} /></div><ResourceTable {...listing} rowKey="team_id" columns={columns} /></Card><RecordDrawer kind="team" record={selected} onClose={() => setSelected(null)} /></>;
}

export function AthletesPage() {
  const { lookups } = useData();
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(null);
  const listing = useList('athletes', filters);
  const columns = [
    { title: 'Athlete', key: 'name', render: (_, row) => <button className="text-button" onClick={() => setSelected(row)}><span className="record-avatar athlete-avatar">{row.first_name?.[0]}{row.last_name?.[0]}</span>{athleteName(row)}</button> },
    { title: 'Nationality', dataIndex: 'nationality', render: (value) => value || '—' },
    { title: '', key: 'view', align: 'right', render: (_, row) => <Button type="link" onClick={() => setSelected(row)}>View profile <ArrowRightOutlined /></Button> },
  ];
  return <><PageHeading title="Athletes" description="Find a player, trace their team history, and explore their performance." /><Card className="data-card"><div className="filter-bar"><Input.Search allowClear placeholder="Search athlete name" aria-label="Search athlete name" onSearch={(q) => setFilters((value) => ({ ...value, q }))} /><FilterSelect label="All teams" options={options(lookups.teams, 'team_id', 'team_name')} onChange={(team_id) => setFilters((value) => ({ ...value, team_id }))} /></div><ResourceTable {...listing} rowKey="athlete_id" columns={columns} /></Card><RecordDrawer kind="athlete" record={selected} onClose={() => setSelected(null)} /></>;
}

export function GamesPage() {
  const { lookups } = useData();
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(null);
  const listing = useList('games', filters);
  const columns = useGameColumns(setSelected);
  return <><PageHeading title="Games" description="The season, one matchup at a time. Explore schedules, scores, and game statistics." /><Card className="data-card"><div className="filter-bar"><FilterSelect label="All seasons" options={options(lookups.seasons, 'season_id', 'season_name')} onChange={(season_id) => setFilters((value) => ({ ...value, season_id }))} /><FilterSelect label="All statuses" options={['scheduled', 'in_progress', 'completed', 'cancelled'].map((value) => ({ value, label: value.replaceAll('_', ' ') }))} onChange={(status) => setFilters((value) => ({ ...value, status }))} /><FilterSelect label="All teams" options={options(lookups.teams, 'team_id', 'team_name')} onChange={(team_id) => setFilters((value) => ({ ...value, team_id }))} /><Input type="date" aria-label="Games on or after date" title="Games on or after" onChange={(event) => setFilters((value) => ({ ...value, date_from: event.target.value }))} /></div><ResourceTable {...listing} rowKey="game_id" columns={columns} /></Card><RecordDrawer kind="game" record={selected} onClose={() => setSelected(null)} /></>;
}

export function StandingsPage() {
  const { lookups } = useData();
  const labels = useLabels();
  const [seasonId, setSeasonId] = useState(null);
  const selectedSeason = seasonId ?? lookups.seasons[0]?.season_id;
  const listing = useList('standings', { season_id: selectedSeason });
  const columns = [
    { title: 'Rank', dataIndex: 'rank', width: 90, render: (value) => <span className={`rank ${value === 1 ? 'rank-first' : ''}`}>{value}</span> },
    { title: 'Team', dataIndex: 'team_id', render: (value, row) => <strong>{row.team_name || labels.team(value)}</strong> },
    { title: 'Wins', dataIndex: 'wins', align: 'right' },
    { title: 'Losses', dataIndex: 'losses', align: 'right' },
    { title: 'Ties', dataIndex: 'ties', align: 'right' },
    { title: 'Win %', dataIndex: 'win_percentage', align: 'right', render: (value) => <strong className="score">{(Number(value || 0) * 100).toFixed(1)}%</strong> },
    { title: 'Points', dataIndex: 'points', align: 'right' },
  ];
  return <><PageHeading title="Standings" description="A season-wide view of team results, updated when game results change." /><Card className="data-card"><div className="filter-bar"><Select aria-label="Season" placeholder="Select season" value={selectedSeason} options={options(lookups.seasons, 'season_id', 'season_name')} onChange={setSeasonId} /><Tag color="cyan">Basic demo standings</Tag></div><ResourceTable {...listing} rowKey="standing_id" columns={columns} /><div className="table-footnote">Completed games only. Win % = (wins + ½ ties) ÷ games played. Equal percentages share a rank. Official NFL tiebreakers are deferred.</div></Card></>;
}

export function StatisticsPage() {
  const { lookups } = useData();
  const labels = useLabels();
  const [filters, setFilters] = useState({});
  const listing = useList('performance-statistics', filters);
  const columns = useStatisticColumns();
  return <><PageHeading title="Statistics" description="Connect individual and team performance to the game where it happened." /><Card className="data-card"><div className="filter-bar"><FilterSelect label="All statistics" options={options(lookups.stat_definitions, 'stat_definition_id', 'stat_name')} onChange={(stat_definition_id) => setFilters((value) => ({ ...value, stat_definition_id }))} /><FilterSelect label="All games" options={lookups.games.map((row) => ({ value: row.game_id, label: labels.game(row.game_id) }))} onChange={(game_id) => setFilters((value) => ({ ...value, game_id }))} /><FilterSelect label="All athletes" value={filters.athlete_id} options={lookups.athletes.map((row) => ({ value: row.athlete_id, label: athleteName(row) }))} onChange={(athlete_id) => setFilters((value) => ({ ...value, athlete_id, team_id: undefined }))} /><FilterSelect label="All teams" value={filters.team_id} options={options(lookups.teams, 'team_id', 'team_name')} onChange={(team_id) => setFilters((value) => ({ ...value, team_id, athlete_id: undefined }))} /></div><ResourceTable {...listing} rowKey="performance_statistic_id" columns={columns} /></Card></>;
}

export function RecordDrawer({ kind, record, onClose }) {
  const labels = useLabels();
  const id = record?.[`${kind}_id`];
  const memberships = useResource(record && ['team', 'athlete'].includes(kind) ? `/memberships${query({ [`${kind}_id`]: id, page_size: 200 })}` : null);
  const rosters = useResource(record && kind === 'team' ? `/rosters${query({ team_id: id, page_size: 200 })}` : null);
  const statistics = useResource(record && ['athlete', 'game'].includes(kind) ? `/performance-statistics${query({ [`${kind}_id`]: id, page_size: 200 })}` : null);
  const statisticColumns = useStatisticColumns();
  const membershipColumns = [
    ...(kind === 'team' ? [{ title: 'Athlete', dataIndex: 'athlete_id', render: labels.athlete }] : []),
    { title: 'Team · season', dataIndex: 'roster_id', render: labels.roster },
    { title: 'Position', dataIndex: 'position', render: (value) => value || '—' },
    { title: '#', dataIndex: 'jersey_number', render: (value) => value ?? '—' },
    { title: 'From', dataIndex: 'start_date', render: shortDate },
    { title: 'Until', dataIndex: 'end_date', render: shortDate },
  ];
  const title = kind === 'team' ? record?.team_name : kind === 'athlete' ? athleteName(record) : record ? labels.game(id) : '';
  return <Drawer title={title || 'Record details'} open={Boolean(record)} onClose={onClose} width={900}>
    {record && <>
      {kind === 'team' && <><Descriptions bordered size="small" column={2} items={[{ key: 'city', label: 'City', children: record.city }, { key: 'league', label: 'League', children: labels.league(record.league_id) }]} /><h3>Seasonal rosters</h3><ResourceTable resource={rosters} rowKey="roster_id" columns={[{ title: 'Season', dataIndex: 'season_id', render: labels.season }, { title: 'Team', dataIndex: 'team_id', render: labels.team }]} /></>}
      {kind === 'athlete' && <Descriptions bordered size="small" column={1} items={[{ key: 'nationality', label: 'Nationality', children: record.nationality || '—' }]} />}
      {['team', 'athlete'].includes(kind) && <><h3>{kind === 'team' ? 'Roster memberships' : 'Team history'}</h3><ResourceTable resource={memberships} rowKey="membership_id" columns={membershipColumns} /></>}
      {kind === 'game' && <><Descriptions bordered size="small" column={2} items={[{ key: 'date', label: 'Date & time', children: gameDate(record.game_time) }, { key: 'season', label: 'Season', children: labels.season(record.season_id) }, { key: 'venue', label: 'Venue', children: labels.venue(record.venue_id) }, { key: 'status', label: 'Status', children: <StatusTag status={record.status} /> }]} /><div className="matchup-panel">{[...(record.participants || [])].sort((a, b) => a.participant_role === 'away' ? -1 : b.participant_role === 'away' ? 1 : 0).map((participant) => <div key={participant.team_id}><span className="eyebrow">{participant.participant_role}</span><h3>{labels.team(participant.team_id)}</h3><strong>{participant.score ?? '—'}</strong></div>)}</div></>}
      {['athlete', 'game'].includes(kind) && <><h3>Performance statistics</h3><ResourceTable resource={statistics} rowKey="performance_statistic_id" columns={statisticColumns.filter((column) => !(kind === 'athlete' && column.key === 'subject') && !(kind === 'game' && column.dataIndex === 'game_id'))} /></>}
      {[memberships, rosters, statistics].some((resource) => resource.data?.total > 200) && <Alert type="info" message="This detail view shows the first 200 records. Use the main statistics or management page to browse further." />}
    </>}
  </Drawer>;
}
