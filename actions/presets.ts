"use server";

import { db } from "@/lib/db";
import { expensePresets, type ExpensePresetItem } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function getExpensePresets() {
  const result = await db
    .select()
    .from(expensePresets)
    .orderBy(desc(expensePresets.createdAt));

  return result;
}

export async function addExpensePreset(preset: ExpensePresetItem) {
  const now = new Date();
  const [inserted] = await db
    .insert(expensePresets)
    .values({
      label: preset.label,
      category: preset.category,
      amount: preset.amount,
      note: preset.note,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return inserted;
}

export async function updateExpensePreset(
  id: string,
  preset: Partial<ExpensePresetItem>
) {
  const [updated] = await db
    .update(expensePresets)
    .set({
      ...preset,
      updatedAt: new Date(),
    })
    .where(eq(expensePresets.id, id))
    .returning();
  return updated;
}

export async function deleteExpensePreset(id: string) {
  await db.delete(expensePresets).where(eq(expensePresets.id, id));
}

// Legacy bulk-replace kept for backwards compatibility
export async function replaceExpensePresets(
  presets: Array<ExpensePresetItem & { id: string }>
) {
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.delete(expensePresets);

    if (presets.length > 0) {
      await tx.insert(expensePresets).values(
        presets.map((preset) => ({
          id: preset.id,
          label: preset.label,
          category: preset.category,
          amount: preset.amount,
          note: preset.note,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }
  });
}