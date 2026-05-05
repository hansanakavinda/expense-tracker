import { config } from "dotenv";
config({ path: ".env.local" });
// Also try .env as fallback (user changed gitignore to use .env)
if (!process.env.DATABASE_URL) {
  config({ path: ".env" });
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { expenses } from "../lib/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ── Seed data ────────────────────────────────────────────────────────────────
// Format: { date, breakfast, lunch, dinner, otherExpenses[] }
// Source: spreadsheet data for March 2026
const seedData = [
  {
    "date": "2026-03-23",
    "breakfast": 250,
    "lunch": 150,
    "dinner": 600,
    "otherExpenses": [
      { "category": "Utilities & Bills", "amount": 24000, "note": "Rent + Key money" }
    ]
  },
]

// ── Insert ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`Seeding ${seedData.length} expense rows…\n`);

  for (const row of seedData) {
    const total =
      row.breakfast +
      row.lunch +
      row.dinner +
      row.otherExpenses.reduce((s, e) => s + e.amount, 0);

    await db
      .insert(expenses)
      .values({
        date: row.date,
        breakfast: row.breakfast,
        lunch: row.lunch,
        dinner: row.dinner,
        otherExpenses: row.otherExpenses,
      })
      .onConflictDoUpdate({
        target: expenses.date,
        set: {
          breakfast: row.breakfast,
          lunch: row.lunch,
          dinner: row.dinner,
          otherExpenses: row.otherExpenses,
          updatedAt: new Date(),
        },
      });

    console.log(`  ✓  ${row.date}  →  Rs. ${total.toLocaleString("en-LK")}`);
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
