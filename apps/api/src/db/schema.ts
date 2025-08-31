import { pgTable, serial, integer, text, boolean, timestamp, date, time, jsonb, varchar, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { EVENT_STATUS, CIRCLE_FORMAT, CIRCLE_ROLES } from '../config/constants';

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

// Events (simplified for matching system - only date and time)
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  startTime: time('start_time', { withTimezone: false }).notNull(),
  endTime: time('end_time', { withTimezone: false }).notNull(),
  matchingStatus: varchar('matching_status', { length: 20 }).default(EVENT_STATUS.OPEN).notNull(),
  matchingTriggeredAt: timestamp('matching_triggered_at', { withTimezone: true }),
  matchingCompletedAt: timestamp('matching_completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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

// Event Ratings (for circle members to rate each other)
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

// Matching Pool (users who opt-in to be matched)
export const matchingPool = pgTable('matching_pool', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  partnerId: integer('partner_id').references(() => users.id),
  matchAddress: text('match_address'),
  hostingAvailable: boolean('hosting_available').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userEventUnique: uniqueIndex('matching_pool_user_event_idx').on(table.userId, table.eventId),
}));

// Circles (groups of 6 users assigned after matching)
export const circles = pgTable('circles', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  format: varchar('format', { length: 20 }).notNull(), // 'rotating' or 'hosted'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Circle Members (users assigned to circles)
export const circleMembers = pgTable('circle_members', {
  id: serial('id').primaryKey(),
  circleId: integer('circle_id').references(() => circles.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'host', 'participant', 'starter', 'main', 'dessert'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  circleUserUnique: uniqueIndex('circle_members_circle_user_idx').on(table.circleId, table.userId),
}));

// Email Notifications
export const emailNotifications = pgTable('email_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'matching_triggered', 'circle_assigned', 'partner_opt_in'
  subject: varchar('subject', { length: 200 }).notNull(),
  body: text('body').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'sent', 'failed'
});

// Chat Messages for circle communication
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  circleId: integer('circle_id').references(() => circles.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  eventRatings: many(eventRatings, { relationName: 'rater' }),
  ratedBy: many(eventRatings, { relationName: 'ratedUser' }),
  testimonials: many(testimonials),
  userBadges: many(userBadges),
  userPoints: one(userPoints),
  pointTransactions: many(pointTransactions),
  pointRedemptions: many(pointRedemptions),
  matchingPool: many(matchingPool),
  circleMembers: many(circleMembers),
  emailNotifications: many(emailNotifications),
  chatMessages: many(chatMessages),
}));

export const neighbourhoodsRelations = relations(neighbourhoods, ({ many }) => ({
  testimonials: many(testimonials),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  eventRatings: many(eventRatings),
  pointTransactions: many(pointTransactions),
  pointRedemptions: many(pointRedemptions),
  matchingPool: many(matchingPool),
  circles: many(circles),
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

export const matchingPoolRelations = relations(matchingPool, ({ one }) => ({
  event: one(events, {
    fields: [matchingPool.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [matchingPool.userId],
    references: [users.id],
  }),
  partner: one(users, {
    fields: [matchingPool.partnerId],
    references: [users.id],
    relationName: 'partner',
  }),
}));

export const circlesRelations = relations(circles, ({ one, many }) => ({
  event: one(events, {
    fields: [circles.eventId],
    references: [events.id],
  }),
  members: many(circleMembers),
  chatMessages: many(chatMessages),
}));

export const circleMembersRelations = relations(circleMembers, ({ one }) => ({
  circle: one(circles, {
    fields: [circleMembers.circleId],
    references: [circles.id],
  }),
  user: one(users, {
    fields: [circleMembers.userId],
    references: [users.id],
  }),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, {
    fields: [emailNotifications.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  circle: one(circles, {
    fields: [chatMessages.circleId],
    references: [circles.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));