# 🔧 Get External Database URL

## The Issue
The internal Railway URL `postgres.railway.internal` only works from within Railway's network. We need the external URL.

## How to Get External DATABASE_URL

### Option 1: From Railway Dashboard
1. Go to: https://railway.app/
2. Click on your **PostgreSQL database service**
3. Go to **"Variables"** tab
4. Look for **DATABASE_URL** - this should be the external URL
5. Copy the value

### Option 2: From Railway CLI
```bash
npx @railway/cli variables
```

### Option 3: Check if it's in your backend environment
The external URL usually looks like:
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:xxxx/railway
```

## Once You Have the External URL

Run this command (replace with your actual external URL):
```bash
"C:\Program Files\PostgreSQL\15\bin\psql.exe" "YOUR_EXTERNAL_DATABASE_URL" -f fix-remaining-issues.sql
```

## Alternative: Use Node.js Script
If you can't get the external URL, we can use the Node.js script approach instead.
