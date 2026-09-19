# Evenly

[**Live Demo**](https://evenly-eight.vercel.app)

Evenly is a private, real-time expense splitting app designed for small groups, roommates, and travel companions. It provides a seamless way to track shared costs, split expenses exactly how you need them, and mathematically minimize debts using a built-in settlement simplification engine. 

Say goodbye to ads, per-user subscription fees, and bloated interfaces. Evenly is built to be fast, secure, and fully owned by you. It can be installed directly to your phone's home screen as a native-feeling Progressive Web App (PWA).

### Key Features
- **Secure Accounts & Sync:** Features HttpOnly, Secure, SameSite=Lax JWT cookie authentication to prevent XSS attacks, ensuring your data is safely backed up and synced.
- **Blazing Fast Architecture:** Built on modern asynchronous Python (FastAPI + asyncpg/aiosqlite) with optimized O(1) memory footprint SQL pipelines (UNION ALL, streaming CSV exports) to handle massive group histories.
- **Advanced Debt Simplification:** The core financial engine automatically calculates a minimized number of payments required to settle all debts in the group.
- **Flexible Splitting:** Split expenses equally, by exact amounts, or by custom percentages.
- **Export & Ownership:** Your data is yours. Export any tab's ledger to CSV at any time.
- **Push Notifications:** Real-time Web Push Notifications keep everyone in the loop when expenses are added or settled.
- **PWA Ready:** Install it on iOS or Android and it runs full-screen, without a browser bar, just like a native app.

Built with **FastAPI + SQLAlchemy** on the backend and **React + TypeScript + Tailwind CSS** on the frontend, ensuring high performance, complete type safety, and an excellent developer experience.

## How it works, in short

- Anyone can create an account and start a tab, which generates a 10-character invite code.
- They share the code (or a link containing it) with their group.
- The group registers for free accounts and joins the tab. 
- Expenses can be split equally, by exact amount, or by percentage.
- The balances screen simplifies debts down to the minimum number of payments needed to settle everyone up.
- Because it uses a secure JWT authentication system, your data is safely backed up to the cloud and syncs effortlessly across all your devices.

## Project structure

```
evenly/
├── alembic/             # Database migrations
├── app/                 # FastAPI Backend
│   ├── main.py          # FastAPI app entrypoint and middleware
│   ├── routers/         # Thin HTTP routing shells (auth, groups, users)
│   ├── services/        # Core business logic and DB transactions
│   ├── database.py      # Async DB connection (aiosqlite locally, asyncpg in prod)
│   ├── models.py        # SQLAlchemy tables and schemas
│   ├── schemas.py       # Pydantic request/response validation
│   ├── auth.py          # JWT authentication and cookie management
│   └── balances.py      # Core financial engine + debt simplification
├── frontend/            # React Frontend
│   ├── src/
│   │   ├── api/         # Axios API client configured for JWT
│   │   ├── components/  # Reusable UI components & Modals
│   │   ├── context/     # React Context for authentication
│   │   ├── pages/       # Route-level components (GroupView, AuthPage)
│   │   ├── store/       # Zustand UI state store
│   │   └── types/       # TypeScript types mirroring FastAPI schemas
│   ├── vite.config.ts   # Vite configuration including PWA generation
│   └── package.json
├── tests/               # Comprehensive Pytest API suite
├── vercel.json          # Monorepo deployment config for Vercel
├── .env.example
└── README.md
```

## Running it locally

Because the frontend and backend are decoupled, you will need two terminal windows.

### 1. Start the Backend (Terminal 1)
```bash
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```
The API will run on `http://127.0.0.1:8000`. It creates an `evenly.db` SQLite file next to the app automatically.

### 2. Start the Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
The React application will run on `http://localhost:5173`. Open this URL in your browser.


## Running Tests

Evenly includes a comprehensive test suite for both the backend and frontend to ensure safety against regressions.

### Backend Tests (Pytest)
```bash
pytest tests/
```
The backend test suite runs entirely in-memory using SQLite and validates authentication, permissions, edge cases, and the correctness of the ledger's balance mutations.

### Frontend Tests (Vitest)
```bash
cd frontend
npm run test
```
The frontend suite leverages React Testing Library and Vitest to validate complex client-side debt simplification logic, accessibility (WAI-ARIA) features, and component behavior.

## Shipping it — Vercel (hosting) + Supabase (database)

This project is configured via `vercel.json` to deploy **both** the React frontend and the FastAPI backend instantly on Vercel as a single monorepo app, backed by a free Supabase Postgres database. Total cost: **$0**.

### 1. Create a free Postgres database on Supabase

1. Go to supabase.com and sign up.
2. Create a new project — any region close to you is fine. Save the database password you create!
3. Click **Connect** at the top of the dashboard.
4. Switch to the **Transaction Mode (Port 6543)** or Connection Pooler string.
5. Copy the `postgresql://` URI and replace `[YOUR-PASSWORD]` with your actual password.

### 2. Push this folder to GitHub

```bash
git init
git add .
git commit -m "Evenly: React + FastAPI expense splitter"
gh repo create evenly --source=. --public --push
```

### 3. Deploy on Vercel

1. Go to vercel.com and sign up with your GitHub account.
2. Click **Add New... > Project** and import your newly pushed `evenly` repository.
3. Open the **Environment Variables** section.
4. Add the following required environment variables:
   - **`DATABASE_URL`:** *(your Supabase connection string from Step 1)*
   - **`JWT_SECRET_KEY`:** *(run `openssl rand -hex 32` in a terminal to generate a secure random string)*
   - **`REDIS_URL`:** *(required for production deployments to prevent brute-force attacks on auth routes, e.g., Upstash Redis. If omitted, Vercel's stateless serverless functions will reset the rate limiter on every invocation, bypassing protection)*
5. (Optional) Add variables to enable Web Push Notifications and secure CORS:
   - **`VAPID_PRIVATE_KEY`:** *(run `npx web-push generate-vapid-keys` to generate)*
   - **`VAPID_PUBLIC_KEY`:** *(from the same command)*
   - **`VAPID_CLAIMS_EMAIL`:** `mailto:your-email@example.com`
   - **`CORS_ORIGINS`:** `https://your-vercel-domain.vercel.app`
6. Click **Deploy**.

Vercel will build the React app and deploy the FastAPI backend simultaneously. (Database migrations via Alembic are run automatically during the build step!).

## Inviting your group

Open the app, tap the share icon, and send the code or link. Opening the
link pre-fills the code; the person just signs in to join.

## Adding it to a phone home screen

- **iOS (Safari):** open the link → Share icon → *Add to Home Screen*.
- **Android (Chrome):** open the link → ⋮ menu → *Add to Home screen* / *Install app*.

Once installed it opens full-screen, no browser bar, like a normal native app thanks to the `vite-plugin-pwa` integration.

## A few things worth knowing

- **Currency symbol:** Modify formatting in the frontend components as needed.
- **Deleting an expense:** For safety, only the tab creator (admin) or the person who paid the expense is allowed to delete it.
- **Exporting Data:** You can export the entire tab's ledger to a CSV file. The backend streams the CSV chunk-by-chunk to prevent memory bloat on large groups.
- **Syncing across devices:** Your account identity is securely tied to your email and password via HttpOnly cookies. Log in from any phone or computer and your tabs will instantly sync.
