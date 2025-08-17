import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db/client';

const PgStore = connectPg(session);

function createStore() {
  try {
    const store = new PgStore({ 
      pool, 
      tableName: 'session', 
      createTableIfMissing: true
    });
    return store;
  } catch (err) {
    console.warn('Falling back to MemoryStore for sessions. Reason:', err);
    return new session.MemoryStore();
  }
}

export const sessionMiddleware = session({
  store: createStore(),
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'tablehop.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
});


