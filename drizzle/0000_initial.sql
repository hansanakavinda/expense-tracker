CREATE TABLE IF NOT EXISTS "expenses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" date NOT NULL,
  "breakfast" integer DEFAULT 0 NOT NULL,
  "lunch" integer DEFAULT 0 NOT NULL,
  "dinner" integer DEFAULT 0 NOT NULL,
  "other_expenses" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "expenses_date_unique" UNIQUE("date")
);

CREATE TABLE IF NOT EXISTS "income" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "month" varchar(7) NOT NULL,
  "salary" integer DEFAULT 0 NOT NULL,
  "freelance" integer DEFAULT 0 NOT NULL,
  "other" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "income_month_unique" UNIQUE("month")
);
