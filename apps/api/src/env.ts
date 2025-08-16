import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.preprocess((v) => Number(v), z.number().int().positive()).default(4000),
  SESSION_SECRET: z.string().min(16),
  // Support both Vercel-Supabase integration and direct DATABASE_URL
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema> & { PORT: number };

const parsedEnv = envSchema.parse(process.env);

// Use POSTGRES_URL from Vercel-Supabase integration if available, fallback to DATABASE_URL
const databaseUrl = parsedEnv.POSTGRES_URL || parsedEnv.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Either POSTGRES_URL or DATABASE_URL must be set');
}

export const env: Env = {
  ...parsedEnv,
  DATABASE_URL: databaseUrl,
};


