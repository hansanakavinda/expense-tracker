"use server";

import { db } from "@/lib/db";
import { income } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getIncomeByMonth(month: string) {
  const result = await db
    .select()
    .from(income)
    .where(eq(income.month, month))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertIncome(data: {
  month: string;
  salary: number;
  freelance: number;
  other: number;
}) {
  const now = new Date();
  await db
    .insert(income)
    .values({
      month: data.month,
      salary: data.salary,
      freelance: data.freelance,
      other: data.other,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: income.month,
      set: {
        salary: data.salary,
        freelance: data.freelance,
        other: data.other,
        updatedAt: now,
      },
    });
}
