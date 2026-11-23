# Step 6. Add a feature

**Goal:** add one substantial feature to a working app without breaking it. This is what real development looks like: most of the time you change an existing system.

## 6.1 Pick the feature

Take the feature you planned in Step 2 (`docs/features/<feature-name>.md`), or pick another one. Substantial means it touches the frontend **and** the backend and needs real decisions, for example:

- statistics or a chart based on your data,
- search, filters and sorting,
- import / export (CSV, JSON),
- a calculation or recommendation specific to your domain,
- a shareable read-only link,
- data from a free public API.

## 6.2 Docs first

Update the requirements **before** any code. In OpenCode (**build**):

```text
I want to add the feature described in docs/features/<feature-name>.md.
First ask me 3–5 clarifying questions. Then update docs/requirements.md:
add the user story, acceptance criteria (including error cases) and any new data fields,
and move it from "Out of scope" to "In scope". Mark the feature file as "in progress". Do not write code.
```

**Expected agent behavior:** questions first, then changes only in `docs/requirements.md`. Review the diff and commit it on a new branch:

```bash
git switch -c feature/<short-name>
git add docs/requirements.md
git commit -m "Add requirements for <feature>"
```

## 6.3 Plan → implement → verify

Same loop as in Step 5, with extra attention to the existing code:

```text
/plan-feature The new user story "[story]" from docs/requirements.md.
Reuse the existing code where possible and list every existing file that will change.
Point out risks of breaking current features.
```

**Expected agent behavior:** the plan names existing files and tests to change, not only new ones, and mentions risks.

Then `/implement` (step by step), check in the browser, and `/verify`.

## 6.4 Ask for an explicit review

```text
Use the reviewer subagent to review all changes on this branch compared to main.
Focus on: bugs, missing tests, broken existing features, mismatch with docs/requirements.md.
```

**Expected agent behavior:** the reviewer reads the diff and returns findings ordered by severity with suggested fixes. It cannot change files. Fix what matters with the build agent, then run `/verify` again.

## 6.5 Update the docs and merge

```text
Check docs/architecture.md against the current code. Update the API endpoints table
and add decision log entries for decisions made in this feature. Do not change code.
```

Commit, push, open a pull request in your repository, merge.

## ✅ Result

- [ ] The feature works in the browser; old features still work.
- [ ] New tests cover the feature; `npm run verify` and `npm run test:e2e` pass.
- [ ] `docs/requirements.md` and `docs/architecture.md` describe the feature.
- [ ] A merged pull request with the feature in your repository.

Next: [Step 7. Deploy](07-deploy.md) (optional) or [Step 8. Portfolio](08-portfolio.md)
