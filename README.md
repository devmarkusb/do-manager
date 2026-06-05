# do-manager

[![CI](https://github.com/devmarkusb/do-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/devmarkusb/do-manager/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Personal work queue manager — attention state, not task lists.

Shows cross-domain work threads (PRs, builds, Slack, agents, email, tabs) that currently require your attention. Everything in **Waiting** or **Done** stays out of the primary view until it needs you again.

## Architecture

```
packages/core   Pure domain: work item model + state machine
apps/api        Hono REST API + SQLite (Drizzle)
apps/web        Vite + React attention dashboard
```

**State machine:** `created → active ↔ waiting ↔ needs_input → done`

**Attention view:** only `active` and `needs_input`.

## Prerequisites

- Node.js 22+
- pnpm 10+

## Setup

```bash
pnpm install
cp .env.example .env
pnpm --filter @do-manager/api db:migrate
```

## Development

Run API and web together:

```bash
pnpm dev
```

Or separately:

```bash
pnpm dev:api   # http://localhost:3000
pnpm dev:web   # http://localhost:5173 (proxies /api to :3000)
```

## Commands

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Start API + web in parallel                   |
| `pnpm check`        | Format, lint, typecheck, test, and build (CI) |
| `pnpm build`        | Build all packages                            |
| `pnpm test`         | Run all tests                                 |
| `pnpm lint`         | ESLint all packages                           |
| `pnpm typecheck`    | TypeScript check all packages                 |
| `pnpm format`       | Format with Prettier                          |
| `pnpm format:check` | Check formatting (CI)                         |

### API only

```bash
pnpm --filter @do-manager/api start
pnpm --filter @do-manager/api db:migrate
pnpm --filter @do-manager/api db:generate
```

### Web preview (production build)

```bash
pnpm --filter @do-manager/web build
pnpm --filter @do-manager/web preview
```

## API (minimal)

| Method   | Path                        | Description               |
| -------- | --------------------------- | ------------------------- |
| `GET`    | `/health`                   | Health check              |
| `GET`    | `/api/items?view=attention` | Attention items (default) |
| `GET`    | `/api/items?view=all`       | All items                 |
| `POST`   | `/api/items`                | Create work thread        |
| `PATCH`  | `/api/items/:id`            | Update state / metadata   |
| `DELETE` | `/api/items/:id`            | Remove item               |

Example:

```bash
curl -s http://localhost:3000/api/items | jq
curl -s -X POST http://localhost:3000/api/items \
  -H 'content-type: application/json' \
  -d '{"title":"Review PR #123","source":"pr","state":"active"}' | jq
```

## Environment

See [`.env.example`](.env.example).

| Variable       | Default                 | Description        |
| -------------- | ----------------------- | ------------------ |
| `PORT`         | `3000`                  | API port           |
| `DATABASE_URL` | `./data/do-manager.db`  | SQLite path        |
| `CORS_ORIGIN`  | `http://localhost:5173` | Allowed web origin |

## License

[MIT](LICENSE)
