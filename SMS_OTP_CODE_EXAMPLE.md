# SMS OTP - Code Example

## Backend Implementation Example

### 1. Install Dependencies

```bash
npm install twilio  # or aws-sdk for AWS SNS
```

### 2. Backend Route: Request OTP

```typescript
// backend-api/src/routes/auth.ts

import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// POST /api/auth/request-otp
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number required'
      });
    }

    // Rate limiting: Check if user requested OTP recently
    const recentOTP = await pool.query(`
      SELECT created_at FROM otp_verifications 
      WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC LIMIT 1
    `, [phone]);

    if (recentOTP.rows.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database (expires in 5 minutes)
    await pool.query(`
      INSERT INTO otp_verifications (phone, otp, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
    `, [phone, otp]);

    // Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Your Expense Tracker OTP is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER, // e.g., +1234567890
      to: phone
    });

    logger.info(`OTP sent to ${phone}`);

    res.json({
      success: true,
      message: 'OTP sent to your phone number'
      // NOTE: Never send OTP in response!
    });

  } catch (error) {
    logger.error('OTP request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});
```

### 3. Backend Route: Verify OTP

```typescript
// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required'
      });
    }

    // Find valid OTP
    const otpRecord = await pool.query(`
      SELECT * FROM otp_verifications 
      WHERE phone = $1 
        AND otp = $2 
        AND expires_at > NOW()
        AND used = false
      ORDER BY created_at DESC 
      LIMIT 1
    `, [phone, otp]);

    if (otpRecord.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as used
    await pool.query(`
      UPDATE otp_verifications 
      SET used = true 
      WHERE id = $1
    `, [otpRecord.rows[0].id]);

    // Find or create user
    let user = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    if (user.rows.length === 0) {
      // Create new user with phone number
      const newUser = await pool.query(`
        INSERT INTO users (phone, first_name, last_name, is_active, created_at)
        VALUES ($1, $2, $3, true, NOW())
        RETURNING id, phone, first_name, last_name
      `, [phone, 'User', '']);
      
      user = newUser;
    }

    const userData = user.rows[0];

    // Generate JWT tokens
    const accessToken = generateAccessToken(
      userData.id,
      userData.email || phone,
      'user'
    );
    const refreshToken = generateRefreshToken(userData.id);

    logger.info(`User logged in via OTP: ${userData.id}`);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          id: userData.id,
          phone: userData.phone,
          name: `${userData.first_name} ${userData.last_name}`.trim()
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});
```

## Mobile App Implementation Example

### 1. Install Expo SMS (Optional - for reading OTP automatically)

```bash
npx expo install expo-sms
```

### 2. OTP Request Screen

```typescript
// ExpenseTrackerExpo/screens/auth/OTPRequestScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../config/api';

export default function OTPRequestScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleRequestOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Format phone number (add country code if missing)
    const formattedPhone = phone.startsWith('+') 
      ? phone 
      : `+91${phone}`; // Default to India

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to OTP verification screen
        navigation.navigate('OTPVerify', { phone: formattedPhone });
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Enter your phone number</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+91 9876543210"
        keyboardType="phone-pad"
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <TouchableOpacity 
        onPress={handleRequestOTP}
        disabled={isLoading}
      >
        <Text>{isLoading ? 'Sending...' : 'Send OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 3. OTP Verification Screen

```typescript
// ExpenseTrackerExpo/screens/auth/OTPVerifyScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OTPVerifyScreen({ route }) {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });

      const result = await response.json();

      if (result.success) {
        // Store tokens
        await AsyncStorage.setItem('authToken', result.data.accessToken);
        if (result.data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', result.data.refreshToken);
        }

        // Update user in context
        setUser(result.data.user);

        // Navigate to home
        // navigation.navigate('Home');
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        Alert.alert('Error', result.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Enter OTP sent to {phone}</Text>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <TouchableOpacity 
        onPress={handleVerifyOTP}
        disabled={isLoading}
      >
        <Text>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Environment Variables Needed

```env
# Backend .env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
```

## Database Migration

```sql
-- Create OTP table
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

-- Cleanup expired OTPs (run periodically)
DELETE FROM otp_verifications 
WHERE expires_at < NOW() - INTERVAL '1 day';
```

## Testing

For development, you can skip SMS sending:

```typescript
// In development, log OTP to console instead of sending SMS
if (process.env.NODE_ENV === 'development') {
  console.log(`[DEV] OTP for ${phone}: ${otp}`);
  // Don't actually send SMS
} else {
  await twilioClient.messages.create({...});
}
```

