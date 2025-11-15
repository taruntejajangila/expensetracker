# ⚠️ IMPORTANT: Run This SQL in Railway Database

## Quick Steps:
1. Go to **Railway Dashboard**
2. Click on your **PostgreSQL** service
3. Click **"Data"** tab
4. Click **"Query"** button
5. **Copy and paste the SQL below**
6. Click **"Run"** or press `Ctrl+Enter`

---

## SQL Migration Code:

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

---

## Verify It Worked:

After running, verify the table exists:

```sql
SELECT * FROM otp_verifications LIMIT 1;
```

Should return: **Empty result (no error = success! ✅)**

---

## Next Steps After Migration:

1. ✅ API Key added to Railway
2. ⏳ **Run this SQL migration** ← YOU ARE HERE
3. ⏳ Test with mobile app
4. ⏳ Done! 🎉

