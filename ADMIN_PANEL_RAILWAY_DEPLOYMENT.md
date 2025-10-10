# 🚂 Admin Panel Railway Deployment Guide

## 📋 **Quick Deployment Steps**

### **Step 1: Add Admin Panel Service to Railway**

1. **Go to your Railway project dashboard**
2. **Click "+ New"** (next to your backend service)
3. **Select "GitHub Repo"**
4. **Choose your repository**: `taruntejajangila/expensetracker`
5. **Click "Deploy Now"**

### **Step 2: Configure Service Settings**

1. **Click on the new admin panel service**
2. **Go to "Settings" tab**
3. **Set Root Directory**: `admin-panel`
4. **Save changes**

### **Step 3: Configure Build Settings**

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Port:** Railway will auto-detect (Next.js uses 3000)

### **Step 4: Add Environment Variables**

1. **Go to "Variables" tab**
2. **Add these variables:**

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://expensetracker-production-62b5.up.railway.app/api
```

### **Step 5: Deploy**

1. **Railway will automatically deploy** after you add the variables
2. **Wait for deployment to complete** (~5-10 minutes)
3. **Get your admin panel URL** from Railway

---

## 🎯 **Expected Results**

After deployment, you'll have:
- ✅ **Backend API**: `https://expensetracker-production-62b5.up.railway.app`
- ✅ **Admin Panel**: `https://admin-panel-production-xxxx.up.railway.app`
- ✅ **Database**: PostgreSQL with all tables

---

## 🔧 **Admin Panel Features**

Once deployed, your admin panel will have:
- **User Management**: View and manage users
- **Transaction Management**: View all transactions
- **Category Management**: Manage expense categories
- **Budget Management**: Monitor user budgets
- **Goal Management**: Track user financial goals
- **Support Tickets**: Handle customer support
- **Notifications**: Send push notifications
- **Banner Management**: Manage app banners

---

## 🚀 **Login Credentials**

**Admin Panel Login:**
- **Email**: `admin@expensetracker.com`
- **Password**: `admin123`

---

## 📱 **Mobile App Configuration**

After admin panel is deployed, update your mobile app:
1. **Update `PRODUCTION_API_URL`** in `ExpenseTrackerExpo/config/api.config.ts`
2. **Change to your Railway backend URL**
3. **Build new APK** for production

---

## 🎉 **Complete Stack**

You'll have a fully deployed expense tracker application:
- **Backend API**: Railway
- **Admin Panel**: Railway  
- **Database**: PostgreSQL on Railway
- **Mobile App**: Ready for production build

---

## 💰 **Cost**

- **Railway**: $5/month (includes $5 usage credit)
- **Total cost**: ~$5/month for everything!

---

## 🆘 **Troubleshooting**

### **If Admin Panel Fails to Deploy:**
1. Check **Root Directory** is set to `admin-panel`
2. Verify **Build Command** is correct
3. Check **Environment Variables** are set
4. Review **Deployment Logs** for errors

### **If Admin Panel Can't Connect to Backend:**
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend is running and healthy
3. Test backend health endpoint

---

**Ready to deploy your admin panel to Railway!** 🚀
