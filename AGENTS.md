# Repository guidance

This file is the shared source of project instructions for coding agents,
including Codex and Claude Code. It applies to the whole repository. Follow
the current user's task and any more specific instructions in a subdirectory.

## Purpose and current phase

NFL Players Analytics is a CS5614 database prototype. It demonstrates a
relational sports schema, a working API, and simple browser-based CRUD. The
sample is one fictional football league; the schema supports multiple sports.

Keep changes small and readable. The current priority is the prototype and
skeleton, not production infrastructure or additional features. Authentication,
role enforcement, working favorites/comparisons, real imports/exports, advanced
analytics, migrations, automated tests, and the formal coursework evidence
package are deferred unless the current task explicitly requests them.

There is no automated test suite yet. Do not add or run automated tests solely
as routine cleanup during this phase. Teammates can explore the app manually;
when a task explicitly asks for tests, implement the relevant tests then.

## Start with the relevant source

- `README.md`: fresh-clone setup, startup commands, debugging, and troubleshooting.
- `scripts/setup.mjs`: dependency installation and missing local environment files.
- `docs/DATABASE.md`: ER mapping, integrity rules, seed data, and known limits.
- `backend/app/models.py`: public imports and complete ORM metadata.
- `backend/app/entities/`: the 17 SQLAlchemy table mappings, one entity per file.
- `backend/app/database.py` and `config.py`: engine, sessions, paths, and flags.
- `backend/app/schemas/`: Pydantic payloads and examples, one model per file.
- `backend/app/routes/`: resource routers and shared transaction boundaries.
- `backend/app/services/`: cross-table validation, response labels, standings.
- `backend/app/errors.py` and `sql_debug.py`: readable failures and SQL traces.
- `backend/scripts/`: schema export, explicit initialization, seed, and refresh.
- `frontend/src/`: React pages, Ant Design forms, API client, and shared state.

## Stack and commands

Use React TypeScript/TSX, Ant Design, React Router, and Vite for the frontend.
Use Python 3.12+, FastAPI, Pydantic, and synchronous SQLAlchemy sessions for
the backend. SQLite is the demo database. Preserve `backend/uv.lock`, the root
`package-lock.json`, and `frontend/package-lock.json`; update the relevant
lockfile only when its dependencies change.

With Node.js 22.12+, npm, and `uv` installed, run from the repository root:

```sh
npm run setup
npm run dev
```

Setup runs `npm ci` in the root and `frontend`, syncs locked Python dependencies
with Python 3.12 through `uv`, and copies only missing service `.env` files.
It initializes/seeds an empty SQLite file, seeds a complete compatible empty
application schema, and skips populated application data. It rejects partial or
unrelated schemas, in-memory SQLite, SQLite URI options, and other RDBMS
connectors. It respects the configured `DATABASE_URL`; preserve existing
environment files and data, with no automatic reset or migration.
Stop running servers before setup because `npm ci`
replaces dependency directories. `uv` can install the required Python version.

Initialization and seeding are setup operations for an empty database, not
normal startup steps. Once set up, run only `npm run dev` from the repository root
to start FastAPI on port 8000 and Vite on port 5173 in one terminal. Output is
labeled API/Web; `Ctrl+C` or either service exiting stops both. Stop older
instances first. The launcher must not reset/seed databases or overwrite `.env`
files, and Vite must fail when its port is occupied rather than select another.

For individual services or custom ports, run
`uv run --frozen uvicorn app.main:app --host 127.0.0.1 --port 8000` from
`backend` and `npm run dev -- --port 5173 --strictPort` from `frontend` in
separate terminals. Vite forwards `/api`, `/docs/api`, and `/openapi.json`
to port 8000. Swagger UI lives at `/docs/api`; the app header links to it with
a native link rather than a React Router route. Keep entity tags, endpoint
descriptions, request examples, and error documentation accurate when routes change.

Settings belong in environment files, with documented defaults in `.env.example`.
The backend loads `backend/.env`; Vite loads `frontend/.env` for `API_PROXY_TARGET`.
Keep local `.env` files ignored and never expose secrets through `VITE_` variables.
Document setting changes in README and restart the affected server.

For changes that affect runtime code, suitable lightweight checks are
`uv run --frozen python -m compileall -q app scripts` from `backend` and
`npm run build` from `frontend` (strict type checking plus Vite), plus a relevant
startup/manual check. `npm run typecheck` performs type checking alone. Do not
rerun unrelated checks for documentation-only changes. State exactly what was
checked; builds and syntax checks are not proof of CRUD or integrity coverage.

## Database rules

- Treat `models.py` and its imported entity definitions as the schema source.
  `database/schema.sql` is a coursework submission artifact: preserve it
  byte-for-byte during refactors and documentation work. Only change it when the
  current task explicitly authorizes a schema change. For authorized schema changes, run
  `uv run --frozen python -m scripts.export_schema` from `backend` and include
  `database/schema.sql` in the same change. The SQL file is a standalone SQLite
  creation path; the ORM path must describe the same tables and constraints.
- Enable SQLite foreign keys on every connection, including manual SQL sessions.
  Preserve named constraints, matching key types, and explicit `ON DELETE`
  actions. Do not weaken constraints to make invalid writes succeed.
- Keep SQL parameterized through SQLAlchemy expressions or bound parameters.
  Never concatenate user input into SQL or permit arbitrary SQL from the UI.
- Retain database constraints and backend cross-table validation. Client-side
  validation alone is insufficient. Writes must either commit fully or roll
  back; return readable application errors, never raw database exceptions.
- A game has one home and one away team, saved atomically with the game.
  Completed games need both scores. Each team needs a roster for the season.
- A performance statistic has exactly one subject: athlete or team. An athlete
  must have a qualifying membership on a participating team on the game date.
  Negative statistic values can be meaningful; scores cannot be negative.
- Preserve jersey numbers as nullable strings, including values such as `00`.
  Treat date-only fields as calendar dates. Store game times as naive UTC,
  normalize incoming offsets, and return timezone-aware UTC timestamps.
- Reuse `recalculate_standings` for derived standings. Points are
  `wins + 0.5 * ties`; win percentage divides by games played, or is zero.
  Equal percentages share dense ranks. These are basic demo rules, not official
  NFL tiebreakers.
- Seed only deterministic synthetic records. Do not introduce real people's
  data, API credentials, scraping, or external data dependencies for the demo.
- Never silently reset, delete, or reseed an existing database. A reset requires
  an explicit task requesting it; stop the backend first and confirm the target
  is the intended disposable database. Ordinary feature work preserves data.
- `DATABASE_URL` is configurable, and relative SQLite paths resolve from
  `backend`. Do not hard-code developer-specific filesystem paths. Changing
  RDBMS later still needs driver, migration, and compatibility work.

## API and frontend conventions

- Put each React component in a separate file. Use small page sections, form
  components, and layout components instead of a large switch or page bundle.
  Separate hooks, types, API access, and pure helpers from component files.
- Format JSX with clear nesting and indentation; put nested tags and long prop
  lists on separate lines. Do not compress multiple components onto one line.
- Apply the same separation on the backend: one entity and request model per
  file, resource-specific routers, and focused service modules. Keep `main.py`
  for assembly and `models.py` as a stable public import for database scripts.
- Keep strict TypeScript enabled. Model API payloads and props explicitly;
  do not bypass checking with blanket `any` types or `@ts-nocheck`.
- Keep explicit resource routes and Pydantic request models. Lists return
  `{items, total, page, page_size}`. Errors return
  `{error: {code, message, fields?}}`; preserve useful 404/409/422 distinctions.
- Use the shared frontend API client and database-backed selectors for foreign
  keys. Display labels instead of requiring users to enter numeric IDs.
- Edit forms load current values. Confirm deletes and explain cascades.
  Refresh affected data after successful writes; preserve useful errors after
  rejected writes. Handle empty, loading, and unavailable-backend states.
- Keep the synthetic-data label and the local prototype boundary visible. Do
  not introduce a login screen or claim that the stored user role enforces
  authorization.
- The backend `.env.example` sets `SQL_ECHO=true` for new demo setups so actual
  SQL and parameters appear in the API terminal. Setup preserves existing `.env`
  values; change that flag explicitly and restart when requested. The Settings
  fallback remains false if the flag is unset. `SQL_DEBUG_UI` defaults to false
  independently. Browser SQL inspection is development-only, read-only,
  request-scoped, and bounded in memory. Display
  actual emitted SQL and separate bound parameters, not reconstructed SQL or
  raw exception messages. Keep the disabled endpoint unavailable.

## Handoff and Git hygiene

Update documentation when setup commands, schema rules, flags, or API contracts
change. Keep agent instructions here; `CLAUDE.md` should remain a short pointer.

Never commit local databases, `.env` files, credentials, dependency directories,
caches, build output, or machine-specific logs. Commit the example environment
file, reproducible source/scripts, and dependency lockfiles instead. Review the
staged diff and preserve unrelated changes. Use `codex/` for new agent-created
branches unless a task specifies otherwise. Push only when the task authorizes
it, without overwriting remote work or force-pushing as routine conflict repair.
