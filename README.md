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

## Shipping it — Render (hosting) + Neon (database)

Render's own free Postgres deletes itself after 30 days, so we don't use
it. Neon's free Postgres has no expiry date, so the database lives there
instead, and Render just runs the app. Total cost: **$0**.

### 1. Push this folder to GitHub

```bash
cd evenly
git init
git add .
git commit -m "Evenly: private expense splitter"
gh repo create evenly --source=. --public --push
```

(No `gh` CLI? Create an empty repo on GitHub first, then `git remote add
origin <url>` and `git push -u origin main`.)

### 2. Create a free Postgres database on Neon

1. Go to neon.tech and sign up (no card needed).
2. Create a project — any region close to you is fine.
3. Open **Connection Details** and copy the full connection string. It
   looks like `postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require`.
4. Keep this tab open, you'll paste it into Render next.

### 3. Create the web service on Render

1. Go to render.com and sign up, then **New + → Web Service**.
2. Connect the GitHub repo you just pushed.
3. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment**, add two variables:
   - `DATABASE_URL` → the Neon connection string from step 2
   - `PYTHON_VERSION` → `3.12.3`
     (Render sometimes defaults to a newer Python that doesn't have
     pre-built wheels for some of these packages yet — pinning this
     avoids a build failing for that reason.)
5. Choose the **Free** instance type and click **Create Web Service**.

Render will build and deploy. You'll get a URL like
`https://evenly-xyz.onrender.com` — that's the app, live, for your group.

### What "free" actually means here

- **Render free web service:** 750 instance-hours/month, which easily
  covers one app running full-time. It spins down after 15 minutes with
  no traffic and takes 30-60 seconds to wake back up on the next
  request — so the first open after a quiet spell feels a bit slow,
  then it's normal. Fine for a friend group, not something you'd want
  for a paying customer-facing product.
- **Neon free Postgres:** permanent, no card, no expiry — 0.5 GB storage
  and 100 compute-hours/month per project, with compute pausing after 5
  minutes idle (it un-pauses itself on the next query, no action
  needed). Way more than a small group's expense log will ever use.

If this group ever gets big enough to outgrow either limit, that's a
nice problem to have and each has a paid tier to upgrade into without
changing any code.

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
