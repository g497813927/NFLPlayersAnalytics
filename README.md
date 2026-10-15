# NFL Players Analytics — prototype

A local, database-backed football analytics prototype for CS5614. All people,
teams, venues, and results in the sample are fictional. The database supports
multiple sports; this first demo focuses on one fictional football league.

## First-time setup

Requirements: Git, [uv](https://docs.astral.sh/uv/), Python 3.12, and Node.js
22.12+ with npm. `uv` can install Python 3.12 if it is not already available.
Use the committed lockfiles to install the same dependencies as your teammates.
This repository is private, so your GitHub account needs repository access to clone it.

Clone the repository, then prepare and start the backend in **terminal 1**:

```sh
git clone https://github.com/g497813927/NFLPlayersAnalytics.git
cd NFLPlayersAnalytics/backend
uv sync --frozen --python 3.12
cp .env.example .env
uv run --frozen python -m scripts.init_db --method orm
uv run --frozen python -m scripts.seed
uv run --frozen uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In **terminal 2**, start from the cloned repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [the prototype](http://127.0.0.1:5173). The homepage reports database
connectivity. [FastAPI's API reference](http://127.0.0.1:8000/docs) is also
available while the backend runs. Vite forwards `/api` requests to port 8000;
both processes must stay running. Stop them with `Ctrl+C` in each terminal.

The shell examples use macOS/Linux syntax. On Windows PowerShell, replace
`cp .env.example .env` with `Copy-Item .env.example .env`; the `uv` and npm
commands are the same.

## Start again or update your checkout

Keep the existing database and `.env`. Do **not** rerun initialization or seeding
for a normal restart. From the repository root, use two terminals:

```sh
# Terminal 1
cd backend
uv run --frozen uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```sh
# Terminal 2
cd frontend
npm run dev
```

After pulling updates, rerun `uv sync --frozen --python 3.12` in `backend` and
`npm ci` in `frontend` if dependencies changed. There is no migration history
yet: model changes do not update an existing database automatically. For a
changed schema, deliberately rebuild only disposable demo data as described
below.

If a sandbox prevents writes to the normal package caches, use
`UV_CACHE_DIR=.cache/uv uv sync --frozen --python 3.12` and
`npm ci --cache .cache/npm` instead.

## What works

- Home with connection status, record counts, and recent results.
- Teams, athletes, games, statistics, and basic standings backed by the API.
- Data Management forms for teams, athletes, rosters, memberships, games and
  their participants, and individual/team performance statistics.
- Search and filters, database-backed relationship selectors, edit forms, and
  delete confirmation.
- Database constraints plus cross-table validation, transactional writes, and
  readable error messages.
- Optional terminal SQL logging and a read-only SQL inspector in the browser.

Game participants are saved as one home/away pair with the game. A completed
game needs two scores. Statistics have exactly one subject: an athlete or a
team. Athlete statistics require a matching roster membership on the game date.
An edit that would invalidate existing statistics is rejected.

The seeded rosters contain selected athletes, not complete professional team
rosters. Standings count completed games and use `(wins + 0.5 * ties) / games`
for ranking. Equal percentages share a rank. They are intentionally labeled
basic demo standings and do not implement official NFL tiebreakers.

## Two database creation methods

Run commands below from `backend`. ORM and SQL initialization are alternative
ways to create the same database, not steps to run in sequence.

```sh
# Create tables using the SQLAlchemy models.
uv run --frozen python -m scripts.init_db --method orm

# OR create tables using the checked-in standalone SQL script.
uv run --frozen python -m scripts.init_db --method sql

# Load the same deterministic fictional data after either method.
uv run --frozen python -m scripts.seed
```

Initialization refuses any existing tables or views; seeding requires empty
tables. `--reset` **deletes the configured SQLite database file**, including
your manual changes. Use it only for disposable local demo data, check
`DATABASE_URL`, and stop the backend first:

```sh
uv run --frozen python -m scripts.init_db --method sql --reset
uv run --frozen python -m scripts.seed
```

The default database is `backend/data/prototype.db`. Relative SQLite paths in
`DATABASE_URL` resolve from the backend directory, regardless of the shell's
working directory. Startup does not automatically create tables or reseed data.

The standalone script is [database/schema.sql](database/schema.sql); the ORM
source is [backend/app/models.py](backend/app/models.py). Regenerate and review
the SQL after changing models, then commit both together:

```sh
uv run --frozen python -m scripts.export_schema
```

After deliberate direct SQL edits, refresh derived standings with
`uv run --frozen python -m scripts.refresh_standings`. The command also checks the
cross-table sports rules before updating anything.

To execute the DDL directly with the optional SQLite CLI, run `mkdir -p data`
from `backend` and create a fresh database file with
`sqlite3 -bail data/prototype.db < ../database/schema.sql`. Then run the seeder
as above. Always enable
`PRAGMA foreign_keys=ON;` when using a separate SQLite connection for manual
writes; that setting is per connection. The application enables it automatically.

## Sample data

The Python seeder uses fixed random seed `5614` and fictional data for
2022–2026. A fresh seed creates:

| Records | Count |
| --- | ---: |
| Sports / leagues | 1 / 1 |
| Teams / athletes | 20 / 100 |
| Seasons / venues / statistic definitions | 5 / 10 / 6 |
| Rosters / memberships | 100 / 500 |
| Games / game participants | 100 / 200 |
| Performance statistics / standings | 1,260 / 100 |
| Demo users / favorites / saved comparisons / import history | 5 / 20 / 20 / 5 |

The latest season includes scheduled games. Demo users are sample rows, not
login accounts. No credentials or real people's personal information are
required. Each teammate generates their own local database.

## SQL inspector

In `backend/.env`, enable either or both flags and restart the backend:

```dotenv
APP_ENV=development
SQL_ECHO=true
SQL_DEBUG_UI=true
```

`SQL_ECHO` prints executed statements and their bound parameters in the backend
terminal. `SQL_DEBUG_UI` enables the browser's SQL inspector, using request IDs
to show the actual statements, separate parameters, and execution times for
recent operations. It keeps up to 100 requests and 100 statements per request
in process memory. Restarting the backend clears the traces.

Both flags default to false. The browser inspector is disabled outside
`APP_ENV=development`. It cannot execute SQL. Raw database error messages and
stack traces are never included in application error responses.

## Project layout

Contributors and coding agents should read [AGENTS.md](AGENTS.md).
[CLAUDE.md](CLAUDE.md) points Claude Code to those same instructions.
[Database notes](docs/DATABASE.md) explain the ER mapping, integrity rules,
standings calculation, and current limitations.

```text
backend/
  app/          models, connection setup, API, validation, standings, SQL tracing
  scripts/      schema export, explicit initialization, deterministic seeding
  data/         ignored local SQLite database
  pyproject.toml / uv.lock
database/
  schema.sql    standalone SQLite schema
frontend/
  src/          React pages and Ant Design forms
docs/
  DATABASE.md   schema rules and current boundaries
```

The repository includes source, schema, example configuration, and dependency
lockfiles. `.env`, SQLite databases, `.venv`, `node_modules`, build output, and
local caches are ignored; do not commit them.

## Troubleshooting

- **Database setup required:** run one initialization method and then the
  seeder in `backend`, then select **Reconnect** in the app.
- **Disconnected:** ensure FastAPI is running on `127.0.0.1:8000`; check
  [the health endpoint](http://127.0.0.1:8000/api/health) and its terminal output.
- **Address already in use:** stop the existing process or use the already
  running server. Changing the backend port also requires updating Vite's proxy
  in `frontend/vite.config.js`.
- **Database is not empty:** normal restarts do not need initialization; only
  use the reset procedure when you intend to discard local changes.

## Current boundaries and next steps

This is an unauthenticated local prototype; there is no login or pretend access
control. Keep the demo bound to loopback. User, favorite, comparison, and import
history tables are included for the future application, but their full feature
flows are deferred.

There is no automated test suite yet. Tests, formal integrity demonstrations,
screenshots, and the coursework evidence report are deferred at the current
request so this phase can focus on the working skeleton. Do not interpret the
prototype as fully tested.

Later phases can add authentication/roles, favorites and comparisons, advanced
analytics, import/export, a migration history, and the deferred test/evidence
work. `DATABASE_URL` and SQLAlchemy isolate the connection configuration, but
changing RDBMS still requires its driver, migrations, and compatibility checks;
the checked-in SQL script targets SQLite.
