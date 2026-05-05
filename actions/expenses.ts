"use server";

import { db } from "@/lib/db";
import { expenses } from "@/lib/schema";
import type { OtherExpenseItem } from "@/lib/schema";
import { and, eq, gte, lt } from "drizzle-orm";

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
  const start = `${month}-01`;
  const endDate = new Date(`${month}-01T00:00:00Z`);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);
  const end = endDate.toISOString().slice(0, 10);

  const result = await db
    .select()
    .from(expenses)
    .where(and(gte(expenses.date, start), lt(expenses.date, end)));
  return result;
}
