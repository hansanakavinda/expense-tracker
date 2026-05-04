# Expense Tracker

A personal daily expense tracking web app built with **Next.js 14+**, **Neon DB** (serverless Postgres), **Drizzle ORM**, **NextAuth.js v5**, and **Tailwind CSS**.

---

## Features

- 📅 **Daily Log** — fast, mobile-friendly expense entry per day
- 📊 **Monthly Dashboard** — income vs. spending, category breakdown, weekly totals
- 🔐 **Single-user auth** — credentials provider (email + password from env vars)
- 💾 **Neon DB** — serverless Postgres with Drizzle ORM
- 🚀 **Vercel-ready** — deploys in one click

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Database | Neon DB (serverless Postgres) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 (JWT) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (`postgres://...`) |
| `AUTH_SECRET` | NextAuth secret key — generate with `openssl rand -base64 32` |
| `AUTH_USER_EMAIL` | Your login email |
| `AUTH_USER_PASSWORD` | Your login password (plain text, checked server-side only) |

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd expense-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Neon DB

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the connection string from your project dashboard
3. Paste it as `DATABASE_URL` in `.env.local`

### 4. Generate the auth secret

```bash
openssl rand -base64 32
```

Paste the output as `AUTH_SECRET` in `.env.local`.

### 5. Push the database schema

```bash
npm run db:push
```

This will create the `expenses` and `income` tables on Neon using the Drizzle schema.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your credentials.

---

## Database Schema

### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| date | date | `YYYY-MM-DD`, unique |
| breakfast | integer | LKR, default 0 |
| lunch | integer | LKR, default 0 |
| dinner | integer | LKR, default 0 |
| other_expenses | jsonb | `[{ category, amount, note }]` |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

### `income`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| month | varchar(7) | `YYYY-MM`, unique |
| salary | integer | LKR, default 0 |
| freelance | integer | LKR, default 0 |
| other | integer | LKR, default 0 |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the repository into [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Deploy — Vercel automatically handles Next.js App Router builds

> **Tip**: Run `npm run db:push` once against your production Neon database before your first deploy.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to Neon |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

---

## Project Structure

```
/app
  /login          → Login page
  /               → Redirects to /log
  /log            → Daily expense entry
  /dashboard      → Monthly overview and analytics
  /api/auth       → NextAuth route handler
/components
  Navbar.tsx
  Toast.tsx
  OtherExpenseRow.tsx
  MonthSelector.tsx
  CategoryBar.tsx
/lib
  db.ts           → Neon + Drizzle connection
  schema.ts       → Drizzle schema definitions
/actions
  expenses.ts     → Expense server actions
  income.ts       → Income server actions
/drizzle
  0000_initial.sql → Initial migration
auth.ts           → NextAuth configuration
middleware.ts     → Route protection
```