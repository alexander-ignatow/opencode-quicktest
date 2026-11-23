# Architecture

This file records **how** the application is built and **why**. Keep it short and up to date: AI agents read it before every task (it is loaded automatically through `opencode.jsonc`), and so will anyone who reviews your project.

## Provided infrastructure

The starter contains infrastructure only, with no product features.

| Part | Location | Technology |
| --- | --- | --- |
| Frontend | `apps/web` | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | `apps/api` | Node.js, Express 5, TypeScript |
| Unit tests | `apps/*/src/**/*.test.ts(x)` | Vitest, React Testing Library, Supertest |
| End-to-end tests | `e2e/` | Playwright |
| Workspace | root `package.json` | npm workspaces |

### Frontend (`apps/web`)

- `src/main.tsx` renders `src/App.tsx`, the starter page.
- `src/api.ts` contains the functions that call the backend.
- Styling uses Tailwind utility classes (`src/index.css` imports Tailwind).

### Backend (`apps/api`)

- The whole API is in `src/server.ts`. It exports the Express `app` (so tests can use it without a network port) and starts listening only when the file is run directly.
- One endpoint exists: `GET /api/version` → `{ "name": "api", "version": "0.1.0" }`.
- In development Node.js runs the TypeScript file directly (`node --watch`); `npm run build` compiles it to `dist/`.
- In production (`npm start` runs `dist/server.js`) Express also serves the built frontend from `apps/web/dist` (`serveFrontend`). Every non-`/api` GET request gets `index.html`. The port comes from `PORT`, then `API_PORT`, then 3001.

## How the applications communicate

```
Browser ──► Vite dev server (localhost:5173) ──/api/*──► Express (localhost:3001)
```

- The frontend uses relative URLs such as `fetch('/api/version')`.
- In development, the Vite proxy (`apps/web/vite.config.ts`) forwards every `/api/*` request to Express. The browser sees a single origin, so no CORS setup is needed.
- Ports can be changed with the `API_PORT` and `WEB_PORT` environment variables.
- In production there is no Vite: Express serves the frontend and the API from the same origin, so relative `/api` URLs keep working and still no CORS is needed. The whole application deploys as one Node.js web service (build: `npm run build`, start: `npm start`).

## Decisions intentionally left open

These are yours to decide based on your requirements. Choose the simplest option that works, and record the choice below.

- **Data storage** — in memory, a JSON file, browser `localStorage`, or a database.
- **API design** — resources, URLs, request/response shapes, error format.
- **Backend structure** — when and how to split `server.ts` (routers, modules, validation).
- **Frontend structure** — pages, component folders, routing (whether you need a router at all).
- **State management** — React state and props first; add more only if needed.
- **Validation** — hand-written checks or a validation library.
- **Authentication** — only if your requirements really need it.
- **Deployment** — whether and where the application runs outside your computer (one Node.js web service is enough).

## How to document a decision

Add a short entry for every significant decision: new endpoints, data model, storage, dependencies, folder structure. Newest first.

```markdown
### YYYY-MM-DD — Short title

- **Context:** What problem or requirement led to this decision?
- **Decision:** What did you choose?
- **Alternatives:** What else did you consider, and why not?
- **Consequences:** What becomes easier or harder?
```

Also keep the "API endpoints" section up to date.

## API endpoints

| Method | Path | Description | Response |
| --- | --- | --- | --- |
| GET | `/api/version` | API name and version | `200 { name, version }` |

## Decision log

<!-- Add your decisions here, newest first. -->

### 2026-11-23 — Hosting: one free Render web service

- **Context:** The demo app should be public and free. The starter already runs as one service in production (Express serves the built frontend).
- **Decision:** One Render free web service, described in `render.yaml` (Blueprint). It deploys the `master` branch; work happens in `develop` and feature branches; build `npm ci --include=dev && npm run build`, start `npm start`, health check `/api/version`. `DATABASE_URL` is set in the Render dashboard.
- **Alternatives:** Separate frontend (static host) and API hosts — two deploys and CORS for no benefit. Render's free PostgreSQL — expires after 30 days.
- **Consequences:** The free service sleeps after 15 minutes without traffic; the first request then takes about a minute. The disk is temporary, so nothing is stored in files.

### 2026-11-23 — Images are links, not files

- **Context:** Editions need covers and people may have photos. Storing images needs file storage we do not have on free hosting.
- **Decision:** Covers are not stored: the UI builds the cover URL from the ISBN (Open Library Covers API) and shows a placeholder when there is no ISBN or no cover. A person has an optional `photoUrl`.
- **Alternatives:** Uploading images to object storage — postponed (see open questions in requirements).
- **Consequences:** No upload code in the MVP. Editions without ISBN always show the placeholder.

### 2026-11-23 — Authentication: server sessions in a cookie

- **Context:** Only curators may create editions. Readers come later (`docs/features/my-library.md`).
- **Decision:** Email + password login. Passwords are hashed with `scrypt` from `node:crypto` (no dependency). On login the server creates a random session token, stores its hash with the user id and expiry in a `sessions` table, and sends the token in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). Logout deletes the session row.
- **Alternatives:** JWT — logout and revocation get harder, no benefit for one server. An auth service — another account and dependency.
- **Consequences:** Every protected route checks the session and the user's roles. No registration in the MVP: the first curator comes from the seed (`CURATOR_EMAIL`, `CURATOR_PASSWORD`).

### 2026-11-23 — Users have a set of roles

- **Context:** The MVP has one role (`curator`); the planned feature adds `reader`, and one person can be both.
- **Decision:** A `users` table plus a set of roles per user (a `user_roles` table). Data that belongs to a person points to `users.id`; roles only decide what a user may do. No separate profile tables until a role gets its own fields.
- **Alternatives:** A single `role` column — a curator could not be a reader. Separate curator/reader profile tables — no role-specific data yet.
- **Consequences:** Adding `reader` later is a new role value and new permissions, not a change of the users model.

### 2026-11-23 — Seeding from data/seed.json

- **Context:** An empty catalog cannot be demoed or tested. `data/seed.json` holds realistic sample data with relations by name.
- **Decision:** `npm run db:seed` reads `data/seed.json` and creates editions through the same "create edition" logic as the curator form. It is idempotent: existing records are matched by natural keys (person: name; work: title + authors; edition: title + publisher + year — not ISBN, which old editions do not have). It also creates the first curator from `CURATOR_EMAIL` / `CURATOR_PASSWORD`. On the deployed app it is run once by hand against its database.
- **Alternatives:** SQL dump — breaks on every schema change and skips the business logic. Seeding on every server start — slows down starts and hides errors.
- **Consequences:** The seed doubles as the first test of the create-edition logic. Matching by name means real duplicates (two different people with one name) need a decision later.

### 2026-11-23 — Database access: Drizzle ORM

- **Context:** The data model has many-to-many relations (works ↔ editions, credits). We need typed queries and versioned migrations.
- **Decision:** Drizzle ORM with `drizzle-kit`. The schema lives in TypeScript; migrations are generated as SQL files and committed.
- **Alternatives:** Plain `pg` with hand-written SQL — transparent, but we would write our own migration runner. Prisma — separate code generation step and more magic.
- **Consequences:** New dependencies `drizzle-orm`, `drizzle-kit` and a Postgres driver. Schema files must use only erasable TypeScript syntax (Node runs `.ts` directly). Review generated SQL before committing a migration.

### 2026-11-23 — Storage: PostgreSQL on Neon

- **Context:** Works, editions, people and credits are relational data. Data must survive restarts and deploys; hosting must be free.
- **Decision:** PostgreSQL on Neon (free plan). Two database branches: `main` for the deployed app (`master`), `demo` for local development, feature branches and live demos. The connection string comes from `DATABASE_URL`.
- **Alternatives:** In memory / JSON file — lost on restart or redeploy. MongoDB Atlas — documents fit worse for many-to-many relations.
- **Consequences:** `.env` locally (never committed), `.env.example` in the repo. Developing against a cloud database needs internet.
