# Evenly

A private running tab for one group of people — no accounts, no ads, no
per-user fees. Split expenses, see who owes who (simplified to the fewest
possible payments), and mark things settled. Installs to a phone home
screen as a PWA.

Built with FastAPI + SQLAlchemy on the backend and plain HTML/CSS/JS on the
frontend (no build step, no framework tooling to fight with).

## How it works, in short

- Anyone can start a tab, which gives them a 6-character invite code.
- They share the code (or a link containing it) with their group.
- Each person "joins" with just their name — no email, no password. The
  browser remembers who they are via a private token saved in
  `localStorage`, the same way IRONLOG/e-BoE-style personal tools do.
- Expenses can be split equally, by exact amount, or by percentage.
- The balances screen simplifies debts down to the minimum number of
  payments needed to settle everyone up (e.g. instead of 6 separate
  IOUs among 3 people, it might tell you just 2 payments to make).

This is intentionally light on "security theater" — it's built for a
closed group of people who trust each other, not the public internet.
Anyone with the invite code can join, so treat the code like you'd treat
a shared Wi-Fi password.

## Project structure

```
evenly/
├── app/
│   ├── main.py          # FastAPI routes + serves the frontend
│   ├── database.py      # DB connection (SQLite locally, Postgres in prod)
│   ├── models.py        # SQLAlchemy tables
│   ├── schemas.py       # Request/response validation
│   ├── balances.py      # Balance math + debt simplification
│   └── static/          # The whole frontend (HTML/CSS/JS/PWA files)
├── requirements.txt
├── .env.example
└── README.md
```

## Running it locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`. No database setup needed — it creates a
`evenly.db` SQLite file next to the app automatically. Delete that file
any time to wipe all data and start fresh.

## Shipping it — Vercel (hosting) + Supabase (database)

This project is configured to deploy instantly on Vercel as a serverless app, backed by a free Supabase Postgres database. Total cost: **$0**.

### 1. Create a free Postgres database on Supabase

1. Go to supabase.com and sign up (no card needed).
2. Create a new project — any region close to you is fine. Save the database password you create!
3. Once the project is ready, click **Connect** at the top of the dashboard.
4. Select **Direct Connection string** (URI) and copy the `postgresql://` link.
5. Replace `[YOUR-PASSWORD]` in that link with your actual password. Keep this handy for the next step.

### 2. Push this folder to GitHub

```bash
cd evenly
git init
git add .
git commit -m "Evenly: private expense splitter"
gh repo create evenly --source=. --public --push
```

(No `gh` CLI? Create an empty repo on GitHub first, then `git remote add origin <url>` and `git push -u origin main`.)

### 3. Deploy on Vercel

1. Go to vercel.com and sign up with your GitHub account.
2. Click **Add New... > Project** and import your newly pushed `evenly` repository.
3. Open the **Environment Variables** section.
4. Add a new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** *(your Supabase connection string from Step 1)*
5. Click **Deploy**.

Vercel will build and deploy the app in about a minute. You'll get a URL like `https://evenly-xyz.vercel.app` — that's the app, live, for your group.

### What "free" actually means here

- **Vercel Hobby Tier:** Completely free for personal use. Because Vercel is "serverless", your app wakes up instantly (1-2 seconds) rather than taking 60 seconds like traditional free-tier hosts (e.g. Render).
- **Supabase Free Tier:** A permanent, fully-featured Postgres database with 500MB of storage. It automatically pauses after 1 week of inactivity (unlike Neon's 5 minutes), and wakes up the moment someone opens your app.

## Inviting your group

Open the app, tap the share icon, and send the code or link. Opening the
link pre-fills the code; the person just types their name to join.

## Adding it to a phone home screen

- **iOS (Safari):** open the link → Share icon → *Add to Home Screen*.
- **Android (Chrome):** open the link → ⋮ menu → *Add to Home screen* /
  *Install app*.

Once installed it opens full-screen, no browser bar, like a normal app.

## A few things worth knowing

- **Currency symbol:** hardcoded to ₹ in `app/static/app.js`, in the
  `fmt()` function near the top. Change the `"₹"` to `"$"` or whatever
  you need — it's one line.
- **Deleting an expense:** any member can delete any expense (again,
  built for a trusted group, not strangers).
- **Losing your "login":** since identity lives in the browser's
  `localStorage`, clearing site data or switching browsers/devices logs
  you out — you'd rejoin with the same invite code. There's no password
  to reset because there was never a password.
