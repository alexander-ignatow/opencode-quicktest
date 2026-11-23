# Demo plan

Presenter notes for the "AI-first full-stack development" webinar. Not part of the student guide.

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
