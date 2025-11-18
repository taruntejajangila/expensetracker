# 🚨 Fix Railway Auto-Deploy for Both Services

## 🔍 Problem
Both **backend** (`expensetracker`) and **admin-panel** services are not auto-deploying when you push to GitHub.

## ✅ What I See in Your Screenshots
- ✅ Source Repo: `taruntejajangila/expensetracker` - Connected
- ✅ Root Directory: `/backend-api` - Correct
- ✅ Branch: `master` - Correct
- ❓ **Auto Deploy Toggle** - Not visible (need to check)

## 🎯 Step-by-Step Fix

### **🚨 CRITICAL: Disconnect & Reconnect GitHub** (Try This First!)

**This is the #1 proven fix** that has worked for many users! If your services were deployed from a template or have connection issues, this often resolves auto-deploy problems.

**For Backend Service:**
1. Railway Dashboard → `expensetracker` service
2. Settings → Source section
3. Click **"Disconnect"** button
4. Click **"Edit"** or **"Connect GitHub"**
5. Select repository: `taruntejajangila/expensetracker`
6. Set Root Directory: `backend-api`
7. Set Branch: `master`
8. **Save** - This forces Railway to properly re-register the webhook

**For Admin Panel Service:**
1. Railway Dashboard → `admin-panel` service
2. Settings → Source section
3. Click **"Disconnect"** button
4. Click **"Connect GitHub"**
5. Select repository: `taruntejajangila/expensetracker`
6. Set Root Directory: `admin-panel`
7. Set Branch: `master`
8. **Save**

### **STEP 1: Check Auto-Deploy Toggle (Backend Service)**

1. **Railway Dashboard** → Click on **`expensetracker`** service (backend)
2. **Settings** tab → Click **"Deploy"** in the right sidebar (or scroll to Deploy section)
3. Look for **"Auto Deploy"** toggle at the TOP of the Deploy section
4. **If it's OFF** → Turn it **ON** ✅
5. **Save** changes

### **STEP 2: Check Auto-Deploy Toggle (Admin Panel Service)**

1. **Railway Dashboard** → Click on **`admin-panel`** service
2. **Settings** tab → Click **"Deploy"** in the right sidebar
3. Look for **"Auto Deploy"** toggle
4. **If it's OFF** → Turn it **ON** ✅
5. **Save** changes

### **STEP 3: Verify GitHub Webhook**

1. Go to: **https://github.com/taruntejajangila/expensetracker/settings/hooks**
2. Look for **Railway webhook** (should have `railway.app` in URL)
3. **If webhook is missing:**
   - Railway Dashboard → **Project Settings** (top level, not service)
   - **Settings** tab → **Source** section
   - Click **"Disconnect"** then **"Connect GitHub"** again
   - Re-authorize Railway
4. **If webhook exists:**
   - Click on it
   - Check **"Recent Deliveries"** tab
   - Should show recent `push` events with `200 OK` status
   - If showing errors, Railway needs to re-authenticate

### **STEP 4: Reconnect GitHub (If Webhook Issues)**

**Option A: Reconnect at Project Level**
1. Railway Dashboard → Your **Project** (top level)
2. **Settings** tab
3. **Source** section → Click **"Disconnect"**
4. Click **"Connect GitHub"**
5. Select repository: `taruntejajangila/expensetracker`
6. Authorize Railway

**Option B: Reconnect at Service Level (If Project Level Doesn't Work)**
1. Railway Dashboard → **Backend Service** (`expensetracker`)
2. **Settings** → **Source** section
3. Click **"Disconnect"** button
4. Click **"Edit"** next to Source Repo
5. Reconnect to: `taruntejajangila/expensetracker`
6. Set Root Directory: `backend-api`
7. Set Branch: `master`
8. **Save**

Repeat for **admin-panel** service:
- Root Directory: `admin-panel`
- Branch: `master`

### **STEP 5: Test Auto-Deploy**

After fixing, test with:

```bash
git commit --allow-empty -m "Test Railway auto-deploy"
git push origin master
```

**Watch Railway Dashboard:**
1. Go to **Backend Service** → **Deployments** tab
2. Should see new deployment start within **30-60 seconds**
3. Go to **Admin Panel Service** → **Deployments** tab
4. Should also see new deployment start

## 🔧 Alternative: Manual Deploy (Temporary Fix)

If auto-deploy still doesn't work:

1. **Railway Dashboard** → Backend Service → **Deployments** tab
2. Click **"Redeploy"** button
3. Select **"Deploy Latest"**
4. Repeat for admin-panel service

## 📋 Checklist

Before asking for help, verify:

**Backend Service:**
- [ ] Auto Deploy is **ON** in Settings → Deploy
- [ ] Branch is `master`
- [ ] Root Directory is `backend-api`
- [ ] GitHub repo is connected

**Admin Panel Service:**
- [ ] Auto Deploy is **ON** in Settings → Deploy
- [ ] Branch is `master`
- [ ] Root Directory is `admin-panel`
- [ ] GitHub repo is connected

**Project Level:**
- [ ] GitHub webhook exists in GitHub settings
- [ ] Webhook shows recent successful deliveries
- [ ] Railway has access to repository

## 🚨 Most Common Issues (Based on Research)

1. **Template Deployment Issue** - If services were deployed from templates, auto-deploy might be disabled. **Disconnect/Reconnect GitHub** fixes this (see Step 1 above).

2. **Auto Deploy toggle is OFF** - Check Settings → Deploy Section → Auto Deploy toggle

3. **Runtime Version** - Using "Legacy" runtime can break auto-deploy. Switch to V2 or Metal runtime.

4. **GitHub Webhook Issues** - Disconnect/Reconnect forces Railway to re-register the webhook properly.

See `RAILWAY_KNOWN_ISSUES_FIX.md` for more details on known issues.

## 💡 Quick Fix Script

If you want to force a deployment right now:

```bash
# This will trigger a deployment if webhook is working
git commit --allow-empty -m "Force Railway deployment - $(date)"
git push origin master
```

Then manually redeploy in Railway if needed.

