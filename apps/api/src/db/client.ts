import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../env';

// Create a shared connection pool
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

export const db = drizzle(pool, { schema });
export type DbClient = typeof db;


