# Backend

Express 5 on Node.js, TypeScript, in `apps/api`. What it must do is specified in `docs/requirements.md`; the tables it writes are in `data-model.md`.

## Structure

```
apps/api/
  drizzle/                  generated SQL migrations (committed)
  drizzle.config.ts
  src/
    server.ts               middleware, route mounting, serveFrontend, import.meta.main
    db/
      client.ts             pg Pool + drizzle(), reads DATABASE_URL once
      schema/               one file per table, exported from schema/index.ts
    routes/                 works.ts, editions.ts, people.ts, dictionaries.ts, auth.ts
    services/
      create-edition.ts     the only create flow; reused by the seed
    lib/
      errors.ts             ApiError, codes, error middleware, not-found handler
      auth.ts               scrypt hashing, session create/find/delete, requireCurator
      slug.ts               slug generation and uniqueness
      ids.ts                nanoid id generator
    scripts/
      seed.ts               npm run db:seed
```

- **Layers:** route → service → Drizzle queries. A route handles HTTP, parses its input with a Zod schema in `apps/api` and calls queries or the service. A service exists only for logic that spans several rows (today: creating an edition). There is no repository layer.
- `server.ts` keeps `express.json()`, the routers mounted under `/api`, one error middleware and a 404 handler for unknown `/api` routes, plus `export const app`, `serveFrontend` and the `import.meta.main` block. Do not move those three.
- Node.js runs the `.ts` files directly in development (`node --watch src/server.ts`); `npm run build` compiles to `dist/`. Relative imports therefore include the `.ts` extension, and only erasable TypeScript syntax is allowed: no `enum`, no `namespace`, no constructor parameter properties.
- Production (`npm start` runs `dist/server.js`) also serves the built frontend from `apps/web/dist`. The port comes from `PORT`, then `API_PORT`, then 3001.
- Migrations run with `npm run db:migrate` (drizzle-kit) on purpose, never on server start: the free Render service restarts and sleeps often.
- `npm run db:seed` runs `src/scripts/seed.ts`, which calls `services/create-edition.ts` — not a second implementation.

## Rules

- Every route lives under `/api/...` so the Vite proxy forwards it and no CORS setup is needed.
- Validate every input (body, params, query) with a Zod schema in `apps/api` before it reaches the database. A failure returns `400` with `fields`.
- One JSON error shape everywhere (below). Never leak a stack trace, SQL or a driver message.
- Authentication: a session cookie checked by `requireCurator` on every create route; the user's roles come from `user_roles`, not from a column on `users`.
- Response bodies are the resource or array itself, with no wrapper. Dates are ISO 8601 strings; years are integers; absent optional fields are omitted. Requests accept `null` as absent.
- Tests next to the code (`*.test.ts`) with Vitest and Supertest. The `db` module is mocked; tests cover the success path, invalid input, unauthorised, not-found and duplicate cases. E2E runs start from a freshly seeded `demo` database state, never from unique fixture titles.

## API conventions

**Error body.** Every non-2xx response is:

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Some fields are invalid", "fields": { "contents": "An edition needs at least one work" } } }
```

- `code` is stable and for the client to branch on: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `NOT_FOUND`, `EDITION_EXISTS`, `INTERNAL`.
- `fields` maps a path inside the request body to a message — top-level (`title`), nested (`contents[0].authors[1]`), or a list (`contents`). The form places these next to the right input.
- `details` carries extra data when the client needs it: `{ "editionSlug": "solaris" }` for `EDITION_EXISTS`.
- Statuses: `400` invalid input and duplicate credit, `401` missing or expired session (and missing role), `404` unknown slug or unknown `/api` route, `409` duplicate edition, `500` anything unexpected.

**Query parameters** are optional and validated: `GET /api/people?q=lem&limit=10` and `GET /api/works?q=solar&limit=10` (`limit` defaults to 10, maximum 20).

## API endpoints

| Method | Path | Auth | Description | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/version` | guest | API name and version | `200 { name, version }` |
| GET | `/api/works` | guest | catalog rows, ordered by `lower(title) COLLATE "C", slug` | `200 [{ slug, title, year, authors[], genres[], editionCount }]` |
| GET | `/api/works/:slug` | guest | work with authors, genres and the editions containing it | `200 { slug, title, year, originalLanguage, authors[], genres[], editions[] }` plus optional `originalTitle`, `synopsis` |
| GET | `/api/editions/:slug` | guest | edition with Contents and Cast | `200 { slug, title, year, language, contents[], cast[] }` plus optional `publisher`, `isbn` |
| GET | `/api/people/:slug` | guest | person with their filmography | `200 { slug, name, works[], editions[] }` plus optional `born`, `died`, `bio`, `photoUrl` |
| GET | `/api/genres` | guest | genre dictionary | `200 [{ key, name }]` |
| GET | `/api/credit-roles` | guest | credit-role dictionary with levels and order | `200 [{ key, level, name, position }]` |
| GET | `/api/works?q=` | guest | work autocomplete, matches on part of the title | `200 [{ slug, title, year }]` |
| GET | `/api/people?q=` | guest | person autocomplete, matches on part of the name | `200 [{ slug, name, born, died }]` |
| POST | `/api/editions` | curator | create an edition with new works, new people and credits | `201 { slug }` · `400` · `401` · `409` |
| POST | `/api/auth/login` | guest | email + password; wrong credentials return `401 UNAUTHENTICATED` with "Invalid email or password" | `200 { email, roles }` · `400` · `401` |
| POST | `/api/auth/logout` | guest | deletes the session and clears the cookie | `204` |
| GET | `/api/auth/me` | guest | current user; `401` means guest, not a retryable error | `200 { email, roles }` · `401` |

Absent optional fields are omitted from responses; empty login fields fail client validation before a request is sent. The web app redirects a guest to `/login?next=/editions/new` and uses `next` after a successful login.

## Payload and response shapes (illustrative)

These are the item shapes behind the endpoint table. Field names are part of the contract; the example values are not.

```jsonc
// GET /api/works
[{ "slug": "solaris", "title": "Solaris", "year": 1961,
   "authors": [{ "slug": "stanislaw-lem", "name": "Stanisław Lem" }],
   "genres": [{ "key": "science-fiction", "name": "Science fiction" }],
   "editionCount": 4 }]

// GET /api/works/:slug
{ "slug": "solaris", "title": "Solaris", "year": 1961, "originalLanguage": "pl",
  "authors": [{ "slug": "stanislaw-lem", "name": "Stanisław Lem" }],
  "genres": [{ "key": "science-fiction", "name": "Science fiction" }],
  "editions": [{ "slug": "solaris-1961", "title": "Solaris", "year": 1961,
                 "language": "pl" }] }

// GET /api/editions/:slug
{ "slug": "sol-jar-1", "title": "Соляріс", "year": 2017, "language": "uk",
  "contents": [{ "position": 1, "work": { "slug": "solaris", "title": "Solaris" } }],
  "cast": [{ "role": { "key": "translator", "name": "Translator", "position": 2 },
             "people": [{ "slug": "dmitro-andrukhiv", "name": "Дмитро Андрухів" }] }] }

// GET /api/people/:slug — works[] omitted when there are no author credits
{ "slug": "dmitro-andrukhiv", "name": "Дмитро Андрухів",
  "editions": [{ "role": { "key": "translator", "name": "Translator", "position": 2 },
                 "editions": [{ "slug": "sol-jar-1", "title": "Соляріс" }] }] }

// POST /api/editions — existing records by slug/key, new ones by value
{ "title": "Соляріс", "year": 2017, "language": "uk", "isbn": "9789661047616",
  "contents": [
    { "work": { "slug": "solaris" } },
    { "work": { "title": "Eden", "year": 1959, "originalLanguage": "pl",
                "genres": [{ "key": "science-fiction" }],
                "authors": [{ "name": "Stanisław Lem" }] } }
  ],
  "credits": [{ "role": "translator", "person": { "slug": "dmitro-andrukhiv" } }] }
```

`cast[]` and a person's `editions[]` are already grouped by credit role in `credit_roles.position` order; people inside a group are ordered by name in character-code order. `cast[]` is absent for an edition with no edition credits, and `works[]` is absent for a person with no author credits. Existing works and people are referenced by `slug`; genres and credit roles by `key`. Ids never appear.

## Configuration

The server reads `DATABASE_URL` (required), `CURATOR_EMAIL` and `CURATOR_PASSWORD` (seed only), and `PORT` / `API_PORT`. Nothing else is configurable: the session lifetime and the autocomplete limit are constants in code. Secrets never appear in code or in the repository; `.env.example` lists the names with fake values.
