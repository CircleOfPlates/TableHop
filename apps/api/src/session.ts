import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db/client';

const PgStore = connectPg(session);

function createStore() {
  try {
    console.log('Creating PostgreSQL session store with shared pool...');
    const store = new PgStore({ 
      pool, 
      tableName: 'session', 
      createTableIfMissing: true
    });
    console.log('PostgreSQL session store created successfully');
    return store;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Falling back to MemoryStore for sessions. Reason:', err);
    return new session.MemoryStore();
  }
}

export const sessionMiddleware = session({
  store: createStore(),
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: true, // Changed to true to ensure session is saved
  saveUninitialized: false,
  name: 'tablehop.sid', // Custom session name
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
});


