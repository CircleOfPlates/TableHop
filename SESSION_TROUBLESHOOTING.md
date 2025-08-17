# Session Troubleshooting Guide

## 🚨 Common Session Issues on Railway

### Problem: Login works but `/auth/me` returns 401

This is typically caused by one of these issues:

1. **Cookie not being sent** - Frontend not including credentials
2. **Cookie domain/secure settings** - Railway environment mismatch
3. **Session store issues** - PostgreSQL session table problems
4. **CORS configuration** - Frontend URL not set correctly

## 🔧 Debugging Steps

### Step 1: Check Railway Environment Variables

Ensure these are set correctly in your Railway API service:

```
NODE_ENV=production
PORT=4000
SESSION_SECRET=your-super-secret-session-key-min-32-characters
FRONTEND_URL=https://your-frontend-url.railway.app
DATABASE_URL=your-railway-postgres-url
```

### Step 2: Test Session Flow

Use the test script to debug the session flow:

```bash
# Set your Railway API URL
export API_URL=https://your-api-url.railway.app

# Run the test script
npm run test-session -w apps/api
```

### Step 3: Check Railway Logs

1. Go to your Railway API service
2. Click on "Deployments"
3. Click on the latest deployment
4. Check the logs for session-related messages

Look for these log messages:
- `Session store connected to PostgreSQL`
- `Setting session user: { userId: X, sessionExists: true }`
- `Session saved successfully: { sessionId: "...", userId: X }`
- `Getting session user ID: { userId: X, sessionExists: true, sessionId: "..." }`

### Step 4: Test Session Debug Endpoint

Visit: `https://your-api-url.railway.app/api/session-debug`

This will show you:
- Whether the session exists
- Session ID
- User ID in session
- Cookies being sent
- Request headers

### Step 5: Check Frontend Configuration

Ensure your frontend has the correct API URL:

```javascript
// In your frontend environment variables
VITE_API_URL=https://your-api-url.railway.app
```

And that your API calls include credentials:

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include', // This is crucial!
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
})
```

## 🛠️ Common Fixes

### Fix 1: Update Session Configuration

If cookies aren't being set properly, try updating the session configuration:

```typescript
// In apps/api/src/session.ts
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
    // Try these settings for Railway:
    domain: undefined, // Let browser set domain
    path: '/'
  },
});
```

### Fix 2: Update CORS Configuration

Ensure CORS allows your frontend domain:

```typescript
// In apps/api/src/server.ts
app.use(cors({ 
  origin: env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));
```

### Fix 3: Check Session Store

If PostgreSQL session store isn't working, check:

1. **Database connection**: Ensure `DATABASE_URL` is correct
2. **Session table**: The table should be created automatically
3. **Fallback**: The code falls back to MemoryStore if PostgreSQL fails

### Fix 4: Frontend Cookie Handling

Ensure your frontend is properly handling cookies:

```javascript
// In your API client configuration
const apiClient = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // This is crucial!
  headers: {
    'Content-Type': 'application/json',
  }
};
```

## 🔍 Manual Testing

### Test 1: Direct API Call

```bash
# Test login
curl -X POST https://your-api-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}' \
  -c cookies.txt

# Test auth/me with cookies
curl https://your-api-url.railway.app/api/auth/me \
  -b cookies.txt
```

### Test 2: Session Debug

```bash
# Test session debug
curl https://your-api-url.railway.app/api/session-debug
```

## 📋 Checklist

- [ ] `SESSION_SECRET` is set in Railway
- [ ] `FRONTEND_URL` is set correctly
- [ ] `DATABASE_URL` is working
- [ ] Frontend includes `credentials: 'include'`
- [ ] CORS allows frontend domain
- [ ] Session store is connected to PostgreSQL
- [ ] Cookies are being set and sent
- [ ] No domain/secure cookie issues

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Share the Railway logs** from the API service
2. **Share the session debug response** from `/api/session-debug`
3. **Share the frontend console logs** when trying to login
4. **Check if the issue is Railway-specific** by testing locally

## 🔄 Alternative Solutions

If sessions continue to fail, consider:

1. **JWT Tokens**: Switch to JWT-based authentication
2. **Redis Sessions**: Use Redis instead of PostgreSQL for sessions
3. **Memory Store**: Use in-memory sessions (not recommended for production)

---

**Remember**: Session issues are often environment-specific. What works locally might not work on Railway due to different network configurations, SSL settings, and domain handling.
