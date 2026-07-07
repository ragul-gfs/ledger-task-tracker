# Ledger — Task Tracker

A personal task ledger: list view + calendar view with date-range bars.
Plain HTML/CSS/JS frontend, small Express backend, data saved to a
Turso database (free, permanent, independent of any hosting provider).

## The whole setup, step by step

### 1. Create a free Turso database (5 minutes, no credit card)

1. Go to https://turso.tech and sign up (free).
2. Once logged in, on the dashboard click **Create Database**.
3. Give it any name (e.g. `ledger`), pick the closest region, create it.
4. On the database page, find:
   - **Database URL** — starts with `libsql://...`
   - Click **Create Token** (or similar) to get an **Auth Token** — a long string.
5. Keep both values handy — you'll paste them into Render in step 3.

### 2. Push this code to GitHub

1. Create a new repo on GitHub.
2. Upload everything in this folder to it (or `git push` if you're
   comfortable with git).

### 3. Deploy on Render (free tier is fine — no disk needed)

1. Go to https://render.com, sign up / log in.
2. **New → Web Service** → connect the GitHub repo you just made.
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Before deploying, add two environment variables:
   - `TURSO_DATABASE_URL` = the `libsql://...` URL from step 1
   - `TURSO_AUTH_TOKEN` = the token from step 1
5. Click **Deploy**.

That's it. Render gives you a URL like `https://ledger-task-tracker.onrender.com`
— open it, bookmark it, use it from any device.

## Why this is the "no issues" setup

- Render's free tier can restart your service or wipe its own local
  disk — but since your data lives in Turso, not on Render, that never
  touches your data. Nothing to configure, no paid disk, no risk.
- Turso's free tier has no expiry and needs no card.
- If you ever delete the Render service, your data is still safe in
  Turso — you'd just need to redeploy the app somewhere and point it at
  the same database again.

## One thing to know about Render's free tier

Free web services on Render "spin down" after periods of no traffic and
take a few seconds to wake back up on the next visit. That's normal —
just a short delay on the first load after a while, not a data issue.

## Running it locally (optional, for testing)

```bash
npm install
npm start
```

Without the Turso env vars set, it automatically falls back to a local
file (`data/ledger.db`) so you can try it before deploying. Once you set
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, it uses Turso instead — same
code, either place.

## API

- `GET /api/data/:key` → `{ value }` or 404 if unset
- `POST /api/data/:key` with `{ value: "<json string>" }` → saves it

The whole task list is stored as one JSON blob under the key
`ledger_tasks_v1`.
