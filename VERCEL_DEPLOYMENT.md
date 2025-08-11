# TableHop Vercel + Supabase Deployment Guide

This guide will help you deploy TableHop to Vercel with Supabase as the database.

## 🚀 Quick Start

### Step 1: Supabase Setup ✅ (You've already done this)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your database URL from Settings → Database
3. Note down your database URL for the next steps

### Step 2: Deploy Backend to Vercel

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up/Login with GitHub**
3. **Import your TableHop repository**
4. **Configure the deployment:**

   **Project Settings:**
   - **Framework Preset**: `Node.js`
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   SESSION_SECRET=your-super-secret-session-key-here-min-16-chars
   DATABASE_URL=your-supabase-database-url
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

6. **Deploy!**

### Step 3: Deploy Frontend to Vercel

1. **Create another Vercel project** (same repository)
2. **Configure:**
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Add Environment Variables:**
   ```
   VITE_API_URL=https://your-api-vercel-app.vercel.app
   ```

4. **Deploy!**

## 🔧 Current Issue: Swagger Documentation

The 404 error you're seeing for `/api-docs` is because:

1. **Vercel serverless functions** have limitations with complex Express apps
2. **Swagger UI** requires static file serving which doesn't work well in serverless
3. **The current setup** is trying to use the full Express app in a serverless environment

## 🛠️ Solutions

### Option 1: Use the Simplified API (Recommended for now)

The current `api/index.js` file I created has basic endpoints that work with Vercel:

- ✅ `/health` - Health check
- ✅ `/api/test` - Test endpoint
- ✅ `/` - Root endpoint

**Test these first:**
```
https://your-api-domain.vercel.app/health
https://your-api-domain.vercel.app/api/test
https://your-api-domain.vercel.app/
```

### Option 2: Fix Swagger for Vercel

If you want Swagger documentation, we need to:

1. **Create a separate Swagger endpoint** that doesn't use static files
2. **Use a different approach** for serving the documentation

### Option 3: Use Railway Instead

Railway handles Express apps much better than Vercel for serverless functions.

## 🧪 Testing Your Deployment

### Test the API endpoints:

```bash
# Health check
curl https://your-api-domain.vercel.app/health

# Test endpoint
curl https://your-api-domain.vercel.app/api/test

# Root endpoint
curl https://your-api-domain.vercel.app/
```

### Expected responses:

**Health check:**
```json
{
  "ok": true
}
```

**Test endpoint:**
```json
{
  "message": "TableHop API is working!",
  "timestamp": "2024-01-XX...",
  "environment": "production",
  "vercel": "your-app-name.vercel.app"
}
```

## 🔍 Debugging Steps

### 1. Check Vercel Logs
- Go to your Vercel dashboard
- Click on your API project
- Go to "Functions" tab
- Check for any errors

### 2. Verify Environment Variables
- Ensure all environment variables are set correctly
- Check that `DATABASE_URL` points to your Supabase database

### 3. Test Database Connection
- The `/api/test` endpoint should work even without database
- If it works, the issue is with database connection

## 🎯 Next Steps

1. **Test the basic endpoints** first
2. **If they work**, we can add more functionality
3. **If they don't work**, check Vercel logs for errors
4. **Consider Railway** if Vercel continues to have issues

## 📞 Need Help?

If you're still getting errors:

1. **Share the Vercel deployment URL**
2. **Share any error messages from Vercel logs**
3. **Test the basic endpoints** and share the results

The simplified API should work with Vercel. Once we confirm it's working, we can add more features step by step.
