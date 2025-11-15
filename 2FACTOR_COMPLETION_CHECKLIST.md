# 2Factor.in OTP Integration - Completion Checklist

## ✅ What's Been Implemented

### Backend (Complete)
1. ✅ **2Factor Service** (`backend-api/src/services/twoFactorService.ts`)
   - Handles SMS sending via 2Factor.in API
   - Error handling and logging

2. ✅ **OTP Routes** (`backend-api/src/routes/auth.ts`)
   - `POST /api/auth/request-otp` - Request OTP
   - `POST /api/auth/verify-otp` - Verify OTP and login
   - Rate limiting (max 3 OTPs per hour)
   - Auto user creation on first OTP verify

3. ✅ **Database Migration** (`backend-api/migrations/create_otp_table.sql`)
   - OTP storage table with indexes
   - Cleanup function for expired OTPs

### Mobile App (Complete)
1. ✅ **OTP Request Screen** (`ExpenseTrackerExpo/screens/auth/OTPRequestScreen.tsx`)
   - Phone number input
   - Validation
   - API integration

2. ✅ **OTP Verify Screen** (`ExpenseTrackerExpo/screens/auth/OTPVerifyScreen.tsx`)
   - 6-digit OTP input (auto-focus)
   - Auto-submit when complete
   - Resend OTP with cooldown
   - Error handling

3. ✅ **Navigation** (`ExpenseTrackerExpo/App.js`)
   - Added OTP screens to AuthStackNavigator
   - "Login with Phone Number (OTP)" button in LoginScreen

## 📋 What You Need to Do

### Step 1: Run Database Migration ⚠️ IMPORTANT

Execute this SQL in your Railway database:

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

**How to run:**
1. Go to Railway Dashboard
2. Select your PostgreSQL service
3. Go to **Data** tab
4. Click **Query** or use **Connect** to open psql
5. Paste and execute the SQL above

### Step 2: Sign Up for 2Factor.in

1. Visit: https://2factor.in
2. Create an account
3. Get your **API Key** from dashboard
4. Add credits (minimum ₹100)

### Step 3: Add Environment Variable

Add to Railway environment variables:

1. Go to Railway Dashboard
2. Select your **backend service**
3. Go to **Variables** tab
4. Add new variable:
   - **Name**: `TWO_FACTOR_API_KEY`
   - **Value**: Your 2Factor.in API key
5. Click **Add**

### Step 4: Test the Integration

**Test Backend API:**

```bash
# Request OTP
curl -X POST https://your-api.railway.app/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Verify OTP (use the OTP you received)
curl -X POST https://your-api.railway.app/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

**Test Mobile App:**
1. Open the app
2. On Login screen, tap "Login with Phone Number (OTP)"
3. Enter your phone number
4. Check SMS for OTP
5. Enter OTP
6. Should log in successfully

## 🧪 Testing Checklist

- [ ] Database table created
- [ ] API key added to Railway
- [ ] Can request OTP via API
- [ ] OTP received on phone
- [ ] Can verify OTP via API
- [ ] User created on first OTP verify
- [ ] Existing user can login with OTP
- [ ] Rate limiting works (max 3 per hour)
- [ ] Expired OTP rejected
- [ ] Used OTP rejected
- [ ] Mobile app OTP flow works
- [ ] Auto-submit when 6 digits entered
- [ ] Resend OTP works with cooldown

## 📱 Mobile App Features

### OTP Request Screen
- ✅ Phone number input with validation
- ✅ Auto-formatting (adds +91 if missing)
- ✅ Error handling
- ✅ Loading states

### OTP Verify Screen
- ✅ 6 individual input boxes
- ✅ Auto-focus next box
- ✅ Auto-submit when complete
- ✅ Resend OTP (60s cooldown)
- ✅ Change number option
- ✅ Error handling

## 💰 Cost Estimate

- **Per SMS**: ₹0.10
- **1000 OTPs/month**: ₹100 (~$1.20)
- **10,000 OTPs/month**: ₹1,000 (~$12)

## 🚀 Next Steps

1. ✅ Code is ready
2. ⏳ Run database migration
3. ⏳ Get 2Factor.in API key
4. ⏳ Add to Railway environment variables
5. ⏳ Test with real phone number
6. ⏳ Deploy and test!

## 📞 Support

- **2Factor.in**: support@2factor.in
- **Phone**: +91-22-48-933-633

## 🎯 Quick Start

1. **Run SQL migration** (see Step 1 above)
2. **Get API key** from 2Factor.in
3. **Add to Railway**: `TWO_FACTOR_API_KEY=your_key`
4. **Test**: Use mobile app to request OTP
5. **Done!** 🎉

