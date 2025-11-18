# 🔍 Railway Deployment Troubleshooting

## Issue: Railway Not Auto-Deploying

If Railway is not triggering deployments automatically, check these:

### 1. Verify GitHub Connection
- Go to Railway Dashboard → Your Project → Settings
- Check "Source" section
- Ensure GitHub repository is connected
- Repository should be: `taruntejajangila/expensetracker`

### 2. Check Auto-Deploy Settings
- Go to your backend service → Settings → Deploy
- **Auto Deploy**: Should be **ENABLED**
- **Branch**: Should be `master` (not `main`)
- **Root Directory**: Should be `backend-api` (if your service is configured for backend)

### 3. Check Webhook Status
- Go to GitHub: https://github.com/taruntejajangila/expensetracker/settings/hooks
- Look for Railway webhook
- Should show recent deliveries
- If missing or failed, Railway can't detect new commits

### 4. Manual Trigger Options

#### Option A: Railway Dashboard
1. Railway Dashboard → Your Service
2. Deployments tab
3. Click "Redeploy" button
4. Select "Deploy Latest" or specific commit

#### Option B: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project (if not already)
railway link

# Deploy
railway up
```

#### Option C: Empty Commit (Force Trigger)
```bash
git commit --allow-empty -m "Trigger Railway deployment"
git push origin master
```

### 5. Check Service Configuration
- Service should be configured for Node.js
- Build Command: `npm run build`
- Start Command: `npm start`
- Root Directory: `backend-api`

### 6. Check for Errors
- Railway Dashboard → Your Service → Logs
- Look for build errors
- Look for deployment failures
- Check if environment variables are set

