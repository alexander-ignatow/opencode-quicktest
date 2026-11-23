# Glossary

> **Status:** MVP. Every agent reads this file before every task. Use these exact words in code, UI texts and tests.

The words of BookCast and what exactly they mean here. Pairs that are easy to mix up are marked in the third column.

| Term | Meaning in this app | Not to be confused with | In code |
| --- | --- | --- | --- |
| Work | A piece of writing as its author created it — a novel, a story, a play — independent of how it was published. | Edition | `works`, `Work` |
| Edition | A concrete published book: title, publisher, year, language, optional ISBN. Contains one or more works, in order. | Work; a single copy of a book | `editions`, `Edition` |
| Contents | The ordered list of works inside an edition. | Cast | `edition_works` |
| Person | A real person who took part in a work or an edition (author, translator, ...). Has no login. | User | `people`, `Person` |
| Author | A person credited on a **work**. Every work has at least one author. | Edition credits (translator, editor, ...) | work credit with role `author` |
| Credit | A person + a credit role, attached to a work (work credit) or to an edition (edition credit). | User role | `work_credits`, `edition_credits` |
| Credit role | What a person did: `author` on a work; `translator`, `editor`, `foreword`, `introduction`, `afterword`, `illustrator`, `cover-artist`, `designer` on an edition. Fixed dictionary. | User role | `CreditRole` |
| Cast | All edition credits of one edition, shown like the cast of a film. Optional: an edition may have none. | Authors (they belong to the work) | UI term only |
| Editor | A **credit role**: the person who edited an edition. Catalog data. | Curator — a *user* who edits the catalog | credit role `editor` |
| Genre | A category from a fixed dictionary. A work has one or more genres. | — | `genres`, `work_genres` |
| Publisher | The company that published an edition. Plain text in the MVP, not an entity. | Person | `editions.publisher` |
| ISBN | Optional book number of an edition. Does not exist for editions before about 1970, so it never identifies an edition. | Edition identity | `editions.isbn` |
| User | An account that can log in to BookCast. | Person | `users`, `User` |
| User role | What a user may do in the app. A user can have several. MVP: `curator`; planned: `reader`. | Credit role | `user_roles` |
| Curator | A user who adds editions to the catalog. | Editor (credit role) | user role `curator` |
| Guest | Anyone browsing the catalog without logging in. Not stored. | Reader | — |
| Reader *(planned)* | A registered user with a personal library. See `docs/features/my-library.md`. | Guest; a person in the catalog | user role `reader` |
| My book *(planned)* | A reader's marks on one edition: owned, wishlist, read. | Edition | `my_books` |
| Seed | The sample catalog in `data/seed.json`, loaded by `npm run db:seed`. | Migration (changes the schema, not the data) | `db:seed` |
