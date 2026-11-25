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

### Frontend (starter state)

- `src/main.tsx` renders `src/App.tsx`, the starter page.
- `src/api.ts` contains the functions that call the backend.
- Styling uses Tailwind utility classes (`src/index.css` imports Tailwind).

### Backend (starter state)

- The whole API is in `src/server.ts`. It exports the Express `app` (so tests can use it without a network port) and starts listening only when the file is run directly.
- One endpoint exists: `GET /api/version` → `{ "name": "api", "version": "0.1.0" }`.
- In development Node.js runs the TypeScript file directly (`node --watch`); `npm run build` compiles it to `dist/`.
- In production (`npm start` runs `dist/server.js`) Express also serves the built frontend from `apps/web/dist` (`serveFrontend`). Every non-`/api` GET request gets `index.html`. The port comes from `PORT`, then `API_PORT`, then 3001.

## Target MVP structure

The MVP keeps the starter's constraints (`export const app`, `serveFrontend`, `import.meta.main`) and adds one layer per concern. Do not add folders "for later"; create a module only when a story needs it.

```
apps/api/src/
  server.ts          entry point: re-exports app, serveFrontend, import.meta.main
  app.ts             Express app, JSON middleware, routes, error handler
  routes/            version, auth, works, editions, people, lookups
  db/                Drizzle schema, client, queries
  validation/        hand-written request validators
apps/web/src/
  main.tsx           React root
  App.tsx            router, header, auth provider
  pages/             CatalogPage, WorkPage, EditionPage, PersonPage,
                     LoginPage, CreateEditionPage, NotFoundPage
  components/        Header, Cover, WorkPicker, PersonPicker, FieldError, ...
  api.ts             typed fetch functions
  auth.tsx           AuthProvider and useAuth
```

- **Backend structure:** one router module per resource, mounted under `/api`. `server.ts` stays the entry point and re-exports the app for tests. The error handler is the only place that turns exceptions into JSON.
- **Frontend structure:** one page component per route, shared components for the header, covers, pickers and field errors.
- **State:** React state and props; `AuthProvider` is the only context. No state or data-fetching library.
- **Routing:** `react-router-dom` because the app has seven routes and deep links; a hand-written router is more code and more edge cases. The dependency is small and standard.
- **Data fetching:** plain `fetch` in `api.ts` with `credentials: 'include'`; pages call it in `useEffect` and handle loading, error and empty states.
- **Validation:** hand-written validators in `apps/api/src/validation`; no validation library. The field messages in `docs/requirements.md` are the contract.

## How the applications communicate

```
Browser ──► Vite dev server (localhost:5173) ──/api/*──► Express (localhost:3001)
```

- The frontend uses relative URLs such as `fetch('/api/works')`.
- In development, the Vite proxy (`apps/web/vite.config.ts`) forwards every `/api/*` request to Express. The browser sees a single origin, so no CORS setup is needed.
- Ports can be changed with the `API_PORT` and `WEB_PORT` environment variables.
- In production there is no Vite: Express serves the frontend and the API from the same origin, so relative `/api` URLs keep working and still no CORS is needed. The whole application deploys as one Node.js web service (build: `npm run build`, start: `npm start`).
- The session cookie is sent automatically because frontend and API share an origin; `credentials: 'include'` makes that explicit.

## Frontend routes

| Path | Page | Access |
| --- | --- | --- |
| `/` | Works catalog | Public |
| `/works/:id` | Work | Public |
| `/editions/:id` | Edition | Public |
| `/people/:id` | Person | Public |
| `/login` | Login; optional `?returnTo=/editions/new` | Public; a logged-in curator is sent to `/` |
| `/editions/new` | Add an edition | Curator; a guest is sent to `/login?returnTo=/editions/new` |
| any other path | Not found | Public |

## API design

- All routes start with `/api` and return JSON.
- Resource ids are server-generated UUIDs. A malformed or unknown id is `404`.
- Lists are returned already sorted (see the ordering decision below); the UI does not re-sort.
- Requests and responses use camelCase. The database uses snake_case; the query layer maps between them.
- The API never returns `passwordHash` or session token hashes.

### Error format

Every error has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "fields": { "title": "Title is required." }
  }
}
```

`fields` is present only for `400` responses and maps a field path (`title`, `contents.0.workId`, `credits.1.role`) to the exact message from `docs/requirements.md`. Codes:

| Status | Code | When |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Invalid or missing input, unknown reference id, duplicate work in Contents, duplicate person + role |
| `401` | `UNAUTHENTICATED` | No session, or the session expired |
| `403` | `FORBIDDEN` | Logged in but missing a required role |
| `404` | `NOT_FOUND` | Unknown or malformed resource id |
| `500` | `INTERNAL` | Unexpected failure; the message is the page-level message (`Could not save the edition.`, etc.) |

### API endpoints

| Method | Path | Access | Description | Success |
| --- | --- | --- | --- | --- |
| GET | `/api/version` | Public | API name and version | `200 { name, version }` |
| GET | `/api/works` | Public | Catalog; without `search`, all works. With `?search=`, up to 10 works for the picker | `200 { works: WorkSummary[] }` |
| GET | `/api/works/:id` | Public | Work with its editions | `200 { work: WorkDetail }` |
| GET | `/api/editions/:id` | Public | Edition with Contents and cast | `200 { edition: EditionDetail }` |
| GET | `/api/people` | Public | `?search=` required; up to 10 people for the picker | `200 { people: PersonSummary[] }` |
| GET | `/api/people/:id` | Public | Person with work and edition credits | `200 { person: PersonDetail }` |
| GET | `/api/lookups` | Public | Genres, languages and credit roles for the form | `200 { genres, languages, creditRoles }` |
| POST | `/api/auth/login` | Public | Start a session | `200 { user: User }`, `Set-Cookie` |
| POST | `/api/auth/logout` | Public | End the session; idempotent | `204` |
| GET | `/api/auth/me` | Public | Current user or `null` | `200 { user: User \| null }` |
| POST | `/api/editions` | Curator | Create an edition, its Contents, its cast and any new works/people atomically | `201 { edition: { id } }` |

### Response shapes

```ts
type LanguageRef = { key: string; name: string };
type GenreRef = { key: string; name: string };
type RoleRef = { key: string; name: string; level: 'work' | 'edition' };
type PersonRef = { id: string; name: string };
type PersonSummary = PersonRef & { born: number | null; died: number | null };

type WorkSummary = {
  id: string;
  displayTitle: string;
  originalTitle: string;
  commonTitle: string | null;
  year: number;
  authors: PersonRef[];
  genres: GenreRef[];
  coverIsbn: string | null;
};

type EditionSummary = {
  id: string;
  title: string;
  publisher: string | null;
  year: number;
  language: LanguageRef;
  isbn: string | null;
  coverIsbn: string | null;
};

type WorkDetail = WorkSummary & {
  originalLanguage: LanguageRef;
  synopsis: string | null;
  editions: EditionSummary[];
};

type EditionDetail = {
  id: string;
  title: string;
  publisher: string | null;
  year: number;
  language: LanguageRef;
  isbn: string | null;
  contents: Array<{
    position: number;
    work: {
      id: string;
      displayTitle: string;
      originalTitle: string;
      originalLanguage: LanguageRef;
    };
    translatedFrom: LanguageRef | null;
  }>;
  cast: Array<{ role: RoleRef; people: PersonRef[] }>;
};

type PersonDetail = PersonSummary & {
  bio: string | null;
  workCredits: Array<{
    role: RoleRef;
    works: Array<{ id: string; displayTitle: string; year: number }>;
  }>;
  editionCredits: Array<{
    role: RoleRef;
    editions: Array<{ id: string; title: string; year: number }>;
  }>;
};

type CreateEditionRequest = {
  title: string;
  publisher?: string;
  year: number;
  language: string;
  isbn?: string;
  contents: Array<
    | { position: number; workId: string }
    | {
        position: number;
        work: {
          originalTitle: string;
          commonTitle?: string;
          year: number;
          originalLanguage: string;
          genres: string[];
          author: { personId: string } | { name: string };
        };
      }
  >;
  credits: Array<
    | { role: string; personId: string }
    | { role: string; person: { name: string } }
  >;
};
```

- `coverIsbn` is the ISBN of the edition with the earliest year (then publisher A–Z, then id); `null` when there is none. The UI builds the cover URL; the API never returns an image URL.
- `translatedFrom` is the work's original language when it differs from the edition language, otherwise `null`.
- `cast` contains only roles with people, in the fixed role order; people are sorted A–Z.
- `POST /api/editions` validates and creates everything in one transaction. If any part fails, nothing is saved.
- `GET /api/people?search=` and `GET /api/works?search=` return `400` when `search` is empty or longer than 100 characters. The frontend calls them only with at least one character.

### Sessions

- Cookie name `bookcast_session`; `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production, `Max-Age` 7 days.
- The server stores only the hash of the random token, the user id and the expiry.
- `POST /api/auth/login` compares the email case-insensitively (trimmed) and verifies the password with `scrypt`; a wrong email and a wrong password return the same `401 Wrong email or password.`
- `POST /api/auth/logout` deletes the session row and clears the cookie, even when no session exists.
- A protected request without a valid session returns `401`; a logged-in user without `curator` returns `403`.
- The frontend redirects to `/login?returnTo=/editions/new` on `401` from the create form and shows `Your session expired. Log in again.`; the form data is lost by design.

## Decisions resolved for the MVP

| Area | Decision |
| --- | --- |
| Data storage | PostgreSQL on Neon, Drizzle ORM, migrations in `apps/api` |
| API design | REST under `/api`, typed JSON, error envelope, status codes above |
| Backend structure | `server.ts` entry + `app.ts` + one router module per resource + `db/` + `validation/` |
| Frontend structure | React Router, one page per route, shared components, `api.ts`, `AuthProvider` |
| State | React state and props; no state or data-fetching library |
| Validation | Hand-written, server-side, exact field messages |
| Authentication | Cookie sessions, 7 days, `scrypt` password hashes |
| Deployment | One Render web service, `render.yaml` |
| Ordering | `Intl.Collator('en', { sensitivity: 'base', numeric: true })`, ties by id; leading articles not ignored; API sorts, UI preserves |
| Catalog year | Work year |
| Covers | Open Library URL with `?default=false`; placeholder on no ISBN or load error; earliest ISBN edition, ties by publisher then id |
| Create flow | One transaction; submit disabled while pending; no server idempotency key |
| Seed | Explicit ids; re-running the seed updates or skips the same records |

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

## Decision log

<!-- Add your decisions here, newest first. -->

### 2026-11-24 — Public API contract and create-edition flow

- **Context:** The requirements refer to `404`, `401` and `500`, but the starter had no API contract. The create form must support existing and new works/people in one request.
- **Decision:** The endpoints, shapes, status codes and error envelope in this file are the contract. Public pages use `GET`; the form uses one `POST /api/editions`. New works and people are nested in that request and created in the same transaction. Validation is hand-written; field messages match `docs/requirements.md`.
- **Alternatives:** Separate endpoints for works, people and editions — the UI would have to save a half-built edition, leaving orphan records, which the requirements forbid. A validation library — one more dependency for a small fixed set of checks.
- **Consequences:** One request can fail atomically with field-level errors. The frontend maps `fields` paths to inputs. Any new endpoint must be added to the table above.

### 2026-11-24 — Ordering and display defaults

- **Context:** "A–Z" was undefined for Latin + Cyrillic titles, leading articles, digits and ties; the catalog "year" could be the work or the edition year.
- **Decision:** Use `Intl.Collator('en', { sensitivity: 'base', numeric: true })`; ties by id. Leading articles are not ignored; `2001: A Space Odyssey` sorts before letters. The catalog shows the work year. The API returns sorted lists; the UI does not re-sort.
- **Alternatives:** Ignore leading articles (library convention) — surprising for "The …" titles and needs an exception list. Locale-aware sorting per language — more rules and inconsistent order between pages.
- **Consequences:** Tests can use the same comparator. The order is stable across server and browser. Some users may expect "The Great Silence" under G; the UI can explain nothing, but the rule is documented.

### 2026-11-24 — Covers: Open Library URL and fallback

- **Context:** Covers are not stored; the API must give the UI enough to build a URL and a deterministic choice when editions tie.
- **Decision:** `coverIsbn` is the ISBN of the earliest edition, then publisher A–Z, then id. The UI uses `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false`; on no ISBN or an image error it shows `No cover`. Tests never depend on the network.
- **Alternatives:** Return a full URL from the API — couples the API to a third party. Use the latest edition — the requirement chose the earliest.
- **Consequences:** *Klara and the Sun* deterministically uses the Alfred A. Knopf ISBN. Offline demos show placeholders, not broken images.

### 2026-11-24 — Sessions last 7 days; expiry redirects

- **Context:** "Still logged in later" had no duration, and the 401 recovery flow implied keeping form data.
- **Decision:** Cookie sessions last 7 days (`Max-Age`), survive reload and browser restart. A `401` from the create endpoint sends the browser to `/login?returnTo=/editions/new` with `Your session expired. Log in again.`; the form data is lost. No session-expiry form preservation in the MVP.
- **Alternatives:** Session cookie only (lost on browser restart) — fails the "later" criterion. Keep the form in memory and restore after login — extra state and tests for an edge case.
- **Consequences:** Users log in again after a week. The expired-session test is a redirect, not a state-restoration test.

### 2026-11-24 — Atomic create, disabled submit, no idempotency key

- **Context:** "Exactly one edition" and "nothing is saved" needed a mechanism.
- **Decision:** `POST /api/editions` runs in one database transaction. The `Save edition` button is disabled while the request is pending. The API has no idempotency key; two separate requests create two editions.
- **Alternatives:** Client-generated idempotency key — the correct fix for network retries, but extra API and storage work. Server-side deduplication by title/year — would block legitimate duplicates.
- **Consequences:** A failed request leaves no orphan work/person. A network retry after a lost response can still duplicate the edition; this is accepted for the MVP.

### 2026-11-24 — Seed matches by explicit id

- **Context:** `data/seed.json` carries explicit ids, while the earlier seed decision matched by natural keys (name, title + authors, title + publisher + year). Homonyms would break natural-key matching.
- **Decision:** The seed matches by the ids in the file. Re-running it updates or skips the same records; it does not create duplicates. It still creates editions through the same logic as the form. This supersedes the 2026-11-23 seeding entry.
- **Alternatives:** Natural keys — cannot distinguish two people with one name. Delete-and-recreate — loses references from user-created data.
- **Consequences:** The seed is stable and testable. A typo in an id creates a new record instead of updating; review the seed diff.

### 2026-11-24 — No person photos in the MVP

- **Context:** The seed has no `photoUrl` values and the MVP has no upload; a placeholder photo adds UI cost without data.
- **Decision:** Remove the person photo field from the MVP data and UI. Covers remain the only images. This supersedes the photo part of the 2026-11-23 images entry.
- **Alternatives:** Keep `photoUrl` and show a placeholder — dead data. Use an external avatar service — another dependency and privacy question.
- **Consequences:** Person pages show name, dates, bio and credits only. Adding photos later needs a data change and an image source decision.

### 2026-11-23 — Hosting: one free Render web service

- **Context:** The demo app should be public and free. The starter already runs as one service in production (Express serves the built frontend).
- **Decision:** One Render free web service, described in `render.yaml` (Blueprint). It deploys the `master` branch; work happens in `develop` and feature branches; build `npm ci --include=dev && npm run build`, start `npm start`, health check `/api/version`. `DATABASE_URL` is set in the Render dashboard.
- **Alternatives:** Separate frontend (static host) and API hosts — two deploys and CORS for no benefit. Render's free PostgreSQL — expires after 30 days.
- **Consequences:** The free service sleeps after 15 minutes without traffic; the first request then takes about a minute. The disk is temporary, so nothing is stored in files.

### 2026-11-23 — Images are links, not files

- **Context:** Editions need covers and people may have photos. Storing images needs file storage we do not have on free hosting.
- **Decision:** Covers are not stored: the UI builds the cover URL from the ISBN (Open Library Covers API) and shows a placeholder when there is no ISBN or no cover. Person photos are out of the MVP (see the 2026-11-24 entry).
- **Alternatives:** Uploading images to object storage — postponed (see open questions in requirements).
- **Consequences:** No upload code in the MVP. Editions without ISBN always show the placeholder.

### 2026-11-23 — Authentication: server sessions in a cookie

- **Context:** Only curators may create editions. Readers come later (`docs/features/my-library.md`).
- **Decision:** Email + password login. Passwords are hashed with `scrypt` from `node:crypto` (no dependency). On login the server creates a random session token, stores its hash with the user id and expiry in a `sessions` table, and sends the token in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). Logout deletes the session row. The session lasts 7 days (see the 2026-11-24 entry).
- **Alternatives:** JWT — logout and revocation get harder, no benefit for one server. An auth service — another account and dependency.
- **Consequences:** Every protected route checks the session and the user's roles. No registration in the MVP: the first curator comes from the seed (`CURATOR_EMAIL`, `CURATOR_PASSWORD`).

### 2026-11-23 — Users have a set of roles

- **Context:** The MVP has one role (`curator`); the planned feature adds `reader`, and one person can be both.
- **Decision:** A `users` table plus a set of roles per user (a `user_roles` table). Data that belongs to a person points to `users.id`; roles only decide what a user may do. No separate profile tables until a role gets its own fields.
- **Alternatives:** A single `role` column — a curator could not be a reader. Separate curator/reader profile tables — no role-specific data yet.
- **Consequences:** Adding `reader` later is a new role value and new permissions, not a change of the users model.

### 2026-11-23 — Seeding from data/seed.json

- **Context:** An empty catalog cannot be demoed or tested. `data/seed.json` holds realistic sample data with explicit ids.
- **Decision:** `npm run db:seed` reads `data/seed.json` and creates editions through the same "create edition" logic as the curator form. It matches existing records by the explicit ids (see the 2026-11-24 entry) and is idempotent. It also creates the first curator from `CURATOR_EMAIL` / `CURATOR_PASSWORD`. On the deployed app it is run once by hand against its database.
- **Alternatives:** SQL dump — breaks on every schema change and skips the business logic. Seeding on every server start — slows down starts and hides errors.
- **Consequences:** The seed doubles as the first test of the create-edition logic. Ids in the seed must be reviewed like code.

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
