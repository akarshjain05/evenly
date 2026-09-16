# Evenly

[**Live Demo**](https://evenly-eight.vercel.app)

Evenly is a private, real-time expense splitting app designed for small groups, roommates, and travel companions. It provides a seamless way to track shared costs, split expenses exactly how you need them, and mathematically minimize debts using a built-in settlement simplification engine. 

Say goodbye to ads, per-user subscription fees, and bloated interfaces. Evenly is built to be fast, secure, and fully owned by you. It can be installed directly to your phone's home screen as a native-feeling Progressive Web App (PWA).

### Key Features
- **Secure Accounts & Sync:** Robust JWT-based authentication ensures your data is safely backed up to the cloud and instantly synced across all your devices.
- **Advanced Debt Simplification:** The core financial engine automatically calculates the absolute fewest number of payments required to settle all debts in the group.
- **Flexible Splitting:** Split expenses equally, by exact amounts, or by custom percentages.
- **Export & Ownership:** Your data is yours. Export any tab's ledger to CSV at any time.
- **Push Notifications:** Real-time Web Push Notifications keep everyone in the loop when expenses are added or settled.
- **PWA Ready:** Install it on iOS or Android and it runs full-screen, without a browser bar, just like a native app.

Built with FastAPI + SQLAlchemy on the backend and plain HTML/CSS/JS on the frontend (no build step, no framework tooling to fight with).

## How it works, in short

- Anyone can create an account and start a tab, which generates a 6-character invite code.
- They share the code (or a link containing it) with their group.
- The group registers for free accounts and joins the tab. 
- Expenses can be split equally, by exact amount, or by percentage.
- The balances screen simplifies debts down to the minimum number of payments needed to settle everyone up.
- Because it uses a secure JWT authentication system, your data is safely backed up to the cloud and syncs effortlessly across all your devices.

## Project structure

```
evenly/
├── alembic/             # Database migrations
├── app/
│   ├── main.py          # FastAPI app entrypoint, middleware, and SPA routing
│   ├── routers/         # Modular API endpoints (auth, groups, users, notifications)
│   ├── database.py      # DB connection (SQLite locally, Postgres in prod)
│   ├── models.py        # SQLAlchemy tables
│   ├── schemas.py       # Pydantic request/response validation
│   ├── auth.py          # Secure JWT auth and password hashing
│   ├── balances.py      # Core financial engine + debt simplification
│   └── static/          # The whole frontend (HTML/CSS/JS/PWA files)
├── tests/               # Comprehensive Pytest API suite
├── requirements.txt
├── .env.example
└── README.md
```

## Running it locally

```bash
pip install -r requirements.txt
alembic upgrade head
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
4. Switch to the **Transaction Mode (Port 6543)** or Connection Pooler string. (Because Vercel is serverless, a connection pooler is required to avoid exhausting database connections).
5. Copy the `postgresql://` URI and replace `[YOUR-PASSWORD]` with your actual password. Keep this handy for the next step.

### 2. Push this folder to GitHub

```bash
cd evenly
git init
git add .
git commit -m "Evenly: private expense splitter"
gh repo create evenly --source=. --public --push
```

### 3. Deploy on Vercel

1. Go to vercel.com and sign up with your GitHub account.
2. Click **Add New... > Project** and import your newly pushed `evenly` repository.
3. Open the **Environment Variables** section.
4. Add the following required environment variables:
   - **`DATABASE_URL`:** *(your Supabase connection string from Step 1)*
   - **`JWT_SECRET_KEY`:** *(run `openssl rand -hex 32` in a terminal to generate a secure random string)*
5. (Optional) Add variables to enable Web Push Notifications and secure CORS:
   - **`VAPID_PRIVATE_KEY`:** *(run `npx web-push generate-vapid-keys` to generate)*
   - **`VAPID_PUBLIC_KEY`:** *(from the same command)*
   - **`VAPID_CLAIMS_EMAIL`:** `mailto:your-email@example.com`
   - **`CORS_ORIGINS`:** `https://your-vercel-domain.vercel.app` (comma separated list of allowed origins)
6. Click **Deploy**.

Vercel will build and deploy the app in about a minute. You'll get a URL like `https://evenly-xyz.vercel.app` — that's the app, live, for your group.

### What "free" actually means here

- **Vercel Hobby Tier:** Completely free for personal use. Because Vercel is "serverless", your app wakes up instantly (1-2 seconds).
- **Supabase Free Tier:** A permanent, fully-featured Postgres database with 500MB of storage. It automatically pauses after 1 week of inactivity, and wakes up the moment someone opens your app.

## Inviting your group

Open the app, tap the share icon, and send the code or link. Opening the
link pre-fills the code; the person just signs in to join.

## Adding it to a phone home screen

- **iOS (Safari):** open the link → Share icon → *Add to Home Screen*.
- **Android (Chrome):** open the link → ⋮ menu → *Add to Home screen* /
  *Install app*.

Once installed it opens full-screen, no browser bar, like a normal app.

## A few things worth knowing

- **Currency symbol:** hardcoded to ₹ in `app/static/app.js`, in the
  `fmt()` function near the top. Change the `"₹"` to `"$"` or whatever
  you need — it's one line.
- **Deleting an expense:** For safety, only the tab creator (admin) or the person who paid the expense is allowed to delete it.
- **Exporting Data:** You can export the entire tab's ledger and history to a CSV file from the Tab Settings menu.
- **Syncing across devices:** your account identity is securely tied to your email and password. Log in from any phone or computer and your tabs will instantly sync from the cloud.
