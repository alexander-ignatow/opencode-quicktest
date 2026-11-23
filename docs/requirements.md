# Product Requirements

> **Status:** draft for the MVP. Open questions are listed at the end; resolve them before implementing the affected part.

This file describes **what** your application must do. AI agents read it before planning or implementing anything (it is loaded automatically through `opencode.jsonc`), so clear requirements lead to better code. Write it in English.

Keep **how** it is built (technical decisions) in `docs/architecture.md`.

## How to write good requirements

- **Define a small but complete MVP** (minimum viable product): the smallest version of your idea that a real user could use from start to finish. Example size: 3–6 user stories.
- **Be specific and observable.** "The user sees an error message when the title is empty" is testable; "the form is user-friendly" is not.
- **Write down what is out of scope.** It stops you (and the AI) from building extra features.
- **Update this file when you change your mind**, before asking an agent to implement the change.
- Ask an AI agent to help you write and critique this file, but make the final decisions yourself.

---

## 1. Product overview

**BookCast** is a book catalog built like a film database. It separates **works** (a novel, a story, a poem) from **editions** (a concrete published book) and shows the **people behind them** with their roles — authors, translators, illustrators, editors — like the cast of a film.

Problem: ordinary book lists mix up the work and the edition. You cannot easily see which editions contain a story, or who translated and illustrated a particular edition.

## 2. Users

- **Guest** — anyone. Browses the catalog without logging in.
- **Curator** — a logged-in user who adds editions to the catalog. The seed creates one curator account; there is no registration or user management in the MVP.

A user can have several roles. More roles are planned (see `docs/features/my-library.md`).

## 3. User stories

1. As a guest, I want to browse a catalog of works with their authors so that I can find something to read.
2. As a guest, I want to open a work and see its authors and every edition that contains it.
3. As a guest, I want to open an edition and see its details (publisher, year, ISBN, language), the works inside it in order, and its cast (translator, illustrator, ...).
4. As a guest, I want to open a person and see everything they did, grouped by role, like a filmography.
5. As a curator, I want to log in and log out so that only curators can change the catalog.
6. As a curator, I want to add an edition in a single form — edition details, the works it contains and the people involved — picking existing works and people or creating new ones on the fly, so that I enter as little data as possible.

## 4. Scope

### In scope (MVP)

- Public pages: works catalog, work page, edition page, person page.
- Curator login/logout (accounts from the seed script).
- Creating editions through **one** flow. Works and people are created only as part of an edition: a work or a person never exists without an edition.
- Picking an existing work or person by name (autocomplete), or creating a new one in the same form.
- Credits on two levels:
  - **work credits** (who wrote the work): the single role `author`; a work may have several authors;
  - **edition credits** (who made this edition): translator, editor, foreword, introduction, afterword, illustrator, cover artist, designer.
- Genres from a fixed dictionary; a work can have several genres.
- Covers are not stored: the cover is shown from the ISBN (Open Library Covers API). Author photos are optional.
- PostgreSQL database with migrations.
- **Seed data** (`data/seed.json`): a realistic sample catalog, so the app is never empty. It provides the fixed dictionaries and at least one example of every shape the acceptance criteria use: a work published in several editions under different titles and languages, an edition that contains several works (an omnibus), an edition without an ISBN, an edition without edition credits, a person credited only on works, a person credited only on editions, and a person with only a name.

### Out of scope

- Editing or deleting anything (create only).
- Registration, readers and personal libraries — planned next feature: `docs/features/my-library.md`.
- Additional user accounts and roles other than `curator`: the seed creates one curator, and the MVP has no registration or user management, so a user without the `curator` role cannot exist.
- Ratings and reviews.
- Cover image upload.
- Search, filters, pagination.
- Merging duplicate people or works.
- Server-side rendering for SEO. Public catalog pages will need it later, not in the MVP.
- Character index (later): link works to characters, e.g. "all books about Sherlock Holmes". A real wish, not for the MVP.

## 5. Acceptance criteria

The criteria describe properties of the data, not particular seed titles: the seed (§4) contains at least one example of every shape a criterion names, and any other data is created through the create-edition flow.

### Pages and URLs

| Page | URL |
| --- | --- |
| Works catalog | `/` |
| Work | `/works/<work slug>` |
| Edition | `/editions/<edition slug>` |
| Person | `/people/<person slug>` |
| Login | `/login` |
| Add an edition | `/editions/new` |

- Every page opens from its URL alone (a deep link works without visiting another page first).
- Links between entities use the slug, never the internal id.
- An unknown slug shows the matching "not found" page with a link back to the catalog, never an error page.
- `/editions/new` is a fixed path, so no edition slug is `new`; how slugs are generated and made unique is in §6 Data.

Global checks that apply to every story:

- Given a page is waiting for data, when it is still loading, then a visible loading state is shown in place of the content.
- Given a request fails, then an error message with a retry action is shown; the page is never blank and never half-filled. Retrying sends the request again and shows the loading state.
- Given a list has no items, then an explanatory message is shown instead of an empty list.
- Given a work, edition or person is linked, then the link goes to that entity's URL and can be opened in a new tab.

Story 1 — Browse the works catalog (`/`):

- Given the seed is loaded, when a guest opens the catalog page, then every work in the catalog is shown, one row per work, sorted by title case-insensitively (titles are compared character code by character code after lowercasing, so the order is identical on every machine); leading articles are not moved.
- Given a row in that list, then it shows the work title (linked), every author (linked), the work's year, all its genres, and the number of editions that contain it.
- Given a work with several authors, then all authors are shown.
- Given the catalog has no works, when the page is opened, then the message "No works in the catalog yet." is shown and no list is rendered.
- Given the backend answers with an error, then the error state with a retry action is shown.

Story 2 — Work page (`/works/<slug>`):

- Given a work, when a guest opens its page, then the title, year, original language, all genres, the synopsis and every author (linked) are shown.
- Given a work with an original title, then the original title is shown next to the title.
- Given a work without a synopsis, then no synopsis heading and no empty block is shown, and the other fields are unaffected.
- Given a work contained in several editions, then every edition that contains it is listed with its edition title, publisher, year, language and cover, sorted by edition year ascending; editions with the same year are ordered by title, then by publisher, and an edition without a publisher comes last.
- Given a work whose editions were published under their own titles or in other languages, then each edition is listed under its own title and language, not under the work's title.
- Given an unknown slug in the URL, then a "Work not found" page with a link back to the catalog is shown.

Story 3 — Edition page (`/editions/<slug>`):

- Given an edition, when a guest opens its page, then its title, publisher, year, language and ISBN are shown.
- Given an edition without a publisher or without an ISBN, then no empty label or value is shown for the missing field.
- Given an edition with an ISBN, then the cover is requested from the Open Library Covers API using that ISBN.
- Given an edition without an ISBN, then a placeholder cover is shown.
- Given the cover image cannot be loaded, then a placeholder cover is shown instead of a broken image.
- Given an edition, then Contents lists every work it contains in the stored order (positions 1, 2, 3 …), each work linked.
- Given an edition that contains several works (an omnibus), then all of them are listed in exactly the stored order.
- Given an edition with edition credits, then the Cast shows every credit grouped by credit role, roles in dictionary order, each person linked.
- Given an edition with no edition credits, then no Cast heading is shown.
- Given an unknown slug in the URL, then an "Edition not found" page with a link back to the catalog is shown.

Story 4 — Person page (`/people/<slug>`):

- Given a person, when a guest opens their page, then the name and, when they exist, the born year, died year, bio and photo are shown.
- Given a person without a photo, then the initials placeholder is shown instead of an image.
- Given a photo URL that fails to load, then the initials placeholder is shown and the name stays readable.
- Given a person with work credits, then the Works block lists every work they are credited on as author, each work linked.
- Given a person with no work credits, then the Works block is absent.
- Given a person with edition credits, then the Editions block lists every credited edition under its credit role, each edition linked.
- Given a person with no edition credits, then the Editions block is absent.
- Given a person with only a name, then the header shows only the name, with no empty born/died/bio labels and no broken image, and their credits are still listed.
- Given an unknown slug in the URL, then a "Person not found" page with a link back to the catalog is shown.

Story 5 — Curator login and logout (`/login`):

- Given a guest, when they open `/editions/new`, then they are sent to `/login`, and after a correct login they land on `/editions/new`.
- Given a wrong password or an unknown email, then the same message "Invalid email or password" is shown, the entered email is kept, and no session cookie is set.
- Given the email or the password is empty, then a field-level error is shown and no request is sent.
- Given a logged-in curator clicks "Log out", then the session ends, `/editions/new` redirects to `/login` again, and a create request sent with the old cookie is rejected with 401.
- Given an expired or invalid session cookie, then the visitor is treated as a guest (redirect for pages, 401 for the API), never a server error.
- Given a logged-in curator opens `/login`, then they are sent to the catalog instead of seeing the login form.

The seed creates exactly one curator account and the MVP cannot create users, so the case "a logged-in user without the `curator` role" is out of scope (§4). The API still requires the `curator` role on every create request (§6 User role).

Story 6 — Add an edition (`/editions/new`):

- Given a logged-in curator, when they fill in the edition details, pick one existing work, create one new work (title, year, original language, at least one author, at least one genre), add one edition credit by picking an existing person, and save, then the edition is created at `/editions/<slug>` with a slug generated by the server, and the new work appears in the catalog, on its own page and on its author's person page.
- Given a saved edition, then it is listed on the page of every work it contains and in the Editions block of every person credited on it.
- Given two works or editions whose titles would produce the same slug, then each gets its own URL (the later one with a numeric suffix) and both pages stay reachable.
- Given the curator has entered several works, then they can move them up and down, and the saved Contents order equals the order shown in the form.
- Given the form is left or cancelled, then nothing is saved: no edition, no new work and no new person is created.
- Given the title, year or language of the edition is missing, then a field-level error is shown for each missing field and nothing is saved.
- Given the year is not a whole number or is outside 1000 to the current year + 1, then a field-level error is shown.
- Given Contents is empty, then the error "An edition needs at least one work" is shown and nothing is saved.
- Given a new work has no author or no genre, then the error is shown on that work and nothing is saved.
- Given a new person has an empty name, or a name longer than 200 characters, then the error is shown on that person.
- Given an ISBN with a wrong check digit, then a field-level error on the ISBN is shown; given a valid ISBN written with hyphens, then it is accepted and stored normalized (digits, `X` for ISBN-10).
- Given an edition with the same title, publisher and year already exists, then saving is rejected with "This edition already exists", a link to that edition is shown, and nothing is created.
- Given the same person is added twice with the same credit role on one edition (or one work), then the duplicate is rejected with an explanatory error.
- Given an autocomplete field for people, when the curator types part of an existing person's name, then matching people are suggested; choosing a suggestion links that person and creates nothing new.
- Given the typed name matches nothing, then "Create new person" is offered; given the typed name matches an existing person exactly, then "Create new person" is still offered and creates a separate person (explicit choice, never silent reuse).
- Given an unauthenticated create request, then the API answers 401 and no record is created.
- Given saving fails with a server error, then an error message is shown and the entered data stays in the form.

## 6. Data

All data is stored in PostgreSQL (see `docs/architecture.md`). The reference is the seed in `data/seed.json`, loaded by `npm run db:seed`: it provides the fixed dictionaries (genres and credit roles) and the sample catalog described in §4. The seed must load without a single validation error.

Types: `text`, `integer`, `timestamp`. Every entity has an `id` surrogate key; works, editions and people also have a public **slug** used in URLs. The **natural key** used to match existing records is listed per entity. "Required" means the API rejects the request without it; the UI shows the same rule as a field-level error before sending.

**Slugs.** The URL identifier of a work, edition or person. It is generated by the server and is never typed or edited by a user:

- the source is the title (work, edition) or the name (person);
- lowercased; Unicode letters and digits are kept (Cyrillic included), and every other run of characters becomes one hyphen; no leading or trailing hyphen; if nothing is left, the fallback is `work`, `edition` or `person`;
- unique within its entity: when the slug is already taken, `-2`, `-3`, … is appended;
- never `new` for an edition (`/editions/new` is the add-edition page);
- never changes after creation, even if a later title would produce a different slug.

### Genre

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| key | text | yes | Lowercase key, unique, e.g. `science-fiction`. Fixed dictionary, seeded; not editable in the MVP. |
| name | text | yes | Display name, unique, e.g. "Science fiction". |

### Credit role

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| key | text | yes | Unique. Fixed dictionary: `author` (level `work`); `translator`, `editor`, `foreword`, `introduction`, `afterword`, `illustrator`, `cover-artist`, `designer` (level `edition`). |
| level | text | yes | `work` or `edition`; decides where the role may be used. A work credit with an edition-level role (or the reverse) is rejected. |
| name | text | yes | Display name, e.g. "Cover artist". |

### Person

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| name | text | yes | 1–200 characters after trimming. Natural key (matched by exact name when seeding). |
| slug | text | yes | Public URL identifier, generated from the name (see **Slugs**); unique among people; never entered by a user. |
| born | integer | no | Year, 1000 to the current year, not later than `died`. |
| died | integer | no | Year, 1000 to the current year, not earlier than `born`. |
| bio | text | no | Up to 2000 characters. |
| photoUrl | text | no | Absolute `http`/`https` URL, up to 500 characters. A photo is a link, never a file. |

### Work

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| title | text | yes | 1–300 characters after trimming. Natural key together with the authors. |
| slug | text | yes | Public URL identifier, generated from the title (see **Slugs**); unique among works; never entered by a user. |
| originalTitle | text | no | Up to 300 characters; omitted when there is none. |
| year | integer | yes | Original year of the work, 1000 to the current year + 1. |
| originalLanguage | text | yes | Language code of the original text (`en`, `pl`, `uk`, `cs` in the seed). |
| synopsis | text | no | Up to 2000 characters. |
| genres | list of Genre | yes | At least one. |
| authors | list of Person | yes | At least one, through a work credit with role `author`. |

### Work credit (Author)

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| work | Work | yes | — |
| person | Person | yes | — |
| role | Credit role | yes | Must be a `work`-level role; in the MVP only `author`. Unique together with work and person. |

### Edition

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| title | text | yes | 1–300 characters after trimming. May differ from the work title (translated editions). |
| slug | text | yes | Public URL identifier, generated from the title (see **Slugs**); unique among editions; never `new`; never entered by a user. |
| publisher | text | no | Up to 200 characters; plain text, not an entity. Empty counts as absent. Natural key together with title and year. |
| year | integer | yes | Year of this edition, 1000 to the current year + 1. |
| language | text | yes | Language code of this edition. |
| isbn | text | no | ISBN-10 or ISBN-13 with a valid check digit; hyphens and spaces accepted on input, stored normalized (digits, `X` for ISBN-10). Never identifies an edition and is not part of the natural key. |

### Contents

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| edition | Edition | yes | One row per work in an edition. |
| work | Work | yes | Unique together with the edition. |
| position | integer | yes | 1, 2, 3 … in the order entered; unique together with the edition. At least one row per edition. |

### Edition credit (Cast)

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| edition | Edition | yes | — |
| person | Person | yes | — |
| role | Credit role | yes | Must be an `edition`-level role. Unique together with edition, person and role. An edition may have no edition credits. |

### User

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| email | text | yes | Valid email address, stored lowercase, unique. Login name. |
| password hash | text | yes | `scrypt` hash with its salt (see `docs/architecture.md`); never returned by the API. |
| created at | timestamp | yes | Set by the server. |

The seed creates the curator account from `CURATOR_EMAIL` and `CURATOR_PASSWORD`. There is no registration or user management in the MVP.

### User role

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| user | User | yes | — |
| role | text | yes | `curator` in the MVP; `reader` is planned (`docs/features/my-library.md`). Unique together with the user. |

### Session

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| token hash | text | yes | Hash of the random session token; unique. The token itself exists only in the `httpOnly` cookie. |
| user | User | yes | — |
| expires at | timestamp | yes | Set by the server at login (duration: see open questions). |
| created at | timestamp | yes | Set by the server. |

### Derived, never stored

- **Cover** of an edition — built from the ISBN with the Open Library Covers API; placeholder when there is no ISBN or no cover.
- **Edition count** on the catalog and work pages.
- **Filmography grouping** on the person page: work credits under "Works", edition credits under "Editions" grouped by credit role.

## 7. Open questions

- The seed references works by title only. What if two works share a title — how does `npm run db:seed` tell them apart?
- Two different people can share a name, but the seed matches people by exact name and the create form treats an exact name as an existing person unless the curator picks "Create new". Should the born year become part of the person's natural key, and does the exact-name case need a stronger warning?
- Are the proposed limits acceptable (title 300, name 200, publisher 200, bio/synopsis 2000, photoUrl 500), especially for long collection titles?
- Is the ISBN unique across editions when present? It is not the edition's identity, but two editions with one ISBN would be a data-entry mistake — warn, reject, or allow?
- Language: keep a free ISO 639-1 two-letter code, or make it a fixed dictionary like genres, so that a typo (`eng`) is rejected and "all editions in Ukrainian" stays possible later?
- How long may a curator stay logged in (session lifetime), and is a "remember me" option wanted? Not decided in `docs/architecture.md`.
- Cover fallback: a placeholder image or a generated block with the title's initials? Should the app remember that Open Library has no cover for an ISBN, or ask again on every view?
- `photoUrl` links can rot. Should the app check reachability, or just show the initials placeholder when the image fails (as in the criteria above)?
- On the edition page, should the authors of the contained works also be shown (useful for a collection), or is the Cast enough? The criteria above show them only on the work pages.
- Images (low priority): where do we store author photos and our own covers if we stop relying on links — file storage or a hosting service? Do we want a gallery (several photos per person or edition) later?
