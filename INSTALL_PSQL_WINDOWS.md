# Install psql (PostgreSQL Client) on Windows

## Option 1: Install PostgreSQL (Includes psql) - Recommended

### Download PostgreSQL:
1. Go to: https://www.postgresql.org/download/windows/
2. Click **"Download the installer"**
3. Download **PostgreSQL 15 or 16** (latest stable version)
4. Run the installer
5. During installation:
   - **Uncheck** "Stack Builder" (not needed)
   - **Remember the password** you set for postgres user (or leave default)
   - **Port**: Keep default 5432
6. Complete the installation

### Verify Installation:
Open PowerShell and run:
```powershell
psql --version
```

You should see: `psql (PostgreSQL) 15.x` or similar

---

## Option 2: Install Only PostgreSQL Client Tools (Lighter)

### Using Chocolatey (if you have it):
```powershell
choco install postgresql --params '/Password:postgres'
```

### Or Download Standalone Client:
1. Go to: https://www.enterprisedb.com/download-postgresql-binaries
2. Download **PostgreSQL Binaries** for Windows
3. Extract and add to PATH

---

## Option 3: Use Railway Web Interface (Alternative)

If you don't want to install psql, you can use Railway's web interface:

1. Go to Railway Dashboard
2. Click your **PostgreSQL** service
3. Click **"Data"** tab
4. Click **"Connect"** button
5. This opens a web-based SQL editor
6. Paste and run the SQL migration there

---

## After Installing psql

Once psql is installed, you can run:

```powershell
railway connect
```

Then select **"Postgres"** and it should work!

---

## Quick Test

After installation, test it:

```powershell
psql --version
```

If you see a version number, you're good to go! ✅

