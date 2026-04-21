import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Helper to get env vars in Astro (Vite) and Node.js
const getEnv = (key: string) => {
  // 1. Try process.env first (Standard Node.js / Vercel Serverless)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // 2. Try import.meta.env (Vite dev server)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return undefined;
};

// Get database URL from environment
let databaseUrl = getEnv('DATABASE_URL');

if (!databaseUrl) {
  // If DATABASE_URL not set, use Supabase connection string
  const supabaseUrl = getEnv('SUPABASE_URL');
  const supabaseKey = getEnv('SUPABASE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing database configuration. Please set DATABASE_URL or SUPABASE_URL + SUPABASE_KEY in .env.local'
    );
  }

  // Extract database URL from Supabase
  databaseUrl = getEnv('SUPABASE_CONNECTION_STRING');
  
  if (!databaseUrl) {
    throw new Error(
      'Missing SUPABASE_CONNECTION_STRING. Get it from Supabase dashboard: Settings → Database → Connection pooling (Pooler mode)'
    );
  }
}

// Create connection client
const client = postgres(databaseUrl);

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Export client for custom queries if needed
export { client };
