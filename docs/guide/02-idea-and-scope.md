# Step 2. Idea and scope

**Goal:** a unique app idea and a small, finishable MVP.

You do not need the coding agent for this step. Use any AI chat you like: [Claude](https://claude.ai), [ChatGPT](https://chatgpt.com), [Gemini](https://gemini.google.com).

## 2.1 What makes a good idea

- **It is yours.** It comes from your hobby, job, studies or a problem you actually have.
- **It is not a generic tutorial app.** No plain todo list, notes, weather or habit tracker — there are thousands of those in portfolios.
- **It has one or two main entities** (things you store), for example "plant" and "watering".
- **It has one thing beyond create/read/update/delete:** statistics, search, a calculation, a reminder, an import, a chart.
- **It is small:** an MVP you can build in a few evenings.
- **It is free to run:** no payments, no paid APIs.

## 2.2 Find ideas

Paste this into an AI chat and fill in the brackets:

```text
Help me pick an idea for a small full-stack web app for my portfolio.

About me: [your interests, hobbies, job, things you do every week, problems that annoy you]

Constraints:
- React frontend + Node.js/Express backend, built in a few evenings.
- 1–2 main entities, plus one feature beyond simple CRUD (stats, search, calculation, chart...).
- No payments, no paid APIs, no complex login.
- Not a generic todo, notes, weather or habit tracker app.

Suggest 7 ideas. For each: name, one-sentence problem it solves, who uses it,
the main entities, and the "beyond CRUD" feature.
```

**Expected behavior:** a list of concrete ideas tied to your interests. If they feel generic, tell the chat more about yourself and ask again. Pick the one *you* would actually use.

## 2.3 Define the MVP scope

In the same chat:

```text
I pick: [idea name].

Define a realistic MVP for it:
1. Product overview: name, problem, target user (2–3 sentences).
2. 3–6 user stories in the format "As a ..., I want ... so that ...".
3. In scope: what the MVP includes.
4. Out of scope: what we explicitly do NOT build now (accounts, payments, mobile app, ...).
5. One "next feature" to add after the MVP that makes the app more interesting.

Keep the MVP as small as possible while still useful from start to finish.
Write it in English, in Markdown.
```

**Expected behavior:** a short Markdown brief. Push back if it is too big: "Cut it to 4 stories" is a perfectly good reply.

## 2.4 Save the brief

1. Open `docs/requirements.md`.
2. Paste the brief into sections 1–4 (Product overview, Users, User stories, Scope). Keep the "next feature" in section 7 (Open questions) for Step 6.
3. Change the status line at the top to `Status: draft`.
4. Commit:

```bash
git add docs/requirements.md
git commit -m "Add project brief"
```

If your course keeps a shared list of ideas, add yours there, so everyone builds something different.

## ✅ Result

- [ ] `docs/requirements.md` contains your app name, problem, users, 3–6 user stories, in scope / out of scope.
- [ ] A "next feature" idea is written down.
- [ ] The brief is committed.

Next: [Step 3. Data and hosting](03-data-and-hosting.md)
