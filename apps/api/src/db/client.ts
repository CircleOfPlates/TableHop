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

// Create the database client with all schema and relations
export const db = drizzle(pool, { 
  schema: {
    ...schema,
    // Explicitly include all relations
    usersRelations: schema.usersRelations,
    neighbourhoodsRelations: schema.neighbourhoodsRelations,
    eventsRelations: schema.eventsRelations,
    eventRatingsRelations: schema.eventRatingsRelations,
    testimonialsRelations: schema.testimonialsRelations,
    userBadgesRelations: schema.userBadgesRelations,
    userPointsRelations: schema.userPointsRelations,
    pointTransactionsRelations: schema.pointTransactionsRelations,
    pointRedemptionsRelations: schema.pointRedemptionsRelations,
    matchingPoolRelations: schema.matchingPoolRelations,
    circlesRelations: schema.circlesRelations,
    circleMembersRelations: schema.circleMembersRelations,
    emailNotificationsRelations: schema.emailNotificationsRelations,
  }
});

export type DbClient = typeof db;


