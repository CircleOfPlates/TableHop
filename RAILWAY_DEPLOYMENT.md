# Railway Deployment Guide for TableHop

This guide will help you deploy TableHop to Railway, which is an excellent platform for full-stack applications with built-in PostgreSQL support.

## 🚀 Quick Start

### Prerequisites

- GitHub account with your TableHop repository
- Railway account (free tier available)

## 📋 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Ensure your code is pushed to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Verify your repository structure:**
   ```
   TableHop/
   ├── apps/
   │   ├── api/          # Backend API
   │   └── web/          # Frontend application
   ├── railway.json      # Railway configuration
   └── package.json      # Root package.json
   ```

### Step 2: Deploy Backend API

1. **Go to [Railway.app](https://railway.app)**
   - Sign up/login with your GitHub account

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your TableHop repository

3. **Configure the API service:**
   - **Name**: `tablehop-api`
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Add PostgreSQL Database:**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically add `DATABASE_URL` to your environment

5. **Set Environment Variables:**
   Go to your API service settings and add:
   ```
   NODE_ENV=production
   PORT=4000
   SESSION_SECRET=your-super-secret-session-key-min-32-characters
   FRONTEND_URL=https://your-frontend-domain.railway.app
   ```

6. **Deploy the API:**
   - Railway will automatically detect and deploy your API
   - The API will be available at `https://your-api-name.railway.app`

### Step 3: Deploy Frontend

1. **Create a new service for the frontend:**
   - In your Railway project, click "New"
   - Select "Deploy from GitHub repo"
   - Choose the same TableHop repository

2. **Configure the frontend service:**
   - **Name**: `tablehop-web`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-api-name.railway.app
   PORT=3000
   ```

4. **Deploy the frontend:**
   - Railway will build and deploy your frontend
   - The frontend will be available at `https://your-frontend-name.railway.app`

### Step 4: Update Environment Variables

After both services are deployed, update the API's `FRONTEND_URL` to point to your actual frontend URL:

1. Go to your API service settings
2. Update `FRONTEND_URL` to your frontend Railway URL
3. Redeploy the API service

### Step 5: Initialize Database

1. **Connect to your Railway PostgreSQL database:**
   - Go to your PostgreSQL service in Railway
   - Click "Connect" → "Railway CLI"
   - Or use the connection string from the "Connect" tab

2. **Run database setup:**
   ```bash
   # Push schema to database
   npm run db:push -w apps/api
   
   # Create admin user
   npm run create-admin -w apps/api
   
   # Create sample data (optional)
   npm run create-neighbourhoods -w apps/api
   npm run create-events -w apps/api
   ```

## 🔧 Alternative: Single Service Deployment

If you prefer to deploy everything as one service:

1. **Create a single service:**
   - Deploy from GitHub repo
   - Root directory: `/` (root of repository)

2. **Set build and start commands:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start -w apps/api`

3. **Add PostgreSQL database** (same as above)

4. **Set environment variables:**
   ```
   NODE_ENV=production
   PORT=4000
   SESSION_SECRET=your-super-secret-session-key-min-32-characters
   DATABASE_URL=your-railway-postgres-url
   ```

## 🌐 Custom Domains

### Setting up Custom Domains

1. **For API:**
   - Go to your API service settings
   - Click "Domains" → "Generate Domain"
   - Or add your custom domain

2. **For Frontend:**
   - Go to your frontend service settings
   - Click "Domains" → "Generate Domain"
   - Or add your custom domain

3. **Update Environment Variables:**
   - Update `FRONTEND_URL` in API service
   - Update `VITE_API_URL` in frontend service

## 📊 Monitoring and Logs

### Viewing Logs

1. **In Railway Dashboard:**
   - Go to your service
   - Click "Deployments" tab
   - Click on a deployment to view logs

2. **Using Railway CLI:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # View logs
   railway logs
   ```

### Health Checks

Your API includes a health check endpoint at `/health` that Railway will use to monitor the service.

## 🔒 Security Considerations

### Environment Variables

- **Never commit secrets** to your repository
- Use Railway's environment variable management
- Rotate `SESSION_SECRET` regularly

### Database Security

- Railway PostgreSQL is automatically secured
- Connection strings are encrypted
- Database is isolated per project

## 💰 Cost Management

### Railway Free Tier

- **$5/month credit** (enough for development)
- **PostgreSQL**: Included
- **Custom domains**: Included
- **SSL certificates**: Automatic

### Monitoring Usage

- Check your usage in Railway dashboard
- Set up usage alerts
- Consider upgrading for production

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check build logs in Railway dashboard
   - Verify all dependencies are in `package.json`
   - Ensure TypeScript compilation passes

2. **Database Connection Issues:**
   - Verify `DATABASE_URL` is set correctly
   - Check if PostgreSQL service is running
   - Ensure SSL is enabled for production

3. **CORS Issues:**
   - Verify `FRONTEND_URL` is set correctly
   - Check that frontend URL matches exactly
   - Ensure no trailing slashes

4. **Session Issues:**
   - Verify `SESSION_SECRET` is set and secure
   - Check that session store is working
   - Ensure cookies are being set correctly

### Debug Commands

```bash
# Check Railway CLI status
railway status

# View service logs
railway logs

# Connect to database
railway connect

# Redeploy service
railway up
```

## 📈 Scaling

### Automatic Scaling

Railway automatically scales your services based on traffic. For production:

1. **Monitor performance** in Railway dashboard
2. **Set up alerts** for high usage
3. **Consider upgrading** if you hit limits

### Manual Scaling

- Go to service settings
- Adjust instance count
- Set resource limits

## 🎉 Success!

Once deployed, your TableHop application will be available at:
- **Frontend**: `https://your-frontend-name.railway.app`
- **API**: `https://your-api-name.railway.app`
- **API Docs**: `https://your-api-name.railway.app/api-docs`

### Next Steps

1. **Test your deployment** thoroughly
2. **Set up monitoring** and alerts
3. **Configure custom domains** if needed
4. **Set up backups** for your database
5. **Share your deployed URL** with users!

## 🆘 Support

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **TableHop Issues**: Check the repository issues

---

**Happy deploying! 🚀**
