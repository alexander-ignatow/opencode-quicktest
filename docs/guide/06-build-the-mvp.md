# Step 6. Build the MVP

**Goal:** a working MVP, built one user story at a time with the plan → implement → verify loop.

## 6.1 Why not "generate the whole app"

- The model forgets and contradicts itself when the change is large.
- One wrong idea early breaks everything built on top of it.
- You cannot review 2000 new lines. You can review 100.

Small steps + a check after each step = a reliable result. This matters even more with free models.

## 6.2 First: the data model in code and the seed

Your first "story" is technical, and it is the riskiest one: it turns `docs/architecture/data-model.md` into real code — the database schema, the first migration and the seed script that loads `data/seed.json`. Do it right after Step 5, before any user story, and give it time: setup problems (database connection, migrations, `.env`) all show up here. Every next story then has a real schema and real data, and goes much smoother.

```text
/plan-feature Implement the data model from docs/architecture/data-model.md as the database schema
and the first migration, and a seed script that loads data/seed.json, as decided in
docs/architecture/decisions.md (storage, seeding). Add npm scripts for generating and applying
migrations and for seeding. No API endpoints and no UI yet.
```

**Expected agent behavior:** the plan lists the schema files, the migration, the seed script and the npm scripts, and maps every part of `seed.json` to tables. If the mapping does not fit, the data model or the seed is wrong — fix the docs with the architect first.

Done when:

- the schema matches `docs/architecture/data-model.md`, and the migration is committed;
- `npm run db:seed` (or the name you chose) fills the database, and running it twice creates no duplicates;
- there is a test for the seed logic (for example, how one record of `seed.json` becomes rows).

## 6.3 The loop

Repeat for every user story:

```
branch → /plan-feature → review the plan → /implement → check in the browser → /verify → understand → commit
```

### 1. Create a branch

```bash
git switch -c feature/<short-name>
```

### 2. Plan

Start a fresh session (`/new`) for every story — a short context works better.

```text
/plan-feature User story 1 from docs/requirements.md: [paste the story].
Follow docs/architecture/.
```

**Expected agent behavior:** it runs as the read-only **plan** agent, reads the docs and code, and returns: frontend vs backend work, API endpoints (method, path, request, response, errors), acceptance criteria, small numbered steps, open questions. No files change.

### 3. Review the plan

Read it. Answer its open questions. If the plan contradicts `docs/architecture/` — a new library, another folder layout, a second way to do the same thing — stop: decide it with the **architect** first, then plan again. Push back if something is unnecessary:

```text
Drop the separate search endpoint — filter on the frontend, there will be few items.
Update the plan and show only the changed steps.
```

### 4. Implement

Switch to **build** (`Shift+Tab`), then:

```text
/implement
```

or one step at a time (recommended with free models):

```text
/implement Only step 1 of the plan: the backend endpoint with tests.
```

**Expected agent behavior:** it reads the plan and code, delegates to the `backend` / `frontend` subagents for larger parts, writes tests, runs `lint`, `typecheck`, `test`, `build`, and ends with a summary listing every check with a real PASS/FAIL. It does not commit.

If it asks for permission to run a command, read the command before you allow it.

### 5. Check in the browser

Run `npm run dev` yourself and click through the story. Try the error cases from your acceptance criteria. Do not trust "everything works" until you have seen it.

### 6. Verify

```text
/verify
```

**Expected agent behavior:** it runs all checks one by one, compares the result with the acceptance criteria, asks the `reviewer` subagent to review the changes, and reports a table with PASS / FAIL / NOT RUN plus review findings. It changes nothing.

Fix findings with a concrete prompt: "Fix finding 2 from the review. Then run the tests again."

### 7. Understand

```text
Explain how [the feature] works: from the click in the browser to the data on the server.
Name the files and functions involved.
```

You should be able to explain every part of your app in an interview.

### 8. Commit and merge

```bash
git status
git diff                 # read what changed
git add .
git commit -m "Add <feature>"
git push -u origin feature/<short-name>
```

On GitHub open a pull request **in your repository** and merge it. Then:

```bash
git switch main
git pull
```

## 6.4 When the agent gets stuck

1. Give it the **exact** error text: "`npm run test` fails with: ... Find the cause, explain it, fix it, run the tests again."
2. Undo a bad change: `/undo` in OpenCode, or `git restore .` (discards all uncommitted changes in tracked files).
3. Make the step smaller.
4. Check that the requirement is clear — vague requirements give vague code.
5. Start a fresh session with `/new`.
6. Try another free model with `/models`.
7. If the agent repeats the same mistake, add a short rule to `AGENTS.md`.

## ✅ Result

- [ ] The schema and migrations match the data model; the seed loads `data/seed.json`, and running it twice creates no duplicates.
- [ ] All MVP user stories work in the browser, including error and empty states.
- [ ] `npm run verify` and `npm run test:e2e` pass.
- [ ] At least one Playwright test covers the main user flow.
- [ ] `docs/architecture/` is up to date: API endpoints, data model, new decisions.
- [ ] Work is merged into `main` in small, meaningful commits.

Next: [Step 7. Add a feature](07-add-a-feature.md) (optional)
