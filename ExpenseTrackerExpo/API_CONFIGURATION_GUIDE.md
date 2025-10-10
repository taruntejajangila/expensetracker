# 🌐 API Configuration Guide

## ✅ Automatic Environment Switching

Your app now **automatically switches** between local development and production APIs!

---

## 📱 **How It Works**

### **Local Development (npm start)** 🔧
```
When you run: npm start
The app uses: http://192.168.29.14:5000/api
```

### **Production Build (APK/IPA)** ☁️
```
When you build: npx expo build:android
The app uses: https://your-backend.railway.app/api
```

**You DON'T need to change anything manually!** ✨

---

## 🛠️ **Configuration File**

All API URLs are managed in one place:
```
📁 ExpenseTrackerExpo/config/api.config.ts
```

### **What to Update:**

#### **1. For Local Development:**
```typescript
// Change this to YOUR computer's IP address
const LOCAL_API_URL = 'http://192.168.29.14:5000/api';
```

**How to find your IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` (look for inet)

#### **2. For Production (After deploying to Railway):**
```typescript
// Change this to your Railway backend URL
const PRODUCTION_API_URL = 'https://your-backend.railway.app/api';
```

---

## 🚀 **Workflow**

### **During Development:**
1. Make sure your backend is running locally
2. Update `LOCAL_API_URL` with your IP
3. Run `npm start` in ExpenseTrackerExpo
4. App automatically uses local backend ✅

### **When Deploying:**
1. Deploy backend to Railway (get URL)
2. Update `PRODUCTION_API_URL` in config
3. Build APK: `npx expo build:android`
4. App automatically uses Railway backend ✅

---

## 📋 **Files Updated**

All these files now use the centralized config:

### **✅ Services**
- ✅ `services/AccountService.ts`
- ✅ `services/GoalService.ts`
- ✅ `services/BudgetService.ts`
- ✅ `services/transactionService.ts`
- ✅ `services/CategoryService.ts`
- ✅ `services/CreditCardService.ts`
- ✅ `services/ReminderService.ts`
- ✅ `services/LoanService.ts`

### **✅ Contexts**
- ✅ `context/AuthContext.tsx`

---

## 🎯 **Benefits**

1. ✅ **No manual URL changes** - Automatic switching
2. ✅ **Single source of truth** - All APIs in one config file
3. ✅ **Easy maintenance** - Update once, affects everywhere
4. ✅ **Safe deployment** - Production builds automatically use production URLs

---

## ⚠️ **Important Notes**

### **For Mobile Testing:**
- Make sure your phone/emulator can reach your computer's IP
- Both devices should be on the same WiFi network
- Backend must be running on your computer

### **For Production:**
- Update `PRODUCTION_API_URL` BEFORE building APK
- Test the production URL in browser first
- Ensure Railway backend is deployed and running

---

## 🔍 **Checking Current Configuration**

When you start the app, check the console:
```
🌐 API Configuration Loaded:
   Mode: 🔧 DEVELOPMENT
   API URL: http://192.168.29.14:5000/api
```

Or in production build:
```
🌐 API Configuration Loaded:
   Mode: ☁️ PRODUCTION
   API URL: https://your-backend.railway.app/api
```

---

## 💡 **Troubleshooting**

### **Problem: Can't connect to backend**
1. Check if backend is running: `cd backend-api && npm run dev`
2. Verify your IP address is correct
3. Ensure phone and computer are on same WiFi

### **Problem: Production build not working**
1. Verify `PRODUCTION_API_URL` is correct
2. Check if Railway backend is running
3. Test URL in browser: `https://your-backend.railway.app/api/health`

---

**Last Updated**: October 2025  
**Maintained By**: Development Team

