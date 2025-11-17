# Security Recommendations for Expense Tracker App

## 🔴 Critical Issues (Fix Immediately)

### 1. Remove Test Token Bypass in Production
**File:** `backend-api/src/middleware/auth.ts` (lines 38-50)

**Current Code:**
```typescript
if (token.includes('test-dev-') || token.includes('expo-go-mock-') || token === 'test-token') {
  // Bypasses authentication
}
```

**Fix:**
```typescript
// Only allow test tokens in development
if (process.env.NODE_ENV === 'development' && 
    (token.includes('test-dev-') || token.includes('expo-go-mock-') || token === 'test-token')) {
  // Test token logic
} else if (token.includes('test-dev-') || token.includes('expo-go-mock-') || token === 'test-token') {
  // In production, reject test tokens
  res.status(401).json({
    success: false,
    message: 'Invalid token'
  });
  return;
}
```

### 2. Fix JWT Secret Fallback
**File:** `backend-api/src/routes/admin.ts` (line 92)

**Current Code:**
```typescript
process.env.JWT_SECRET || 'your-secret-key'
```

**Fix:**
```typescript
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured');
}
process.env.JWT_SECRET
```

### 3. Restrict CORS in Production
**File:** `backend-api/src/server.ts` (line 76)

**Current Code:**
```typescript
origin: true, // Allow all origins
```

**Fix:**
```typescript
origin: process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL, process.env.ADMIN_PANEL_URL].filter(Boolean)
  : true, // Allow all in development
```

## 🟡 Medium Priority Issues

### 4. Tighten Rate Limiting
**File:** `backend-api/src/server.ts` (line 86)

**Current:** 500 requests per 15 minutes
**Recommended:** 100-200 requests per 15 minutes in production

```typescript
max: process.env.NODE_ENV === 'production' 
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500'),
```

### 5. Add Request Size Limits
Already present (10MB), but consider reducing for specific endpoints:
- API endpoints: 1MB
- File uploads: 10MB (already set)

### 6. Remove Database Fallback Authentication
**File:** `backend-api/src/middleware/auth.ts` (lines 87-102)

**Current:** Falls back to JWT-only if DB is unavailable
**Recommended:** Fail securely instead

```typescript
} catch (dbError: any) {
  // In production, fail securely
  if (process.env.NODE_ENV === 'production') {
    logger.error('Database unavailable - rejecting authentication:', dbError.message);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable'
    });
    return;
  }
  // Only allow fallback in development
  // ... existing fallback code
}
```

## 🟢 Additional Security Enhancements

### 7. Add HTTPS Enforcement
```typescript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 8. Add Security Headers
Already using Helmet, but ensure:
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

### 9. Implement OTP Rate Limiting
Add specific rate limiting for OTP endpoints:
```typescript
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per 15 minutes
  message: 'Too many OTP requests. Please try again later.'
});

router.post('/request-otp', otpRateLimit, ...);
```

### 10. Add Input Sanitization
Consider adding `express-validator` sanitization:
```typescript
body('email').trim().normalizeEmail().isEmail()
body('phone').trim().escape()
```

### 11. Implement Token Blacklisting
For logout/revocation:
- Store revoked tokens in Redis or database
- Check blacklist during token verification

### 12. Add Audit Logging
Log all sensitive operations:
- Login attempts
- Password changes
- Admin actions
- Financial transactions

### 13. Database Security
- Use connection pooling (already implemented)
- Ensure database credentials are in environment variables
- Use SSL/TLS for database connections in production
- Regular backups with encryption

### 14. Environment Variables Security
- Never commit `.env` files
- Use Railway/Heroku environment variables
- Rotate secrets regularly
- Use different secrets for dev/staging/production

## 📋 Security Checklist

- [ ] Remove test token bypass in production
- [ ] Fix JWT secret fallback
- [ ] Restrict CORS to specific domains
- [ ] Tighten rate limiting
- [ ] Remove database fallback authentication
- [ ] Add HTTPS enforcement
- [ ] Implement OTP rate limiting
- [ ] Add input sanitization
- [ ] Implement token blacklisting
- [ ] Add audit logging
- [ ] Review all environment variables
- [ ] Enable database SSL/TLS
- [ ] Regular security audits
- [ ] Penetration testing

## 🔐 Current Security Score: 6/10

**Strengths:**
- ✅ JWT authentication
- ✅ Password hashing
- ✅ Input validation
- ✅ SQL injection protection
- ✅ Security headers (Helmet)
- ✅ Rate limiting

**Weaknesses:**
- ❌ Test token bypass
- ❌ Weak CORS policy
- ❌ Generous rate limits
- ❌ Database fallback auth
- ❌ No HTTPS enforcement
- ❌ No token blacklisting

