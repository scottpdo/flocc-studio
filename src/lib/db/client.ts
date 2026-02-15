/**
 * Database Client — Drizzle + Neon
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create Neon client
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle client
export const db = drizzle(sql, { schema });

// Export schema for convenience
export { schema };
