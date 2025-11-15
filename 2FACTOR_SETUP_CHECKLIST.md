# 2Factor.in Setup Checklist

## ✅ What's Been Implemented

1. ✅ **2Factor Service** (`backend-api/src/services/twoFactorService.ts`)
   - Handles SMS sending via 2Factor.in API

2. ✅ **OTP Routes** (`backend-api/src/routes/auth.ts`)
   - `POST /api/auth/request-otp` - Request OTP
   - `POST /api/auth/verify-otp` - Verify OTP and login

3. ✅ **Database Migration** (`backend-api/migrations/create_otp_table.sql`)
   - OTP storage table
   - Indexes for performance

4. ✅ **Documentation**
   - Integration guide
   - Code examples

## 📋 What You Need to Do

### Step 1: Sign Up for 2Factor.in
1. Visit: https://2factor.in
2. Create account
3. Get your API Key from dashboard
4. Add credits (minimum ₹100)

### Step 2: Add Environment Variable
Add to `backend-api/.env`:
```env
TWO_FACTOR_API_KEY=your_api_key_here
```

### Step 3: Run Database Migration
Execute the SQL in `backend-api/migrations/create_otp_table.sql`:
```bash
# Connect to your database and run:
psql -U your_user -d your_database -f backend-api/migrations/create_otp_table.sql
```

Or manually run in your database:
```sql
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_otp ON otp_verifications(phone, otp);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
```

### Step 4: Test the API

**Request OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

### Step 5: Add Mobile App Screens
- Create `OTPRequestScreen.tsx` (see guide)
- Create `OTPVerifyScreen.tsx` (see guide)
- Add navigation routes

## 🧪 Testing Checklist

- [ ] API key configured
- [ ] Database table created
- [ ] Can request OTP
- [ ] OTP received on phone
- [ ] Can verify OTP
- [ ] User created on first OTP verify
- [ ] Existing user can login with OTP
- [ ] Rate limiting works (max 3 per hour)
- [ ] Expired OTP rejected
- [ ] Used OTP rejected

## 📱 Mobile App Integration

See `2FACTOR_INTEGRATION_GUIDE.md` for:
- Complete mobile app code
- Screen components
- API integration examples

## 💰 Cost Estimate

- **Per SMS**: ₹0.10
- **1000 OTPs/month**: ₹100 (~$1.20)
- **10,000 OTPs/month**: ₹1,000 (~$12)

## 🚀 Next Steps

1. Get 2Factor.in API key
2. Add to environment variables
3. Run database migration
4. Test with real phone number
5. Integrate in mobile app
6. Deploy!

## 📞 Support

- **2Factor.in**: support@2factor.in
- **Phone**: +91-22-48-933-633

