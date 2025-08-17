# Railway Deployment Checklist

## ✅ Pre-Deployment Checklist

### Repository Setup
- [ ] Code is pushed to GitHub
- [ ] All files are committed
- [ ] Repository is public or Railway has access
- [ ] `railway.json` is present in root
- [ ] Root `package.json` has `start` script
- [ ] API `package.json` has `build` and `start` scripts
- [ ] Web `package.json` has `build` and `preview` scripts

### Build Verification
- [ ] `npm run build:api` works locally
- [ ] `npm run build:web` works locally
- [ ] TypeScript compilation passes
- [ ] No TypeScript errors
- [ ] All dependencies are in `package.json`

### Environment Variables (to set in Railway)
- [ ] `NODE_ENV=production`
- [ ] `PORT=4000` (for API)
- [ ] `PORT=3000` (for web)
- [ ] `SESSION_SECRET=your-secure-secret-key`
- [ ] `DATABASE_URL=railway-postgres-url` (auto-added)
- [ ] `FRONTEND_URL=https://your-frontend-url.railway.app`
- [ ] `VITE_API_URL=https://your-api-url.railway.app`

## 🚀 Deployment Steps

### Step 1: Deploy API
1. [ ] Go to [Railway.app](https://railway.app)
2. [ ] Create new project
3. [ ] Deploy from GitHub repo
4. [ ] Set root directory to `apps/api`
5. [ ] Set build command: `npm install && npm run build`
6. [ ] Set start command: `npm start`
7. [ ] Add PostgreSQL database
8. [ ] Set environment variables
9. [ ] Deploy and verify API is running

### Step 2: Deploy Frontend
1. [ ] Create new service in same project
2. [ ] Deploy from same GitHub repo
3. [ ] Set root directory to `apps/web`
4. [ ] Set build command: `npm install && npm run build`
5. [ ] Set start command: `npm run preview`
6. [ ] Set environment variables
7. [ ] Deploy and verify frontend is running

### Step 3: Configure URLs
1. [ ] Get API URL from Railway dashboard
2. [ ] Get frontend URL from Railway dashboard
3. [ ] Update API's `FRONTEND_URL` environment variable
4. [ ] Update frontend's `VITE_API_URL` environment variable
5. [ ] Redeploy both services

### Step 4: Database Setup
1. [ ] Connect to Railway PostgreSQL
2. [ ] Run `npm run db:push -w apps/api`
3. [ ] Run `npm run create-admin -w apps/api`
4. [ ] Run `npm run create-neighbourhoods -w apps/api` (optional)
5. [ ] Run `npm run create-events -w apps/api` (optional)

## 🔍 Post-Deployment Verification

### API Health Checks
- [ ] `https://your-api-url.railway.app/health` returns `{"ok": true}`
- [ ] `https://your-api-url.railway.app/api-docs` loads Swagger docs
- [ ] API logs show no errors

### Frontend Health Checks
- [ ] `https://your-frontend-url.railway.app` loads the app
- [ ] No console errors in browser
- [ ] Frontend can connect to API
- [ ] CORS is working properly

### Authentication Tests
- [ ] User registration works
- [ ] User login works
- [ ] Session persistence works
- [ ] Logout works
- [ ] Admin login works

### Feature Tests
- [ ] Event browsing works
- [ ] Profile management works
- [ ] Admin dashboard accessible
- [ ] All forms submit successfully

## 🚨 Troubleshooting

### Common Issues
- [ ] Build failures - Check Railway logs
- [ ] Database connection - Verify `DATABASE_URL`
- [ ] CORS errors - Check `FRONTEND_URL` and `VITE_API_URL`
- [ ] Session issues - Verify `SESSION_SECRET`
- [ ] Port conflicts - Ensure correct ports are set

### Debug Commands
```bash
# Check Railway CLI
railway status

# View logs
railway logs

# Connect to database
railway connect

# Redeploy
railway up
```

## 📊 Monitoring Setup

### Railway Dashboard
- [ ] Monitor service health
- [ ] Check resource usage
- [ ] Set up alerts
- [ ] Monitor logs

### Custom Domains (Optional)
- [ ] Set up custom domain for API
- [ ] Set up custom domain for frontend
- [ ] Update environment variables
- [ ] Configure SSL certificates

## 🎉 Success Criteria

Your deployment is successful when:
- [ ] Both API and frontend are accessible
- [ ] Database is connected and working
- [ ] Authentication system works
- [ ] All core features function properly
- [ ] No critical errors in logs
- [ ] Performance is acceptable

## 📝 Next Steps

After successful deployment:
1. [ ] Test all user flows
2. [ ] Set up monitoring and alerts
3. [ ] Configure custom domains if needed
4. [ ] Set up database backups
5. [ ] Share your deployed URL
6. [ ] Monitor performance and usage

---

**Ready to deploy! 🚀**
