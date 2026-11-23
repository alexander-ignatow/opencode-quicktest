# Frontend

React 19 with TypeScript, Vite and Tailwind CSS 4, in `apps/web`. Data comes from the API through relative `/api/...` URLs (see `README.md`); what each page shows is specified in `docs/requirements.md`.

## Structure

```
apps/web/src/
  main.tsx, App.tsx       entry, router + layout (header, logout, outlet)
  api/                    typed calls per resource; the only modules that call fetch
  hooks/                  useResource, useAuth, useCreateEdition as needed
  components/             files added when a second use justifies them
  pages/                  WorksCatalogPage, WorkPage, EditionPage, PersonPage,
                          LoginPage, NotFoundPage
  features/add-edition/   AddEditionPage and only the files the form needs
```

This is a folder map, not a file checklist. Add files when the code needs them, never "for later".

- Zod schemas used by forms live in `apps/web`; API response types are declared locally from the endpoint contracts in `backend.md`. There is no shared package for now.
- One layout in `App.tsx`; routes `/`, `/works/:slug`, `/editions/:slug`, `/people/:slug`, `/editions/new`, `/login`, plus a catch-all that renders the not-found page with a link to the catalog.
- `/editions/new` is guarded: no session → redirect to `/login?next=/editions/new`; after a successful login the app uses `next` when it is a local path, otherwise `/`. A `401` from `/api/auth/me` means guest, not a retryable error. A logged-in curator opening `/login` is sent to `/`.

## Rules

- **Three states per screen:** `useResource` gives loading / error / empty; the page renders a visible loading state, an error with a retry that refetches, and an explanatory message when a list is empty. Never a blank or half-filled page.
- **Only `api/` calls `fetch`.** Components never build URLs. Errors become a typed `ApiError` (`code`, `message`, `fields`, `details`).
- **Forms:** every form, including login, uses `react-hook-form` with a Zod resolver local to `apps/web`. Field errors from the client and from a `400` body are placed by the same path. A failed save keeps everything the user typed. Cancel and leaving the page save nothing (nothing is sent).
- **Accessibility:** semantic HTML, every input labelled, keyboard for every control, `role="status"` for async changes, placeholder text announced to screen readers (`alt`), focus moves to the first invalid field on submit.
- **Images:** the cover component builds the Open Library URL from the ISBN and swaps to the placeholder on `error`; the photo component swaps to initials on `error`. No image is stored or uploaded.
- **Words:** UI texts use `docs/glossary.md` terms exactly — "Contents", "Cast", "Author", "Edition", "Work", "Curator".
- **Responsive:** small screens first, then `sm:` / `md:` breakpoints.
- **No dependency without a decision.** The approved set is `react-router-dom`, `react-hook-form`, `zod` (local to `apps/web`) and the existing stack. No component library, no state manager, no data-caching library.

## Reuse rules

- Extract a component or helper when the **second** place needs it — not in advance, and not "for later". Keep a rule next to its first consumer until then.
- `components/ui/`, if it exists, stays generic and takes primitives (strings, booleans, children), never an entity. Domain rendering stays out of it.
- A page composes; it does not fetch and format at the same time.
- One hook per concern: `useResource` for reads, `useCreateEdition` for the create flow, `useAuth` for the session. Do not create a second way to do the same thing.
- Ordering: the catalog order comes from the API; a work's editions are ordered by year ascending, then title, then publisher with a missing publisher last; credit groups use `credit_roles.position` with people ordered by name. Test the order where it is implemented.

## Tests

- Vitest + React Testing Library next to the component (`*.test.tsx`), queries by role, label or text, `fetch` mocked with `vi.stubGlobal`.
- Every page: loading, success, error with retry, empty. Every form: field errors, server error keeping data, happy path. The autocomplete combobox gets keyboard tests (arrows, Enter, Escape, announcements).
