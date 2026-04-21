import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/whatsapp_cms',
  },
  migrations: {
    prefix: 'timestamp',
  },
  introspect: {
    casing: 'snake_case',
  },
  verbose: true,
  strict: true,
});
