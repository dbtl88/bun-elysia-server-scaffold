import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DB_CONNECTION_STRING!,
    ssl: process.env.NODE_ENV == "local" ? false : true,
  },
} satisfies Config;