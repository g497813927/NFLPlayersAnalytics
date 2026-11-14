# Project structure

[Back to README](../README.md)

This map explains where the prototype's code, database artifacts, documentation,
and quality checks live. Start with the folder for the behavior you want to change.

## Repository map

```text
NFLPlayersAnalytics/
├── .github/workflows/quality.yml  # Hosted Node and Python quality checks
├── AGENTS.md                     # Shared instructions for coding agents
├── CLAUDE.md                     # Stand-alone Claude workflow and conventions
├── README.md                     # Short overview and quick start
├── package.json                  # Shared setup, dev, and check commands
├── package-lock.json             # Locked Node tooling dependencies
├── .prettierrc.json               # Readable source-formatting rules
├── .prettierignore                # Generated files and SQL excluded from formatting
├── eslint.config.mjs             # Frontend and Node-script lint rules
├── stylelint.config.mjs          # CSS lint rules
├── scripts/
│   └── setup.mjs                 # Install dependencies and prepare local setup
├── backend/
│   ├── .env.example              # Documented server setting defaults
│   ├── pyproject.toml            # Python dependencies and Ruff configuration
│   ├── uv.lock                   # Locked Python dependencies
│   ├── app/
│   │   ├── main.py               # Assemble FastAPI and middleware
│   │   ├── config.py             # Load settings from environment / .env
│   │   ├── database.py           # Sports engine and database sessions
│   │   ├── models.py             # Public ORM imports and complete metadata
│   │   ├── entities/             # One mapping per table, plus shared base
│   │   ├── schemas/              # Request / response models and examples
│   │   ├── routes/               # Resource endpoints and account operations
│   │   ├── services/             # Integrity rules, labels, reports, standings
│   │   ├── auth/                 # Private engine, passwords, sessions, permissions
│   │   ├── security/             # Optional request guard and rate limits
│   │   ├── errors.py             # Readable error responses
│   │   └── sql_debug.py          # Bounded development SQL capture
│   └── scripts/                  # Explicit database setup and maintenance
├── db/
│   ├── schema.sql                # Preserved 17-table coursework artifact
│   └── auth_schema.sql           # Two additional authentication tables
├── frontend/
│   ├── .env.example              # Development API proxy setting
│   ├── package.json              # Frontend dev, typecheck, and build commands
│   ├── package-lock.json         # Locked frontend dependencies
│   ├── vite.config.ts            # Vite and development proxy configuration
│   └── src/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Application composition
│       ├── api.ts                # Shared HTTP client and CSRF handling
│       ├── layout/               # Navigation, shell, and route registration
│       ├── pages/                # Task-oriented screens
│       ├── components/           # Reusable controls, tables, and messages
│       ├── hooks/                # Shared data-loading hooks
│       └── features/
│           ├── auth/             # Sign-in, signup, password change, user creation
│           ├── favorites/        # Account-owned and guest favorites
│           ├── games/            # Saved games and explicitly simulated replay
│           └── comparisons/      # Team and player comparison views
└── docs/
    ├── SETUP.md                  # Detailed setup, settings, and troubleshooting
    ├── USER_GUIDE.md             # User tasks and feature boundaries
    ├── ACCOUNTS.md               # Account behavior and security boundaries
    ├── DATABASE.md               # Schema mapping and integrity rules
    ├── PROJECT_STRUCTURE.md      # This guide
    └── screenshots/              # Captures linked from README and the user guide
```

The repository keeps project guides and the screenshots they reference.
Coursework reports, submission evidence, and document exports are stored separately.

## How a request reaches the database

1. A page or feature uses `frontend/src/api.ts` to call `/api/...`.
2. Vite forwards development API requests to FastAPI. It also forwards
   `/docs/api` and `/openapi.json` for Swagger.
3. Routers validate payloads and permissions, then use focused service functions
   and SQLAlchemy mappings. Account operations use the private authentication
   engine; sports operations use the sports engine.
4. SQLAlchemy sends bound SQL to SQLite. Transactions commit complete writes or
   roll back, and failures become readable API errors.

The 17 core mappings plus two authentication mappings form one 19-table database.
`models.py` exposes the complete ORM metadata. Keep the submitted core SQL file
unchanged unless a task explicitly authorizes a schema change.

## Setup and maintenance entry points

| Task                                 | Entry point                            | Behavior                                                                                              |
| ------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| First-time setup                     | `npm run setup` → `scripts/setup.mjs`  | Installs locked dependencies, creates missing `.env` files, then calls `backend/scripts/setup_db.py`. |
| Start both services                  | `npm run dev`                          | Runs FastAPI and Vite together; stops both when either exits.                                         |
| Initialize a fresh database          | `backend/scripts/init_db.py`           | Creates tables through ORM or the SQL scripts; normal startup does not initialize tables.             |
| Populate an empty database           | `backend/scripts/seed.py`              | Loads deterministic synthetic sports records.                                                         |
| Upgrade an older compatible database | `backend/scripts/upgrade_auth.py`      | Adds the two authentication tables without resetting sports data.                                     |
| Create an administrator              | `backend/scripts/create_admin.py`      | Prompts locally for credentials; web forms create only fan or analyst users.                          |
| Recompute standings                  | `backend/scripts/refresh_standings.py` | Validates related data and refreshes derived standings.                                               |
| Export authorized schema changes     | `backend/scripts/export_schema.py`     | Exports ORM DDL; `--auth` selects the authentication extension.                                       |

Run Python modules from `backend` with `uv run --frozen python -m scripts.<name>`,
or use `uv run --directory backend --frozen python -m scripts.<name>` from the root.
See [setup instructions](SETUP.md) before running database maintenance commands.

## CI and local quality checks

[Code quality](../.github/workflows/quality.yml) runs for every pull request,
pushes to `main` and `codex/**`, and manual dispatches. Both jobs run on Ubuntu;
older runs for the same branch or PR are canceled when superseded.

| Job                             | Runtime and installation                                                 | Checks                                                                    |
| ------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Node format, lint, and build    | Node 24; `npm ci` in root and `frontend`                                 | `npm run format:check`, `npm run lint`, `npm run build --prefix frontend` |
| Python format, lint, and syntax | Python 3.12 via uv; `uv sync --directory backend --frozen --python 3.12` | Ruff format check, Ruff lint, and `python -m compileall -q app scripts`   |

Run `npm run check` from the root for the combined local equivalent. Formatting
uses Prettier and Ruff; linting uses ESLint, Stylelint, and Ruff. The frontend
build includes strict TypeScript checking. These are quality and compilation
checks; functional behavior is verified separately. No automated functional test
suite is currently included.

The workflow needs no local `.env`, credentials, initialized database, or live
backend. `npm run format` and `npm run format:python` fix formatting; review the
diff before committing. JSX should stay expanded and readable. Do not compact
source or weaken lint rules to pass CI.

## Where to make a change

| Change                                  | Relevant files                                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Add a screen or navigation entry        | `frontend/src/pages/`, `features/`, and `layout/AppRoutes.tsx`                                                                |
| Change an account flow                  | `frontend/src/features/auth/`, `backend/app/routes/auth.py`, `account_password.py`, `admin_users.py`, and `backend/app/auth/` |
| Add or adjust an API field              | Resource files in `backend/app/schemas/` and `routes/`; matching frontend types; Swagger examples                             |
| Adjust integrity or report calculations | `backend/app/services/` and the relevant entity mappings                                                                      |
| Change request-guard behavior           | `backend/app/security/`; preserve parameterized SQL and password exclusions                                                   |
| Change startup or dependencies          | Root/frontend `package.json`, `scripts/setup.mjs`, or `backend/pyproject.toml`; update only affected lockfiles                |
| Update project documentation            | `README.md` and the relevant guide in `docs/`; keep linked screenshots in `docs/screenshots/`                                 |

Local `.env` files, database files, dependency directories, build output, caches,
and machine logs stay outside Git. Defaults belong in the two `.env.example`
files, and credentials are created locally rather than checked in.
