import { pgTable, serial, integer, text, boolean, timestamp, date, time, jsonb, varchar, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  participants: many(participants),
  eventRatings: many(eventRatings, { relationName: 'rater' }),
  ratedBy: many(eventRatings, { relationName: 'ratedUser' }),
  testimonials: many(testimonials),
  userBadges: many(userBadges),
  userPoints: one(userPoints),
  pointTransactions: many(pointTransactions),
  pointRedemptions: many(pointRedemptions),
}));

export const neighbourhoodsRelations = relations(neighbourhoods, ({ many }) => ({
  events: many(events),
  testimonials: many(testimonials),
}));

export const eventsRelations = relations(events, ({ many, one }) => ({
  participants: many(participants),
  eventRatings: many(eventRatings),
  dinnerGroups: many(dinnerGroups),
  pointTransactions: many(pointTransactions),
  pointRedemptions: many(pointRedemptions),
  neighbourhood: one(neighbourhoods, {
    fields: [events.neighbourhoodId],
    references: [neighbourhoods.id],
  }),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  event: one(events, {
    fields: [participants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
  partner: one(users, {
    fields: [participants.partnerId],
    references: [users.id],
    relationName: 'partner',
  }),
  dinnerGroupsAsStarter: many(dinnerGroups, { relationName: 'starterParticipant' }),
  dinnerGroupsAsMain: many(dinnerGroups, { relationName: 'mainParticipant' }),
  dinnerGroupsAsDessert: many(dinnerGroups, { relationName: 'dessertParticipant' }),
}));

export const eventRatingsRelations = relations(eventRatings, ({ one }) => ({
  event: one(events, {
    fields: [eventRatings.eventId],
    references: [events.id],
  }),
  rater: one(users, {
    fields: [eventRatings.raterId],
    references: [users.id],
    relationName: 'rater',
  }),
  ratedUser: one(users, {
    fields: [eventRatings.ratedUserId],
    references: [users.id],
    relationName: 'ratedUser',
  }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  user: one(users, {
    fields: [testimonials.userId],
    references: [users.id],
  }),
  neighbourhood: one(neighbourhoods, {
    fields: [testimonials.neighbourhoodId],
    references: [neighbourhoods.id],
  }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
}));

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [pointTransactions.eventId],
    references: [events.id],
  }),
}));

export const pointRedemptionsRelations = relations(pointRedemptions, ({ one }) => ({
  user: one(users, {
    fields: [pointRedemptions.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [pointRedemptions.eventId],
    references: [events.id],
  }),
}));

export const dinnerGroupsRelations = relations(dinnerGroups, ({ one }) => ({
  event: one(events, {
    fields: [dinnerGroups.eventId],
    references: [events.id],
  }),
  starterParticipant: one(participants, {
    fields: [dinnerGroups.starterParticipantId],
    references: [participants.id],
    relationName: 'starterParticipant',
  }),
  mainParticipant: one(participants, {
    fields: [dinnerGroups.mainParticipantId],
    references: [participants.id],
    relationName: 'mainParticipant',
  }),
  dessertParticipant: one(participants, {
    fields: [dinnerGroups.dessertParticipantId],
    references: [participants.id],
    relationName: 'dessertParticipant',
  }),
}));


