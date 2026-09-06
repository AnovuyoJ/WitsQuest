import "../config";
import { Pool, PoolClient } from "pg";

// This is a PostgreSQL connection, not Supabase's generated HTTP Data API.
export const database = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 15_000,
});

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
