# Railway Database Connection Troubleshooting

## 🔴 Current Issue

Database connection is timing out after 60 seconds. This suggests a configuration or network issue.

## ✅ What I've Fixed

1. ✅ Increased connection timeout from 30s to 60s
2. ✅ Increased retries from 3 to 5 attempts
3. ✅ Increased retry delay from 5s to 10s
4. ✅ Added better error logging and diagnostics
5. ✅ Reduced connection pool size (10 instead of 20)
6. ✅ Added wrapper timeout protection

## 🔍 Troubleshooting Steps

### Step 1: Verify DATABASE_URL in Railway

1. Go to Railway Dashboard
2. Select your backend service
3. Go to **Variables** tab
4. Check if `DATABASE_URL` exists and is correct
5. It should look like: `postgresql://user:password@host:port/database?sslmode=require`

### Step 2: Check Database Service Status

1. In Railway Dashboard, check your **PostgreSQL** service
2. Make sure it's **Running** (green status)
3. Check if it's in the same **Project** as your backend
4. Verify the database is not paused or sleeping

### Step 3: Verify Database Connection String

The DATABASE_URL should be:
- **Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require`
- **Example**: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

### Step 4: Check Railway Service Linking

1. In Railway Dashboard
2. Select your **backend service**
3. Go to **Settings** → **Service Settings**
4. Check **Connected Services** or **Service Dependencies**
5. Make sure PostgreSQL is **linked/connected** to your backend service

### Step 5: Test Database Connection Manually

You can test the connection using Railway's database URL:

```bash
# Using psql (if you have it installed)
psql $DATABASE_URL

# Or using Railway CLI
railway connect
```

### Step 6: Check Network/Region Settings

1. Make sure backend and database are in the **same region**
2. Check if there are any **firewall rules** blocking connections
3. Verify **private networking** is enabled (if available)

## 🛠️ Common Solutions

### Solution 1: Re-link Database Service

1. In Railway Dashboard
2. Select your backend service
3. Go to **Settings** → **Connected Services**
4. **Disconnect** the database
5. **Reconnect** it
6. This will refresh the DATABASE_URL

### Solution 2: Check Database Service Plan

- Free tier databases may have connection limits
- Check if database is hitting connection limits
- Consider upgrading if needed

### Solution 3: Verify SSL Settings

The DATABASE_URL should include `?sslmode=require` at the end:
```
postgresql://user:pass@host:port/db?sslmode=require
```

### Solution 4: Restart Both Services

1. Restart the **PostgreSQL** service
2. Wait 30 seconds
3. Restart the **backend** service
4. Check logs again

### Solution 5: Check Railway Status

1. Visit: https://status.railway.app
2. Check if there are any ongoing issues
3. Check Railway Discord/Support for known issues

## 📊 Diagnostic Information

The health endpoint now shows database status:
```
GET /health
```

Response includes:
```json
{
  "database": {
    "status": "connected" | "disconnected",
    "error": "error message if any"
  }
}
```

## 🔧 Manual Database Connection Test

If you have Railway CLI installed:

```bash
# Connect to database
railway connect

# Or use the DATABASE_URL directly
psql $DATABASE_URL -c "SELECT NOW();"
```

## ⚠️ If Still Not Working

1. **Check Railway Logs** for database service errors
2. **Verify DATABASE_URL** is being passed correctly
3. **Try creating a new database** service and linking it
4. **Contact Railway Support** if issue persists

## 📝 Next Steps

1. Check Railway dashboard for database service status
2. Verify DATABASE_URL environment variable
3. Ensure services are linked properly
4. Check Railway status page for outages
5. Review Railway logs for more details

## 💡 Alternative: Use Railway's Internal Networking

If services are in the same project, Railway should handle networking automatically. Make sure:
- Both services are in the **same Railway project**
- Database is **linked** to backend service
- No custom networking rules blocking connections

