# 🚂 How to Trigger Railway Deployment

Since Railway is not auto-deploying, follow these steps:

## Method 1: Manual Redeploy in Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Login with your GitHub account

2. **Open Your Project**
   - Click on your `expensetracker` project

3. **Select Backend Service**
   - Click on the backend service (usually named `expensetracker` or similar)

4. **Trigger Deployment**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** button
   - OR click **"Deploy Latest"** 
   - Select branch: `master`
   - Click **"Deploy"**

5. **Wait for Deployment**
   - Watch the deployment logs
   - Should see commit `d649f4f` or latest commit being deployed
   - Takes ~3-5 minutes

## Method 2: Check Auto-Deploy Settings

1. **In Railway Dashboard**
   - Go to your backend service
   - Click **"Settings"** tab
   - Scroll to **"Deploy"** section
   - Ensure **"Auto Deploy"** is **ENABLED**
   - Ensure **"Branch"** is set to `master`

2. **If Auto-Deploy is Disabled**
   - Enable it
   - Railway should automatically deploy the latest commit

## Method 3: Use Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project (if not already linked)
railway link

# Deploy latest commit
railway up

# Or deploy specific service
railway up --service expensetracker
```

## Method 4: Force Push (Not Recommended)

If nothing else works, you can force trigger by making a small change:

```bash
# Make a tiny change
echo "# Deployment trigger" >> backend-api/README.md

# Commit and push
git add backend-api/README.md
git commit -m "Trigger Railway deployment"
git push origin master
```

## Verify Deployment

After deployment:

1. **Check Railway Dashboard**
   - Go to Deployments tab
   - Should see commit `d649f4f` or latest commit
   - Status should be "Active" or "Deployed"

2. **Check Deployment Logs**
   - Look for build logs
   - Should see: "Building..." then "Deployed successfully"

3. **Test API**
   - Visit: https://expensetracker-production-eb9c.up.railway.app/api/health
   - Should return healthy status

## Troubleshooting

**If deployment fails:**
- Check Railway logs for errors
- Verify environment variables are set
- Check if build command is correct: `npm run build`
- Check if start command is correct: `npm start`

**If still showing old commit:**
- Clear Railway cache (Settings → Clear Cache)
- Redeploy manually
- Check if Railway is watching the correct branch

