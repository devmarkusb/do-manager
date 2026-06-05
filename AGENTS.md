# AGENTS.md — do-manager

Canonical agent instructions for this repository. Tool-specific files (`CLAUDE.md`, `.cursor/rules/`) are thin adapters only.

## Project overview

**do-manager** is a local-first personal **attention work queue** (not a task manager). It tracks cross-domain work threads (PRs, builds, Slack, agents, etc.) and surfaces items in **`active`** or **`needs_input`** in the primary UI.

**Stack:** pnpm monorepo · TypeScript · Node ≥22 · `@do-manager/core` (domain) · Hono API · Drizzle + SQLite (`@libsql/client`) · Vite + React web.

**Maturity:** early bootstrap. No auth, external integrations, or production deploy config yet. See `docs/DEVELOPMENT_SPEC.md` for as-implemented behavior.

**Dependency direction:** `packages/core` ← `apps/api`, `apps/web`. Web talks to API via HTTP only.

## Build commands

From repository root (requires pnpm 10+, Node 22+):

```bash
pnpm install
pnpm build                    # all workspaces
pnpm dev                      # API :3000 + web :5173 in parallel
pnpm dev:api                  # API only
pnpm dev:web                  # web only (proxies /api to :3000)
```

Per-package (when scoped work is enough):

```bash
pnpm --filter @do-manager/core build
pnpm --filter @do-manager/api build
pnpm --filter @do-manager/api start    # runs dist/index.js
pnpm --filter @do-manager/web build
pnpm --filter @do-manager/web preview
```

Database (API):

```bash
cp .env.example .env          # first-time local setup
pnpm --filter @do-manager/api db:migrate
pnpm --filter @do-manager/api db:generate   # after schema.ts changes only
```

## Test commands

```bash
pnpm test                     # all workspaces (Vitest)
pnpm --filter @do-manager/core test
pnpm --filter @do-manager/api test
pnpm --filter @do-manager/web test
```

CI (`.github/workflows/ci.yml`) also runs: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm audit --prod --audit-level=high`.

## Formatting and linting

```bash
pnpm format                   # Prettier write
pnpm format:check             # Prettier check (CI)
pnpm lint                     # ESLint all packages (eslint.config.js at root)
pnpm typecheck                # tsc --noEmit all packages
```

**Prettier:** `.prettierrc` (single quotes, trailing commas, printWidth 100).  
**ESLint:** flat config in `eslint.config.js`; unused vars allowed with `_` prefix.

No pre-commit hooks are configured.

## Architecture and important directories

```
packages/core/src/     Domain types, ATTENTION_STATES, state machine (pure TS)
apps/api/src/          Hono routes, Zod schemas, WorkItemRepository, db client
apps/api/drizzle/      SQL migrations (generated/hand-applied — see restrictions)
apps/web/src/          React attention dashboard
docs/                  Engineering specs (DEVELOPMENT_SPEC.md)
.github/workflows/     CI only
```

**Domain rules (do not bypass in API/UI):**

- States: `created`, `active`, `waiting`, `needs_input`, `done`
- Attention view: `active`, `needs_input` only (`ATTENTION_STATES` in core)
- Transitions: `packages/core/src/state-machine.ts`; API enforces via `canTransition(..., allowReopen=true)`
- Default create state: `active` (web always sends this)

**API surface:** `GET/POST/PATCH/DELETE /api/items`, `GET /health`. List default: `?view=attention`.

## Coding conventions

- **ESM only** (`"type": "module"`); use `.js` extensions in TS imports between local files.
- **Minimal scope:** match existing patterns; avoid premature abstractions or new dependencies without reason.
- **Domain changes start in `packages/core`**, then propagate to API repository/schemas and web UI transition buttons.
- **API validation:** Zod in `apps/api/src/routes/schemas.ts`; reuse `WORK_ITEM_STATES` / `WORK_ITEM_SOURCES` from core.
- **Persistence:** Drizzle schema in `apps/api/src/db/schema.ts`; repository in `apps/api/src/repository/work-items.ts`.
- **Timestamps:** ISO strings; updates touch `lastTouched` unless PATCH includes `touch: false`.
- **Comments:** only for non-obvious business logic; prefer self-explanatory code.
- **Do not** add large boilerplate, fake integrations, or enterprise patterns this project does not use.

## Testing expectations

- **Core:** unit tests for state machine (`packages/core/src/state-machine.test.ts`).
- **API:** repository integration tests against temp SQLite under `apps/api/data/test/` (gitignored via `data/`).
- **Web:** minimal smoke tests today; add tests when changing `apps/web/src/api.ts` or non-trivial UI logic.
- Run `pnpm test` (and `pnpm typecheck` / `pnpm lint` when touching types or exports) before finishing substantive changes.
- Prefer testing observable behavior over implementation details.

## Files and directories agents must not edit without explicit approval

| Path                                     | Reason                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `.env`, `.env.*` (except `.env.example`) | Secrets / local config                                                               |
| `data/`, `*.db*`                         | Local runtime database                                                               |
| `pnpm-lock.yaml`                         | Lockfile — only when intentionally changing dependencies                             |
| `node_modules/`, `dist/`, `coverage/`    | Generated / installed output                                                         |
| `apps/api/drizzle/**`                    | Applied migrations — prefer `db:generate` + review; do not hand-edit applied history |
| `.github/workflows/ci.yml`               | CI/release gates                                                                     |
| `docs/DEVELOPMENT_SPEC.md`               | Reverse-engineered spec — update deliberately when behavior changes                  |

**Caution (ask first unless task requires it):** schema changes (`apps/api/src/db/schema.ts`), new env vars, auth/deployment work.

## Security and privacy constraints

- **No authentication** on the API today; treat as localhost / single-user only.
- **Never commit** credentials, tokens, or personal DB files.
- **Do not** weaken CORS, validation, or state-transition checks without explicit request.
- **Do not** add MCP servers, shell hooks, or broad tool permissions to repo config by default.
- SQLite path defaults to `./data/do-manager.db` (`DATABASE_URL`).

## Git and remote operations

**Never push without explicit user approval.** This includes:

- `git push` (any remote or branch)
- `git push --force`, `--force-with-lease`, or history rewrites followed by push
- `gh repo create ... --push`, `gh pr merge`, or any command that publishes commits

Local git is fine when the task requires it (`git status`, `git diff`, local commits **only when the user asks**). After local commits, stop and let the user review; do not push unless they clearly approve.

If the user asks to push, confirm branch/remote when ambiguous, then push once — do not combine with unrelated changes.

## Review checklist before final response

1. Domain/state changes reflected in **core → API → web** (if applicable).
2. `pnpm test` and `pnpm typecheck` pass (run when feasible).
3. `pnpm lint` / `pnpm format:check` pass for edited TS/MD/config.
4. No secrets, lockfile churn, or migration edits unless task-required.
5. Diff stays focused; no unrelated refactors or speculative features.
6. README or `docs/` updated only when user-facing commands or behavior changed.
7. Git commits created **only when the user asks**.
8. **No `git push` or remote publish** unless the user explicitly approved it in the current task.

## Maintenance policy (for humans and agents)

| Layer                       | Belongs here                                                  |
| --------------------------- | ------------------------------------------------------------- |
| **Global user config**      | Personal preferences, MCP tokens, IDE themes                  |
| **This file (`AGENTS.md`)** | Repo-wide commands, architecture, safety rules                |
| **`.cursor/rules/*.mdc`**   | Cursor scoping/metadata only — not a second copy of this file |
| **`CLAUDE.md`**             | Claude entry point + Claude-only notes                        |
| **Session prompt**          | Task-specific intent for the current change                   |

Re-run AI repo setup when tooling or tree changes materially; merge updates — do not blindly replace bespoke sections.
