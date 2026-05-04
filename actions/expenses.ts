"use server";

import { db } from "@/lib/db";
import { expenses } from "@/lib/schema";
import type { OtherExpenseItem } from "@/lib/schema";
import { eq, like } from "drizzle-orm";

export async function getExpenseByDate(date: string) {
  const result = await db
    .select()
    .from(expenses)
    .where(eq(expenses.date, date))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertExpense(data: {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  otherExpenses: OtherExpenseItem[];
}) {
  const now = new Date();
  await db
    .insert(expenses)
    .values({
      date: data.date,
      breakfast: data.breakfast,
      lunch: data.lunch,
      dinner: data.dinner,
      otherExpenses: data.otherExpenses,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: expenses.date,
      set: {
        breakfast: data.breakfast,
        lunch: data.lunch,
        dinner: data.dinner,
        otherExpenses: data.otherExpenses,
        updatedAt: now,
      },
    });
}

export async function getExpensesByMonth(month: string) {
  // month = "YYYY-MM"
  const result = await db
    .select()
    .from(expenses)
    .where(like(expenses.date, `${month}-%`));
  return result;
}
