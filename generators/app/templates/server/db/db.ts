import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const queryClient = postgres(process.env.DB_CONNECTION_STRING!, {});

export const db = drizzle(queryClient, { schema });