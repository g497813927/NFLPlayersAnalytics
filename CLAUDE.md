# Claude Code project guide

Use these instructions when working in NFL Players Analytics. This file includes
the day-to-day workflow directly. [AGENTS.md](AGENTS.md) is the full shared
reference; the current user's task takes precedence over either file.

## Project and stack

This is a CS5614 database prototype with one fictional football league. It has
sports-data CRUD, account-owned favorites, simulated game visualizations, season
filters, and read-only team/player comparison reports. Keep changes focused and
readable. Production deployment, password recovery, imports/exports, general
schema migrations, and an automated test suite remain deferred unless requested.

- Frontend: React with strict TypeScript/TSX, Ant Design, React Router, and Vite.
- Backend: Python 3.12+, FastAPI, Pydantic, and synchronous SQLAlchemy sessions.
- Database: SQLite for the demo; 17 core tables and two authentication tables.
  Changing to another RDBMS requires driver, migration, and compatibility work.

## Where code lives

```text
.github/workflows/quality.yml  Hosted Node and Python quality checks
scripts/setup.mjs             Root setup command
backend/app/main.py           FastAPI assembly and middleware
backend/app/config.py         Environment settings
backend/app/database.py       Sports engine and sessions
backend/app/models.py         Public imports for complete ORM metadata
backend/app/entities/         One SQLAlchemy table mapping per file
backend/app/schemas/          Pydantic request/response models and examples
backend/app/routes/           Resource routers and transaction boundaries
backend/app/services/         Integrity rules, labels, reports, standings
backend/app/auth/             Private account engine, sessions, permissions
backend/app/security/         Optional request guard and limits
backend/scripts/              Explicit database setup and maintenance
frontend/src/api.ts           Shared API client and CSRF handling
frontend/src/layout/          Navigation, shell, and route registration
frontend/src/pages/           User-task screens
frontend/src/features/        Accounts, favorites, games, comparisons
frontend/src/components/      Reusable controls and messages
frontend/src/hooks/           Shared data hooks
db/                          Core SQL artifact and authentication extension
docs/                        Guides, screenshots, and final coursework report
```

See [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the detailed tree,
change-entry-point table, and CI job breakdown.

## Setup and start

Install Node.js 22.13+ LTS or 24+, npm, and uv. From the repository root:

```sh
npm run setup
npm run dev
```

Setup installs locked dependencies, creates only missing service `.env` files,
and initializes/seeds an empty SQLite database. It preserves existing
configuration and populated data. It rejects partial or incompatible schemas;
the only automatic upgrade adds authentication tables to an intact legacy core
schema. Stop servers before setup because `npm ci` replaces dependencies.

Normal startup is only `npm run dev`. It starts API port 8000 and Web port 5173
in one terminal. `Ctrl+C` or either service exiting stops both. The launcher
must not reset or seed a database, overwrite `.env`, or silently change ports.

Useful individual commands, also from the root:

```sh
# Backend only
uv run --directory backend --frozen uvicorn app.main:app --no-proxy-headers --host 127.0.0.1 --port 8000

# Frontend only
npm --prefix frontend run dev -- --port 5173 --strictPort

# Provision an administrator with hidden interactive input
uv run --directory backend --frozen python -m scripts.create_admin
```

Vite proxies `/api`, `/docs/api`, and `/openapi.json` to the backend. Swagger is
at `/docs/api`; the header uses a native link. Keep entity groups, descriptions,
request examples, and error documentation accurate when APIs change.

## Configuration and secrets

The backend loads `backend/.env`; Vite loads `frontend/.env`. Document defaults
in their `.env.example` files and restart the affected service after changes.
See [SETUP.md](docs/SETUP.md) for the complete settings and port guide.

- `DATABASE_URL`: relative SQLite file paths resolve from `backend`.
- `SQL_ECHO=true`: prints actual sports SQL and bound parameters in the terminal.
  New examples enable it; the application fallback is false when unset.
- `SQL_DEBUG_UI=true`: enables the bounded, read-only browser inspector only
  when `APP_ENV=development` and the caller is an admin. Its default is false.
- `API_PROXY_TARGET`: frontend development proxy target, default port 8000.
- Keep credentials out of source, `.env.example`, `VITE_` variables, and logs.
  Never commit local `.env`, database files, dependencies, caches, or build output.

## Quality checks and CI

Run the combined check from the root before handing off runtime changes:

```sh
npm run check
```

It runs Prettier, ESLint, Stylelint, the strict TypeScript/Vite build, Ruff format
and lint checks, and Python syntax compilation. Use `npm run format` and
`npm run format:python` for formatting fixes, then inspect the diff.

`.github/workflows/quality.yml` runs the Node 24 and Python 3.12 jobs for every
PR, pushes to `main` or `codex/**`, and manual dispatches. It does not need a
running app, `.env`, credentials, or a seeded database. Preserve the root and
frontend `package-lock.json` files and `backend/uv.lock`; update only the locks
whose dependencies change.

There is no automated functional test suite. Do not add or run tests solely as
routine cleanup. Use relevant manual checks for the feature being changed and
state what was verified. Builds and syntax checks do not establish CRUD or
security coverage. Do not disable rules or compact source to make CI pass.

## Database and API rules

- Treat `models.py` and the imported entity mappings as the schema source.
  Preserve `db/schema.sql` byte-for-byte unless the user explicitly authorizes a
  schema change. Authentication DDL is separate in `db/auth_schema.sql`.
- Never reset, delete, or reseed an existing database during ordinary feature
  work. Use an explicitly identified disposable database for destructive demos.
- Enable SQLite foreign keys on every connection. Preserve named constraints,
  matching key types, and explicit delete actions.
- Use SQLAlchemy expressions or bound parameters. Never concatenate user input
  into SQL or expose arbitrary SQL execution through the UI.
- Keep backend cross-table validation as well as database constraints. Writes
  must commit completely or roll back; return readable errors without raw SQL
  exceptions or stack traces.
- List responses use `{items, total, page, page_size}`; errors use
  `{error: {code, message, fields?}}`. Keep meaningful 404/409/422 distinctions.
- Games save one home and one away participant atomically. Completed games need
  both scores. Athlete statistics require qualifying roster membership on the
  game date. A statistic has exactly one athlete or team subject.
- Preserve jersey numbers as nullable strings and calendar dates as dates.
  Normalize game times to UTC. Reuse `recalculate_standings` for derived results.
- Comparisons use completed games, respect each metric's `calc_type`, preserve
  missing values, and use recorded team-subject rows for team metrics. Season
  filters follow the stored season, including dates in the next calendar year.

See [DATABASE.md](docs/DATABASE.md) for relationships and integrity details.

## Account and request security

- Public registration creates a fan. Fan and analyst have normal-user access.
  Only admins can change shared sports data or inspect development SQL.
- Create every administrator with the local `scripts.create_admin` command.
  The admin web form may create only fan or analyst accounts.
- Use Argon2 hashes and expiring, revocable opaque sessions in HttpOnly cookies.
  Store only token hashes. Account queries use the private engine with SQL
  logging and capture disabled; never log passwords, hashes, cookies, or CSRF.
- Require `require_admin` for shared-data writes. Favorite ownership comes from
  `require_user`, not a client-supplied ID. Validate CSRF on authenticated writes
  and JSON/origin requirements on account entry points.
- Password changes require the current password, revoke prior sessions, and
  issue a fresh cookie and CSRF token. Coordinate login with password rotation;
  serialize browser account mutations so logout revokes the final session.
- Keep password fields outside request-guard signature scanning, including
  trailing-slash variants. The guard supplements parameterized SQL; it is not
  a comprehensive production WAF. Keep `--no-proxy-headers` in the local launcher.

## Frontend and code organization

Put each React component in its own file. Keep hooks, API access, types, and pure
helpers separate. Use readable JSX nesting and multiline props; keep strict
TypeScript and avoid blanket `any` or `@ts-nocheck` escapes. Apply the same focus
on the backend: separate entities, payload models, routers, and services.

Use database-backed selectors and readable names instead of asking users to
enter foreign-key IDs. Edit forms load current values; deletes need confirmation
and an explanation of dependencies. Refresh affected data after writes and
handle loading, empty, failed, and unavailable-backend states.

Keep the synthetic-data label visible. Mock game events never write to the
database. Signed-in favorites are account-owned; guest favorites stay local and
must not be silently imported. Protect against stale responses on account
changes and use complete lookup/roster data before filtering or pagination.

## Documentation and Git handoff

Update guides when commands, settings, APIs, or schema rules change. Keep
`AGENTS.md`, this guide, and `PROJECT_STRUCTURE.md` consistent. Final report
files live in `docs/final-report/`; preserve all three authors in document
metadata and leave individual contribution paragraphs blank unless instructed.

Inspect the current branch, remote, PR head/base, and worktree before editing.
Preserve unrelated changes. Use `codex/` for new branches. Commit only intended
files; push only when authorized. Do not force-push to repair ordinary conflicts.
Never merge a PR or stack without the user's authorization for that specific
stack. Read CI and review status from the current head before reporting readiness.
