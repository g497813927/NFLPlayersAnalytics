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
- `docs/DATABASE.md`: ER mapping, integrity rules, seed data, and known limits.
- `backend/app/models.py`: the 17 SQLAlchemy table mappings and SQL constraints.
- `backend/app/database.py` and `config.py`: engine, sessions, paths, and flags.
- `backend/app/schemas.py`: Pydantic write payloads.
- `backend/app/routes.py`: explicit API endpoints and transaction boundaries.
- `backend/app/services.py`: cross-table validation, response labels, standings.
- `backend/app/errors.py` and `sql_debug.py`: readable failures and SQL traces.
- `backend/scripts/`: schema export, explicit initialization, seed, and refresh.
- `frontend/src/`: React pages, Ant Design forms, API client, and shared state.

## Stack and commands

Use React JavaScript, Ant Design, React Router, and Vite for the frontend.
Use Python 3.12+, FastAPI, Pydantic, and synchronous SQLAlchemy sessions for
the backend. SQLite is the demo database. Preserve `uv.lock` and
`frontend/package-lock.json`; update them only when dependencies change.

From `backend`:

```sh
uv sync --frozen --python 3.12
uv run --frozen python -m scripts.init_db --method orm
uv run --frozen python -m scripts.seed
uv run --frozen uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Initialization and seeding are first-time steps for an empty database, not
normal startup steps. From `frontend`, run `npm ci` once and `npm run dev` to
start the browser app. Vite forwards `/api`, `/docs/api`, and `/openapi.json`
to port 8000. Swagger UI lives at `/docs/api`; the app header links to it with
a native link rather than a React Router route.

For changes that affect runtime code, suitable lightweight checks are
`uv run --frozen python -m compileall -q app scripts` from `backend` and
`npm run build` from `frontend`, plus a relevant startup/manual check. Do not
rerun unrelated checks for documentation-only changes. State exactly what was
checked; builds and syntax checks are not proof of CRUD or integrity coverage.

## Database rules

- Treat `models.py` as the schema source. After schema changes, run
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
- `SQL_ECHO` and `SQL_DEBUG_UI` default to false. Browser SQL inspection is
  development-only, read-only, request-scoped, and bounded in memory. Display
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
