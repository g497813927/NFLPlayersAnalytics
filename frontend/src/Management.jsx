import { useState } from 'react';
import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Modal, Radio, Row, Select, Space, Tabs, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { api, query } from './api';
import { athleteName, gameDate, shortDate, useData, useLabels, useResource } from './context';
import { ErrorNotice, PageHeading, ResourceTable, StatusTag } from './components';

const ENTITIES = {
  teams: { label: 'Teams', singular: 'team', key: 'team_id' },
  athletes: { label: 'Athletes', singular: 'athlete', key: 'athlete_id' },
  rosters: { label: 'Rosters', singular: 'roster', key: 'roster_id' },
  memberships: { label: 'Memberships', singular: 'membership', key: 'membership_id' },
  games: { label: 'Games', singular: 'game', key: 'game_id' },
  'performance-statistics': { label: 'Statistics', singular: 'statistic', key: 'performance_statistic_id' },
};
const required = [{ required: true, message: 'Please complete this field.' }];
const textRequired = [{ required: true, whitespace: true, message: 'Please complete this field.' }];
const selectProps = { showSearch: true, optionFilterProp: 'label', placeholder: 'Choose a record' };
const localDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function ManagementPage() {
  const [entity, setEntity] = useState('teams');
  return <><PageHeading eyebrow="WORKSPACE" title="Data management" description="Add, edit, and remove records. Database rules keep connected data consistent." /><Alert className="prototype-alert" type="info" showIcon message="Prototype workspace · no sign-in required" description="Changes are saved to your local demo database. Related records are selected from the database, and rejected changes receive a readable explanation." /><Card className="data-card management-card"><Tabs activeKey={entity} onChange={setEntity} items={Object.entries(ENTITIES).map(([key, value]) => ({ key, label: value.label }))} /><ManagementTable key={entity} entity={entity} /></Card></>;
}

function ManagementTable({ entity }) {
  const { refresh, lookups } = useData();
  const labels = useLabels();
  const { message } = App.useApp();
  const config = ENTITIES[entity];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [form] = Form.useForm();
  const resource = useResource(`/${entity}${query({ page, page_size: pageSize, q: search })}`);
  const columns = {
    teams: [{ title: 'Team', dataIndex: 'team_name' }, { title: 'City', dataIndex: 'city' }, { title: 'League', dataIndex: 'league_id', render: labels.league }],
    athletes: [{ title: 'Athlete', render: (_, row) => athleteName(row) }, { title: 'Nationality', dataIndex: 'nationality', render: (value) => value || '—' }],
    rosters: [{ title: 'Team', dataIndex: 'team_id', render: labels.team }, { title: 'Season', dataIndex: 'season_id', render: labels.season }],
    memberships: [{ title: 'Athlete', dataIndex: 'athlete_id', render: labels.athlete }, { title: 'Roster', dataIndex: 'roster_id', render: labels.roster }, { title: 'Position', dataIndex: 'position' }, { title: 'Jersey', dataIndex: 'jersey_number', render: (value) => value ?? '—' }, { title: 'From', dataIndex: 'start_date', render: shortDate }, { title: 'Until', dataIndex: 'end_date', render: shortDate }],
    games: [{ title: 'Game', dataIndex: 'game_id', render: labels.game }, { title: 'Date & time', dataIndex: 'game_time', render: gameDate }, { title: 'Status', dataIndex: 'status', render: (value) => <StatusTag status={value} /> }],
    'performance-statistics': [{ title: 'Subject', render: (_, row) => row.athlete_id != null ? labels.athlete(row.athlete_id) : labels.team(row.team_id) }, { title: 'Statistic', dataIndex: 'stat_definition_id', render: labels.stat }, { title: 'Value', dataIndex: 'stat_value' }, { title: 'Game', dataIndex: 'game_id', render: labels.game }],
  }[entity];

  const startEdit = (row = {}) => {
    setFormError(null);
    setEditing(row);
    form.resetFields();
    let values = { ...row };
    if (entity === 'games') {
      const home = row.participants?.find((item) => item.participant_role === 'home');
      const away = row.participants?.find((item) => item.participant_role === 'away');
      values = { ...values, status: row.status || 'scheduled', game_time: localDateTime(row.game_time), home_team_id: home?.team_id, away_team_id: away?.team_id, home_score: home?.score, away_score: away?.score };
    }
    if (entity === 'performance-statistics') values.subject_type = row.team_id != null ? 'team' : 'athlete';
    form.setFieldsValue(values);
  };

  const submit = async (values) => {
    setSaving(true);
    setFormError(null);
    const blankToNull = (value) => value === undefined || value === '' ? null : value;
    let payload = { ...values };
    if (entity === 'athletes') payload.nationality = blankToNull(payload.nationality);
    if (entity === 'memberships') {
      payload.end_date = blankToNull(payload.end_date);
      payload.jersey_number = blankToNull(payload.jersey_number);
    }
    if (entity === 'games') {
      if (Number.isNaN(new Date(values.game_time).getTime())) {
        setFormError('Please enter a valid date and time.');
        setSaving(false);
        return;
      }
      payload = {
        game_time: new Date(values.game_time).toISOString(), status: values.status,
        season_id: values.season_id, venue_id: blankToNull(values.venue_id),
        participants: [
          { team_id: values.home_team_id, participant_role: 'home', score: blankToNull(values.home_score) },
          { team_id: values.away_team_id, participant_role: 'away', score: blankToNull(values.away_score) },
        ],
      };
    }
    if (entity === 'performance-statistics') {
      delete payload.subject_type;
      payload.athlete_id = values.subject_type === 'athlete' ? values.athlete_id : null;
      payload.team_id = values.subject_type === 'team' ? values.team_id : null;
    }
    try {
      const id = editing[config.key];
      await api(`/${entity}${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: payload });
      message.success(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${id ? 'updated' : 'created'}.`);
      setEditing(null);
      await refresh();
    } catch (error) { setFormError(error.message); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    setDeleteError(null);
    try {
      await api(`/${entity}/${deleting[config.key]}`, { method: 'DELETE' });
      setDeleting(null);
      message.success('Record deleted.');
      if (resource.data?.items?.length === 1 && page > 1) setPage(page - 1);
      await refresh();
    } catch (error) { setDeleteError(error.message); }
    finally { setSaving(false); }
  };

  return <><div className="management-toolbar"><div><h2>{config.label}</h2><span className="muted">{resource.data?.total ?? '—'} records in the database</span></div><Space>{['teams', 'athletes'].includes(entity) && <Input.Search allowClear placeholder={`Search ${config.label.toLowerCase()}`} aria-label={`Search ${config.label.toLowerCase()}`} onSearch={(value) => { setSearch(value); setPage(1); }} />}<Button type="primary" icon={<PlusOutlined />} onClick={() => startEdit()}>Add {config.singular}</Button></Space></div>
    <ResourceTable resource={resource} rowKey={config.key} page={page} pageSize={pageSize} onPageChange={(next, size) => { setPage(next); setPageSize(size); }} columns={[...columns, { title: 'Actions', key: 'actions', fixed: 'right', width: 150, render: (_, row) => <Space><Button size="small" icon={<EditOutlined />} onClick={() => startEdit(row)} aria-label={`Edit ${config.singular}`}>Edit</Button><Button size="small" danger icon={<DeleteOutlined />} onClick={() => { setDeleting(row); setDeleteError(null); }} aria-label={`Delete ${config.singular}`} /></Space> }]} />
    <Modal title={`${editing?.[config.key] ? 'Edit' : 'Add'} ${config.singular}`} open={editing !== null} onCancel={() => !saving && setEditing(null)} onOk={() => form.submit()} okText="Save record" confirmLoading={saving} cancelButtonProps={{ disabled: saving }} closable={!saving} maskClosable={!saving} width={entity === 'games' || entity === 'memberships' ? 680 : 560} forceRender>
      <ErrorNotice error={formError} /><Form form={form} layout="vertical" preserve={false} onFinish={submit} disabled={saving} requiredMark="optional"><EntityFields entity={entity} form={form} lookups={lookups} labels={labels} /></Form>
    </Modal>
    <Modal title={`Delete this ${config.singular}?`} open={Boolean(deleting)} onCancel={() => !saving && setDeleting(null)} onOk={remove} okText="Delete record" okButtonProps={{ danger: true }} confirmLoading={saving} cancelButtonProps={{ disabled: saving }} closable={!saving} maskClosable={!saving}>
      <p>{entity === 'games' ? 'Deleting this game also deletes its participants and performance statistics. The season standings will be updated.' : entity === 'rosters' ? 'Deleting this roster also deletes its memberships. The deletion will be blocked if it would invalidate existing game statistics.' : 'The record will be removed from your local database. If other records still depend on it, the database may block this action.'}</p><ErrorNotice error={deleteError} />
    </Modal>
  </>;
}

function EntityFields({ entity, form, lookups, labels }) {
  const seasonId = Form.useWatch('season_id', form);
  const rosterId = Form.useWatch('roster_id', form);
  const gameId = Form.useWatch('game_id', form);
  const subjectType = Form.useWatch('subject_type', form) || 'athlete';
  const status = Form.useWatch('status', form);
  const homeId = Form.useWatch('home_team_id', form);
  const awayId = Form.useWatch('away_team_id', form);
  const startDate = Form.useWatch('start_date', form);
  const season = lookups.seasons.find((row) => row.season_id === seasonId);
  const roster = lookups.rosters.find((row) => row.roster_id === rosterId);
  const rosterSeason = lookups.seasons.find((row) => row.season_id === roster?.season_id);
  const game = lookups.games.find((row) => row.game_id === gameId);
  const teamOptions = lookups.teams.map((row) => ({ value: row.team_id, label: row.team_name }));
  const seasonOptions = lookups.seasons.map((row) => ({ value: row.season_id, label: row.season_name }));
  const athleteOptions = lookups.athletes.map((row) => ({ value: row.athlete_id, label: athleteName(row) }));
  const select = (name, label, choices, extra = {}) => <Form.Item name={name} label={label} rules={required}><Select {...selectProps} options={choices} {...extra} /></Form.Item>;

  if (entity === 'teams') return <>{<Form.Item name="team_name" label="Team name" rules={textRequired}><Input maxLength={120} placeholder="e.g. Harbor City Owls" /></Form.Item>}<Form.Item name="city" label="City" rules={textRequired}><Input maxLength={100} /></Form.Item>{select('league_id', 'League', lookups.leagues.map((row) => ({ value: row.league_id, label: row.league_name })))}</>;
  if (entity === 'athletes') return <><Row gutter={16}><Col span={12}><Form.Item name="first_name" label="First name" rules={textRequired}><Input maxLength={80} /></Form.Item></Col><Col span={12}><Form.Item name="last_name" label="Last name" rules={textRequired}><Input maxLength={80} /></Form.Item></Col></Row><Form.Item name="nationality" label="Nationality"><Input maxLength={80} /></Form.Item></>;
  if (entity === 'rosters') return <>{select('season_id', 'Season', seasonOptions, { onChange: () => form.setFieldValue('team_id', undefined) })}{select('team_id', 'Team', teamOptions.filter((option) => !season || lookups.teams.find((row) => row.team_id === option.value)?.league_id === season.league_id))}<p className="muted">Each team has one roster per season. Add athletes through the Memberships tab.</p></>;
  if (entity === 'memberships') return <>{select('roster_id', 'Team and season', lookups.rosters.map((row) => ({ value: row.roster_id, label: labels.roster(row.roster_id) })), { onChange: (value) => {
    const chosenRoster = lookups.rosters.find((row) => row.roster_id === value);
    const chosenSeason = lookups.seasons.find((row) => row.season_id === chosenRoster?.season_id);
    form.setFieldsValue({ start_date: chosenSeason?.start_date, end_date: chosenSeason?.end_date });
  } })}{select('athlete_id', 'Athlete', athleteOptions)}<Row gutter={16}><Col span={16}><Form.Item name="position" label="Position" rules={textRequired}><Input maxLength={40} placeholder="e.g. Quarterback" /></Form.Item></Col><Col span={8}><Form.Item name="jersey_number" label="Jersey number"><Input maxLength={10} placeholder="e.g. 00" /></Form.Item></Col></Row><Row gutter={16}><Col span={12}><Form.Item name="start_date" label="Start date" rules={required}><Input type="date" min={rosterSeason?.start_date} max={rosterSeason?.end_date} /></Form.Item></Col><Col span={12}><Form.Item name="end_date" label="End date" dependencies={['start_date']} rules={[({ getFieldValue }) => ({ validator(_, value) { return !value || !getFieldValue('start_date') || value >= getFieldValue('start_date') ? Promise.resolve() : Promise.reject(new Error('End date must be on or after the start date.')); } })]}><Input type="date" min={startDate || rosterSeason?.start_date} max={rosterSeason?.end_date} /></Form.Item></Col></Row><p className="muted">Membership dates must fall within the selected roster’s season.</p></>;
  if (entity === 'games') {
    const validTeams = new Set(lookups.rosters.filter((row) => row.season_id === seasonId).map((row) => row.team_id));
    const teams = teamOptions.filter((row) => validTeams.has(row.value));
    return <><Row gutter={16}><Col span={12}>{select('season_id', 'Season', seasonOptions, { onChange: () => form.setFieldsValue({ home_team_id: undefined, away_team_id: undefined }) })}</Col><Col span={12}><Form.Item name="status" label="Status" rules={required}><Select options={['scheduled', 'in_progress', 'completed', 'cancelled'].map((value) => ({ value, label: value.replaceAll('_', ' ') }))} /></Form.Item></Col></Row><Row gutter={16}><Col span={12}><Form.Item name="game_time" label="Game time (your local time)" rules={required}><Input type="datetime-local" /></Form.Item></Col><Col span={12}><Form.Item name="venue_id" label="Venue"><Select {...selectProps} allowClear options={lookups.venues.map((row) => ({ value: row.venue_id, label: row.venue_name }))} /></Form.Item></Col></Row><div className="form-section"><h3>Matchup</h3><p className="muted">Select teams with rosters in this season. Completed games require both scores.</p><Row gutter={16}><Col span={17}>{select('away_team_id', 'Away team', teams.map((row) => ({ ...row, disabled: row.value === homeId })), { disabled: !seasonId })}</Col><Col span={7}><Form.Item name="away_score" label="Away score" rules={status === 'completed' ? required : []}><InputNumber min={0} precision={0} /></Form.Item></Col></Row><Row gutter={16}><Col span={17}>{select('home_team_id', 'Home team', teams.map((row) => ({ ...row, disabled: row.value === awayId })), { disabled: !seasonId })}</Col><Col span={7}><Form.Item name="home_score" label="Home score" rules={status === 'completed' ? required : []}><InputNumber min={0} precision={0} /></Form.Item></Col></Row>{seasonId && teams.length < 2 && <Alert type="warning" message="This season needs at least two team rosters before a game can be added." />}</div></>;
  }
  if (entity === 'performance-statistics') {
    const gameTeamIds = new Set((game?.participants || []).map((row) => row.team_id));
    return <>{select('game_id', 'Game', lookups.games.map((row) => ({ value: row.game_id, label: labels.game(row.game_id) })), { onChange: () => form.setFieldValue('team_id', undefined) })}{select('stat_definition_id', 'Statistic', lookups.stat_definitions.map((row) => ({ value: row.stat_definition_id, label: `${row.stat_name}${row.abbreviation ? ` (${row.abbreviation})` : ''}` })))}<Form.Item name="subject_type" label="Record performance for" rules={required}><Radio.Group options={[{ value: 'athlete', label: 'An athlete' }, { value: 'team', label: 'A team' }]} /></Form.Item>{subjectType === 'athlete' ? select('athlete_id', 'Athlete', athleteOptions) : select('team_id', 'Team', teamOptions.filter((row) => gameTeamIds.has(row.value)), { disabled: !gameId })}<Form.Item name="stat_value" label="Value" rules={required}><InputNumber /></Form.Item><p className="muted">Athletes must have an active membership with a participating team on the game date. Negative values are allowed where meaningful, such as yards lost.</p></>;
  }
  return null;
}
