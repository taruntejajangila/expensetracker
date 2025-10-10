# 🚀 Quick Start: Deploy to Railway in 30 Minutes

**Follow these steps in order:**

---

## ✅ **Pre-Deployment Checklist**

Before you start:
- [ ] Git installed and configured
- [ ] GitHub account created
- [ ] Railway account created (https://railway.app - login with GitHub)
- [ ] Node.js installed
- [ ] Code is working locally

---

## 📝 **STEP 1: Push to GitHub (5 minutes)**

### **Commands to Run:**

```bash
# 1. Go to your project
cd /d/expensetracker-1

# 2. Check git status (should be clean)
git status

# 3. Create GitHub repo at https://github.com/new
# Name: expense-tracker
# Type: Private
# Don't initialize with anything

# 4. Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git

# 5. Push to GitHub
git push -u origin master

# If authentication fails, use Personal Access Token:
# GitHub → Settings → Developer settings → Personal access tokens → Generate new
```

✅ **Verify**: Visit your GitHub repo and see all code uploaded

---

## 🚂 **STEP 2: Deploy Backend to Railway (10 minutes)**

### **Railway Dashboard Steps:**

1. **Go to**: https://railway.app/new
2. **Click**: "Deploy from GitHub repo"
3. **Select**: Your `expense-tracker` repository
4. **Click** on the new project

### **Configure Backend:**

5. Click on the service → **Settings**
6. **Root Directory**: `backend-api`
7. **Build Command**: Leave default or `npm install && npm run build`
8. **Start Command**: `npm start`

### **Add Database:**

9. **Click**: "+ New" → "Database" → "PostgreSQL"
10. Wait for database to provision (~2 minutes)

### **Add Environment Variables:**

11. Click backend service → **Variables** tab
12. Click "New Variable" and add:

```env
NODE_ENV=production
PORT=5000

# JWT - CHANGE THESE!
JWT_SECRET=change-this-to-random-string-123456789
JWT_REFRESH_SECRET=change-this-too-987654321
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Will update these after deployment
MOBILE_APP_URL=http://localhost:19006
ADMIN_PANEL_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3001
SERVER_URL=https://your-backend.railway.app

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### **Get Database Variables:**

13. Click PostgreSQL service → **Variables** tab
14. Copy these to backend variables:
   - `DATABASE_URL` (easiest)
   - OR individual: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

### **Get Backend URL:**

15. Click backend service → **Settings** → **Domains**
16. Copy the URL (like: `https://backend-production-xxxx.up.railway.app`)
17. Update `SERVER_URL` variable with this URL

✅ **Verify**: Open `https://your-backend.railway.app/api/health` in browser

---

## 🖥️ **STEP 3: Deploy Admin Panel (10 minutes)**

### **Option A: Railway**

1. Railway dashboard → **+ New** → "GitHub Repo" → Same repo
2. **Settings**:
   - Root Directory: `admin-panel`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. **Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```

### **Option B: Vercel (Recommended - Free)**

1. Go to: https://vercel.com/new
2. Import your GitHub repo
3. Configure:
   - Root Directory: `admin-panel`
   - Framework: Next.js
4. Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```
5. Deploy

✅ **Verify**: Open your admin panel URL, try to login

---

## 📱 **STEP 4: Update Mobile App (5 minutes)**

### **Update Production URL:**

```bash
# 1. Open this file:
code ExpenseTrackerExpo/config/api.config.ts

# 2. Update line 10:
const PRODUCTION_API_URL = 'https://your-backend.railway.app/api';

# 3. Save, commit, push
git add .
git commit -m "Update production API URL"
git push
```

### **Test Locally First:**

```bash
cd ExpenseTrackerExpo
npm start
# Test on your phone with Expo Go
```

✅ **Verify**: App connects to Railway backend

---

## 🗄️ **STEP 5: Setup Database Tables (5 minutes)**

You need to create tables in Railway PostgreSQL:

### **Option 1: Use Database Client**

1. Download pgAdmin or DBeaver
2. Get Railway database credentials:
   - Click PostgreSQL → **Connect** tab
   - Copy connection URL or individual credentials
3. Connect and run your SQL schema

### **Option 2: Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migration (if you have one)
railway run npm run db:migrate
```

### **Option 3: Create Schema Script**

Create `backend-api/scripts/create-schema.sql` with your tables, then:

```bash
# Connect to Railway database and run schema
railway run psql $DATABASE_URL < scripts/create-schema.sql
```

✅ **Verify**: Check tables exist in Railway PostgreSQL

---

## 🔧 **STEP 6: Create Admin User**

You need an admin account to login to admin panel:

```bash
# Option 1: Use your registration endpoint
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'

# Option 2: Insert directly in database
# Connect to Railway PostgreSQL and run:
INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'admin@yourdomain.com', 'hashed_password', 'admin');
```

✅ **Verify**: Login to admin panel with admin credentials

---

## 🎯 **FINAL VERIFICATION**

### **Backend Check:**
```bash
curl https://your-backend.railway.app/api/health
# Should return: {"status":"ok"}
```

### **Admin Panel Check:**
- Open: `https://your-admin.vercel.app`
- Login with admin credentials
- Check dashboard loads

### **Mobile App Check:**
- For testing: Use Expo Go (scan QR code)
- For production: Build APK (see full guide)

---

## 💰 **Monthly Cost**

✅ Backend + Database: **$5/month** (Railway Hobby)  
✅ Admin Panel: **Free** (Vercel)  
✅ GitHub: **Free** (Private repos)  
✅ Mobile App: **Free** (APK distribution)

**Total: $5/month**

---

## 🚨 **Common Issues**

### **"Database connection failed"**
- Check DATABASE_URL is set in backend variables
- Verify PostgreSQL service is running
- Check Railway logs for errors

### **"CORS error" in admin panel**
- Add admin panel URL to ADMIN_PANEL_URL variable
- Restart backend service
- Check CORS settings in backend code

### **"Can't connect" in mobile app**
- Verify PRODUCTION_API_URL in config file
- Make sure you rebuilt/restarted app
- Check backend URL is accessible

---

## 📞 **Need Help?**

1. **Check Railway Logs**: Click service → Deployments → View Logs
2. **Railway Discord**: https://discord.gg/railway
3. **Expo Forums**: https://forums.expo.dev/

---

## 🎉 **Success!**

If all checks pass:
✅ Your backend is live on Railway  
✅ Your admin panel is accessible  
✅ Your mobile app can connect  
✅ Everything costs $5/month  

**You're now running in production!** 🚀

---

## 🔜 **Next Steps**

1. **Build Production APK**:
   ```bash
   cd ExpenseTrackerExpo
   npx expo build:android
   ```

2. **Set up custom domain** (optional):
   - Railway: Settings → Domains → Add custom domain
   - Point your domain DNS to Railway

3. **Enable monitoring**:
   - Railway provides automatic monitoring
   - Check CPU/Memory usage
   - Set up alerts

4. **Backup database**:
   - Railway provides automated backups
   - Export data regularly for safety

---

**Deployment Time: ~30 minutes**  
**Monthly Cost: $5**  
**Status: Production Ready** ✅


