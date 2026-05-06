CREATE TABLE IF NOT EXISTS "expense_presets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "label" varchar(100) NOT NULL,
  "category" varchar(50) NOT NULL,
  "amount" integer DEFAULT 0 NOT NULL,
  "note" varchar(255) DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);