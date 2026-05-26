import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[DB] New client connected to PostgreSQL pool');
  }
});

pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  process.exit(-1);
});

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null | undefined)[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] Executed query in ${duration}ms | rows: ${result.rowCount}`);
    }
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[DB] Query error:', err.message);
    console.error('[DB] Query:', text);
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  const timeout = setTimeout(() => {
    console.error('[DB] A client has been checked out for more than 5 seconds!');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    client.release = release;
    return release();
  };

  // Override query for logging instrumentation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).query = (...args: Parameters<typeof originalQuery>) => {
    return originalQuery(...args);
  };

  return client;
};

export const transaction = async <T>(
  callback: (client: Awaited<ReturnType<typeof getClient>>) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('[DB] Connection successful. Server time:', result.rows[0].now);
    return true;
  } catch (error) {
    const err = error as Error;
    console.error('[DB] Connection failed:', err.message);
    return false;
  }
};

export default pool;
