import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (local) or the Vercel project settings (production)."
  );
}

// On Vercel (Fluid compute) and other shared/long-running runtimes, the module
// scope is reused across requests, so we open one pool here and reuse it.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

// Let the Vercel runtime drain idle connections before an instance suspends.
attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });
export { schema };
