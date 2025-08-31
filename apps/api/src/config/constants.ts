export const MATCHING_CONFIG = {
  DEFAULT_CIRCLE_SIZE: 6,
  MATCHING_DEADLINE_DAYS: 2, // Days before event
  ROTATING_HOSTED_SPLIT: 0.5, // 50/50 split
} as const;

export const EVENT_STATUS = {
  OPEN: 'open',
  MATCHING: 'matching',
  CLOSED: 'closed',
} as const;

export const CIRCLE_FORMAT = {
  ROTATING: 'rotating',
  HOSTED: 'hosted',
} as const;

export const CIRCLE_ROLES = {
  HOST: 'host',
  PARTICIPANT: 'participant',
  STARTER: 'starter',
  MAIN: 'main',
  DESSERT: 'dessert',
} as const;

