# Demo plan

Presenter notes for the "AI-first full-stack development" webinar. Not part of the student guide.

## 0. Show the project structure — the template is a recommendation

Open the repository tree and walk through it top-down:

- `apps/web`, `apps/api`, `e2e/` — working React + Express app with tests, no product features.
- `docs/` — `requirements.md`, `architecture.md`, `glossary.md`, `features/`, `development.md`, `guide/` (and `demo/` here).
- `data/seed.json` — sample data.
- `.opencode/` — agents (`analyst`, `frontend`, `backend`, `reviewer`) and commands (`/plan-feature`, `/implement`, `/verify`); `AGENTS.md` and `opencode.jsonc` — rules and permissions every agent gets.
- `render.yaml`, `.env.example` — deploy scheme and the list of secrets.

Messages:

- **In the template, agents refer to files that do not exist yet** (`docs/features/`, `data/seed.json`, a filled `glossary.md`, `.env`). They appear step by step while you follow the guide. An empty file is a placeholder for a decision you have not made yet.
- **The template is my recommendation, not a rule.** Example: the seed does not have to be a JSON file — it can be instructions on where to get the data, or a database dump. Requirements could live in GitHub issues instead of a Markdown file.
- **Any file of the template can — and sometimes must — be changed for your project:** rules in `AGENTS.md`, agents and their permissions, commands, the docs structure.
- **This repo already differs from the template, and that is normal:** the moment a project starts, it goes its own way (BookCast glossary, deploy scheme, architecture decisions).
- **That is why there is no single "correct" template for an AI-assisted project today.** It depends on the domain, the architecture, the requirements and the team.

## 1. Explain the assignment

Open the template README and walk through the guide. Message: every step ends with a concrete, checkable result, and each result is the input for the next step.

1. **Setup** — create a repo with **Use this template**, install, run the app and tests, connect OpenCode with a free model.
   - Result: the app runs, tests pass, the agent answers the first prompt.
   - Demo: done before, show the result.
2. **Idea and scope** — in any AI chat: pick a unique idea, cut an MVP, plan the next feature, write a glossary and sample data.
   - Result: brief in `docs/requirements.md`, `docs/glossary.md`, `docs/features/<name>.md`, `data/seed.json`.
   - Demo: done before, tell about BookCast.
   - What collecting the sample data taught us (a good story for this step):
     1. ISBN is not a silver bullet: it exists only since about 1970, so older and historical editions (19th century and earlier) have none. ISBN cannot be the identity of an edition.
     2. Author uniqueness is an open question: how do we avoid duplicates ("A. C. Clarke" vs "Arthur C. Clarke", transliterations)?
     3. The cast needs non-standard roles (scientific editor, typeface designer, ...). In practice the whole cast became optional — only the author is required.
3. **Data, architecture and hosting** — from here on the work happens in OpenCode. Choose storage, seeding, the decisions the next feature depends on, hosting; connect the database.
   - Result: decision log in `docs/architecture.md`, `.env` + `.env.example`.
   - Demo: done before, tell about the stack and the deploy scheme.
4. **Requirements** — the **analyst** agent (can edit only `docs/` and `data/`, never code) asks questions, then writes acceptance criteria and data; a second session reviews them as QA.
   - Result: complete, testable `docs/requirements.md`.
   - Demo: Day 1, live.
5. **Build the MVP** — seed first, then story by story: `/plan-feature` → `/implement` → browser → `/verify` → commit.
   - Result: working MVP, green checks, e2e test for the main flow.
   - Demo: Day 1, live (one story); the rest is homework.
6. **Add a feature** — docs first, then the same loop on an existing system, with an explicit review.
   - Result: feature merged with tests and updated docs.
   - Demo: Day 2, live.
7. **Deploy** *(optional)* — production build locally, then a free web service.
   - Result: public URL, data survives a redeploy.
   - Demo: show `render.yaml` and the deploy scheme; deploying is optional.
8. **Portfolio** — README about your app, screenshot, remove the guide, polish the repo.
   - Result: portfolio-ready public repository.
   - Demo: tell, homework.

## 2. Prerequisites

### Starting point

The demo starts from tag `start` on `master`, where guide Steps 1–3 are **already done**. I do not repeat them live: I show their results (section 3) and tell how a student gets there. The live part is code generation — Steps 4–6.

### Repositories

| Repo | Role |
| --- | --- |
| [opencode-playground](https://github.com/alexander-ignatow/opencode-playground) | Template for students (`master`). Guide in `docs/guide`. |
| [opencode-quicktest](https://github.com/alexander-ignatow/opencode-quicktest) | This demo app, created from the template with **Use this template**. Students get read access. |

### Branches and tags in this repo

| Branch / tag | Purpose |
| --- | --- |
| `master` | Stable branch, deployed by Render. Right now it is the **starting point**: Steps 1–3 done. |
| tag `start` | Marks the starting point on `master`, so it stays reachable after `master` moves on. |
| `develop` | The prepared run of Steps 4–8, done in advance. Merged into `master` when stable (→ deploy). |
| `feature/<name>` | One branch per story or feature, cut from `develop` and merged back with a pull request — the same flow the guide teaches. |
| tags `step-N-...` | Fallback checkpoints on `develop` after every step: `git switch -c live <tag>` to jump there. |
| `demo/<day>` | Throwaway branch for the live demo, cut from `start` (Day 1) or a step tag (Day 2). Never merged. |

### Accounts and services

| Service | What is set up | Notes |
| --- | --- | --- |
| GitHub | Both repos, public | Students fork nothing; they use the template |
| OpenCode Zen | Connected via `/connect` | Free model used today: DeepSeek 4.1 Flash Free, plus a backup free model |
| Neon | Postgres, project created | Database branch `main` for the deployed `master`; `demo` for local work, `develop`, feature branches and the live demo — so experiments never touch the deployed data |
| Render | Prepared, **not deployed** | `render.yaml` describes one free web service that deploys `master`. Deploying is optional for the demo. |

### Local environment

| Item | Value |
| --- | --- |
| OS | macOS |
| Node.js | 24 (current). A guideline: take the current LTS, minimum 22.18. |
| OpenCode | Latest version (`opencode --version`) |
| Editor | Any |
| `.env` | Present locally with `DATABASE_URL` for the **demo** database branch. Never shown on screen. |

> Versions and the model are guidelines, not requirements. The list of free models and their limits changes regularly: pick the model right before you start working. DeepSeek 4.1 Flash Free is simply what works for this example today.

### Pre-flight checklist (before each webinar day)

- [ ] `git fetch --all --tags`, on the right branch, working tree clean.
- [ ] `npm install` done, `npm run dev` works, Playwright browser installed (`npm run test:e2e:install`).
- [ ] OpenCode started from the repo root, provider connected, model selected, a test prompt answered.
- [ ] Free model checked today (`/models`); a backup free model chosen in case the main one is down or rate-limited.
- [ ] Neon dashboard open in a browser tab (and Render, if `master` is deployed — open its URL a minute before, it sleeps).
- [ ] Fallback tags known (see section 6); fallback recording ready, if any.
- [ ] Screen: terminal + editor + browser layout, large font, notifications off, no secrets visible.

## 3. Steps 1–3: what students do (done before the demo)

For each step: what a student does, what it produces, and what I open on screen to show it.

### Step 1. Setup

- Student: **Use this template** → clone → `npm install` → `npm run dev` → `npm run test` / `npm run test:e2e` → install OpenCode → `/connect` (OpenCode Zen) → `/models` (a free model) → first prompt from guide 1.8.
- Result: the app shows "Connected to api v0.1.0", tests are green, the agent summarized the project without changing files.
- Show: the starter page in the browser, the repo tree (`apps/`, `docs/`, `.opencode/`, `AGENTS.md`), one agent file and one command file — "this is what the agent knows". Point at `.opencode/agents/analyst.md`: an agent with its own role and its own permissions — we will use it live in Step 4.

### Step 2. Idea and scope (any AI chat)

- Student: brainstorm ideas from personal interests → pick one → cut an MVP → define the next feature → write a glossary → ask for sample data as human-readable JSON.
- Result: brief in `docs/requirements.md` (sections 1–4), `docs/glossary.md`, `docs/features/<name>.md`, `data/seed.json`.
- Show:
  - `docs/requirements.md` — BookCast: works vs editions, the cast, guest and curator, one creation flow through the edition.
  - `docs/glossary.md` — work vs edition, credit role vs user role, editor vs curator. Free models are weak: without this file they *will* mix these up on screen. Every agent reads it before every task (`opencode.jsonc`).
  - `docs/features/my-library.md` — planned *now*, so the architecture does not block it on Day 2.
  - `data/seed.json` — books about AI: a work in many editions and translations, collections, editions without ISBN, a rich Ukrainian cast (Нейромант 2017).
- Talking points: the three lessons from collecting data (section 1, Step 2).

### Step 3. Data, architecture and hosting (OpenCode starts here)

- Student: in OpenCode, the **plan** agent compares storage and hosting options for *their* requirements and names the decisions the next feature depends on → the **build** agent records them in `docs/architecture.md` → Neon project and `.env` → `.env.example` committed.
- Result: decision log in `docs/architecture.md`, `.env` (local only), `.env.example`, optionally `render.yaml`.
- Show:
  - `docs/architecture.md` decision log: Neon Postgres (database branches `main` and `demo`), Drizzle, seeding through the create-edition logic, users with a **set** of roles, cookie sessions, images as links, one Render service.
  - The roles decision as the key example: made now because of the planned feature, costs nothing in the MVP.
  - `.env.example` and `git status` — `.env` is not in git. Never open `.env` on screen.
  - `render.yaml` — the deploy scheme in one file: `master` is deployed, work happens in `develop` and feature branches.
- Note: a student needs the agent here to understand the options; I skip this dialogue because I already know what I want.

## 4. Day 1 script

_TBD_

## 5. Day 2 script

_TBD_

## 6. Checkpoints

_TBD — tags on `develop` with what each one shows._

## 7. Run log

_Timings and problems from rehearsals. Feeds the scripts above and fixes to the guide._

## 8. Key messages (for slides / cheat sheet)

- Every step ends with a concrete, checkable result, and that result is the input for the next step.
- Product first, code later: idea, scope, next feature, glossary and sample data come before any code.
- Plan the next feature together with the MVP: the architecture must not block it, but do not build it in advance (example: users with a *set* of roles).
- Sample data is the best test of the data model: if you cannot write 10–20 realistic records, the model is not ready.
- Collecting real data teaches things no brainstorm does: ISBN is not an identity, duplicates of people are a real problem, the cast needs non-standard roles.
- Free models are weak at similar words: a glossary in a separate file, read by every agent, prevents mixing up concepts.
- Give an agent a role **and** permissions: the analyst can edit only docs, so it cannot drift into code.
- Small steps + a check after every step: plan → implement → verify → understand → commit.
- Never trust "all tests passed" without seeing the output.
- The template is a starting point. Change it for your project — there is no single right AI-assisted setup.
