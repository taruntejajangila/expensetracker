# 🚂 Railway Deployment Guide
## Complete Step-by-Step Instructions

**Last Updated**: October 10, 2025  
**Deployment Platform**: Railway  
**Cost**: $5/month (Hobby Plan)

---

## 📋 **Overview**

We'll deploy in this order:
1. ✅ Push code to GitHub
2. ✅ Deploy Backend API to Railway
3. ✅ Deploy Admin Panel to Railway (or Vercel)
4. ✅ Update Mobile App with production URLs
5. ✅ Build Mobile App APK

**Total Time**: ~30-45 minutes

---

## 🔐 **STEP 1: Push to GitHub**

### **1.1: Create GitHub Repository**

1. Go to https://github.com
2. Click "New repository" (green button)
3. Repository name: `expense-tracker` (or your choice)
4. Choose: **Private** (recommended)
5. **DO NOT** initialize with README (you already have code)
6. Click "Create repository"

### **1.2: Push Your Code**

**In your terminal:**

```bash
# Navigate to your project
cd /d/expensetracker-1

# Add GitHub as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git

# Push your code
git push -u origin master
```

**If you get an error about authentication:**
```bash
# You'll need to create a Personal Access Token:
# 1. Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# 2. Generate new token (classic)
# 3. Select: repo (full control)
# 4. Copy the token
# 5. When pushing, use token as password
```

---

## 🚂 **STEP 2: Deploy Backend API to Railway**

### **2.1: Create Railway Account**

1. Go to https://railway.app
2. Click "Start a New Project"
3. Login with GitHub (recommended)
4. Authorize Railway to access your repositories

### **2.2: Create New Project**

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `expense-tracker` repository
4. Railway will detect it's a monorepo

### **2.3: Configure Backend Service**

**Important**: You need to tell Railway which folder to deploy

1. After selecting repo, Railway starts detecting
2. Click on the deployment
3. Go to **Settings** tab
4. Find **"Root Directory"**
5. Set to: `backend-api`
6. Find **"Start Command"**
7. Set to: `npm run dev` (for testing) or `npm start` (for production with build)

### **2.4: Add Environment Variables**

In Railway dashboard:

1. Click on your backend service
2. Go to **Variables** tab
3. Click "New Variable"
4. Add these one by one:

```env
# Database (Railway will provide this)
NODE_ENV=production
PORT=5000

# Database - You'll set up PostgreSQL next
DB_HOST=
DB_PORT=5432
DB_NAME=expense_tracker_db
DB_USER=
DB_PASSWORD=

# JWT Secrets (IMPORTANT: Change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-change-this-too
JWT_REFRESH_EXPIRES_IN=7d

# App URLs (will be provided by Railway)
MOBILE_APP_URL=exp://your-expo-url
ADMIN_PANEL_URL=https://your-admin-panel-url
FRONTEND_URL=https://your-admin-panel-url

# Server URL (Railway will provide domain)
SERVER_URL=https://your-backend.railway.app

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

### **2.5: Add PostgreSQL Database**

1. In Railway dashboard, click "New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway creates database and provides connection details
5. Copy these values to your backend environment variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`

**OR use the DATABASE_URL:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### **2.6: Get Your Backend URL**

1. After deployment completes, Railway assigns a URL
2. Go to **Settings** tab
3. Find "Domains"
4. Copy your URL (e.g., `https://your-backend-production.up.railway.app`)
5. Add `/api` to use it (e.g., `https://your-backend-production.up.railway.app/api`)

### **2.7: Update SERVER_URL**

1. Go back to **Variables** tab
2. Update `SERVER_URL` with your Railway domain
3. Example: `SERVER_URL=https://your-backend-production.up.railway.app`

### **2.8: Test Backend**

```bash
# Test health endpoint
curl https://your-backend-production.up.railway.app/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🖥️ **STEP 3: Deploy Admin Panel**

You have 2 options:

### **Option A: Railway (Recommended)**

1. In Railway dashboard, click "New"
2. Select "Deploy from GitHub repo"
3. Choose your `expense-tracker` repository again
4. In **Settings**:
   - Root Directory: `admin-panel`
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Add environment variable:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-production.up.railway.app/api
   ```
6. Deploy and get your admin panel URL

### **Option B: Vercel (Free, Better for Next.js)**

1. Go to https://vercel.com
2. Login with GitHub
3. Click "New Project"
4. Import your `expense-tracker` repository
5. Configure:
   - Framework: Next.js
   - Root Directory: `admin-panel`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add environment variable:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-production.up.railway.app/api
   ```
7. Deploy

---

## 📱 **STEP 4: Update Mobile App**

### **4.1: Update Config File**

Edit: `ExpenseTrackerExpo/config/api.config.ts`

```typescript
// Line 10: Update with your Railway backend URL
const PRODUCTION_API_URL = 'https://your-backend-production.up.railway.app/api';
```

### **4.2: Commit Changes**

```bash
git add ExpenseTrackerExpo/config/api.config.ts
git commit -m "Update production API URL"
git push
```

---

## 📦 **STEP 5: Build Mobile App APK**

### **5.1: Install EAS CLI**

```bash
npm install -g eas-cli
```

### **5.2: Login to Expo**

```bash
cd ExpenseTrackerExpo
eas login
```

### **5.3: Configure EAS Build**

```bash
eas build:configure
```

### **5.4: Build Android APK**

```bash
# For APK (directly installable)
eas build --platform android --profile preview

# For AAB (Google Play Store)
eas build --platform android --profile production
```

**This will:**
1. Upload your code to Expo servers
2. Build the APK in the cloud
3. Provide a download link

### **5.5: Download and Test**

1. Wait for build to complete (~10-15 minutes)
2. Download APK from the link provided
3. Install on Android device
4. Test app functionality

---

## 🔧 **STEP 6: Database Setup**

### **6.1: Run Migrations**

You need to create database tables. Connect to Railway PostgreSQL:

**Option A: Use Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations (if you have migration scripts)
railway run npm run db:migrate
```

**Option B: Use Database Client**

1. Get database credentials from Railway
2. Use pgAdmin, DBeaver, or TablePlus
3. Connect to database
4. Run your SQL schema file

**Option C: Create Tables Manually**

If you don't have migration scripts, you need to create tables. Here's a quick script:

```bash
# In backend-api directory, create this file:
# scripts/setup-production-db.js
```

Then run:
```bash
railway run node scripts/setup-production-db.js
```

---

## ✅ **STEP 7: Verification**

### **7.1: Test Backend**

```bash
# Health check
curl https://your-backend.railway.app/api/health

# Test registration
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### **7.2: Test Admin Panel**

1. Open: `https://your-admin-panel.vercel.app`
2. Login with admin credentials
3. Check dashboard loads
4. Test user management

### **7.3: Test Mobile App**

1. Install APK on Android device
2. Register a new account
3. Add a transaction
4. Check if data saves

---

## 🎯 **Cost Summary**

| Service | Cost | What's Included |
|---------|------|-----------------|
| **Railway Hobby** | $5/month | Backend + Database + $5 usage credit |
| **Vercel** | Free | Admin Panel (unlimited) |
| **Expo** | Free | APK builds (limited free builds) |
| **GitHub** | Free | Code hosting (private repos) |
| **Total** | **$5/month** | Everything running |

---

## 🔒 **Security Checklist**

Before going live:

- [ ] Change all JWT secrets in Railway variables
- [ ] Update admin default password
- [ ] Enable HTTPS (automatic on Railway/Vercel)
- [ ] Set up database backups
- [ ] Configure CORS properly
- [ ] Test authentication flow
- [ ] Verify file upload security

---

## 📱 **Alternative: Expo Application Services (EAS)**

For mobile app distribution:

### **Option 1: Direct APK**
- Build with EAS
- Host APK file on your website
- Users download and install manually

### **Option 2: Google Play Store**
- Build AAB with EAS
- Create Google Play Developer account ($25 one-time)
- Submit app for review
- Users install from Play Store

### **Option 3: Internal Testing**
- Use Expo Go app for testing
- Share QR code with testers
- No build needed

---

## 🚨 **Troubleshooting**

### **Backend won't start:**
```bash
# Check logs in Railway dashboard
# Common issues:
- Missing environment variables
- Database connection failed
- Port conflict (Railway assigns PORT automatically)
```

### **Admin Panel can't connect:**
```bash
# Check NEXT_PUBLIC_API_URL is correct
# Must include /api at the end
# Must be HTTPS (Railway provides this)
```

### **Mobile App can't connect:**
```bash
# Check config/api.config.ts
# Make sure PRODUCTION_API_URL is correct
# Rebuild APK after changes
```

### **Database connection fails:**
```bash
# Verify DATABASE_URL or individual DB_* variables
# Check database is running in Railway
# Test connection with database client
```

---

## 📞 **Support Resources**

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Expo Docs**: https://docs.expo.dev/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## 🎉 **You're Done!**

After completing these steps:

✅ Backend running on Railway  
✅ Admin Panel on Vercel/Railway  
✅ Database on Railway PostgreSQL  
✅ Mobile APK built and ready  
✅ All components connected  

**Your expense tracker is now LIVE!** 🚀

---

**Need Help?** Check Railway logs, test each endpoint, and verify environment variables are set correctly.


