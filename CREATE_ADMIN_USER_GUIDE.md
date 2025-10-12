# 👤 Create Admin User in Railway Database

## 🎯 **Problem:**
You can't login to the admin panel because the admin user doesn't exist in your Railway PostgreSQL database.

---

## ✅ **Solution: Create Admin User**

### **Method 1: Using Node.js Script (Easiest)**

#### **Step 1: Get DATABASE_URL from Railway**

1. **Go to Railway** → **PostgreSQL Service**
2. **Click** → **Variables** tab
3. **Copy the `DATABASE_URL`** value
   - It looks like: `postgresql://postgres:password@host:port/railway`

#### **Step 2: Run the Script**

```bash
# Navigate to backend directory
cd backend-api

# Install dependencies (if not already)
npm install

# Run the script (replace <DATABASE_URL> with your actual URL)
node create-admin-user.js "postgresql://postgres:password@host:port/railway"
```

#### **Step 3: Verify**

Script will show:
```
✅ Admin user created successfully!
📧 Email: admin@expensetracker.com
🔑 Password: admin123
👤 Name: Admin User
```

---

### **Method 2: Using Railway CLI (Alternative)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the script using Railway environment
railway run node create-admin-user.js
```

---

### **Method 3: Direct Database Query (Advanced)**

**If you have a PostgreSQL client (pgAdmin, DBeaver, etc.):**

1. **Connect to Railway PostgreSQL** using the connection details
2. **Run this SQL:**

```sql
-- Create admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, is_verified, is_active) 
VALUES (
  'admin@expensetracker.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Z9W2XvK6u',
  'Admin',
  'User',
  true,
  true
);
```

3. **Verify**:
```sql
SELECT * FROM users WHERE email = 'admin@expensetracker.com';
```

---

## 🎯 **After Creating Admin User:**

1. **Refresh admin panel**
2. **Try login** with:
   - **Email**: `admin@expensetracker.com`
   - **Password**: `admin123`
3. **Should work now!** ✅

---

## 🔒 **Security Note:**

**After successful login, CHANGE THE PASSWORD IMMEDIATELY!**

The default password `admin123` is insecure and should be changed in production.

---

## 📋 **Troubleshooting:**

### **If script shows "Admin user already exists":**
- The user was created but password might be wrong
- Delete and recreate:
```sql
DELETE FROM users WHERE email = 'admin@expensetracker.com';
```
Then run the script again.

### **If script shows "Connection failed":**
- Check DATABASE_URL is correct
- Ensure you're using the PUBLIC_URL if connecting from outside Railway
- Check PostgreSQL service is running in Railway

---

## 🚀 **Quick Start:**

```bash
# 1. Get DATABASE_URL from Railway PostgreSQL service
# 2. Run this:
cd backend-api
node create-admin-user.js "YOUR_DATABASE_URL_HERE"
```

That's it! Admin user will be created and you can login! ✅

