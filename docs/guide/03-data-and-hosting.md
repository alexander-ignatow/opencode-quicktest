# Step 3. Data and hosting

**Goal:** decide where your data lives and (optionally) where your app will run, *before* writing code.

The starter has no database on purpose. You choose what your app needs.

## 3.1 Why decide now

A typical trap: everything works locally with a file or a local database, and then it turns out the free hosting cannot keep it. Choose storage and hosting **together**.

## 3.2 Storage options

| Option | Good for | Watch out |
| --- | --- | --- |
| **In memory** (a variable on the server) | The very first version, prototypes | Data disappears on every restart |
| **JSON file** on the server | Local-only apps | Free hosting has a temporary disk: the file is lost on restart or redeploy |
| **Managed PostgreSQL** — [Neon](https://neon.com) | Relational data (tables, relations). Free plan, no credit card | Small storage and compute limits |
| **Managed PostgreSQL** — [Supabase](https://supabase.com) | Same, plus a web dashboard | Free projects are paused after a week without activity |
| **MongoDB** — [Atlas](https://www.mongodb.com/atlas) free cluster | Document data (JSON-like) | 512 MB storage |
| **Firestore** — [Firebase](https://firebase.google.com) | Document data | Use it **from the backend only**, otherwise your Express API becomes pointless |

**If you are not sure:** start with **in memory** for the first stories, then move to **Neon** (or **MongoDB Atlas** if you prefer documents) as soon as your data must survive a restart. A cloud database works the same from your laptop and from hosting, so you install nothing locally.

## 3.3 Hosting options (optional)

Deploying is optional, but a live link makes a portfolio project much stronger.

The starter runs as **one service** in production: `npm run build && npm start` serves the API and the built frontend on one port. So you need just one Node.js web service.

| Option | Notes |
| --- | --- |
| [Render](https://render.com) free web service | Recommended. Deploys from GitHub. Sleeps after 15 minutes without traffic, the first request then takes about a minute. Temporary disk. |
| Any other Node.js host | Fine if it has a free tier that runs a Node.js server. Check its current limits. |

Avoid Render's free PostgreSQL for this project: it expires after 30 days.

*Free tiers were checked in November 2026. They change — check the provider's pricing page.*

## 3.4 Secrets

A cloud database gives you a **connection string** with a password inside. Treat it as a secret:

- Store it in a `.env` file in the repository root. `.env` is already in `.gitignore`, so it is never committed.
- On the hosting, set it as an **environment variable** in the dashboard.
- **Never paste it into the AI chat.** OpenCode asks for permission before reading `.env` — say no unless you have a reason.
- Commit a `.env.example` with the variable names and fake values, so others know what to set.

## 3.5 Decide with the agent

In OpenCode, switch to the **plan** agent (`Shift+Tab`) and ask:

```text
Read docs/requirements.md. I need to choose data storage and hosting for this app.
Options I consider: [e.g. in memory first, then Neon Postgres; Render for hosting].
Compare them for MY requirements: what fits, what are the risks, what changes in the code.
Recommend one option and explain why. Do not change any files.
```

**Expected agent behavior:** it reads the requirements, compares the options against your entities and stories, recommends one, and lists consequences (new dependency, `.env`, migrations or schema). It does not edit files — the plan agent cannot.

Then switch back to **build** and record the decision:

```text
Add a decision log entry to docs/architecture.md: storage = [your choice], hosting = [your choice or "not decided"].
Use the template in that file: context, decision, alternatives, consequences. Do not write code.
```

**Expected agent behavior:** one new entry under "Decision log", nothing else changed. Check with `git diff`.

```bash
git add docs/architecture.md
git commit -m "Record storage and hosting decision"
```

## ✅ Result

- [ ] `docs/architecture.md` has a decision log entry for storage (and hosting, if you plan to deploy).
- [ ] If you chose a cloud database: an account exists and you know where to find the connection string. It is **not** in git and **not** in the chat.

Next: [Step 4. Requirements](04-requirements.md)
