# Glossary

> **Status:** MVP. Every agent reads this file before every task. Use these exact words in code, UI texts and tests.

The words of BookCast and what exactly they mean here. Pairs that are easy to mix up are marked in the third column.

| Term | Meaning in this app | Not to be confused with | In code |
| --- | --- | --- | --- |
| Work | A piece of writing as its author created it — a novel, a story, a play — independent of how it was published. | Edition | `works`, `Work` |
| Catalog | The public A–Z list of works at `/`. Each row is a work, not an edition. | Contents (works inside one edition) | UI term only |
| Original title | The title of a work in the language it was written in. Required on every work. | Common title; the title of an edition | `works.originalTitle` |
| Common title | The title a work is best known by in English, stored only when it differs from the original title. | Original title; the title of an edition | `works.commonTitle` |
| Display title | What the app shows for a work: its common title when one is set, otherwise its original title. | The title of an edition | UI term only |
| Synopsis | A short description of a work's story. Optional. | Bio (about a person) | `works.synopsis` |
| Edition | A concrete published book: title, publisher, year, language, optional ISBN. Contains one or more works, in order. | Work; a single copy of a book | `editions`, `Edition` |
| Cover | The image of an edition, derived from its ISBN (Open Library). Never stored; `No cover` if there is no ISBN or no image. | Contents; Cast | UI term only |
| Contents | The ordered list of works inside an edition. | Cast | `edition_works` |
| Translated work | A work whose original language differs from the edition language. Shown in Contents as `Display title — translated from Language`. | Edition language (where it was published) | UI term only |
| Position | Where a work sits in an edition's contents: a number starting at 1, unique inside the edition. Assigned 1..n in add order; the MVP has no reordering. | — | `edition_works.position` |
| Person | A real person who took part in a work or an edition (author, translator, ...). Has no login and no photo in the MVP. | User | `people`, `Person` |
| Bio | A short description of a person's life and work. Optional. | Synopsis (about a work) | `people.bio` |
| Author | A person credited on a **work**. Every work has exactly one author in the MVP. | Edition credits (translator, editor, ...) | work credit with role `author` |
| Credit | A person + a credit role, attached to a work (work credit) or to an edition (edition credit). | User role | `work_credits`, `edition_credits` |
| Credit role | What a person did: `author` on a work; `translator`, `editor`, `foreword`, `introduction`, `afterword`, `illustrator`, `cover-artist`, `designer` on an edition. Fixed dictionary. | User role | `CreditRole` |
| Cast | All edition credits of one edition, shown like the cast of a film. Optional: an edition may have none. | Authors (they belong to the work) | UI term only |
| Work picker / Person picker | The autocomplete inside the create-edition form. It searches existing works or people; it is not catalog search. | Catalog; Search | UI term only |
| Editor | A **credit role**: the person who edited an edition. Catalog data. | Curator — a *user* who edits the catalog | credit role `editor` |
| Genre | A category from a fixed dictionary. A work has one or more genres. | — | `genres`, `work_genres` |
| Language | A code from the fixed dictionary of ISO 639-1 codes — the language an edition is published in and the language a work was written in. | Genre (a category, not a language) | `languages`, `editions.language`, `works.originalLanguage` |
| Publisher | The company that published an edition. Plain text in the MVP, not an entity. | Person | `editions.publisher` |
| ISBN | Optional book number of an edition. Does not exist for editions before about 1970, so it never identifies an edition; duplicate ISBNs are allowed. | Edition identity | `editions.isbn` |
| User | An account that can log in to BookCast. | Person | `users`, `User` |
| User role | What a user may do in the app. A user can have several. MVP: `curator`; planned: `reader`. | Credit role | `user_roles` |
| Curator | A user who adds editions to the catalog. | Editor (credit role) | user role `curator` |
| Session | A logged-in user's server session, sent in the `bookcast_session` cookie and lasting 7 days. | User; Person | `sessions`, cookie |
| Guest | Anyone browsing the catalog without logging in. Not stored. | Reader | — |
| Reader *(planned)* | A registered user with a personal library. See `docs/features/my-library.md`. | Guest; a person in the catalog | user role `reader` |
| My book *(planned)* | A reader's marks on one edition: owned, wishlist, read. | Edition | `my_books` |
| Seed | The sample catalog in `data/seed.json`, loaded by `npm run db:seed`. | Migration (changes the schema, not the data) | `db:seed` |
