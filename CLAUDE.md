# Claude Code instructions

Before working in this repository, read and follow [AGENTS.md](./AGENTS.md).
It is the authoritative shared project guidance for Claude Code and other
coding agents, including the current prototype scope and deferred testing work.

Do not assume Claude Code automatically loads `AGENTS.md`; open it explicitly.
Also read any applicable subdirectory `AGENTS.md` when working in that area.

```text
.github/workflows/  Node/Python CI
scripts/           Shared setup
backend/           FastAPI, SQLAlchemy, accounts, and database scripts
frontend/          React TypeScript interface
db/                SQL submission artifacts
docs/              Guides, screenshots, and final report
```

Use [README.md](./README.md) for quick start,
[PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) for the detailed map and CI,
and [DATABASE.md](./docs/DATABASE.md) for database rules. Keep shared behavior
instructions in `AGENTS.md`; this file is the Claude entry point.
