# Claude Code — do-manager

Read **`AGENTS.md`** first. It is the canonical instruction set for this repository.

## Claude-specific notes

- Prefer editing source over regenerating migrations; use `pnpm --filter @do-manager/api db:generate` after `schema.ts` changes, then review SQL.
- For domain/state work, read `packages/core/src/state-machine.ts` and `docs/DEVELOPMENT_SPEC.md` §3–§4 before changing API or UI transitions.
- This repo has **no auth** and **no MCP config** by design; do not add `.mcp.json` or credential files unless explicitly requested.
- Do not create git commits unless the user asks.

## Quick commands

Same as `AGENTS.md`:

```bash
pnpm install && pnpm dev
pnpm test && pnpm typecheck && pnpm lint && pnpm format:check
```
