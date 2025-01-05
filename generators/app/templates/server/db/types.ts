import * as schema from "./schema";

export type NewRecord = typeof schema.records.$inferInsert;
export type Record = typeof schema.records.$inferSelect;
