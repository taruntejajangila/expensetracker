# 🌐 Expense Tracker - Cloud Deployment Documentation

## 📋 **Table of Contents**
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Required Applications](#required-applications)
4. [Cloud Platform Options](#cloud-platform-options)
5. [Deployment Checklist](#deployment-checklist)
6. [Configuration Changes](#configuration-changes)
7. [Step-by-Step Deployment](#step-by-step-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## 🎯 **Project Overview**

The Expense Tracker is a full-stack application consisting of three main components:

- **📱 Mobile App** (React Native/Expo) - User interface for expense tracking
- **🔧 Backend API** (Node.js/TypeScript/PostgreSQL) - Data management and business logic
- **🖥️ Admin Panel** (Next.js/React) - Administrative interface for managing users and data

### **Current Technology Stack:**
- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Admin Panel**: Next.js, React, Material-UI
- **Authentication**: JWT tokens
- **File Uploads**: Multer middleware

---

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Admin Panel   │    │   Backend API   │
│  (React Native) │    │    (Next.js)    │    │   (Node.js)     │
│                 │    │                 │    │                 │
│ • User Interface│    │ • Admin Dashboard│    │ • REST API      │
│ • Expense Entry │    │ • User Management│    │ • Authentication│
│ • Data Display  │    │ • Analytics     │    │ • Data Processing│
│ • Offline Sync  │    │ • Reports       │    │ • File Uploads  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │    Database     │
                    │                 │
                    │ • User Data     │
                    │ • Transactions  │
                    │ • Categories    │
                    │ • Budgets       │
                    │ • Goals         │
                    └─────────────────┘
```

---

## 🛠️ **Required Applications**

### **1. Essential Software (Must Have)**

#### **Git & Version Control**
- **Git** - Version control system
  - Download: https://git-scm.com/downloads
  - Purpose: Upload code to cloud platforms
  - Check installation: `git --version`

#### **Node.js & npm**
- **Node.js** (v18.0.0 or higher)
  - Download: https://nodejs.org/
  - Purpose: Run backend API and build processes
  - Check installation: `node --version` and `npm --version`

#### **Code Editor**
- **VS Code** or **Cursor** (already installed)
  - Purpose: Edit configuration files for deployment

### **2. Cloud Platform Accounts (Choose One)**

#### **Option A: DigitalOcean App Platform (Recommended)**
- **Account**: https://www.digitalocean.com
- **Cost**: $5-12/month
- **Features**: Single platform for all components, managed database
- **Free Credits**: $200 for new users

#### **Option B: Railway**
- **Account**: https://railway.app
- **Cost**: $5-20/month
- **Features**: Git integration, easy deployment
- **Free Credits**: $5 monthly credit

#### **Option C: Render**
- **Account**: https://render.com
- **Cost**: $7-19/month
- **Features**: Free tier available, modern platform
- **Free Credits**: Free tier with limitations

### **3. Mobile App Development Tools**

#### **Expo CLI (Required for Mobile App)**
```bash
npm install -g @expo/cli
```
- **Purpose**: Build and deploy mobile applications
- **Check installation**: `expo --version`

#### **Android Studio (Optional)**
- **Download**: https://developer.android.com/studio
- **Purpose**: Advanced Android development and testing
- **Required for**: Custom native modules

#### **Xcode (macOS only)**
- **Download**: Mac App Store
- **Purpose**: iOS development and testing
- **Required for**: iOS app builds

### **4. Database Management Tools (Optional)**

#### **pgAdmin**
- **Download**: https://www.pgadmin.org/
- **Purpose**: PostgreSQL database management
- **Alternative**: DBeaver, TablePlus

---

## ☁️ **Cloud Platform Options**

### **DigitalOcean App Platform (Recommended)**

**Pros:**
- ✅ Single platform for all components
- ✅ Managed PostgreSQL database included
- ✅ Auto-scaling and load balancing
- ✅ Easy deployment from GitHub
- ✅ Free SSL certificates
- ✅ Global CDN

**Cons:**
- ❌ Slightly higher cost than alternatives
- ❌ Less customization than VPS

**Pricing:**
- Starter: $5/month (1 app, shared CPU)
- Basic: $12/month (1 app, dedicated CPU)
- Pro: $24/month (multiple apps)

### **Railway**

**Pros:**
- ✅ Git integration
- ✅ One-click deployment
- ✅ Developer-friendly interface
- ✅ Built-in database
- ✅ Free tier available

**Cons:**
- ❌ Less control over infrastructure
- ❌ Can be expensive with usage

**Pricing:**
- Hobby: $5/month (includes $5 credit)
- Pro: $20/month (unlimited usage)

### **Render**

**Pros:**
- ✅ Free tier available
- ✅ Modern platform
- ✅ Good documentation
- ✅ Auto-deploy from GitHub

**Cons:**
- ❌ Free tier has limitations
- ❌ Can be slow on free tier

**Pricing:**
- Free: Limited resources
- Starter: $7/month
- Standard: $19/month

---

## ✅ **Deployment Checklist**

### **Pre-Deployment Setup**

#### **1. Code Preparation**
- [ ] **Backend API** - TypeScript compilation ready
- [ ] **Admin Panel** - Next.js build configuration
- [ ] **Mobile App** - Expo configuration complete
- [ ] **Environment Variables** - Production values prepared
- [ ] **Database Schema** - Migration scripts ready

#### **2. Account Setup**
- [ ] **GitHub Account** - Code repository created
- [ ] **Cloud Platform Account** - Chosen platform account created
- [ ] **Domain Name** - Optional, for custom URLs
- [ ] **SSL Certificate** - Usually provided by platform

#### **3. Local Testing**
- [ ] **Backend API** - Tested locally with production settings
- [ ] **Admin Panel** - Tested with production API
- [ ] **Mobile App** - Tested with production API
- [ ] **Database** - All tables and data working

### **Deployment Steps**

#### **Phase 1: Backend API Deployment**
- [ ] **Create App** - Deploy Node.js application
- [ ] **Database Setup** - Create PostgreSQL database
- [ ] **Environment Variables** - Configure production settings
- [ ] **File Uploads** - Configure upload directory
- [ ] **Health Check** - Verify API endpoints working

#### **Phase 2: Admin Panel Deployment**
- [ ] **Create Static Site** - Deploy Next.js build
- [ ] **API Configuration** - Update API URLs
- [ ] **Environment Variables** - Configure production settings
- [ ] **Domain Setup** - Configure custom domain (optional)

#### **Phase 3: Mobile App Deployment**
- [ ] **API URL Update** - Update AuthContext with production API
- [ ] **Build Configuration** - Configure Expo build settings
- [ ] **APK Generation** - Build Android APK
- [ ] **iOS Build** - Build iOS app (if applicable)

#### **Phase 4: Testing & Go-Live**
- [ ] **Integration Testing** - Test all components together
- [ ] **Performance Testing** - Verify response times
- [ ] **Security Testing** - Verify HTTPS and authentication
- [ ] **User Acceptance Testing** - Test with real users
- [ ] **Go-Live** - Deploy to production

---

## ⚙️ **Configuration Changes**

### **Backend API Configuration**

#### **Environment Variables (.env)**
```env
# Production Environment
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=your-cloud-db-host
DB_PORT=5432
DB_NAME=expense_tracker_db
DB_USER=your-db-username
DB_PASSWORD=your-secure-password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# App URLs (Update with your cloud URLs)
MOBILE_APP_URL=https://your-mobile-app-url
ADMIN_PANEL_URL=https://your-admin-panel-url
FRONTEND_URL=https://your-admin-panel-url

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@expensetracker.com

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

#### **CORS Configuration (server.ts)**
```typescript
// Update CORS origins for production
app.use(cors({
  origin: [
    process.env.MOBILE_APP_URL || 'https://your-mobile-app-url',
    process.env.ADMIN_PANEL_URL || 'https://your-admin-panel-url',
    process.env.FRONTEND_URL || 'https://your-admin-panel-url'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));
```

### **Admin Panel Configuration**

#### **Next.js Configuration (next.config.js)**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: 'my-value',
    NEXT_PUBLIC_API_URL: 'https://your-api-url.com/api', // UPDATE THIS
  },
  // Add other production configurations
  output: 'export', // For static export
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

#### **API Service Configuration (api.ts)**
```typescript
// Update base URL for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-url.com/api';
```

### **Mobile App Configuration**

#### **AuthContext Configuration (AuthContext.tsx)**
```typescript
// Update API_BASE_URL for production
const API_BASE_URL = 'https://your-api-url.com/api'; // UPDATE THIS
```

#### **Expo Configuration (app.json)**
```json
{
  "expo": {
    "name": "Expense Tracker",
    "slug": "expense-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "jsEngine": "jsc"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "jsEngine": "jsc"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

---

## 🚀 **Step-by-Step Deployment**

### **Phase 1: Backend API Deployment**

#### **Step 1: Prepare Backend Code**
```bash
cd backend-api
npm install
npm run build
```

#### **Step 2: Create Production Environment File**
```bash
# Create .env file with production values
cp env.example .env
# Edit .env with your production values
```

#### **Step 3: Deploy to Cloud Platform**

**DigitalOcean App Platform:**
1. Go to DigitalOcean App Platform
2. Click "Create App"
3. Connect your GitHub repository
4. Select "Backend Service"
5. Configure:
   - Source: `backend-api` folder
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Environment Variables: Add all from .env

**Railway:**
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select `backend-api` folder
6. Add environment variables

#### **Step 4: Create Database**
**DigitalOcean:**
1. Go to Databases
2. Create PostgreSQL database
3. Note connection details
4. Update environment variables

**Railway:**
1. Add PostgreSQL service
2. Connect to your app
3. Update environment variables

#### **Step 5: Test Backend API**
```bash
# Test health endpoint
curl https://your-api-url.com/health

# Test API documentation
curl https://your-api-url.com/api
```

### **Phase 2: Admin Panel Deployment**

#### **Step 1: Update API Configuration**
```bash
cd admin-panel
# Update next.config.js with production API URL
```

#### **Step 2: Build Admin Panel**
```bash
npm install
npm run build
```

#### **Step 3: Deploy Admin Panel**

**DigitalOcean App Platform:**
1. Create new app
2. Select "Static Site"
3. Connect GitHub repository
4. Configure:
   - Source: `admin-panel` folder
   - Build Command: `npm run build`
   - Output Directory: `build`

**Railway:**
1. Add new service
2. Select "Static Site"
3. Configure build settings

#### **Step 4: Test Admin Panel**
1. Visit your admin panel URL
2. Test login functionality
3. Verify API connectivity

### **Phase 3: Mobile App Deployment**

#### **Step 1: Update API URLs**
```bash
cd ExpenseTrackerExpo
# Update AuthContext.tsx with production API URL
```

#### **Step 2: Build Mobile App**
```bash
# Install Expo CLI if not already installed
npm install -g @expo/cli

# Build Android APK
npx expo build:android

# Build iOS app (macOS only)
npx expo build:ios
```

#### **Step 3: Test Mobile App**
1. Install APK on Android device
2. Test all functionality
3. Verify API connectivity

---

## 🔧 **Troubleshooting**

### **Common Issues and Solutions**

#### **Backend API Issues**

**Issue: Database Connection Failed**
```bash
# Check database credentials
# Verify database is running
# Check network connectivity
```

**Issue: CORS Errors**
```bash
# Update CORS configuration in server.ts
# Add your frontend URLs to allowed origins
```

**Issue: File Upload Not Working**
```bash
# Check upload directory permissions
# Verify file size limits
# Check allowed file types
```

#### **Admin Panel Issues**

**Issue: API Connection Failed**
```bash
# Check NEXT_PUBLIC_API_URL in next.config.js
# Verify API is running and accessible
# Check CORS configuration
```

**Issue: Build Failed**
```bash
# Check for TypeScript errors
# Verify all dependencies are installed
# Check Node.js version compatibility
```

#### **Mobile App Issues**

**Issue: API Connection Failed**
```bash
# Check API_BASE_URL in AuthContext.tsx
# Verify API is accessible from mobile device
# Check network connectivity
```

**Issue: Build Failed**
```bash
# Check Expo CLI version
# Verify all dependencies are installed
# Check for TypeScript errors
```

### **Debugging Steps**

1. **Check Logs**
   - Backend: Check application logs
   - Admin Panel: Check browser console
   - Mobile App: Check Expo logs

2. **Test Endpoints**
   - Use Postman or curl to test API
   - Verify all endpoints are working
   - Check response times

3. **Verify Configuration**
   - Check environment variables
   - Verify database connection
   - Test file uploads

---

## 🔄 **Maintenance**

### **Regular Maintenance Tasks**

#### **Daily**
- [ ] Check application health
- [ ] Monitor error logs
- [ ] Verify database connectivity

#### **Weekly**
- [ ] Review performance metrics
- [ ] Check disk space usage
- [ ] Update dependencies (if needed)

#### **Monthly**
- [ ] Security updates
- [ ] Database backups
- [ ] Performance optimization

### **Monitoring and Alerts**

#### **Health Checks**
- Backend API: `/health` endpoint
- Database: Connection pool status
- File uploads: Directory permissions

#### **Performance Monitoring**
- Response times
- Memory usage
- CPU utilization
- Database query performance

#### **Security Monitoring**
- Failed login attempts
- Unusual API usage
- File upload security
- SSL certificate expiration

---

## 📞 **Support and Resources**

### **Documentation Links**
- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

### **Community Support**
- [DigitalOcean Community](https://www.digitalocean.com/community)
- [Railway Discord](https://discord.gg/railway)
- [Expo Discord](https://discord.gg/expo)
- [Stack Overflow](https://stackoverflow.com/)

### **Emergency Contacts**
- Cloud Platform Support
- Database Provider Support
- Domain Registrar Support

---

## 📝 **Version History**

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-XX | Initial documentation |
| 1.1.0 | 2024-01-XX | Added troubleshooting section |
| 1.2.0 | 2024-01-XX | Added maintenance guidelines |

---

**Last Updated**: January 2024  
**Document Version**: 1.0.0  
**Maintained By**: Development Team

