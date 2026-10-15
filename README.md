# NFL Players Analytics — prototype

A local, database-backed football analytics prototype for CS5614. All people,
teams, venues, and results in the sample are fictional. The database supports
multiple sports; this first demo focuses on one fictional football league.

The frontend uses React with TypeScript/TSX and Ant Design. The backend uses
Python, FastAPI, and SQLAlchemy with SQLite for the demo.

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
cp .env.example .env
npm run dev
```

Open [the prototype](http://127.0.0.1:5173). The homepage reports database
connectivity. Open **API docs** in the app header for
[Swagger UI at `/docs/api`](http://127.0.0.1:5173/docs/api), which lists the
endpoints, request fields, and interactive **Try it out** controls. It is also
available [directly from FastAPI](http://127.0.0.1:8000/docs/api). The generated
OpenAPI schema remains at `/openapi.json`.

Endpoints are grouped by entity, with separate sections for teams, athletes,
rosters, memberships, games, statistics, and standings. Expand an operation for
its filters, business rules, named request examples, and readable error format.
Use `/api/lookups` to find current IDs. Example descriptions explain prerequisites
such as creating a new team before adding its roster. `PUT` replaces all editable
fields; **Try it out** writes to your local database.

Vite forwards `/api`, `/docs/api`, and `/openapi.json` requests to port 8000;
both processes must stay running. Stop them with `Ctrl+C` in each terminal.

The shell examples use macOS/Linux syntax. On Windows PowerShell, replace
`cp .env.example .env` with `Copy-Item .env.example .env`; the `uv` and npm
commands are the same.

## Configuration with `.env`

Copy each committed example to a local `.env` once. Existing `.env` files should
be edited, not overwritten when pulling updates. Both local files are ignored by
Git; commit new defaults and explanations in `.env.example` instead.

The backend automatically reads `backend/.env` using Pydantic Settings, regardless
of the working directory. Shell environment variables override this file; missing
values use the defaults below. Restart FastAPI after editing it.

| Backend setting | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///data/prototype.db` | SQLAlchemy connection URL. Relative SQLite paths resolve from `backend/`. |
| `APP_ENV` | `development` | Browser SQL inspection is available only with this value. |
| `SQL_ECHO` | `false` | Print emitted SQL and parameters in the backend terminal. |
| `SQL_DEBUG_UI` | `false` | Capture request SQL for the browser inspector when `APP_ENV=development`. |
| `CORS_ORIGINS` | `["http://127.0.0.1:5173","http://localhost:5173"]` | JSON array of frontend origins allowed to call FastAPI directly. |

For example, `backend/.env` can contain:

```dotenv
DATABASE_URL=sqlite:///data/prototype.db
APP_ENV=development
SQL_ECHO=false
SQL_DEBUG_UI=true
CORS_ORIGINS=["http://127.0.0.1:5173","http://localhost:5173"]
```

Vite reads `frontend/.env` for its development proxy. Restart Vite after editing
it. A shell value takes precedence over the file; if absent, the target defaults
to `http://127.0.0.1:8000`.

```dotenv
API_PROXY_TARGET=http://127.0.0.1:8000
```

The target forwards `/api`, `/docs/api`, and `/openapi.json` to FastAPI. It is a
server-side Vite setting, not a `VITE_` variable exposed to browser code. Never
put secrets in `VITE_` variables. This proxy applies to the development server;
a deployed frontend will need equivalent routing on its host.

To use backend port 8001, start Uvicorn with `--port 8001`, set
`API_PROXY_TARGET=http://127.0.0.1:8001`, and restart Vite. To use frontend port
5174, run `npm run dev -- --port 5174` and update `CORS_ORIGINS` if accessing the
backend directly. Changing a database URL selects a different database; it does
not create its tables or migrate data automatically.

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
  app/
    main.py     application assembly
    config.py   backend .env settings
    models.py   public ORM imports and complete metadata
    entities/   one SQLAlchemy entity per file
    routes/     one router per resource; system and development routes
    schemas/    one request/response model per file; entity request examples
    services/   integrity rules, standings, and individual response builders
  scripts/      schema export, explicit initialization, deterministic seeding
  data/         ignored local SQLite database
  pyproject.toml / uv.lock
database/
  schema.sql    standalone SQLite schema
frontend/
  src/          TypeScript pages, individual TSX components, hooks, and types
  .env.example  development API proxy configuration
  tsconfig.json strict TypeScript compiler settings
docs/
  DATABASE.md   schema rules and current boundaries
```

The repository includes source, schema, example configuration, and dependency
lockfiles. `.env`, SQLite databases, `.venv`, `node_modules`, build output, and
local caches are ignored; do not commit them.

Each React component belongs in its own file. Keep nested JSX and long prop lists
on separate, indented lines. Keep hooks, types, and non-UI helpers outside component
files, and group backend modules by entity or responsibility. `models.py` remains
the stable entry point for database scripts. The checked-in `database/schema.sql`
is the submission artifact and is unchanged by this refactor.

From `frontend`, run `npm run typecheck` for TypeScript diagnostics or
`npm run build` for type checking followed by the production bundle. These are
compile/build checks, not the deferred automated test suite.

## Troubleshooting

- **Database setup required:** run one initialization method and then the
  seeder in `backend`, then select **Reconnect** in the app.
- **Disconnected:** ensure FastAPI is running on `127.0.0.1:8000`; check
  [the health endpoint](http://127.0.0.1:8000/api/health) and its terminal output.
- **Address already in use:** stop the existing process or use the already
  running server. Changing the backend port also requires updating
  `API_PROXY_TARGET` in `frontend/.env` and restarting Vite.
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
