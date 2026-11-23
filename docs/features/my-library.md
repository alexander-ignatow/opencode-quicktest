# Feature: My library

> **Status:** planned — after the MVP (guide Step 7). Written together with the MVP brief, so the MVP architecture does not block it. Do **not** implement it as part of the MVP.

## Idea

Visitors can register as **readers** and keep a personal library: the editions they own, want and have read.

## User stories

1. As a visitor, I want to register and log in as a reader so that I can keep my own library.
2. As a reader, I want to mark an edition as **owned**, **wishlist** and/or **read** from the edition page.
3. As a reader, I want a "My library" page that lists my books and filters them by these marks.

## Rough acceptance criteria

- The three marks are independent: a book can be read but not owned, owned and wished, etc.
- Removing all marks removes the book from my library.
- Only I can see and change my library.
- A curator can also be a reader: roles are added to a user, they do not replace each other.
- Guests see no library controls; the edition page asks them to log in.

## What it touches

| Area | Change |
| --- | --- |
| Auth | Registration; new role `reader` |
| Data | New entity "my book": user + edition + `owned`, `wishlist`, `read`; one row per user and edition |
| API | Endpoints to read and update my library; access only for the owner |
| UI | Marks on the edition page, "My library" page, register form |

## What the MVP must prepare (and nothing more)

- Users have a **set of roles**, not a single `role` field.
- Data that belongs to a person points to the **user** (`user_id`); roles only decide what a user may do.

## Later, not in this feature

- Ratings: a rating belongs to the **work**, while "my book" is an edition — needs its own design.
