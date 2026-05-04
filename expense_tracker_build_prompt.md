# Expense Tracker Web App — Coding Agent Prompt

## Project Overview

Build a personal expense tracking web app for a single user. The primary goal is to make daily expense logging as fast and frictionless as possible. The app should feel clean, mobile-friendly, and snappy. No unnecessary complexity.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Neon DB (serverless Postgres)
- **ORM**: Drizzle ORM
- **Auth**: NextAuth.js v5 (single user — credentials provider with a hardcoded email/password via environment variables)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## Authentication

- Single user only. No registration flow.
- Use NextAuth.js credentials provider.
- Email and password stored as environment variables (`AUTH_USER_EMAIL`, `AUTH_USER_PASSWORD`).
- All routes except `/login` must be protected.
- Session-based auth using NextAuth JWT strategy.

---

## Database Schema

Use Drizzle ORM. Define the following tables:

### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key, default generated |
| date | date | the day the expense belongs to (not timestamp) |
| breakfast | integer | amount in LKR, default 0 |
| lunch | integer | amount in LKR, default 0 |
| dinner | integer | amount in LKR, default 0 |
| other_expenses | jsonb | array of `{ category: string, amount: integer, note: string }` |
| created_at | timestamp | default now() |
| updated_at | timestamp | default now() |

> One row per date. If a row exists for a date, it is updated on save. If not, it is created.

### `income`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key, default generated |
| month | varchar(7) | format `YYYY-MM` e.g. `2026-04` |
| salary | integer | default 0 |
| freelance | integer | default 0 |
| other | integer | default 0 |
| created_at | timestamp | default now() |
| updated_at | timestamp | default now() |

> One row per month. Upsert on save.

---

## App Structure

```
/app
  /login          → Login page
  /               → Redirects to /log (default route)
  /log            → Daily expense entry (main screen)
  /dashboard      → Monthly overview and analytics
/components
/lib
  /db.ts          → Neon + Drizzle setup
  /schema.ts      → Drizzle schema
/actions          → Next.js Server Actions for all DB operations
```

---

## Page 1: `/log` — Daily Expense Entry

This is the most important screen. It must be fast and intuitive.

### Layout & Behaviour

- At the top, a **date selector** (a styled date input or calendar picker). Default is always **today's date** on load.
- When a date is selected/changed, the form **auto-loads** any existing data saved for that date (breakfast, lunch, dinner, other entries). If no data exists, all fields default to 0 / empty.
- A subtle indicator (e.g. a dot or "Saved" badge) shows whether data already exists for the selected date.

### Meal Fields (always visible, fixed)

Three clearly labelled number input fields, always present:
- **Breakfast** — number input, default 0
- **Lunch** — number input, default 0
- **Dinner** — number input, default 0

No need to add or remove these. They are always shown.

### Other Expenses Section

Below the meal fields, an "Other Expenses" section that supports multiple entries per day.

Each entry has:
- **Category** — dropdown with options: `Transport`, `Utilities & Bills`, `Groceries & Snacks`, `Health`, `Entertainment`, `Other`
- **Amount** — number input in LKR
- **Note** — short text input (optional, placeholder: "e.g. Tuk, bus fare")
- A remove button (×) to delete that entry

An **"+ Add Expense"** button appends a new empty entry row.

### Save Button

- A prominent **Save** button at the bottom.
- On save, upsert the record for the selected date.
- Show a brief success toast/message on save.
- After saving, the form stays on the same date (do not navigate away).

### Navigation hint

- A subtle **"← Previous day"** and **"Next day →"** navigation below the date picker to quickly step through days without using the date picker.

---

## Page 2: `/dashboard` — Monthly Overview

### Month Selector

- At the top, a month/year selector (prev/next arrows + current month label). Defaults to current month.

### Income Section

A clean card or section at the top of the dashboard labelled **"Income"** with three editable fields:
- **Salary** — number input
- **Freelance** — number input
- **Other** — number input

Each field can be 0. An **"Update Income"** button saves the values for the selected month. Load existing income on month change.

Show a **Total Income** summary below the three fields.

### Monthly Expense Summary

Below income, show:

- **Total Spent** this month
- **Balance** = Total Income − Total Spent (highlight green if positive, red if negative)
- A **category breakdown** showing totals for: Breakfast, Lunch, Dinner, Transport, Utilities & Bills, Groceries & Snacks, Health, Entertainment, Other
- Each category shows its amount and percentage of total spending

### Weekly Breakdown

Below the summary, a simple table or card list showing each week of the selected month with:
- Week label (e.g. "Week 1 — Mar 23–29")
- Total spent that week

### Daily Log Preview

A scrollable list of all days in the selected month that have data, showing date, total for that day, and any notes from "other" entries. Clicking a day navigates to `/log?date=YYYY-MM-DD` with that date pre-selected.

---

## Server Actions

Implement the following server actions in `/actions`:

- `getExpenseByDate(date: string)` — fetch one expense row by date
- `upsertExpense(data)` — insert or update expense for a date
- `getIncomeByMonth(month: string)` — fetch income row for a month
- `upsertIncome(data)` — insert or update income for a month
- `getExpensesByMonth(month: string)` — fetch all expense rows for a given month (for dashboard)

---

## UI & Styling Guidelines

- Use **Tailwind CSS** throughout. No external UI component libraries.
- Mobile-first. The `/log` page especially must work well on a phone screen.
- Clean, minimal design. Prioritise readability and fast scanning.
- Use a consistent colour accent (e.g. indigo or emerald) for interactive elements.
- Inputs should be large enough to tap comfortably on mobile.
- Currency amounts should display with comma formatting (e.g. `1,200`) and an `Rs.` prefix where shown as read-only.
- Number inputs should not show spinners (hide with CSS).
- All forms should handle loading states (disable buttons while saving).

---

## Environment Variables

The following must be defined in `.env.local` and documented in `.env.example`:

```
DATABASE_URL=           # Neon connection string
AUTH_SECRET=            # NextAuth secret (generate with: openssl rand -base64 32)
AUTH_USER_EMAIL=        # Your login email
AUTH_USER_PASSWORD=     # Your login password (plain text, checked server-side)
```

---

## Project Constraints & Notes

- No multi-user support needed. No user IDs in the schema.
- No real-time updates needed. Standard fetch on navigation/action is fine.
- No offline support needed.
- Keep dependencies minimal. Only add packages that are necessary.
- All monetary values are stored as integers in **LKR (Sri Lankan Rupees)**.
- Dates are stored and handled as `YYYY-MM-DD` strings in all server actions to avoid timezone issues.
- The `other_expenses` JSONB field stores an array; treat an empty array as the default.

---

## Suggested Implementation Order

1. Set up Next.js project with Tailwind
2. Configure Neon DB + Drizzle ORM, run migrations
3. Set up NextAuth with credentials provider
4. Build server actions
5. Build `/log` page (expense entry)
6. Build `/dashboard` page (monthly overview)
7. Add login page and route protection middleware
8. Final polish — loading states, toasts, mobile layout review

---

## Deliverables

- Fully working Next.js app matching the above spec
- `README.md` with setup instructions, environment variable descriptions, and how to run locally and deploy to Vercel
- Drizzle migration files committed
- `.env.example` file
