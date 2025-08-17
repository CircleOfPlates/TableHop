import session from 'express-session';
import connectPg from 'connect-pg-simple';

const PgStore = connectPg(session);

function createStore() {
  try {
    const store = new PgStore({ 
      pool: require('./db/client').pool, 
      tableName: 'session', 
      createTableIfMissing: true
    });
    
    // Add debugging for session store
    store.on('connect', () => {
      console.log('Session store connected to PostgreSQL');
    });
    
    store.on('error', (err) => {
      console.error('Session store error:', err);
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
    // Add domain configuration for Railway
    domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
  },
});


