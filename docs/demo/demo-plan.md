# Demo plan

Presenter notes for the "AI-first full-stack development" webinar. Not part of the student guide.

## 0. Explain the assignment

Open the template README and walk through the guide. Message: every step ends with a concrete, checkable result, and each result is the input for the next step.

1. **Setup** — create a repo with **Use this template**, install, run the app and tests, connect OpenCode with a free model.
   - Result: the app runs, tests pass, the agent answers the first prompt.
   - Demo: done before, show the result.
2. **Idea and scope** — in any AI chat: pick a unique idea, cut an MVP, plan the next feature, write sample data.
   - Result: brief in `docs/requirements.md`, `docs/features/<name>.md`, `data/seed.json`.
   - Demo: done before, tell about BookCast.
3. **Data, architecture and hosting** — choose storage, seeding, the decisions the next feature depends on, hosting; connect the database.
   - Result: decision log in `docs/architecture.md`, `.env` + `.env.example`.
   - Demo: done before, tell about the stack and the deploy scheme.
4. **Requirements** — from here on the work happens in OpenCode. The agent asks questions, then writes acceptance criteria and data; a second session reviews them as QA.
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
   - Demo: show the reference deployment.
8. **Portfolio** — README about your app, screenshot, remove the guide, polish the repo.
   - Result: portfolio-ready public repository.
   - Demo: tell, homework.

## 1. Prerequisites

### Repositories

| Repo | Role |
| --- | --- |
| [opencode-playground](https://github.com/alexander-ignatow/opencode-playground) | Template for students (`master`). Guide in `docs/guide`. |
| [opencode-quicktest](https://github.com/alexander-ignatow/opencode-quicktest) | This demo app, created from the template with **Use this template**. Students get read access. |

### Branches and tags in this repo

| Branch / tag | Purpose |
| --- | --- |
| `master` | **Starting point** of the demo: guide steps 1–3 done (setup, brief, feature file, architecture and hosting decisions). |
| `demo` | Cut from the starting point. Live demo of steps 4–6 during the webinar. |
| `reference` | Cut from the starting point. Steps 4–8 done in advance. Tags after every step as fallbacks. Render deploys from this branch. |
| `step-N-...` tags | Fallback checkpoints on `reference`: `git switch -c live <tag>` to jump there. |

### Accounts and services

| Service | What is set up | Notes |
| --- | --- | --- |
| GitHub | Both repos, public | Students fork nothing; they use the template |
| OpenCode Zen | Connected via `/connect` | Free model: _TBD (e.g. DeepSeek V4 Flash Free)_ + a backup free model |
| Neon | Postgres | Separate databases (or Neon branches) for `demo` and `reference`, so the live demo never touches the public example's data |
| Render | Free web service | Deploys `reference`. Build: `npm ci --include=dev && npm run build`, start: `npm start` |

### Local environment

| Item | Value |
| --- | --- |
| OS | macOS |
| Node.js | _TBD_ (22.18+) |
| OpenCode | _TBD_ (`opencode --version`) |
| Editor | _TBD_ |
| `.env` | Present locally with `DATABASE_URL` for the **demo** database. Never shown on screen. |

### Pre-flight checklist (before each webinar day)

- [ ] `git fetch --all --tags`, on the right branch, working tree clean.
- [ ] `npm install` done, `npm run dev` works, Playwright browser installed (`npm run test:e2e:install`).
- [ ] OpenCode started from the repo root, provider connected, model selected, a test prompt answered.
- [ ] Backup free model chosen in case the main one is down or rate-limited.
- [ ] Neon and Render dashboards open in browser tabs; the reference deployment is awake (open the URL a minute before).
- [ ] Fallback tags known (see section 4); fallback recording ready, if any.
- [ ] Screen: terminal + editor + browser layout, large font, notifications off, no secrets visible.

## 2. Day 1 script

_TBD_

## 3. Day 2 script

_TBD_

## 4. Checkpoints

_TBD — tags on `reference` with what each one shows._

## 5. Run log

_Timings and problems from rehearsals. Feeds the scripts above and fixes to the guide._
