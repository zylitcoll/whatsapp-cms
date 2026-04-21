import dotenv from 'dotenv';
import { execSync } from 'child_process';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.SUPABASE_CONNECTION_STRING || process.env.DATABASE_URL;

try {
  // Use --force to accept statements
  execSync(`npx drizzle-kit push --force`, { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl }
  });
  console.log('Migration completed!');
} catch (e) {
  console.error('Migration failed!');
}
