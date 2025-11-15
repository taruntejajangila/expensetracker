# Run Database Migration Using Railway CLI

## Step 1: Install Railway CLI

Run this command in your terminal:

```bash
curl -fsSL https://railway.com/install.sh | sh
```

**For Windows (PowerShell):**
```powershell
iwr https://railway.com/install.sh | iex
```

**Or download from:** https://railway.com/cli

---

## Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

---

## Step 3: Connect to Your Project

From the screenshot, your project ID is: `36bd7e55-3cd5-425c-baf5-7b18a2a51764`

Run:
```bash
railway link -p 36bd7e55-3cd5-425c-baf5-7b18a2a51764
```

**Or if you're already in the project directory:**
```bash
railway link
```

---

## Step 4: Connect to Database

Connect to your PostgreSQL database:

```bash
railway connect
```

This will open a PostgreSQL connection. You should see a `psql` prompt.

---

## Step 5: Run the Migration SQL

Once connected, paste and run this SQL:

```sql
-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone_otp ON otp_verifications(phone, otp);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_verifications(phone, created_at);
```

**Press Enter** after pasting. You should see:
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
```

---

## Step 6: Verify Table Created

Run this to verify:

```sql
SELECT * FROM otp_verifications LIMIT 1;
```

Should return: **Empty result (no error = success! ✅)**

---

## Step 7: Exit

Type `\q` and press Enter to exit psql.

---

## Alternative: Run SQL File Directly

If you prefer, you can also run the SQL file directly:

```bash
railway connect < backend-api/migrations/create_otp_table.sql
```

---

## Troubleshooting

**If `railway connect` doesn't work:**
- Make sure you're in the project directory
- Try: `railway link` first
- Check: `railway status` to see current project

**If you get "Project not found":**
- Run `railway login` again
- Make sure you're using the correct project ID

**If database connection fails:**
- Check Railway dashboard - make sure PostgreSQL service is running
- Try: `railway variables` to see DATABASE_URL

---

## Quick Command Summary

```bash
# 1. Install CLI (if not installed)
curl -fsSL https://railway.com/install.sh | sh

# 2. Login
railway login

# 3. Link project
railway link -p 36bd7e55-3cd5-425c-baf5-7b18a2a51764

# 4. Connect to database
railway connect

# 5. Paste SQL (in psql prompt)
# ... SQL from above ...

# 6. Verify
SELECT * FROM otp_verifications LIMIT 1;

# 7. Exit
\q
```

---

## ✅ Done!

Once the migration is complete, you can test the OTP flow! 🎉

