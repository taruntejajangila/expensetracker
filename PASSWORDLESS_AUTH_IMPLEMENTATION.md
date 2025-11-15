# Passwordless OTP Authentication Implementation

## ✅ Implementation Complete

The app is now fully passwordless with OTP-based authentication.

---

## 🔄 New Authentication Flow

### **Pre-Check Flow (Recommended)**

1. **User enters phone number**
   - App calls: `POST /api/auth/check-phone`
   - Response: `{ exists: true/false, data: {...} }`

2. **If user exists (Login Flow)**
   - Show: "Login with OTP"
   - User enters phone → OTP sent → Verify OTP
   - User logged in immediately with tokens

3. **If user doesn't exist (Signup Flow)**
   - Show: "Sign up with OTP"
   - User enters phone → OTP sent → Verify OTP
   - User account created (temporary)
   - Show: "Complete your profile" screen
   - User enters name (and optional email)
   - Signup completed → User logged in with tokens

---

## 📡 New API Endpoints

### 1. `POST /api/auth/check-phone`
**Purpose:** Pre-check if user exists (for signup/login flow)

**Request:**
```json
{
  "phone": "+919876543210"
}
```

**Response (User exists):**
```json
{
  "success": true,
  "exists": true,
  "data": {
    "id": "uuid",
    "phone": "+919876543210",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response (User doesn't exist):**
```json
{
  "success": true,
  "exists": false,
  "data": null
}
```

---

### 2. `POST /api/auth/verify-otp` (Updated)
**Purpose:** Verify OTP for both login and signup

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (Existing User - Login):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "requiresSignup": false,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+919876543210",
      "name": "John Doe",
      "email": "user@example.com",
      "createdAt": "2025-11-15T..."
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

**Response (New User - Signup Started):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "requiresSignup": true,
  "data": {
    "tempToken": "jwt_token",
    "user": {
      "id": "uuid",
      "phone": "+919876543210"
    }
  }
}
```

---

### 3. `POST /api/auth/complete-signup` (New)
**Purpose:** Complete signup after OTP verification (for new users only)

**Headers:**
```
Authorization: Bearer <tempToken>
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup completed successfully",
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+919876543210",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-11-15T..."
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

## 🔒 Token Management

- **Access Token:** 24 hours (unchanged)
- **Refresh Token:** 90 days (extended from 7 days)
  - Long-lived to minimize repeated OTP requests
  - Users stay logged in for 90 days

---

## 🗄️ Database Changes

### Migration: `20251115000000_make_password_nullable.ts`
- Made `password` column nullable
- Users created via OTP have `password = NULL`
- Existing users with passwords can still use them (if needed)

### Schema Update
- `users.password` is now `VARCHAR(255) NULL`
- Supports passwordless authentication

---

## 🚫 Deprecated Endpoints

The following endpoints are **disabled** (commented out):

1. `POST /api/auth/register` - Use OTP signup instead
2. `POST /api/auth/login` - Use OTP login instead
3. `POST /api/auth/change-password` - App is fully passwordless

---

## 📱 Mobile App Flow

### **Welcome Screen**
- User opens app → Shows welcome screen

### **Phone Entry Screen**
- User enters phone number (+91 pre-filled)
- App calls `POST /api/auth/check-phone`

### **Based on Response:**

**If `exists: true` (Login):**
1. Show "Login" screen
2. User requests OTP
3. User enters OTP
4. Call `POST /api/auth/verify-otp`
5. User logged in → Navigate to home

**If `exists: false` (Signup):**
1. Show "Sign up" screen
2. User requests OTP
3. User enters OTP
4. Call `POST /api/auth/verify-otp`
5. If `requiresSignup: true`:
   - Show "Complete Profile" screen
   - User enters name (and optional email)
   - Call `POST /api/auth/complete-signup` with `tempToken`
   - User logged in → Navigate to onboarding

---

## ✅ What's Working

- ✅ Pre-check endpoint (`/check-phone`)
- ✅ OTP verification for both login and signup
- ✅ Complete signup endpoint for new users
- ✅ Password column is nullable
- ✅ Long-lived refresh tokens (90 days)
- ✅ Password-based endpoints disabled
- ✅ Migration created and ready to run

---

## 🚀 Next Steps (Mobile App)

1. **Update OTP Request Screen:**
   - Call `/check-phone` first
   - Show appropriate UI based on `exists` flag

2. **Update OTP Verify Screen:**
   - Handle `requiresSignup` flag
   - If `true`, navigate to "Complete Profile" screen

3. **Create Complete Profile Screen:**
   - Collect name (required)
   - Collect email (optional)
   - Call `/complete-signup` with `tempToken`

4. **Remove Password UI:**
   - Remove password input fields
   - Remove "Forgot Password" links
   - Remove password change screens

---

## 🧪 Testing

### Test Login Flow:
1. Use existing phone number
2. Request OTP
3. Verify OTP
4. Should get `requiresSignup: false`
5. Should receive access + refresh tokens

### Test Signup Flow:
1. Use new phone number
2. Request OTP
3. Verify OTP
4. Should get `requiresSignup: true` + `tempToken`
5. Call `/complete-signup` with name
6. Should receive final tokens

---

## 📝 Notes

- Email is optional during signup
- Phone number is the primary identifier
- Users without passwords can only login via OTP
- Refresh tokens last 90 days to minimize OTP requests
- All password-related endpoints are disabled

