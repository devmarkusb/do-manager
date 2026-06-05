# do-manager — TODO

Open work and product questions. Derived from bootstrap **Recommended next steps** and related gaps in `docs/DEVELOPMENT_SPEC.md`.

Status: `[ ]` open · `[~]` in progress · `[x]` done

---

## Product / UX

- [x] **Waiting inbox** — Tab in web UI; lists `waiting` items via `GET /api/items?state=waiting` with resume / needs-input / done actions.
- [x] **Done / history view** — Tab in web UI; lists `done` items via `GET /api/items?state=done` with reopen actions.
- [ ] **Keyboard-first UI** — Quick capture, state transitions, jump to `link` without mouse.
- [ ] **`created` state UX** — Decide if ingest creates `created` then auto-promotes to `active`, or if `created` stays API-only.

---

## Integrations & automation

- [ ] **Webhook / API ingest** — External systems (GitHub, Slack, CI) create or update items via `POST /api/items` / `PATCH`.
- [ ] **Dedup by `(source, link)`** — Upsert semantics so repeated signals do not duplicate rows.
- [ ] **Browser extension** — Detect interesting tabs; create/update items on tab close; item survives after tab is gone.
- [ ] **Auto state promotion** — Rules or events to move `waiting` → `needs_input` when build completes, agent responds, review requested, etc.

---

## Platform & ops

- [x] **`git init`** — Repository initialized on `main`.
- [ ] **Push to remote + CI badge** — Replace `OWNER` in README badge URL; run GitHub Actions on `main`.
- [ ] **Production deploy topology** — How to serve web (static) + API together; `API_BASE` / reverse proxy; no Vite dev proxy in prod.
- [ ] **Environment loading** — Consider `dotenv` or documented process-manager env for local/prod parity.

---

## Security & scope (decisions needed)

- [ ] **Single-user local-only vs hosted** — If networked/multi-user: auth, tenancy, and API hardening required (see spec §14 Q1).
- [ ] **Auth on API** — Not implemented; acceptable only for localhost today.

---

## Engineering / debt

- [ ] **DB enum constraints** — Optional SQLite `CHECK` on `state` / `source` to match core enums.
- [ ] **UI ↔ server transition parity** — Single source for allowed actions (avoid drift with `nextActions()` in web).
- [ ] **Remove or wire dead code** — `isWorkItemState`, `isWorkItemSource`, `countByState` unused in apps.
- [ ] **Web test coverage** — Beyond smoke test for `api.ts` / transition UI.
- [ ] **API route tests** — Direct HTTP tests for validation and 409 transition errors.

---

## Reference

| Doc | Use |
| --- | --- |
| `docs/DEVELOPMENT_SPEC.md` | As-implemented behavior, risks, open questions §14 |
| `AGENTS.md` | Agent/workflow constraints |
| `README.md` | Setup and command reference |

---

_Last updated: bootstrap + spec review._
