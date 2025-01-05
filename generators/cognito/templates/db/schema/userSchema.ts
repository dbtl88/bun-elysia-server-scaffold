import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  cognitoId: uuid("cognito_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});