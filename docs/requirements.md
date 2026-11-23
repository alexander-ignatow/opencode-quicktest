# Product Requirements

> **Status:** draft (brief). Acceptance criteria and data details come in Step 4.

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
- **Curator** — a logged-in user who adds editions to the catalog. Curator accounts are created by the seed script; there is no registration in the MVP.

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
  - **work credits** (who wrote the work): author, co-author;
  - **edition credits** (who made this edition): translator, illustrator, editor, compiler, cover artist.
- PostgreSQL database with migrations.
- **Seed data**: a realistic catalog, so the app is never empty. Public-domain books only, e.g. Sherlock Holmes stories and collections (one story appears in several editions) and Ukrainian classics.

### Out of scope

- Editing or deleting anything (create only).
- Registration, readers and personal libraries — planned next feature: `docs/features/my-library.md`.
- Ratings and reviews.
- Cover image upload.
- Search, filters, pagination.
- Merging duplicate people or works.

## 5. Acceptance criteria

<!--
For each user story, list checks that prove it works. They become your tests.

Story 1:
- Given ..., when ..., then ...
- ...
-->

## 6. Data

<!--
What information does the application store or show? List the main entities and their fields.
Example: Task — title (required, max 100 characters), due date (optional), done (true/false).
Where the data is stored is an architecture decision: see docs/architecture.md.
-->

## 7. Open questions

- Is the list of credit roles above final?
- Which edition fields are required (ISBN? language?)
- Person details: name only, or also years of life and a short bio?
- Work details: original language and year of writing — required or optional?
