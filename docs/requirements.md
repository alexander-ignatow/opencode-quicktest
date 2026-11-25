# Product Requirements

> **Status:** MVP, testable. Every acceptance criterion below is observable in the UI or in an API response. The examples use `data/seed.json`. Decisions that used to be open are resolved in section 7.

This file describes **what** the application must do. Keep **how** it is built (technical decisions) in `docs/architecture.md`.

## How to read this file

- **MVP** means the smallest version a real guest and a real curator can use from start to finish.
- **Test fixture** means a state that a unit or integration test creates itself. The seed does not need to contain it.
- **Exact text** in quotes is part of the contract: tests query by that text.
- Section 5 starts with test conventions that make the criteria repeatable.

---

## 1. Product overview

**BookCast** is a book catalog built like a film database. It separates **works** (a novel, a story, a poem) from **editions** (a concrete published book) and shows the **people behind them** with their roles — authors, translators, illustrators, editors — like the cast of a film.

Problem: ordinary book lists mix up the work and the edition. You cannot easily see which editions contain a story, or who translated and illustrated a particular edition.

## 2. Users

- **Guest** — anyone. Browses the catalog without logging in.
- **Curator** — a logged-in user who adds editions to the catalog. Curator accounts are created by the seed script; there is no registration in the MVP.

A user can have several roles. More roles are planned (see `docs/features/my-library.md`).

## 3. User stories

1. As a guest, I want to browse a catalog of works with their authors so that I can find something to read.
2. As a guest, I want to open a work and see its author and every edition that contains it.
3. As a guest, I want to open an edition and see its details (publisher, year, ISBN, language), the works inside it in order, and its cast (translator, illustrator, ...).
4. As a guest, I want to open a person and see everything they did, grouped by role, like a filmography.
5. As a curator, I want to log in and log out so that only curators can change the catalog.
6. As a curator, I want to add an edition in a single form — edition details, the works it contains and the people involved — picking existing works and people, so that I enter as little data as possible.
7. As a curator, I want to create a new work or a new person inside the same form, so that I never leave the flow to complete the catalog.

## 4. Scope

### In scope (MVP)

- Public pages: works catalog, work page, edition page, person page.
- Curator login/logout (accounts from the seed script).
- Creating editions through **one** flow. Works and people are created only as part of an edition: a work or a person never exists without an edition.
- Picking an existing work or person by name (autocomplete), or creating a new one in the same form.
- Credits on two levels:
  - **work credits** (who wrote the work): exactly one `author` per work in the MVP;
  - **edition credits** (who made this edition): translator, editor, foreword, introduction, afterword, illustrator, cover artist, designer.
- Genres from a fixed dictionary; a work has at least one genre.
- Covers are not stored: the cover is shown from the ISBN (Open Library Covers API).
- PostgreSQL database with migrations.
- **Seed data** (`data/seed.json`): a realistic catalog, so the app is never empty — books about artificial intelligence: 11 authors, 23 works, 31 editions in the original language, English and Ukrainian. It includes a novel in several editions and translations, collections with many works (Ted Chiang's *Exhalation*, a Stanisław Lem omnibus), editions without ISBN (before ISBN existed) and editions without credits.

### Out of scope (MVP)

- Editing or deleting anything (create only).
- Registration, readers and personal libraries — planned next feature: `docs/features/my-library.md`.
- Ratings and reviews.
- Cover image upload.
- Search, filters and pagination on public pages. The only search is the internal work/person picker described in Story 6, limited to 10 suggestions.
- **Works with more than one author.** The MVP form creates exactly one `author` credit per work. The data model keeps a list, so multi-author works can be added later. The `co-author` role does not exist.
- **Reordering Contents.** Positions are assigned 1..n in the order the curator adds works. Removing a work renumbers the rest.
- **Editing person details** (birth year, death year, bio). The form creates a person with a name only. Existing seed people show their dates and bio.
- **Person photos.** No photo field, no photo upload, no placeholder photo.
- **Session-expiry form preservation.** An expired session redirects to login and the form data is lost.
- **Server-side idempotency for double submits.** The submit button is disabled while the request is pending; that is the whole guarantee.
- Password reset, rate limiting, account lockout.
- Merging duplicate people or works.
- Server-side rendering for SEO. Public catalog pages will need it later, not in the MVP.
- Character index (later): link works to characters, e.g. "all books about Sherlock Holmes". A real wish, not for the MVP.
- Responsive/mobile layout and a browser-support matrix. The MVP targets a current desktop browser.
- Series/cycles, place of publication, page count, price.

### MVP rules

- One author per work. One work never exists without an edition.
- A person is created only together with an edition, so every person has at least one credit.
- An edition always has at least one Contents entry.
- ISBN is optional, is not unique and never identifies an edition. Duplicate ISBNs are allowed.
- The catalog shows the **work year**, never the edition year.
- Sorting is deterministic (section 5.0).
- The catalog cover comes from the earliest ISBN edition (section 5.0).
- Sessions last 7 days.

---

## 5. Acceptance criteria

### 5.0 Test conventions

These conventions make the criteria repeatable.

- **Database:** tests start from an empty database, run the seed once, then run the test. The seed is idempotent. E2E uses its own database; tests that change data create unique records and do not assume the seed counts afterwards.
- **Credentials:** the curator email and password come from `CURATOR_EMAIL` and `CURATOR_PASSWORD`. `.env.example` documents the variable names with fake values.
- **Sorting comparator:** every "A–Z" comparison uses
  `new Intl.Collator('en', { sensitivity: 'base', numeric: true }).compare(a, b)`.
  If it returns 0, compare the record ids as strings (`a < b`). Leading articles are **not** ignored: "The Great Silence" sorts under T. `2001: A Space Odyssey` sorts before letters. Case and diacritics do not matter; ties break by id.
- **Server-side order:** the API returns lists already sorted. The UI must not re-sort catalog rows, edition rows, Contents, cast groups or person groups.
- **Loading:** every page shows `Loading…` while it waits for the API.
- **Page errors:** every page that fails to load shows `Could not load the catalog.`, `Could not load the work.`, `Could not load the edition.` or `Could not load the person.` plus a button labelled `Try again` that repeats the request. A page never stays blank.
- **404:** an unknown id shows `Work not found.`, `Edition not found.` or `Person not found.` plus a link labelled `Back to the catalog`. The API answers `404`.
- **Unknown route:** any other URL shows `Page not found.` plus a link labelled `Back to the catalog`. The API does not serve unknown `/api` routes.
- **Malformed ids:** a malformed or unknown id is treated as not found (`404`), never as a server error.
- **Covers:** the URL is
  `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false`.
  If there is no ISBN, or the image fails to load, show a placeholder with the text `No cover`. Images use the alt text `Cover of {title}`.
- **External services in tests:** tests never depend on Open Library. They assert the `src` URL and simulate an image error for the placeholder.
- **500:** API tests simulate internal failures. E2E does not need to trigger a real `500`.
- **Empty catalog:** an integration test resets the database without the seed. E2E does not delete seed data.
- **Test fixtures:** cases marked *test fixture* are created by the test itself (via the API or the form), not by the seed.

### Story 1 — browse the works catalog

- **Given** the seed catalog, **when** a guest opens `/`, **then** all 23 works are listed once each, ordered by display title with the comparator from 5.0, and every row shows the display title as a link, the author name as a link, the work year and the genre names.
- **Given** a work with several editions, **when** it appears in the catalog, **then** its cover comes from the edition with the earliest year that has an ISBN. If several editions share that year, compare publisher A–Z with 5.0, then id. Example: *Klara and the Sun* uses the 2021 Alfred A. Knopf edition (`9780593318171`), not Faber & Faber or Видавництво Старого Лева.
- **Given** a cover that Open Library does not have, **then** the row shows `No cover` and still renders completely.
- **Given** a work whose editions have no ISBN (*test fixture*), **then** the row shows `No cover` and still renders completely.
- **Given** a work whose common title differs from its original title, **when** it appears in the catalog, **then** only the display title is shown; the original title belongs on the work page.
- **Given** an empty catalog, **when** a guest opens `/`, **then** the page shows `No works in the catalog yet.` and no error.
- **Given** the API request fails, **when** the catalog loads, **then** the page shows `Could not load the catalog.` with `Try again` and never stays blank.
- The catalog has the heading `Works`.

### Story 2 — open a work

- **Given** the work *Solaris*, **when** a guest opens `/works/{id}`, **then** the page shows:
  - the display title as the heading;
  - `Original title: Solaris` only when it differs from the display title;
  - `Year: 1961`;
  - `Original language: Polish`;
  - `Genres: Science fiction, Philosophical fiction` (names sorted A–Z);
  - the author as a link to the person page;
  - the synopsis under the heading `Synopsis`;
  - all 4 editions, ordered by year ascending, then publisher A–Z, then id: *Solaris* (Wydawnictwo MON, 1961), *Solaris* (Walker and Company, 1970), *Соляріс* (Навчальна книга – Богдан, 2017), *Едем. Соляріс. Повернення із зірок. Непереможний. Том 1* (Навчальна книга – Богдан, 2025). An anthology that contains the work counts as one of its editions.
- **Given** an edition row on a work page, **then** it shows the edition title as printed as a link to the edition page, the publisher, the year, the language name and a cover thumbnail (section 5.0).
- **Given** the work *Return from the Stars*, **then** the heading is `Return from the Stars` and `Original title: Powrót z gwiazd` is shown.
- **Given** a work without a synopsis, **then** the page shows `No synopsis yet.` instead of an empty section.
- **Given** an edition whose ISBN is missing, **then** its row shows `No cover`.
- **Given** an id that is not a work, **when** a guest opens the work page, **then** `Work not found.` is shown with `Back to the catalog` and the API answers `404`.
- **Given** the API request fails, **then** `Could not load the work.` and `Try again` are shown.

> The seed has no work with several authors; the MVP does not support them.

### Story 3 — open an edition

- **Given** the edition *Едем. Соляріс. Повернення із зірок. Непереможний. Том 1*, **when** a guest opens `/editions/{id}`, **then** the page shows:
  - the title as the heading;
  - `Publisher: Навчальна книга – Богдан`;
  - `Year: 2025`;
  - `Language: Ukrainian`;
  - `ISBN: 9789661045353` (normalized, no spaces or hyphens);
  - `Contents` as an ordered list in position order: *Eden*, *Solaris*, *Return from the Stars*, *The Invincible*, each title as a link to the work page;
  - `Cast` grouped by credit role.
- **Given** an edition with several credits, **then** the cast is grouped by credit role in the fixed order `translator`, `editor`, `foreword`, `introduction`, `afterword`, `illustrator`, `cover-artist`, `designer`; only roles with people are rendered; names are ordered A–Z with 5.0 and each links to the person page. Example: *Нейромант* (2017) renders Translator, Editor, Foreword, Designer in that order.
- **Given** the edition *Solaris* (Wydawnictwo MON, 1961) without an ISBN, **then** the ISBN line shows `No ISBN.` and the cover is `No cover`.
- **Given** an edition without a publisher, **then** the publisher line shows `No publisher.`
- **Given** the edition *Klara and the Sun* (Alfred A. Knopf) without credits, **then** `Cast` shows `This edition has no credits yet.` and no role groups.
- **Given** a work in Contents whose original language differs from the edition language, **then** the work is marked as translated and its original language is named: `Solaris — translated from Polish`. The marker uses the work's display title.
- **Given** two editions with very similar data (*Нейромант*, 2017 and 2020), **when** a guest opens one of them, **then** exactly that edition is shown: pages are opened by id, never found by title or year.
- **Given** an id that is not an edition, **when** a guest opens the edition page, **then** `Edition not found.` is shown with `Back to the catalog` and the API answers `404`.
- **Given** the API request fails, **then** `Could not load the edition.` and `Try again` are shown.

### Story 4 — open a person

- **Given** *Ted Chiang*, **then** `Author of` lists his 9 works with their year, ordered by year, then display title, then id; no edition-credit group is rendered. Each work links to its page.
- **Given** *Дмитро Андрухів*, **then** both editions appear under `Translator`, ordered by edition year, then title, then id: *Соляріс* (2017), *Едем. Соляріс. Повернення із зірок. Непереможний. Том 1* (2025). Each edition links to its page.
- **Given** a person without born, died or bio (*Дмитро Андрухів*), **then** the page shows the name and the credit groups, and no dates block and no bio block.
- **Given** a person with both years (*Stanisław Lem*), **then** `1921–2006` is shown, and the bio under the heading `Bio`.
- **Given** a person with only a birth year (*Kazuo Ishiguro*), **then** `born 1954` is shown.
- **Given** a person with only a death year (*test fixture*), **then** `died 2006` is shown.
- **Given** a person with neither year, **then** no dates are shown.
- **Given** a person who is an author of a work and also credited on an edition (*test fixture*), **then** both groups appear, work credits (`Author of`) before edition credits.
- **Given** an id that is not a person, **when** a guest opens the person page, **then** `Person not found.` is shown with `Back to the catalog` and the API answers `404`.
- **Given** the API request fails, **then** `Could not load the person.` and `Try again` are shown.

> Every person has at least one credit because people are created only as part of an edition; there is no empty person page in the MVP.

### Story 5 — log in and log out

- **Given** the seeded curator email and password, **when** they submit the login form, **then** the session starts, the header shows the email and `Log out`, and the create-edition page opens when the guest was sent there.
- **Given** a guest logs in from the header without a return path, **then** they land on the catalog.
- **Given** a logged-in curator opens `/login`, **then** they are sent to the catalog.
- **Given** a wrong password or an unknown email, **when** the form is submitted, **then** `Wrong email or password.` is shown, no session is created, and the message is the same for both cases.
- **Given** an empty email or an empty password (after trimming the email), **when** the form is submitted, **then** `Email is required.` or `Password is required.` appears next to that field and no request is sent.
- **Given** an email that is not a valid address, **then** `Enter a valid email address.` appears next to the email field and no request is sent.
- **Given** the login API answers `500`, **then** `Could not log in.` is shown and the form stays filled.
- **Given** a logged-in curator who reloads the page or restarts the browser within 7 days, **then** they are still logged in. The session cookie lasts 7 days.
- **Given** a logged-in curator, **when** they click `Log out`, **then** the session ends, the header shows `Log in`, and the create-edition page redirects to the login page again.
- **Given** a guest, **when** they open `/editions/new`, **then** they are sent to `/login?returnTo=/editions/new` with `Log in to add an edition.` and after a successful login they land on the create-edition page.
- **Given** the session expired while the form was open, **when** the curator submits, **then** the API answers `401`, the browser goes to the login page with `Your session expired. Log in again.`, and the form data is lost. After logging in they return to `/editions/new` with an empty form.
- **Given** a logged-in user without the `curator` role (*test fixture*), **when** they call the create endpoint, **then** the API answers `403` with `You do not have permission to add an edition.`
- **Given** any page, **then** the header shows `BookCast` linking to `/`. A guest sees `Log in`. A curator sees the email, `Add an edition` (linking to `/editions/new`) and `Log out`.
- **Given** login succeeds or a redirect happens, **then** focus moves to the page heading.

### Story 6 — add an edition from existing records

- **Given** a logged-in curator, **when** they submit a valid form (title, year, language, one existing work, one existing translator, optional publisher and ISBN), **then** `/editions/{id}` opens with the banner `Edition added.`, the edition appears on its work page and on the translator's person page, and no new work or person was created.
- **Given** the form, **then** it has the heading `Add an edition`, the sections `Edition`, `Contents` and `Cast`, and the labels `Title`, `Publisher`, `Year`, `Language`, `ISBN`, `Work`, `Role`, `Person`.
- **Given** the curator types `solar` in the work picker, **then** up to 10 matching works are suggested, each showing display title, year and author names; matching is a case-insensitive substring of `originalTitle` or `commonTitle`, ordered by display title with 5.0. Picking one reuses that work.
- **Given** the curator types a name in the person picker, **then** up to 10 matching people are suggested, each showing name and, when present, `born–died`; matching is a case-insensitive substring of the name, ordered by name with 5.0.
- **Given** a work picker with no matches, **then** it shows `No matches` and offers `Create new work`.
- **Given** a person picker with no matches, **then** it shows `No matches` and offers `Create new person`.
- **Given** the curator types a title that exactly matches an existing work (case-insensitive, trimmed) but does not pick the suggestion, **then** nothing is created; a new work is created only after they choose `Create new work`. The app never reuses or creates a record silently.
- **Given** the curator types a name that exactly matches an existing person but does not pick the suggestion, **then** the same rule applies: only `Create new person` creates a person.
- **Given** Contents has more than one work, **then** the curator can add and remove rows; positions are 1..n in add order and are renumbered after a removal. Reordering is not available.
- **Given** the same work twice in Contents, **then** `This work is already in Contents.` is shown and nothing is saved.
- **Given** no work in Contents, **then** `Add at least one work.` is shown and nothing is saved.
- **Given** the same person with the same credit role twice in the cast, **then** `This person already has this role in this edition.` is shown and nothing is saved.
- **Given** the title, the year, the language or the contents of the edition are missing, **when** the form is submitted, **then** each missing field shows its error (`Title is required.`, `Year is required.`, `Language is required.`, `Add at least one work.`), the submit is refused and nothing is saved.
- **Given** a title longer than 300 characters or a publisher longer than 200 characters, **then** `Title must be at most 300 characters.` or `Publisher must be at most 200 characters.` is shown and nothing is saved.
- **Given** a year that is not a whole number between 1000 and 2100, **then** `Year must be a whole number between 1000 and 2100.` is shown and nothing is saved.
- **Given** an ISBN that is neither ISBN-10 nor ISBN-13, or whose check digit is wrong, **then** `ISBN must be a valid ISBN-10 or ISBN-13.` is shown next to the ISBN field and nothing is saved.
- **Given** an ISBN typed with spaces or hyphens, **then** it is accepted and stored without them; `X` is stored in upper case. A valid ISBN-10 such as `0-306-40615-2` is accepted.
- **Given** an ISBN that already exists on another edition, **then** it is accepted; ISBN is not unique.
- **Given** no publisher and no ISBN, **then** the edition is saved and its page shows `No publisher.` and `No ISBN.`
- **Given** the API answers `500`, **when** the curator submits, **then** everything entered stays in the form and `Could not save the edition.` is shown; no work, person or edition is saved.
- **Given** the curator submits twice quickly, **then** the `Save edition` button is disabled while the request is pending and exactly one edition is created.
- **Given** a request to create an edition without a session, **then** the API answers `401` and no edition is created.
- **Given** any validation error from the API, **then** the field errors match the messages above and nothing is saved. Saving is atomic: one transaction creates the edition, its Contents and its cast, or nothing.

### Story 7 — create a work or a person inside the form

- **Given** the curator chooses `Create new work`, **then** a form with `Original title`, `Common title`, `Year`, `Original language`, `Genres` and `Author` opens. `Original title`, `Year`, `Original language`, at least one genre and one author are required. `Common title` is optional and, when set, must differ from the original title.
- **Given** the curator chooses `Create new person`, **then** a form with the label `Name` opens. Name is required, 1–200 characters after trimming. Dates, bio and photo are not entered in the MVP.
- **Given** a new work with a new author created in the same form, **then** the work and the person are created, the work is in Contents, the person page shows the work under `Author of`, and the edition's cast stays empty unless a credit was added.
- **Given** an existing person chosen as the author of a new work, **then** the work is created and that person's page shows it; no new person is created.
- **Given** an existing work chosen for Contents, **then** it is reused and no new work is created.
- **Given** a new work without a genre, **then** `Select at least one genre.` is shown and nothing is saved.
- **Given** a new work without an author, **then** `Choose an author.` is shown and nothing is saved.
- **Given** a common title equal to the original title, **then** `Common title must differ from the original title.` is shown and nothing is saved.
- **Given** a new person with an empty name, **then** `Name is required.` is shown and nothing is saved.
- **Given** a failed save after a new work or person was entered, **then** no work, person or edition is saved (atomic).
- **Given** a successfully created work, **then** it appears in the catalog after the save and obeys the catalog rules in Story 1.

### Story 8 — cross-cutting UI rules

- Every page has the header from Story 5.
- Every link is a real link (`<a>`) to the URL named in this file.
- Every form control has a visible label.
- Every field error is associated with its field (`aria-describedby`) and announced (`role="alert"`).
- The work and person pickers are comboboxes with keyboard support: `ArrowDown`/`ArrowUp` move through suggestions, `Enter` picks, `Escape` closes.
- Every image has alt text; the placeholder has the text `No cover`.
- After a page loads or a redirect finishes, focus is on the page heading.
- The MVP targets a current desktop browser; responsive layout is out of scope.

---

## 6. Data

The MVP stores the entities below. A catalog is built only from them: works and people are created together with an edition, never on their own page.

### 6.1 Identifiers

- Every **person**, **work**, **edition** and **user** has a synthetic `id`: a UUID generated by the server when the record is created. It is never typed by a human and never shown as a label in the UI; it is used in URLs and in references between records.
- Records that join two entities (contents entries, work credits, edition credits, work genres, user roles) have no id of their own: they are identified by the combination of the ids they join.
- Dictionary entries (genres, credit roles, languages) are identified by their stable `key`; the UI shows their `name`.
- Nothing in the app looks a record up by its name or title: two people may share a name and two works may share a title.
- A malformed or unknown id is a `404`, not a validation error.

### 6.2 Person

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `id` | UUID | yes | generated by the server |
| `name` | string | yes | 1–200 characters after trimming; need not be unique |
| `born` | integer (year) | no | 1000–2100 |
| `died` | integer (year) | no | 1000–2100; not earlier than `born` when both are set; empty for a living person |
| `bio` | string | no | at most 2000 characters |

- A person has no login. The seed's 20 people with only a name are valid records.
- The MVP form creates a person with a name only. `born`, `died` and `bio` are filled by the seed (or a test fixture) and displayed.
- There is no photo field in the MVP.

### 6.3 Work

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `id` | UUID | yes | generated by the server |
| `originalTitle` | string | yes | 1–300 characters after trimming: the title in the language the work was written in |
| `commonTitle` | string | no | 1–300 characters; the best-known English title; set only when it differs from `originalTitle`, otherwise empty |
| `year` | integer (year) | yes | 1000–2100 |
| `originalLanguage` | language key | yes | one of the language dictionary keys |
| `synopsis` | string | no | at most 4000 characters |
| `genres` | list of genre keys | yes | at least 1, no duplicates, every key in the genre dictionary |
| `authors` | list of person ids | yes | exactly 1 in the MVP; the person must exist |

- **Display title** = `commonTitle` when it is set, otherwise `originalTitle`. It is what the catalog, lists and the Contents use. The original title is shown as an extra line on the work page when the two differ.
- Examples from the seed: *Solaris* (`originalTitle` "Solaris", no `commonTitle`, original language `pl`); *Return from the Stars* (`originalTitle` "Powrót z gwiazd", `commonTitle` "Return from the Stars"); *R.U.R.* (`originalTitle` "R.U.R. (Rossumovi Univerzální Roboti)", `commonTitle` "R.U.R.").
- A work never exists without at least one edition.

### 6.4 Work credit

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `workId` | UUID | yes | an existing work |
| `personId` | UUID | yes | an existing person |
| `role` | credit role key | yes | must be a work-level credit role: `author` in the MVP |

- Every work has exactly one `author` credit in the MVP. The table allows more rows so multi-author works can be added later; the MVP does not create them and there is no `co-author` role.

### 6.5 Edition

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `id` | UUID | yes | generated by the server |
| `title` | string | yes | 1–300 characters after trimming; the title as printed on this edition, which may be a translation |
| `publisher` | string | no | at most 200 characters |
| `year` | integer (year) | yes | 1000–2100 |
| `language` | language key | yes | one of the language dictionary keys |
| `isbn` | string | no | after removing spaces and hyphens: 10 characters (9 digits and a digit or `X` in the last place) or 13 digits; the check digit must be valid; stored without spaces and hyphens, with `X` in upper case |

- The ISBN is optional, is not unique and does not identify an edition (10 seed editions have none; duplicate ISBNs are allowed). It is used only to show a cover.
- `publisher` is optional, although every seed edition has one.
- There is no cross-check between an edition's year and its works' years.

### 6.6 Contents entry

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `editionId` | UUID | yes | an existing edition |
| `workId` | UUID | yes | an existing work, at most once per edition |
| `position` | integer | yes | 1–999; unique inside the edition; the UI assigns 1..n in add order and renumbers after a removal |

- An edition needs at least one contents entry. The order of Contents is ascending `position` and it is the order the works are printed in.
- The same work may appear in many editions.
- The MVP has no reordering.

### 6.7 Edition credit

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `editionId` | UUID | yes | an existing edition |
| `personId` | UUID | yes | an existing person |
| `role` | credit role key | yes | must be an edition-level credit role (see 6.8) |

- No duplicate (`editionId`, `personId`, `role`). One edition may have several people in one role (the seed's omnibus has five translators). One person may have several different roles on one edition.
- An edition may have no credits at all. A work's author may also be credited on the edition.

### 6.8 Dictionaries (fixed)

**Genre** — `key` (slug, unique, stable), `name` (string). The seed has 9: `science-fiction`, `hard-science-fiction`, `cyberpunk`, `space-opera`, `dystopia`, `literary-fiction`, `philosophical-fiction`, `drama`, `fantasy`.

**Credit role** — `key`, `name`, `level` (`work` or `edition`). Fixed list:

| Level | Keys |
| --- | --- |
| `work` | `author` |
| `edition` | `translator`, `editor`, `foreword`, `introduction`, `afterword`, `illustrator`, `cover-artist`, `designer` |

**Language** — `key` = ISO 639-1 two-letter code, `name` (English name). The seed uses `en` English, `pl` Polish, `cs` Czech, `uk` Ukrainian. A work's `originalLanguage` and an edition's `language` come from this dictionary; adding a language is a data change, not a UI feature.

### 6.9 User

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `id` | UUID | yes | generated by the server |
| `email` | string | yes | valid email address, at most 254 characters, unique, compared ignoring case |
| `passwordHash` | string | yes | never returned by the API |
| `roles` | set of user role keys | yes | at least one; the MVP has only `curator` |

- Users are not created in the UI: the seed script creates the first curator from `CURATOR_EMAIL` and `CURATOR_PASSWORD`.
- Sessions last 7 days; see `docs/architecture.md`.

### 6.10 Not stored in the MVP

- **Covers** are not files: the URL is derived from the ISBN, and `No cover` is shown when there is no ISBN or no cover. **Person photos** are not part of the MVP.
- **My book** (owned, wishlist, read) is planned, not part of the MVP: see `docs/features/my-library.md`.
- Series/cycles, place of publication, page count, price, ratings and reviews are not stored.

### 6.11 Seed

`data/seed.json` holds the sample catalog: 31 people (11 of them authors), 23 works, 31 editions, 9 genres, 9 credit roles and 4 languages. It also carries explicit `id` values and references works and people by those ids, so a record with a homonym stays unambiguous. It must stay consistent with this section: if a field changes here, the seed changes with it.

The seed has no multi-author work and no person photos; both are out of MVP scope.

---

## 7. Resolved decisions

These were open questions in the draft; the defaults below are now binding.

1. **Co-author / multiple authors.** One work-level role `author`; exactly one author per work in the MVP. Multi-author works and the `co-author` role are out of scope.
2. **Duplicates.** Nothing is unique: two people may share a name, two works a title, and the same edition may be created twice. ISBN is not unique either. The pickers suggest existing records but never block a new one; a record is created only by an explicit `Create new …` action.
3. **Seeding by id.** The seed matches records by the explicit ids in `data/seed.json`. Natural keys are not used.
4. **Publisher.** Optional. All 31 seed editions have one; the form accepts an empty publisher.
5. **Year rules.** No cross-check between an edition's year and its works' years. Both accept 1000–2100. A future year is not blocked.
6. **Periodical issues.** *The Oxford and Cambridge Review, November 1909* is stored as an edition; no special handling.
7. **Cover choice.** Earliest edition with an ISBN; ties by publisher A–Z (5.0), then id. No "main edition" flag in the MVP.
8. **ISBN.** Optional, validated (ISBN-10/13 + check digit), not unique and never an identity; used only for the cover.
9. **Languages.** Fixed dictionary of four in the seed; adding a language is a data change. The UI does not offer all ISO 639-1 codes.
10. **Images.** No person photos. Covers are derived from the ISBN; no upload, no file storage.
11. **Series.** Not stored; out of scope.
12. **Merging duplicates.** Out of scope.
13. **Catalog year.** The work's year.
14. **Catalog order.** Display title with the comparator in 5.0; leading articles are not ignored; ties by id.
15. **Cover tie.** Publisher A–Z, then id. Example: *Klara and the Sun* uses Alfred A. Knopf.
16. **Session lifetime.** 7 days, persistent cookie; reload and browser restart keep the session.
17. **Expired session on submit.** Redirect to login with `Your session expired. Log in again.`; form data is lost. This is deliberate.
18. **Double submit.** The submit button is disabled while the request is pending. There is no server-side idempotency key in the MVP.
19. **Atomicity.** Creating an edition creates the edition, its Contents, its cast and any new works/people in one transaction. A failure saves nothing.
20. **Validation.** Hand-written validators in the API; no validation library. Field messages are part of the contract (section 5).
21. **API.** The endpoints and response shapes are in `docs/architecture.md`; the acceptance criteria use them.
22. **Reordering.** Out of scope; positions are assigned in add order.
23. **Person details.** Displayed from the seed; the create form saves a name only. Photos are out.
24. **Accessibility.** Labels, associated errors, keyboard support for the pickers, alt text and focus management are part of the MVP (Story 8).
