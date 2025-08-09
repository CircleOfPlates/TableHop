import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { Pool } from 'pg';
import { env } from './env';

const PgStore = connectPg(session);

function createStore() {
  try {
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    return new PgStore({ pool, tableName: 'session', createTableIfMissing: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Falling back to MemoryStore for sessions. Reason:', err);
    return new session.MemoryStore();
  }
}

export const sessionMiddleware = session({
  store: createStore(),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
});


