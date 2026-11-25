# Demo plan

Presenter notes for the "AI-first full-stack development" webinar. Not part of the student guide.

**Format:** 2 days × 60 minutes. Day 1: the template, my project, Steps 1–3 told, **Steps 4–5 live**. Day 2: **1–2 user stories live** (Step 6). Steps 7–9 are homework.

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
   - Demo: told, show the result.
2. **Idea and scope** — in any AI chat: pick a unique idea, cut an MVP, plan the next feature, write a glossary and sample data.
   - Result: brief in `docs/requirements.md`, `docs/glossary.md`, `docs/features/<name>.md`, `data/seed.json`.
   - Demo: told, show BookCast.
   - What collecting the sample data taught us (a good story for this step):
     1. ISBN is not a silver bullet: it exists only since about 1970, so older and historical editions (19th century and earlier) have none. ISBN cannot be the identity of an edition.
     2. Author uniqueness is an open question: how do we avoid duplicates ("A. C. Clarke" vs "Arthur C. Clarke", transliterations)?
     3. The cast needs non-standard roles (scientific editor, typeface designer, ...). In practice the whole cast became optional — only the author is required.
3. **Data, key decisions and hosting** — from here on the work happens in OpenCode. Choose storage, seeding, the decisions the next feature depends on, hosting; connect the database.
   - Result: decision log in `docs/architecture.md`, `.env` + `.env.example`.
   - Demo: told, show the decisions and the deploy scheme.
4. **Requirements** — the **analyst** agent (can edit only `docs/` and `data/`, never code) asks questions, then writes acceptance criteria and data; a second session reviews them as QA.
   - Result: complete, testable `docs/requirements.md`.
   - Demo: **Day 1, live.**
5. **Architecture** — create an `architect` agent, turn `docs/architecture.md` into a `docs/architecture/` folder, agree on the data model, code structure and libraries; review in a fresh session.
   - Result: `docs/architecture/` (README, data model, backend, frontend, decisions), `architect` agent.
   - Demo: **Day 1, live** — the review/fix cycle is the main point.
6. **Build the MVP** — seed first, then story by story: `/plan-feature` → `/implement` → browser → `/verify` → commit.
   - Result: working MVP, green checks, e2e test for the main flow.
   - Demo: **Day 2, live** — 1–2 stories; the rest is homework.
7. **Add a feature** — docs first, then the same loop on an existing system, with an explicit review.
   - Result: feature merged with tests and updated docs.
   - Demo: not shown — implementing a story on Day 2 *is* implementing a feature. Homework: here students learn to change a working system without breaking it.
8. **Deploy** *(optional)* — production build locally, then a free web service.
   - Result: public URL, data survives a redeploy.
   - Demo: show `render.yaml` and the deploy scheme; deploying is optional.
9. **Portfolio** — README about your app, screenshot, remove the guide, polish the repo.
   - Result: portfolio-ready public repository.
   - Demo: tell, homework.

## 2. Prerequisites

### Starting point

The demo starts from `master`, where guide Steps 1–3 are **already done**. I do not repeat them live: I show their results (section 3) and tell how a student gets there. Live: Steps 4–5 on Day 1, Step 6 (1–2 stories) on Day 2.

Before going live: `git switch -c demo/day1 master` (Day 2: a branch from the Day 1 result).

### Repositories

| Repo | Role |
| --- | --- |
| [opencode-playground](https://github.com/alexander-ignatow/opencode-playground) | Template for students (`master`). Guide in `docs/guide`. |
| [opencode-quicktest](https://github.com/alexander-ignatow/opencode-quicktest) | This demo app, created from the template with **Use this template**. Students get read access. |

### Branches in this repo

No tags — a branch from `master` is enough.

| Branch | Purpose |
| --- | --- |
| `master` | Stable branch, deployed by Render. The **starting point**: Steps 1–3 done. |
| `demo/day1`, `demo/day2` | Live demo branches, cut from `master` (Day 2: from the Day 1 result). Throwaway. |
| prepared branch | Rehearsal result with Steps 4–5 done (and later the stories). **Fallback:** if the model hits a limit or gets stuck on air, switch to it and show the result. |
| `feature/<name>` | The flow the guide teaches: one branch per story, merged with a pull request. |

### Accounts and services

| Service | What is set up | Notes |
| --- | --- | --- |
| GitHub | Both repos, public | Students fork nothing; they use the template |
| OpenCode Zen | Connected via `/connect` | Free models used in rehearsal: DeepSeek V4.1 Flash Free (hit its limit in Step 5), **Big Pickle** (finished Step 5). Keep at least two ready. |
| Neon | Postgres, project created | Database branch `main` for the deployed `master`; `demo` for local work, demo branches and feature branches — so experiments never touch the deployed data |
| Render | Prepared, **not deployed** | `render.yaml` describes one free web service that deploys `master`. Deploying is optional for the demo. |

### Local environment

| Item | Value |
| --- | --- |
| OS | macOS |
| Node.js | 24 (current). A guideline: take the current LTS, minimum 22.18. |
| OpenCode | Latest version (`opencode --version`) |
| Editor | Any |
| `.env` | Present locally with `DATABASE_URL` for the **demo** database branch. Never shown on screen. |

> Versions and the model are guidelines, not requirements. The list of free models and their limits changes regularly: pick the model right before you start working. DeepSeek V4.1 Flash Free and Big Pickle are simply what worked for this example in November 2026. The free limit may be shared between free models (per account or IP): switching models does not always help.

### Pre-flight checklist (before each webinar day)

- [ ] `git fetch --all`, demo branch cut from the right point, working tree clean.
- [ ] `npm install` done, `npm run dev` works, Playwright browser installed (`npm run test:e2e:install`).
- [ ] OpenCode started from the repo root, provider connected, model selected, a test prompt answered.
- [ ] Free model checked today (`/models`); a backup free model chosen. **No long runs on the same model right before going live** — do not burn the limit.
- [ ] Neon dashboard open in a browser tab (and Render, if `master` is deployed — open its URL a minute before, it sleeps).
- [ ] Fallback branch fetched locally and checked (see section 6).
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
  - `docs/features/my-library.md` — planned *now* and never built in the demo, but it already changed the architecture (users with a *set* of roles).
  - `data/seed.json` — books about AI: a work in many editions and translations, collections, editions without ISBN, a rich Ukrainian cast (Нейромант 2017).
- Talking points: the three lessons from collecting data (section 1, Step 2).

### Step 3. Data, key decisions and hosting (OpenCode starts here)

- Student: in OpenCode, the **plan** agent compares storage and hosting options for *their* requirements and names the decisions the next feature depends on → the **build** agent records them in `docs/architecture.md` → Neon project and `.env` → `.env.example` committed.
- Result: decision log in `docs/architecture.md`, `.env` (local only), `.env.example`, optionally `render.yaml`.
- Show:
  - `docs/architecture.md` decision log: Neon Postgres (database branches `main` and `demo`), Drizzle, seeding through the create-edition logic, users with a **set** of roles, cookie sessions, images as links, one Render service.
  - The roles decision as the key example: made now because of the planned feature, costs nothing in the MVP.
  - `.env.example` and `git status` — `.env` is not in git. Never open `.env` on screen.
  - `render.yaml` — the deploy scheme in one file: `master` is deployed, work happens in feature branches.
- Note: a student needs the agent here to understand the options; I skip this dialogue because I already know what I want.

## 4. Day 1 script (60 min)

| Block | Time |
| --- | --- |
| Intro, project structure, the assignment (sections 0–1) | ~10 min |
| My project: results of Steps 1–3 (section 3) | ~10 min |
| **Step 4 live** — requirements | 15–20 min |
| **Step 5 live** — architecture | 15–20 min |
| Homework and questions | rest |

If time runs out in Step 5: skip the review (5.5) and say "the same cycle as with the requirements".

### Step 4. Requirements (live): three prompts

1. **Analyst completes the requirements** — switch to `analyst`, prompt from guide 4.1. It asks questions first; I answer; it writes acceptance criteria, data and open questions, and updates the glossary.
2. **QA review in a fresh session** — `/new`, switch to `plan`, prompt from guide 4.2. It lists vague or untestable criteria and contradictions.
3. **Analyst fixes the findings** — back to `analyst`: "Fix findings N, M from the review; leave K as is." Show `git diff docs/requirements.md`.

Message: the model made the mistakes, and the model found them — because the *process* has a review in a fresh session, not because the model is smart. Links to the first key message (section 8).

### Step 4. Requirements (live): three prompts

1. **Analyst completes the requirements** — switch to `analyst`, prompt from guide 4.1. It asks questions first; I answer; it writes acceptance criteria, data and open questions, and updates the glossary.
2. **QA review in a fresh session** — `/new`, switch to `plan`, prompt from guide 4.2. It lists vague or untestable criteria and contradictions.
3. **Analyst fixes the findings** — back to `analyst`: "Fix findings N, M from the review; leave K as is." Show `git diff docs/requirements.md`.

Message: the model made the mistakes, and the model found them — because the *process* has a review in a fresh session, not because the model is smart. Links to the first key message (section 8).

Timing: models are slow; see the run log for real numbers.

### Step 5. Architecture (live)

Why this step exists — found in rehearsal: with one `architecture.md` the architecture starts to drift **before** the first story is implemented. ORM, UI library, validation, folder layout, reuse — left open, every `/implement` invents its own.

1. **build** creates the `architect` agent (guide 5.2). Show the file: same model, different role and permissions — edits only `docs/architecture/`.
2. **build** turns `docs/architecture.md` into the folder and updates the references (guide 5.3). Show that only `README.md` and `decisions.md` are loaded into every session — the rest is read on demand (free models have small limits).
3. **architect** designs it (guide 5.4): options first, my choice, then the files and `decisions.md` entries.
4. **plan** reviews in a fresh session (guide 5.5), **architect** fixes. **This review/fix cycle is the main thing to show.**

Message: an agent is a role, not a model. One weak model, three roles (analyst, architect, builder) with narrow instructions and permissions — each does less, and does it better.

### End of Day 1: homework

- Steps 1–4 (better 1–5) on **your own** project before Day 2 — then the Day 2 questions are about your projects.
- Expect free model limits: spread the work over several days, start a new session (`/new`) for every task, keep prompts small.

## 5. Day 2 script (60 min)

| Block | Time |
| --- | --- |
| Recap: requirements and architecture from Day 1 (agent files, `docs/architecture/`, `decisions.md`) | ~5 min |
| **Step 6 live** — 1–2 stories | 25–35 min |
| What is left for students (Steps 7–9), questions | rest |

### Step 6. Build the MVP (live: 1–2 stories)

Branch from the Day 1 result. For each story:

1. `/new`, `/plan-feature <story>` — the plan agent plans against `docs/architecture/`.
2. Review the plan aloud: does it contradict the architecture? (A new library or another folder layout → stop, back to the architect.)
3. `/implement`, step by step.
4. Check in the browser myself.
5. `/verify` — real PASS/FAIL table and the reviewer's findings.
6. Commit.

Candidate stories: the seed first (data in the database — guide 6.2), then the works catalog (the first visible page).

While reading the agent's output: name 1–2 weak spots aloud, do not fight the model live.

**Deliberate gap: visual design.** Nothing in the guide, requirements or architecture describes how the app should *look* (colors, typography, layout, visual hierarchy). The UI approach (library or none, component reuse) is architecture and is decided; the look is not. Show the students what a weak model produces without a design brief — they will see the problem immediately. Then tell them: this is the same kind of gap as the architecture one, just more visible.

### The planned feature

Not built in the demo: implementing a story *is* implementing a feature. Tell in two sentences: `my-library.md` was planned in Step 2 and never built — but it made us choose users with a *set* of roles. Planned, not built, and it still shaped the architecture.

## 6. Fallback

No tags. One prepared branch with the rehearsal result (Steps 4–5 done, later the stories). If the model hits a limit or gets stuck live: switch to it, show the result, explain what the model would have done.

## 7. Run log

_Timings and problems from rehearsals. Feeds the scripts above and fixes to the guide._

- **2026-11-23, Step 4, DeepSeek V4.1 Flash Free.** Slow, stumbles in places. The analyst introduced errors into the requirements; the QA review by the plan agent found them; a third prompt to the analyst fixed them. The guide's two prompts work as written; the demo needs the third one. Time: 15–20 min.
- **2026-11-23, Step 5, DeepSeek V4.1 Flash Free → Big Pickle.** DeepSeek hit the free limit in the middle of the architecture ("continue in 1.5 hours or pay $10"). Switched to Big Pickle and finished: the process survived the model switch because everything lives in files, not in the model's memory. Weak spots in the result are visible, but not worth fighting live — name them, move on. The review/fix cycle works.

## 8. Key messages (for slides / cheat sheet)

- **Code generation is the smaller part of the work.** The main part is making the result stable, reliable and repeatable — that is what architecture, documentation, tests and agent settings are for. This is the difference between real AI-assisted development and "vibe coding".
- Every step ends with a concrete, checkable result, and that result is the input for the next step.
- Product first, code later: idea, scope, next feature, glossary and sample data come before any code.
- Plan the next feature together with the MVP: the architecture must not block it, but do not build it in advance (example: users with a *set* of roles).
- Sample data is the best test of the data model: if you cannot write 10–20 realistic records, the model is not ready.
- Collecting real data teaches things no brainstorm does: ISBN is not an identity, duplicates of people are a real problem, the cast needs non-standard roles.
- Free models are weak at similar words: a glossary in a separate file, read by every agent, prevents mixing up concepts.
- Give an agent a role **and** permissions: the analyst can edit only docs, so it cannot drift into code.
- Small steps + a check after every step: plan → implement → verify → understand → commit.
- Never trust "all tests passed" without seeing the output.
- Agree on the architecture before the first story: with one loose file it drifts before any code exists. Decide data model, structure and libraries once, write them down, let every agent read them.
- An agent is a role, not a model: one weak model with three narrow roles (analyst, architect, builder) works better than one model with one vague prompt.
- Whatever you do not describe, the model invents. Visual design is the most visible example: no design brief — and you get the weak model's default look.
- Mistakes are expected, the process catches them: in rehearsal the analyst made errors in the requirements and a review in a fresh session found them.
- The template is a starting point. Change it for your project — there is no single right AI-assisted setup.
- Free has a price — limits. A model ran out mid-step: switch to another one and continue from the files. Save requests: short context, `/new` for every task, small steps.
- Plan a feature without building it: `my-library.md` was never implemented, but it shaped the architecture (users with a set of roles).
