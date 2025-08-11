# TableHop Deployment Guide

This guide will help you deploy TableHop to various hosting platforms for free during development.

## 🚀 Quick Deployment Options

### **Option 1: Railway (Recommended - Easiest)**
- **Free Tier**: $5/month credit (enough for development)
- **Pros**: Easy deployment, PostgreSQL included, automatic HTTPS
- **Cons**: Limited free tier

### **Option 2: Render**
- **Free Tier**: Free static sites, $7/month for web services
- **Pros**: Good free tier, PostgreSQL available
- **Cons**: Sleep after inactivity on free tier

### **Option 3: Vercel + Supabase**
- **Free Tier**: Generous limits
- **Pros**: Excellent performance, great developer experience
- **Cons**: Requires separate database setup

### **Option 4: Netlify + Supabase**
- **Free Tier**: Generous limits
- **Pros**: Easy deployment, good performance
- **Cons**: Requires separate database setup

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

Create these environment files:

**Backend (`apps/api/.env`):**
```env
NODE_ENV=production
PORT=4000
SESSION_SECRET=your-super-secret-session-key-here-min-16-chars
DATABASE_URL=your-database-url-here
```

**Frontend (`apps/web/.env`):**
```env
VITE_API_URL=https://your-api-domain.com
```

### 2. Database Setup

You'll need a PostgreSQL database. Options:
- **Railway**: Built-in PostgreSQL
- **Supabase**: Free tier with 500MB
- **Neon**: Free tier with 3GB
- **PlanetScale**: MySQL (requires schema changes)

### 3. Build Scripts

The application already has the necessary build scripts:
- Backend: `npm run build` (creates `dist/` folder)
- Frontend: `npm run build` (creates `dist/` folder)

## 🚀 Railway Deployment (Recommended)

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Ensure all files are committed

### Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your TableHop repository

### Step 3: Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically add `DATABASE_URL` to your environment

### Step 4: Configure Environment Variables
1. Go to your project settings
2. Add these environment variables:
   ```
   NODE_ENV=production
   PORT=4000
   SESSION_SECRET=your-super-secret-session-key-here-min-16-chars
   ```

### Step 5: Deploy Backend
1. Railway will automatically detect and deploy your API
2. The API will be available at `https://your-app-name.railway.app`

### Step 6: Deploy Frontend
1. Create a new service in Railway
2. Select "Deploy from GitHub repo" again
3. Choose the same repository
4. Set the root directory to `apps/web`
5. Add environment variable: `VITE_API_URL=https://your-api-domain.railway.app`

### Step 7: Setup Database
1. Connect to your Railway PostgreSQL database
2. Run the database migrations:
   ```bash
   npm run db:push -w apps/api
   ```
3. Create initial data:
   ```bash
   npm run create-neighbourhoods -w apps/api
   npm run create-events -w apps/api
   npm run create-admin -w apps/api
   ```

## 🌐 Render Deployment

### Step 1: Deploy Backend
1. Go to [Render.com](https://render.com)
2. Create account and connect GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name**: `tablehop-api`
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### Step 2: Add Environment Variables
Add these in Render dashboard:
```
NODE_ENV=production
PORT=10000
SESSION_SECRET=your-super-secret-session-key-here-min-16-chars
DATABASE_URL=your-postgresql-url
```

### Step 3: Deploy Frontend
1. Create another web service
2. Configure:
   - **Name**: `tablehop-web`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Environment**: `Node`

### Step 4: Add Frontend Environment Variables
```
VITE_API_URL=https://your-api-service.onrender.com
```

## ⚡ Vercel + Supabase Deployment

### Step 1: Setup Supabase Database
1. Go to [Supabase.com](https://supabase.com)
2. Create new project
3. Get your database URL from Settings → Database

### Step 2: Deploy Backend to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: `Node.js`
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Add Environment Variables
Add these in Vercel dashboard:
```
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here-min-16-chars
DATABASE_URL=your-supabase-database-url
```

### Step 4: Deploy Frontend to Vercel
1. Create another Vercel project
2. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 5: Add Frontend Environment Variables
```
VITE_API_URL=https://your-api-vercel-app.vercel.app
```

## 🐳 Docker Deployment

If you prefer Docker deployment:

### Step 1: Build and Run
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Or build individually
docker build -t tablehop-api ./apps/api
docker build -t tablehop-web ./apps/web
```

### Step 2: Environment Variables
Create a `.env` file in the root:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=tablehop
SESSION_SECRET=your-super-secret-session-key-here-min-16-chars
VITE_API_URL=http://localhost:4000
```

## 🔧 Post-Deployment Setup

### 1. Database Migration
After deployment, run database setup:
```bash
# Connect to your deployed database and run:
npm run db:push -w apps/api
npm run create-neighbourhoods -w apps/api
npm run create-events -w apps/api
npm run create-admin -w apps/api
```

### 2. Test Your Deployment
1. Visit your frontend URL
2. Test user registration/login
3. Test event browsing
4. Check admin functionality

### 3. Monitor Your Application
- Check application logs
- Monitor database connections
- Test API endpoints via Swagger docs

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check if database is accessible from your deployment platform

2. **CORS Errors**
   - Ensure frontend `VITE_API_URL` points to correct backend URL
   - Check backend CORS configuration

3. **Session Issues**
   - Verify `SESSION_SECRET` is set and secure
   - Check if session store is properly configured

4. **Build Failures**
   - Check if all dependencies are in `package.json`
   - Verify TypeScript compilation

## 📊 Cost Comparison (Free Tiers)

| Platform | Database | Backend | Frontend | Total Cost |
|----------|----------|---------|----------|------------|
| Railway | $5/month | Included | Included | $5/month |
| Render | $7/month | Included | Free | $7/month |
| Vercel + Supabase | Free | Free | Free | $0/month |
| Netlify + Supabase | Free | Free | Free | $0/month |

## 🎯 Recommendation

For **development and testing**, I recommend:
1. **Vercel + Supabase** (completely free)
2. **Railway** (if you want everything in one place)

For **production**, consider:
- **Railway** or **Render** for simplicity
- **AWS/GCP/Azure** for scalability

## 📝 Next Steps

1. Choose your preferred platform
2. Follow the deployment steps above
3. Set up your environment variables
4. Deploy and test your application
5. Share your deployed URL!

Need help? Check the platform-specific documentation or reach out for support.
