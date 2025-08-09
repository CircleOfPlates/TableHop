import { pgTable, serial, integer, text, boolean, timestamp, date, time, jsonb, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 200 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  neighbourhood: varchar('neighbourhood', { length: 200 }),
  bio: text('bio'),
  dietaryRestrictions: text('dietary_restrictions'),
  interests: jsonb('interests').$type<string[]>(),
  dateOfBirth: date('date_of_birth'),
  personalityType: varchar('personality_type', { length: 50 }),
  cookingExperience: varchar('cooking_experience', { length: 50 }),
  preferredGroupSize: varchar('preferred_group_size', { length: 50 }),
  socialPreferences: jsonb('social_preferences').$type<string[]>(),
  role: varchar('role', { length: 20 }).default('user'),
});

// Neighbourhoods
export const neighbourhoods = pgTable('neighbourhoods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  city: varchar('city', { length: 200 }),
  state: varchar('state', { length: 200 }),
  zip: varchar('zip', { length: 20 }),
});

// Events
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  neighbourhoodId: integer('neighbourhood_id').references(() => neighbourhoods.id).notNull(),
  date: date('date').notNull(),
  startTime: time('start_time', { withTimezone: false }).notNull(),
  endTime: time('end_time', { withTimezone: false }).notNull(),
  totalSpots: integer('total_spots').notNull(),
  spotsRemaining: integer('spots_remaining').notNull(),
  isWaitlist: boolean('is_waitlist').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  format: varchar('format', { length: 20 }).notNull(), // 'rotating' | 'hosted'
});

// Participants
export const participants = pgTable(
  'participants',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').references(() => events.id).notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    partnerId: integer('partner_id').references(() => users.id),
    coursePreference: varchar('course_preference', { length: 20 }),
    courseAssigned: varchar('course_assigned', { length: 20 }),
    isHost: boolean('is_host').default(false).notNull(),
    registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userEventUnique: uniqueIndex('participants_user_event_idx').on(table.userId, table.eventId),
  })
);

// Dinner Groups
export const dinnerGroups = pgTable('dinner_groups', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  starterParticipantId: integer('starter_participant_id').references(() => participants.id),
  mainParticipantId: integer('main_participant_id').references(() => participants.id),
  dessertParticipantId: integer('dessert_participant_id').references(() => participants.id),
});

// Testimonials
export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  rating: integer('rating').notNull(),
  neighbourhoodId: integer('neighbourhood_id').references(() => neighbourhoods.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Badges
export const userBadges = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  badgeType: varchar('badge_type', { length: 100 }).notNull(),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).defaultNow().notNull(),
});

// Event Ratings
export const eventRatings = pgTable('event_ratings', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  raterId: integer('rater_id').references(() => users.id).notNull(),
  ratedUserId: integer('rated_user_id').references(() => users.id),
  overallRating: integer('overall_rating').notNull(),
  foodQuality: integer('food_quality'),
  hostExperience: integer('host_experience'),
  socialConnection: integer('social_connection'),
  review: text('review'),
  favoriteMemory: text('favorite_memory'),
  wouldRecommend: boolean('would_recommend'),
  isHostRating: boolean('is_host_rating').default(false).notNull(),
  isGuestRating: boolean('is_guest_rating').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Points System
export const userPoints = pgTable('user_points', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  points: integer('points').default(0).notNull(),
  totalPointsEarned: integer('total_points_earned').default(0).notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
});

export const pointTransactions = pgTable('point_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  eventId: integer('event_id').references(() => events.id),
  pointsEarned: integer('points_earned').notNull(),
  reason: varchar('reason', { length: 200 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pointRedemptions = pgTable('point_redemptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  eventId: integer('event_id').references(() => events.id),
  pointsUsed: integer('points_used').notNull(),
  rewardType: varchar('reward_type', { length: 200 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});


