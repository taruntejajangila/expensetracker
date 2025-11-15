# SMS OTP Authentication - Detailed Explanation

## Overview
This document explains how to implement SMS OTP (One-Time Password) authentication using Expo and your own backend, without Firebase.

## Architecture

### Components Needed:

1. **Mobile App (Expo)**
   - Phone number input screen
   - OTP input screen
   - API calls to backend

2. **Backend API**
   - Generate OTP endpoint
   - Verify OTP endpoint
   - OTP storage (database or cache)
   - SMS sending service integration

3. **SMS Service Provider** (Choose one)
   - Twilio (Recommended - easy to use)
   - AWS SNS (Amazon Simple Notification Service)
   - MessageBird
   - Your own SMS gateway

## Detailed Flow

### Step 1: User Requests OTP

**Mobile App:**
```typescript
// User enters phone number: +91 9876543210
const phoneNumber = "+919876543210";

// Call backend to request OTP
const response = await fetch('https://your-api.com/api/auth/request-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: phoneNumber })
});
```

**Backend:**
```javascript
// 1. Generate random 6-digit OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString(); // e.g., "456789"

// 2. Store in database with expiry (5 minutes)
await db.query(`
  INSERT INTO otp_verifications (phone, otp, expires_at)
  VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
`, [phoneNumber, otp]);

// 3. Send SMS via Twilio/AWS/etc
await sendSMS(phoneNumber, `Your OTP is: ${otp}. Valid for 5 minutes.`);

// 4. Return success (don't send OTP in response!)
return { success: true, message: 'OTP sent to your phone' };
```

### Step 2: User Enters OTP

**Mobile App:**
```typescript
// User enters OTP: "456789"
const enteredOTP = "456789";

// Verify with backend
const response = await fetch('https://your-api.com/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    phone: phoneNumber,
    otp: enteredOTP 
  })
});

const result = await response.json();
if (result.success) {
  // OTP verified! User is logged in
  // Store JWT token
  await AsyncStorage.setItem('authToken', result.data.accessToken);
}
```

**Backend:**
```javascript
// 1. Find OTP in database
const otpRecord = await db.query(`
  SELECT * FROM otp_verifications 
  WHERE phone = $1 AND otp = $2 AND expires_at > NOW()
  ORDER BY created_at DESC LIMIT 1
`, [phoneNumber, enteredOTP]);

// 2. Check if OTP exists and not expired
if (!otpRecord.rows.length) {
  return { success: false, message: 'Invalid or expired OTP' };
}

// 3. Mark OTP as used (prevent reuse)
await db.query(`
  UPDATE otp_verifications 
  SET used = true 
  WHERE id = $1
`, [otpRecord.rows[0].id]);

// 4. Check if user exists, if not create account
let user = await findUserByPhone(phoneNumber);
if (!user) {
  user = await createUser({ phone: phoneNumber });
}

// 5. Generate JWT token
const token = generateAccessToken(user.id, user.email, user.role);

// 6. Return success with token
return {
  success: true,
  data: {
    user: { id: user.id, phone: user.phone },
    accessToken: token
  }
};
```

## Database Schema

You'll need a table to store OTPs:

```sql
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_phone_otp (phone, otp),
  INDEX idx_expires_at (expires_at)
);
```

## Security Features

1. **OTP Expiry**: OTPs expire after 5 minutes
2. **One-time Use**: Mark OTP as used after verification
3. **Rate Limiting**: Limit OTP requests per phone (e.g., 3 per hour)
4. **No OTP in Response**: Never send OTP in API response
5. **Cleanup**: Delete expired OTPs periodically

## Cost Considerations

- **Twilio**: ~$0.0075 per SMS in India
- **AWS SNS**: ~$0.00645 per SMS in India
- **MessageBird**: ~$0.01 per SMS

For 1000 users requesting OTP: ~$7.50/month

## Advantages

✅ Works with Expo Go (no native modules needed)
✅ Full control over OTP logic
✅ No Firebase dependency
✅ Can customize SMS message
✅ Works with any SMS provider
✅ Easy to test (can use test OTPs in development)

## Disadvantages

❌ Need to set up SMS service (Twilio/AWS)
❌ Need to manage OTP storage and cleanup
❌ Need to implement rate limiting
❌ Costs money per SMS (but very cheap)

## Comparison with Firebase Phone Auth

| Feature | Firebase Phone Auth | Custom SMS OTP |
|---------|-------------------|----------------|
| Setup Complexity | High (native modules) | Medium (just API) |
| Expo Go Support | ❌ No | ✅ Yes |
| Cost | Free (limited) | ~$0.007/SMS |
| Customization | Limited | Full control |
| SMS Message | Fixed format | Customizable |

## Next Steps

1. Choose SMS provider (Twilio recommended)
2. Set up backend endpoints
3. Create database table for OTPs
4. Implement rate limiting
5. Add OTP screens to mobile app
6. Test with real phone numbers

