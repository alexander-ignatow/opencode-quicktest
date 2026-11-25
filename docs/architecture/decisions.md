# Decision log

Every significant decision — new endpoints, data model, storage, dependencies, folder structure — gets a short entry here. Newest first. Never rewrite an old entry: add a new one that supersedes it.

Template:

```markdown
### YYYY-MM-DD — Short title

- **Context:** What problem or requirement led to this decision?
- **Decision:** What did you choose?
- **Alternatives:** What else did you consider, and why not?
- **Consequences:** What becomes easier or harder?
```

### 2026-11-25 — Verification fixes: order oracle, JSON 400, final error middleware

- **Context:** Reviewing Story 1 found that the catalog order was only checked against the API’s own output, a malformed JSON body became `500`, authors were selected by role level, and the error middleware ran before the static frontend middleware, so static failures bypassed it.
- **Decision:** The E2E test computes the expected title order itself (lowercase, character codes, then slug); the slug tie-breaker uses `COLLATE "C"`. `express.json()` failures map to `400 VALIDATION_FAILED` with "Invalid JSON body". Authors are selected by `credit_roles.key = 'author'`. The production static middleware is mounted before `errorHandler`, which stays last. New unit tests cover `useResource` (load, error + retry, abort) and `getJson` (JSON error, non-JSON fallback, signal). `backend.md` records that `GET /api/works?q=` is not implemented until Story 6.
- **Alternatives:** Keeping the API as its own E2E oracle — cannot detect a wrong `ORDER BY`; filtering authors by level — correct only while `author` is the sole work-level role; mapping body-parser errors later with the first POST — leaves the inherited contract wrong in the meantime.
- **Consequences:** The catalog order now has an independent regression test. The error contract is complete for the coming create endpoint. `server.ts` mounts the frontend build, then the error handler, then starts listening only under `import.meta.main`.

### 2026-11-25 — Works catalog: grouped queries and the first app shell

- **Context:** Story 1 is the first product feature. The API only had `GET /api/version` and the web app was the starter welcome screen. The catalog must arrive in one deterministic order and give the page loading, error-with-retry and empty states.
- **Decision:** `GET /api/works` lives in `routes/works.ts`: four Drizzle selects (works ordered by `lower(title) COLLATE "C", slug`; authors; genres; edition counts) grouped in JS into the documented response. `lib/errors.ts` adds `ApiError`, the JSON API 404 handler and the error middleware. The web app installs `react-router-dom` (the approved router), gains `api/client.ts` (the only `fetch` plus `ApiError`), `api/works.ts`, `useResource`, the catalog page and a catch-all not-found page; the starter welcome screen and its version call are removed. `GET /api/works?q=` (autocomplete) ships with Story 6, and Work/Edition/Person pages with stories 2–4, so their links currently reach the catch-all.
- **Alternatives:** One raw SQL query with `json_agg` — one round trip, but less readable and untyped; a page-shaped endpoint — not reusable by later pages; keeping the welcome screen next to the catalog — contradicts replacing the starter.
- **Consequences:** Catalog order stays a database rule and is covered end to end, while unit tests mock `db` with a thenable select chain. Every API test that imports `app` must mock `db`, because the client reads `DATABASE_URL` at import time. The catalog page is the first consumer of `useResource`, which later pages reuse.

### 2026-11-25 — `db:seed` replaces the catalog; env comes from the root `.env`

- **Context:** The project had no database layer, while requirements §6 expects `npm run db:seed` to load `data/seed.json` and the documented stack is Drizzle on PostgreSQL. The seed needed a repeat-run rule, a way to find `DATABASE_URL`, and behaviour when curator credentials are absent.
- **Decision:** Add the Drizzle schema, generated migration `apps/api/drizzle/0000_*.sql` and the scripts `db:generate`, `db:migrate`, `db:seed`. `db:seed` validates the file with Zod and cross-reference checks, then in one transaction deletes and reinserts genres, credit roles, people, works, editions, Contents and credits, keeping users and sessions. It upserts the curator from `CURATOR_EMAIL` / `CURATOR_PASSWORD`; when they are missing it warns and skips the account. Both the app and `drizzle.config.ts` load the repository root `.env` with `process.loadEnvFile`; variables already set in the environment win. Ids and slugs are generated in the seed; editions with equal titles get `-2`, `-3` … and `new` is reserved.
- **Alternatives:** Match existing rows by name or title — contradicts the no-natural-keys decision; refuse to run when the catalog is not empty — a second run then fails instead of restoring the sample data; add `dotenv` — `node:process` already loads `.env`; require curator credentials — a developer without them could not seed the catalog.
- **Consequences:** Running the seed destroys curator-created catalog rows in the target database, so it must point at the `demo` branch during development. The seed inserts directly rather than through `services/create-edition.ts`; the service does not exist yet and the seed should reuse it once it does. `docs/development.md` documents the commands.

### 2026-11-23 — Duplicate edition comparison: trimmed, case-sensitive

- **Context:** `requirements.md` §5 rejects an edition with the same title, publisher and year with `409` and a link, but does not define "same"; `data-model.md` had added an unrequested case-insensitive rule.
- **Decision:** Compare title, publisher and year after trimming whitespace, case-sensitively; an empty publisher counts as absent. The check stays in the create-edition service and returns `409` with `details.editionSlug`.
- **Alternatives:** Trim + case-insensitive — hides case variants as duplicates and is hard to undo once data exists; exact stored bytes — whitespace differences slip through and "empty counts as absent" needs special handling.
- **Consequences:** `Solaris` and `SOLARIS` can coexist; tests must cover both directions. No database key is added. Supersedes the comparison sentence in `data-model.md`.

### 2026-11-23 — Catalog sort is a deterministic API rule

- **Context:** Story 1 requires title order identical on every machine (character code after lowercasing); "case-insensitively" alone is not testable.
- **Decision:** `GET /api/works` orders by lowercased title in character-code order — `ORDER BY lower(title) COLLATE "C", slug` — and the web app renders that order as returned.
- **Alternatives:** Sort in the web app with JS codepoint comparison — ships the whole catalog and duplicates the rule in tests; database default collation — locale-dependent and would break the criterion.
- **Consequences:** One sort to test; the Postgres-specific collation syntax needs a revisit if the database changes. Supersedes the vague "sorted by title case-insensitively" in `backend.md`.

### 2026-11-23 — Cast groups use seeded credit-role position

- **Context:** Requirements say Cast roles appear in "dictionary order"; the dictionary has a fixed order in `data/seed.json`, but `credit_roles` had no column to express it.
- **Decision:** Add `credit_roles.position`, filled from the array order in `data/seed.json` (the file itself is unchanged). Cast and filmography groups order by that position; people inside a group order by name in character-code order. The API exposes `position` on credit roles.
- **Alternatives:** Order by role key — alphabetical order contradicts the seed; hard-coded constant in code — can drift from the dictionary and must be duplicated.
- **Consequences:** A migration and seed mapping are needed; "dictionary order" becomes explicit and testable.

### 2026-11-23 — Auth contract: 401 means guest, explicit login statuses, ?next= return

- **Context:** Requirements demand invalid cookies be treated as guests, one fixed bad-credential message and a return to `/editions/new` after login; the docs left status mapping and the redirect mechanism open.
- **Decision:** `GET /api/auth/me` returns `401` when there is no valid session and `useAuth` treats that response as "guest", not a retryable error. Wrong email/password returns `401 UNAUTHENTICATED` with "Invalid email or password"; empty fields fail client validation with no request (the API still validates them and returns `400`). The guard redirects to `/login?next=/editions/new`; after login the app navigates to `next` when it is a local path, otherwise to `/`.
- **Alternatives:** `200 { user: null }` from `/me` — changes the endpoint contract and router state is lost on reload; redirect on any error — an invalid cookie can show a retry error before redirecting.
- **Consequences:** One query parameter to validate; tests cover 401-as-guest, both login failures and the return path. Supersedes the ambiguous auth rows in `backend.md` and the guard line in `frontend.md`.

### 2026-11-23 — Request and response shapes are documented, no shared package

- **Context:** Work autocomplete had no endpoint, create-payload references and nested response shapes were guesswork, and optional fields could be `null` or omitted.
- **Decision:** `backend.md` now defines the shapes: `GET /api/works?q=` for work autocomplete; existing works/people by `slug`, genres and credit roles by `key`; nested `authors`, `contents`, `cast` and filmography groups with explicit fields. Responses omit absent optional fields; requests accept `null` as absent. Types stay local to each app rather than in a shared package. This supersedes the payload sketch in "Creating an edition: one nested POST" (contents items are now `{ work: ... }`).
- **Alternatives:** Filter the whole catalog in the combobox — no new endpoint but ships all works and still leaves shapes undefined; leave shapes to implementation — `/implement` would guess grouping and references.
- **Consequences:** More documentation to keep in sync with code, but one contract for API, form and tests. No new dependency.

### 2026-11-23 — Duplicate credits fail in the service with a field error

- **Context:** Requirements require an explanatory error when the same person gets the same role twice; composite primary keys alone would surface as a 500 and leave new-person identity in one POST undefined.
- **Decision:** The create-edition service checks `(work|edition, person, role)` before insert, including rows created in the same request, and returns `400 VALIDATION_FAILED` with a `fields` path such as `credits[1]` or `contents[0].authors[1]`. A new person is identified by its position in the request; two separate "new person" entries with one name are two people. Primary keys remain the final guard.
- **Alternatives:** Map database constraint errors to 400 — messages depend on constraint names and new-person identity stays undefined; merge new people by name — contradicts "Create new person" and no-natural-keys.
- **Consequences:** A few extra checks in the transaction; clear, localised errors and no accidental name-based merging.

### 2026-11-23 — Less prescribed frontend layout; E2E resets the demo database

- **Context:** Frontend docs pre-listed components and "one helper per file with a test" before any second use, contradicting the reuse rule; E2E creates editions against a seeded branch with no reset, so repeated runs collide with the duplicate-edition 409.
- **Decision:** Frontend docs describe folders and principles only; files and helpers are added when a second use justifies them. E2E runs start from a freshly seeded `demo` database state; fixture data is not made unique to dodge duplicate checks.
- **Alternatives:** Unique fixture titles per run — leaves test data behind and never tests duplicate handling across runs; keep the prescribed file list — fragments trivial logic across many files.
- **Consequences:** Implementers have freedom in file layout; the E2E setup needs a reset step before the run.

### 2026-11-23 — Seed has no synthetic keys; seed script creates them

- **Context:** The identity decision removed natural keys, but `data/seed.json` intentionally keeps name/title references and contains no `id` or `slug` values. The seed must still fill all dictionaries and the sample catalog (requirements §4) without inventing matching rules that contradict identity.
- **Decision:** Keep `data/seed.json` unchanged. `npm run db:seed` creates a fresh synthetic `id` and `slug` for every work, edition and person it inserts, using the same rules as curator-created records. Nothing is matched by name or title; the old idempotent-by-natural-key behaviour of the "Seeding from data/seed.json" entry is gone. How repeat runs deal with existing catalog rows is an implementation detail, not decided here.
- **Alternatives:** Put stable ids in `data/seed.json` and upsert by id — precise and repeatable, but changes the data file (rejected); match by name/title — contradicts the no-natural-keys identity decision; match by slug — two works with one title collide again.
- **Consequences:** The seed file stays readable and unchanged. Identity generation belongs to the seed script. `docs/requirements.md` §6 still describes natural keys and a unique person name; the analyst must update it before code follows these documents. Supersedes the matching rule in "Seeding from data/seed.json".

### 2026-11-23 — No shared workspace for now

- **Context:** The validation decision introduced `packages/shared` for Zod schemas and inferred types. The root workspace currently has only `apps/web` and `apps/api`, and an extra package to resolve from Node's type stripping and Vite is premature for the MVP.
- **Decision:** There is no `packages/shared` workspace. Validation schemas for API requests live in `apps/api`; form schemas and local response types live in `apps/web`, both derived from `docs/requirements.md` §6. The API remains the authority; the client check only saves a round trip.
- **Alternatives:** Keep `packages/shared` — one definition of each rule, but a third workspace with build/resolution work now; hand-written validators in both apps — no Zod, but more error-mapping code; generate clients from an API schema — too much machinery for six endpoints.
- **Consequences:** A field rule can drift between the two apps; when that becomes a real problem, revisit sharing. Each app that validates declares its own `zod` dependency. Supersedes "Validation and shared types: Zod in packages/shared".

### 2026-11-23 — One form pattern: react-hook-form for every form

- **Context:** "Forms and UI" said the login form used plain controlled state, while `frontend.md` says forms use `react-hook-form` with a Zod resolver. Two patterns would mean two ways to show field errors and keep data on failure.
- **Decision:** Every form, including login, uses `react-hook-form` with a Zod resolver local to `apps/web`. Client field errors and API `400` `fields` map to the same paths. No plain controlled login form.
- **Alternatives:** Plain controlled login — two fields need little machinery, but it duplicates validation and error mapping; a different form library — no benefit over the existing choice.
- **Consequences:** One form pattern to learn and test. The login schema is duplicated with the API's login schema until sharing is revisited. Supersedes the login-form part of "Forms and UI: react-hook-form, no UI library".

### 2026-11-23 — Identity: random ids, no natural keys

- **Context:** Natural keys are not reliable: two people can share a name, two works a title, and an edition can repeat title + publisher + year. Matching records by them produced duplicates and ambiguity (requirements §7, first and third open questions). Requirements already make `id` the surrogate key and the slug only a URL label.
- **Decision:** Every table has a surrogate `id`: `text`, 12 characters, lowercase base36, generated in code with `nanoid` (`customAlphabet`). Records are matched by `id` only. There are **no natural keys**: no unique constraint on `people.name`, `works.title` or (`title`, `publisher`, `year`) of an edition. Slugs stay as the public URL identifier, generated from the title or name exactly as `docs/requirements.md` §6 specifies. Business duplicate rules remain application checks (an edition with the same title, publisher and year is rejected with `409` and a link to the existing one), never database keys.
- **Alternatives:** Integer ids — fine, but enumerable and awkward to merge across environments; `crypto.randomUUID()` — no dependency, but 36-character ids dominate logs; slug as primary key — identity would change when a title is corrected, and two identical titles collide.
- **Consequences:** New dependency `nanoid`. The "Seeding from data/seed.json" entry loses its matching rule — the replacement is still open (`README.md` → Open decisions). `docs/requirements.md` §6 still describes natural keys and a unique person name; the analyst has to update it before code follows these documents.

### 2026-11-23 — ISBN is not unique; language is free text

- **Context:** Two data questions were open in requirements §7.
- **Decision:** `editions.isbn` has no unique index and is part of no key — two editions may share an ISBN. `editions.language` and `works.original_language` stay plain text with no dictionary table, validated as two lowercase letters, the definition of "Language code" in the glossary.
- **Alternatives:** Unique ISBN — one typo would block a legitimate record, and reprints reuse numbers; a `languages` dictionary — catches `eng`, but adds a table and a seeded list for little MVP value.
- **Consequences:** A mistyped but well-formed code (`xz`) is stored without complaint. Moving to a dictionary later needs a migration plus data cleanup, and duplicate ISBNs are never flagged.

### 2026-11-23 — Sessions: 30 days, no "remember me"

- **Context:** Requirements §7 left the session lifetime open.
- **Decision:** A session lives 30 days from login, fixed in code (not an environment variable). `sessions.expires_at` stores it, the cookie `Max-Age` matches, and the cookie stays `httpOnly`, `SameSite=Lax`, `Secure` in production. No renewal on activity, no "remember me" option. An expired or unknown token is a guest.
- **Alternatives:** Short session with sliding renewal — more code and clock edge cases; a "remember me" checkbox — two lifetimes to build and test for no MVP benefit; sessions that never expire — a row that grows forever.
- **Consequences:** A curator logs in again about once a month. Nothing to configure per environment.

### 2026-11-23 — API: REST per resource, slugs as references

- **Context:** Each public page needs one payload, and the planned "My library" feature will want the same edition data.
- **Decision:** REST resources, one request per page: `GET /api/works`, `/api/works/:slug`, `/api/editions/:slug`, `/api/people/:slug`, `/api/genres`, `/api/credit-roles`, `/api/people?q=`, plus `POST /api/editions` and the `/api/auth/*` endpoints (full table in `backend.md`). Request bodies reference existing records by **slug**. Success responses are the resource or array itself, with no envelope.
- **Alternatives:** Page-shaped endpoints (`/api/pages/work/:slug`) — always one request, but the API mirrors the UI and the reader feature gets no reuse; GraphQL — a schema and resolver layer for six resources.
- **Consequences:** The frontend has five read calls to cover with tests. Ids never travel to the browser.

### 2026-11-23 — Creating an edition: one nested POST

- **Context:** Story 6 creates an edition, new works, new people and credits from one form, and leaving the form must save nothing.
- **Decision:** One endpoint in one transaction, `POST /api/editions`: edition fields, `contents[]` in display order (each item either `{ slug }` for an existing work or a full new work with `authors[]` and `genres[]`), and `credits[]` (each `{ person: { slug } | { name, … }, role }`). Every rule — at least one work, at least one author and genre per new work, role level, duplicate credit, duplicate edition — is checked inside that transaction; any failure rolls back and returns `400` or `409` with `fields`.
- **Alternatives:** Several endpoints orchestrated by the browser — no atomicity, so a cancel or a failed third call leaves orphan people; a draft-then-complete flow — a state machine plus cleanup rows for one form.
- **Consequences:** `apps/api/src/services/create-edition.ts` is the single entry point, reused by the seed script. The create payload is the largest contract in the app and gets its own Zod schema.

### 2026-11-23 — Backend structure: thin routes, shared services

- **Context:** `server.ts` currently holds the whole API; six resources, sessions, a seed and a database are coming.
- **Decision:** Layers are route → service (only where multi-row business rules live) → Drizzle queries. Folders: `src/routes/`, `src/services/` (`create-edition.ts` for now), `src/lib/` (`errors.ts`, `auth.ts`, `slug.ts`, `ids.ts`), `src/db/` (`client.ts`, `schema/` per table), `src/scripts/seed.ts`; migrations in `apps/api/drizzle/`. No repository layer. `server.ts` keeps the middleware, route mounting, `app`, `serveFrontend` and the `import.meta.main` block. Migrations run through an explicit `npm run db:migrate`, never on server start.
- **Alternatives:** route → service → repository — two extra files per resource for logic that is mostly one statement; growing the single file — a ~1000-line module that every agent session loads.
- **Consequences:** Queries stay beside the route that uses them; a second consumer means extracting a small module. The deploy needs the migrate step run by hand, which is honest for a free single service.

### 2026-11-23 — Validation and shared types: Zod in packages/shared

- **Context:** Requirements demand the same field rules in the API and as client-side field errors before sending, and the create payload is deeply nested.
- **Decision:** A third npm workspace, `packages/shared`, holding Zod schemas for every request body and response plus the TS types inferred from them. The API parses input with a schema and maps the issues to `fields`; the form validates with the same schema through a resolver. New dependency: `zod`.
- **Alternatives:** Hand-written validators in the API and hand-written types in the web app — no dependency, but two copies of every rule; Zod only in the API — cheapest, but the client rules drift away from the server's.
- **Consequences:** One rule changes in one place, and the form and the 400 responses speak the same language. The price is a workspace both builds must resolve: the package must be consumable as TypeScript source by Node's type stripping and by Vite; if that fights the `tsc` build, `packages/shared` is built to JS first.

### 2026-11-23 — Frontend: React Router, one data-loading hook

- **Context:** Six URLs must open directly, and every page needs loading, error-with-retry and empty states.
- **Decision:** `react-router-dom` with `/`, `/works/:slug`, `/editions/:slug`, `/people/:slug`, `/editions/new`, `/login` and a catch-all not-found, all inside one layout. Data loading through a single `useResource` hook over React state: `status`, `data`, `retry`, abort on unmount. No caching library.
- **Alternatives:** A hand-rolled matcher on `pathname` — no dependency, but params, back/forward and 404 pages by hand; TanStack Router — typed params, more setup; TanStack Query — caching for pages that never invalidate.
- **Consequences:** One new dependency and one state machine for all pages, so "never blank, never half-filled" is implemented and tested once. No shared cache: navigating back refetches.

### 2026-11-23 — Forms and UI: react-hook-form, no UI library

- **Context:** The add-edition form has dynamic lists of works and credits, per-item errors and reordering; every other screen is text and lists.
- **Decision:** `react-hook-form` with the shared Zod resolver for the create form (`useFieldArray` for contents and credits, `move()` for up/down); plain controlled state for the login form. No component library: Tailwind plus a small set of local primitives (`Button`, `Card`, `Field`, `Select`, `StatusMessage`). The person/work autocomplete is one hand-written WAI-ARIA combobox with keyboard tests.
- **Alternatives:** Controlled state everywhere — no dependency, but nested error maps, ordering and "keep the data on a server error" written by hand; a headless combobox dependency (`downshift`, `cmdk`) — accessibility for the one hard widget; shadcn/ui — accessible widgets at the cost of dozens of copied files the MVP does not use.
- **Consequences:** Two new dependencies (router, form) and none for visuals. The combobox is the riskiest hand-written widget and must be tested with the keyboard; a dialog or menu later would justify a library.

### 2026-11-23 — API conventions: error format and status codes

- **Context:** The error body was still open, and the form has to put a server error on the right field.
- **Decision:** Every error is `{ "error": { "code", "message", "fields?", "details?" } }`. Codes: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `NOT_FOUND`, `EDITION_EXISTS`, `INTERNAL`. `fields` maps a path (`contents`, `works[0].authors`, `isbn`) to a message; `details` carries extra data such as the existing edition's slug. Statuses: `400` invalid input and duplicate credit, `401` missing or expired session, `404` unknown slug or unknown `/api` route, `409` duplicate edition, `500` anything unexpected. One error middleware builds the body; no stack trace or database message reaches the client.
- **Alternatives:** `{ error: "message" }` — trivial to consume, but no field mapping and nowhere to put the existing-edition link; RFC 9457 problem+json — a real standard, more ceremony than six endpoints need.
- **Consequences:** One shape to test per endpoint, and the API client turns it into a typed error the form maps onto fields.

### 2026-11-23 — Testing database code: mocked db in unit tests

- **Context:** Routes now need PostgreSQL, while `npm run test` must stay fast and work offline.
- **Decision:** Unit tests (Vitest + Supertest) mock the `db` module and cover validation, status codes, transaction behaviour and error mapping. Playwright E2E runs against the seeded `demo` database branch with both servers started by the config. The SQL itself is covered end to end only.
- **Alternatives:** A real test database for unit tests (`DATABASE_URL_TEST`, migrations and truncation per run) — real SQL, but a database dependency for `npm run test` and slower runs; E2E only — least code, but no fast feedback for the 400/401/404 paths requirements demand.
- **Consequences:** A wrong query surfaces later than a wrong route. If query bugs turn out to be the common failure, add a small integration suite against a real database.

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
