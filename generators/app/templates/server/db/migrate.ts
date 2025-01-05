import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

async function runMigration() {
  const sql = postgres(process.env.DB_CONNECTION_STRING!, {
    max: 1,
    idle_timeout: 5,
    max_lifetime: 60,
  });
  const migrationsClient = drizzle(sql);
  await migrate(migrationsClient, { migrationsFolder: "./db/migrations" });
  await sql.end();
}

runMigration();
