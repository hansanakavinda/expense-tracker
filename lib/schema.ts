import {
  pgTable,
  uuid,
  date,
  integer,
  jsonb,
  timestamp,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

export type OtherExpenseItem = {
  category: string;
  amount: number;
  note: string;
};

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date").notNull(),
    breakfast: integer("breakfast").notNull().default(0),
    lunch: integer("lunch").notNull().default(0),
    dinner: integer("dinner").notNull().default(0),
    otherExpenses: jsonb("other_expenses")
      .$type<OtherExpenseItem[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    dateUnique: unique("expenses_date_unique").on(table.date),
  })
);

export const income = pgTable(
  "income",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
    salary: integer("salary").notNull().default(0),
    freelance: integer("freelance").notNull().default(0),
    other: integer("other").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    monthUnique: unique("income_month_unique").on(table.month),
  })
);

export type ExpensePresetItem = {
  label: string;
  category: string;
  amount: number;
  note: string;
};

export const expensePresets = pgTable("expense_presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  amount: integer("amount").notNull().default(0),
  note: varchar("note", { length: 255 }).notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
