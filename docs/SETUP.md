# Setup and configuration

[Back to README](../README.md)

## First-time setup

Requirements: Git, [uv](https://docs.astral.sh/uv/), and Node.js 22.13+ LTS or 24+ with npm.
Setup uses Python 3.12; `uv` can install it if it is not already available.
Use the committed lockfiles to install the same dependencies as your teammates.

Clone the repository, run setup once, then start the app:

```sh
git clone https://github.com/g497813927/NFLPlayersAnalytics.git
cd NFLPlayersAnalytics
npm run setup
npm run dev
```

`npm run setup` installs the locked root/frontend npm dependencies and backend
Python dependencies, creates only missing `backend/.env` and `frontend/.env`
files from their examples, and prepares the configured SQLite database. The
default is `backend/data/prototype.db`; existing `.env` files remain unchanged.

- An empty database receives 17 core tables plus two authentication tables and synthetic sample data.
- A complete, compatible empty application schema receives the sample data.
  If it already contains any rows, setup preserves the data and skips seeding.
- A compatible older 17-table database receives only the two new authentication
  tables. Existing sports records, demo users, and favorites remain unchanged.
- Partial or unrelated schemas stop setup with a readable explanation. Setup
  never resets a database or overwrites existing records. No other automatic
  schema migrations are supported.

Setup supports a plain SQLite file, respects `DATABASE_URL`, and refuses
in-memory SQLite, SQLite URI options, or other RDBMS connectors; configure those
manually if needed. Stop running dev servers before rerunning setup because
`npm ci` replaces their dependency directories. The setup command
can be rerun after pulling updates; it does not start either server.

`npm run dev` runs FastAPI and Vite together in one terminal, with output
labeled **API** and **Web**. It uses backend port 8000 and frontend port 5173;
stop any older instances before starting it. Press `Ctrl+C` once to stop both.
If either process exits or cannot start, the launcher stops the other process
too. It never initializes or reseeds the database or rewrites your `.env` files.

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

Vite forwards `/api`, `/docs/api`, and `/openapi.json` requests to port 8000.

The setup and development commands work in macOS/Linux shells and Windows
PowerShell without manually copying files or activating a virtual environment.

## Configuration with `.env`

Setup copies each committed example to a local `.env` only if that file is
missing. Edit existing `.env` files directly; setup preserves them on subsequent
runs. Both local files are ignored by Git; commit new defaults and explanations
in `.env.example` instead.

The backend automatically reads `backend/.env` using Pydantic Settings, regardless
of the working directory. Shell environment variables override this file.
The table shows the values in the example used by new setups. Missing values
use the same application defaults except `SQL_ECHO`, whose fallback is `false`.
Restart FastAPI after editing the file.

| Backend setting         | New setup value                                     | Purpose                                                                                 |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | `sqlite:///data/prototype.db`                       | SQLAlchemy connection URL. Relative SQLite paths resolve from `backend/`.               |
| `APP_ENV`               | `development`                                       | Browser SQL inspection is available only with this value.                               |
| `SQL_ECHO`              | `true`                                              | Print emitted SQL and parameters in the backend terminal; fallback is `false` if unset. |
| `SQL_DEBUG_UI`          | `false`                                             | Capture request SQL for the browser inspector when `APP_ENV=development`.               |
| `CORS_ORIGINS`          | `["http://127.0.0.1:5173","http://localhost:5173"]` | JSON array of frontend origins allowed to call FastAPI directly.                        |
| `SESSION_HOURS`         | `168`                                               | Fixed session lifetime in hours, from 1 to 720; applies to new sessions.                |
| `SESSION_COOKIE_SECURE` | `false`                                             | Loopback HTTP demo only. Set `true` when serving over HTTPS.                            |

Use the same host consistently (`127.0.0.1` or `localhost`), since cookies belong
to a host. Add custom frontend origins, including port, to `CORS_ORIGINS` for
login and authenticated writes. Keep the production frontend/API on one HTTPS
origin and enable secure cookies before considering a remote deployment.

For example, `backend/.env` can contain:

```dotenv
DATABASE_URL=sqlite:///data/prototype.db
APP_ENV=development
SQL_ECHO=true
SQL_DEBUG_UI=false
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

The root launcher uses ports 8000 and 5173. For custom ports, use the separate
service commands below. To use backend port 8001, start Uvicorn with
`--port 8001`, set `API_PROXY_TARGET=http://127.0.0.1:8001`, and restart Vite.
To use frontend port 5174, run `npm run dev -- --port 5174 --strictPort` from
`frontend` and add its origin to `CORS_ORIGINS` for authenticated writes. Changing
a database URL selects a different database; it does not create its tables or
migrate data automatically.

## Start again or update your checkout

Keep the existing database and `.env`. Do **not** rerun initialization or seeding
for a normal restart. From the repository root, start both services:

```sh
npm run dev
```

Press `Ctrl+C` to stop both services before restarting them, including after
configuration changes. If you prefer separate terminals or need custom ports,
run the services individually instead, starting each terminal at the repository
root:

```sh
# Terminal 1
cd backend
uv run --frozen uvicorn app.main:app --no-proxy-headers --host 127.0.0.1 --port 8000
```

```sh
# Terminal 2
cd frontend
npm run dev -- --port 5173 --strictPort
```

The root aliases `npm run dev:api` and `npm run dev:web` also start just one
service at its default port.

After pulling updates, stop both services and run `npm run setup` to refresh
dependencies while preserving existing environment files and populated data.
Alternatively, run `uv sync --frozen --python 3.12` in `backend` and `npm ci`
in the root or `frontend` when their respective dependencies changed. The root
lockfile covers the shared launcher; the frontend lockfile covers the browser
app. This update adds only the two authentication tables to a compatible
existing schema. There is no general migration history yet; other schema
changes still need a deliberate migration or a disposable database rebuild.

If a sandbox prevents writes to the normal package caches, use
`UV_CACHE_DIR=.cache/uv uv sync --frozen --python 3.12` and
`npm ci --cache .cache/npm` instead. For the shared launcher, use
`UV_CACHE_DIR=.cache/uv npm run dev` from the repository root.

## Two database creation methods

`npm run setup` uses the ORM creation path when the database is empty. For
manual initialization, run the commands below from `backend` after dependencies
and `.env` are ready. ORM and SQL initialization are alternative ways to create
the same database, not steps to run in sequence.

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

The standalone script is [db/schema.sql](../db/schema.sql); the ORM
source is [backend/app/models.py](../backend/app/models.py). The original
`db/schema.sql` is preserved byte-for-byte for submission. Authentication lives
in the separate [db/auth_schema.sql](../db/auth_schema.sql) extension. Both the
ORM initializer and `--method sql` create all 19 tables. Export the extension with:

```sh
uv run --frozen python -m scripts.export_schema --auth
```

After deliberate direct SQL edits, refresh derived standings with
`uv run --frozen python -m scripts.refresh_standings`. The command also checks the
cross-table sports rules before updating anything.

To execute the DDL directly with the optional SQLite CLI, run `mkdir -p data`
from `backend` and create a fresh database file with
`sqlite3 -bail data/prototype.db < ../db/schema.sql`, followed by
`sqlite3 -bail data/prototype.db < ../db/auth_schema.sql`. Then run the seeder
as above. Do not reapply these creation scripts to an existing database. Always enable
`PRAGMA foreign_keys=ON;` when using a separate SQLite connection for manual
writes; that setting is per connection. The application enables it automatically.

## Sample data

The Python seeder uses fixed random seed `5614` and fictional data for
2022–2026. A fresh seed creates:

| Records                                                     |           Count |
| ----------------------------------------------------------- | --------------: |
| Sports / leagues                                            |           1 / 1 |
| Teams / athletes                                            |        20 / 100 |
| Seasons / venues / statistic definitions                    |      5 / 10 / 6 |
| Rosters / memberships                                       |       100 / 500 |
| Games / game participants                                   |       100 / 200 |
| Performance statistics / standings                          |     1,260 / 100 |
| Demo users / favorites / saved comparisons / import history | 5 / 20 / 20 / 5 |

The latest season includes scheduled games. Demo users are sample rows, not
login accounts. No credentials or real people's personal information are
required. Each teammate generates their own local database.

## SQL inspector

New setups enable terminal SQL logging through `SQL_ECHO=true` in
`backend/.env`. Browse pages or submit forms to see the actual SQLAlchemy
statements and separate bound parameters under **API** in the `npm run dev`
terminal. Startup and read requests can also produce SQL output.

Existing `.env` files are preserved by setup. If SQL is not appearing, set
`SQL_ECHO=true` in `backend/.env`, check for an overriding shell variable, and
restart with `npm run dev`. Set it to `false` to turn terminal SQL logging off.

The browser inspector is controlled separately. To enable it as well, use:

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

`SQL_DEBUG_UI` defaults to false. The application fallback for `SQL_ECHO` is
also false when it is absent from both the environment and `.env`; the example
template explicitly enables it for new demo setups. The browser inspector is
disabled outside `APP_ENV=development` and cannot execute SQL. Raw database
error messages and stack traces are never included in application error responses.

## Formatting, linting, and CI

After `npm run setup`, run the complete local quality check from the root:

```sh
npm run check
```

This runs the same checks as `.github/workflows/quality.yml`:

| Runtime                    | Checks                                                         | Local commands                                       |
| -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| Node / frontend / launcher | Prettier, ESLint (including React hooks), Stylelint            | `npm run format:check`, `npm run lint`               |
| React TypeScript           | Strict type checking and Vite production build                 | `npm run build --prefix frontend`                    |
| Python API / scripts       | Ruff formatting, lint/import checks, Python syntax compilation | `npm run format:python:check`, `npm run lint:python` |

To fix formatting, run `npm run format` for TSX/TS/JS/CSS/JSON/Markdown/YAML and
`npm run format:python` for Python. Review the diff before committing. Prettier
uses one JSX attribute per line on multiline tags and expands CSS declarations;
Ruff formats Python consistently at 100 columns. Keep each React component in
its own file and avoid packing several nested JSX elements onto one line.
These are source formatting checks; Vite still minifies the production bundle.

ESLint covers frontend files and the Node setup launcher/configuration files.
Its syntax parser uses the root TypeScript 6 dependency supported by
`typescript-eslint`; the frontend retains its own TypeScript 7 compiler for
strict checking. The scoped `minimatch` overrides supply the patched glob
matcher for ESLint and its TypeScript parser. Ruff is a locked backend development dependency.

CI runs both jobs for pull requests (including stacked PRs), pushes to `main`
and `codex/**` branches, and manual dispatches, using Node 24 and Python 3.12. It needs no `.env`, database,
credentials, or external sports feed. It does not initialize or seed a database.
Formatting, linting, compilation, and builds do not replace the deferred
functional/integrity test suite or manual browser checks.

## Troubleshooting

- **Database setup required:** stop the servers, run `npm run setup`, and
  restart with `npm run dev`.
- **Setup rejects the database:** check `DATABASE_URL` and the reported schema
  mismatch. Use a new SQLite file for a fresh demo or follow the explicit reset
  procedure only when the existing data is disposable.
- **No SQL in the terminal:** set `SQL_ECHO=true` in `backend/.env`, check any
  overriding shell value, restart the servers, then browse or edit records.
- **Disconnected:** ensure FastAPI is running on `127.0.0.1:8000`; check
  [the health endpoint](http://127.0.0.1:8000/api/health) and its terminal output.
- **Address already in use:** stop the existing process or use the already
  running server. The root launcher stops both services when either cannot
  start; it does not silently move Vite to another port. Changing the backend
  port with the separate service commands also requires updating
  `API_PROXY_TARGET` in `frontend/.env` and restarting Vite.
- **Database is not empty:** normal restarts do not need initialization; only
  use the reset procedure when you intend to discard local changes.
