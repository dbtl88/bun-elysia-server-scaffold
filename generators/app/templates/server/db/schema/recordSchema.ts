import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  description: text("description").notNull(),
});