import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const <%=objectName%>s = pgTable("<%=objectName%>s", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  description: text("description").notNull(),
});