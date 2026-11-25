# Architecture

This folder records **how** the application is built and **why**. AI agents read `README.md` and `decisions.md` before every task — both are loaded automatically through `opencode.jsonc` — and open the other files when their task touches them.

| File | What it holds |
| --- | --- |
| `README.md` | Overview: parts of the system, how they talk, cross-cutting rules |
| `data-model.md` | Tables, relations and keys |
| `backend.md` | Backend structure, folders, endpoints and API conventions |
| `frontend.md` | Frontend structure, libraries and reuse rules |
| `decisions.md` | Decision log: every choice, newest first |

What the app must do — users, user stories, acceptance criteria, field rules — stays in `docs/requirements.md`. The words of the domain stay in `docs/glossary.md`. This folder only decides how it is built.

## Parts of the system

| Part | Location | Technology |
| --- | --- | --- |
| Frontend | `apps/web` | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, react-hook-form |
| Backend | `apps/api` | Node.js, Express 5, TypeScript, Drizzle ORM, PostgreSQL |
| Database | Neon PostgreSQL | migrations in `apps/api/drizzle/`, seeded from `data/seed.json` |
| Unit tests | `apps/*/src/**/*.test.ts(x)` | Vitest, React Testing Library, Supertest |
| End-to-end tests | `e2e/` | Playwright |
| Workspace | root `package.json` | npm workspaces (`apps/web`, `apps/api`) |

Frontend in [`frontend.md`](frontend.md), backend in [`backend.md`](backend.md), data in [`data-model.md`](data-model.md).

## How the applications communicate

```
Browser ──► Vite dev server (localhost:5173) ──/api/*──► Express (localhost:3001) ──► PostgreSQL
```

- The frontend uses relative URLs such as `fetch('/api/works')`. Vite proxies `/api/*` to Express in development; in production Express serves both, so one origin and no CORS either way.
- Ports: `PORT`, then `API_PORT`, then 3001 for the API; `WEB_PORT` for Vite.
- The whole application deploys as one Render web service (`render.yaml`), with the database on Neon.

## Cross-cutting rules

**Errors.** Every API error is JSON — `{ "error": { "code", "message", "fields?", "details?" } }` — with `400` invalid input, `401` no or expired session, `404` unknown slug or route, `409` duplicate edition, `500` unexpected. `fields` maps a request path (`works[0].authors`) to a message so the form can show it beside the input. No stack trace or SQL ever reaches the client. The exact codes and the endpoint table are in `backend.md`.

**Validation.** The API parses each request with a Zod schema in `apps/api`; forms validate locally with a Zod schema in `apps/web`. Both derive their field rules from `docs/requirements.md` §6 (lengths, ranges, ISBN check digit, at least one work). The server is the authority, the client check only saves a round trip. There is no shared package for now.

**Identity.** Records are identified by a random 12-character `id`; URLs use the `slug`. No natural keys exist, so duplicate names and titles are legal and nothing is matched by name — see `data-model.md` and the log. `data/seed.json` contains no synthetic keys: the seed script creates an `id` and `slug` for every work, edition and person it inserts.

**Configuration.** Environment variables are `DATABASE_URL` (required), `CURATOR_EMAIL` and `CURATOR_PASSWORD` (seed only), `PORT` / `API_PORT` / `WEB_PORT`. Nothing else is configurable; session lifetime and query limits are constants in code. Never hard-code secrets, never commit `.env`, keep `.env.example` in the repo with the names and fake values.

**Types and words.** TypeScript strict mode, no `any`. API shapes are typed locally in each app from the documented endpoint contracts in `backend.md`. Domain terms come from `docs/glossary.md` exactly — in code, UI texts and tests.

**Tests.** Every behaviour gets success, error and edge cases: Supertest with the `db` module mocked, React Testing Library with `fetch` mocked, and one Playwright test per important user flow. E2E runs start from a freshly seeded `demo` database state, not unique fixture titles.

## Rules for reuse

- Extract on the second use, not in advance.
- `components/ui/`, if it exists, stays generic and takes primitives; domain rendering lives in domain components.
- One hook per concern (`useResource`, `useCreateEdition`, `useAuth`) and one API client module per resource. Helpers stay next to their first consumer until a second use justifies a file.
- New files are added when the current one gets hard to read, never "for later".

## Open decisions

Waiting for a choice: none recorded here. Implementation details are decided when a feature is implemented.

Settled, for reference:

- **Seeding without natural keys** — resolved: `data/seed.json` stays as it is, and `db:seed` creates synthetic ids and slugs while inserting. See the decision log.
- **Identifier in URLs** — settled: slugs are the public identifiers in URLs; ids stay internal.

Blocked on documents outside this folder:

- `docs/requirements.md` §6 still describes natural keys (person: name; work: title + authors; edition: title + publisher + year) and a unique person name. It must be updated by the `analyst` to match the identity decision.
- Still open in requirements §7 and not yet needed by the code: cover fallback style, whether `photoUrl` links are checked, whether the edition page shows authors of contained works, and where images would live if links stop being enough.
