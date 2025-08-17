# Fixed Railway Deployment Guide

## 🚨 Problem Identified

The error you're seeing is because Railway is trying to use workspace commands (`npm run build -w apps/api`) when it should be using local package.json commands. Here's how to fix it:

## ✅ Solution: Correct Railway Deployment Steps

### Step 1: Deploy API Service

1. **Go to [Railway.app](https://railway.app)**
2. **Create a new project**
3. **Deploy from GitHub repo** - Choose your TableHop repository
4. **Configure the service settings:**
   - **Name**: `tablehop-api`
   - **Root Directory**: `apps/api` ⭐ **This is crucial!**
   - **Build Command**: `npm install && npm run build` ⭐ **NOT workspace command**
   - **Start Command**: `npm start` ⭐ **NOT workspace command**

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically add `DATABASE_URL` to your environment

### Step 3: Set Environment Variables for API

Go to your API service settings and add these environment variables:

```
NODE_ENV=production
PORT=4000
SESSION_SECRET=your-super-secret-session-key-min-32-characters
FRONTEND_URL=https://your-frontend-url.railway.app
```

### Step 4: Deploy Frontend Service

1. **Create a new service** in the same Railway project
2. **Deploy from the same GitHub repo**
3. **Configure the service settings:**
   - **Name**: `tablehop-web`
   - **Root Directory**: `apps/web` ⭐ **This is crucial!**
   - **Build Command**: `npm install && npm run build` ⭐ **NOT workspace command**
   - **Start Command**: `npm run preview` ⭐ **NOT workspace command**

### Step 5: Set Environment Variables for Frontend

```
VITE_API_URL=https://your-api-url.railway.app
PORT=3000
```

## 🔧 Alternative: Single Service Deployment

If you're still having issues, try deploying everything as one service:

1. **Create a single service:**
   - Deploy from GitHub repo
   - **Root Directory**: `/` (root of repository)

2. **Set build and start commands:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Add PostgreSQL database** (same as above)

4. **Set environment variables:**
   ```
   NODE_ENV=production
   PORT=4000
   SESSION_SECRET=your-super-secret-session-key-min-32-characters
   DATABASE_URL=your-railway-postgres-url
   ```

## 🚨 Common Mistakes to Avoid

### ❌ Don't Use These Commands:
- `npm run build -w apps/api` (workspace command)
- `npm start -w apps/api` (workspace command)
- Root directory: `/` when you want just the API

### ✅ Use These Commands Instead:
- `npm install && npm run build` (local command)
- `npm start` (local command)
- Root directory: `apps/api` for API service

## 🔍 Verification Steps

After deployment, verify:

1. **API Health Check**: Visit `https://your-api-url.railway.app/health`
   - Should return: `{"ok": true}`

2. **API Documentation**: Visit `https://your-api-url.railway.app/api-docs`
   - Should show Swagger documentation

3. **Frontend Health Check**: Visit `https://your-frontend-url.railway.app/health`
   - Should return: `{"ok": true, "service": "tablehop-web", "timestamp": "...", "status": "healthy"}`

4. **Frontend**: Visit `https://your-frontend-url.railway.app`
   - Should load the TableHop application

## 🛠️ Troubleshooting

### If Build Still Fails:

1. **Check Railway Logs**: Go to your service → Deployments → Click on deployment → View logs

2. **Verify Package.json**: Ensure `apps/api/package.json` has:
   ```json
   {
     "scripts": {
       "build": "tsc -p tsconfig.json",
       "start": "node dist/server.js"
     }
   }
   ```

3. **Check Dependencies**: Ensure all dependencies are in `apps/api/package.json`

4. **Try Single Service**: Use the alternative single service deployment method

### If Database Connection Fails:

1. Verify `DATABASE_URL` is set correctly
2. Check if PostgreSQL service is running
3. Ensure SSL is enabled for production

### If Frontend Health Check Fails:

1. Verify the `/health` route is accessible
2. Check that Vite preview server allows all hosts (`allowedHosts: true`)
3. Ensure the Railway configuration has `healthcheckPath: "/health"`

## 📞 Need Help?

If you're still experiencing issues:

1. **Share the exact error message** from Railway logs
2. **Check the deployment logs** in Railway dashboard
3. **Verify your repository structure** matches the expected layout

---

**This should resolve your Railway deployment issues! 🚀**
