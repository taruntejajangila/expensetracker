const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://192.168.29.14:5000/api';
const ADMIN_EMAIL = 'admin@example.com'; // Replace with actual admin email
const ADMIN_PASSWORD = 'admin123'; // Replace with actual admin password

// Custom notification data
const customNotification = {
  title: "🎉 New Feature Update Available!",
  body: "Check out the latest features in our expense tracker app. Click here to see more details.",
  targetAll: true, // Send to all users
  type: "custom",
  customContent: {
    id: `custom-${Date.now()}`,
    type: "announcement",
    title: "🎉 New Feature Update Available!",
    content: `# 🎉 Exciting New Features!

We're thrilled to announce several new features in our latest app update:

## ✨ What's New

### 1. **Enhanced Budget Tracking**
- Set monthly budgets for different categories
- Visual progress indicators
- Smart alerts when approaching limits
- Budget vs actual spending comparisons

### 2. **Improved Analytics Dashboard**
- Weekly and monthly spending trends
- Category-wise expense breakdowns
- Interactive charts and graphs
- Export data to CSV format

### 3. **Smart Notifications**
- Customizable reminder settings
- Bill payment alerts
- Spending threshold notifications
- Weekly spending summaries

### 4. **Better User Experience**
- Dark mode support
- Improved navigation
- Faster app performance
- Enhanced security features

## 🔧 Bug Fixes
- Fixed transaction synchronization issues
- Resolved login problems on some devices
- Improved offline functionality
- Enhanced data backup reliability

## 📱 How to Update
Simply visit your app store and tap "Update" to get the latest version. The update is free and includes all these improvements.

## 💡 Pro Tips
- Enable notifications to get the most out of the new features
- Set up your budgets early in the month for better tracking
- Use the new analytics to identify spending patterns

Thank you for using our app! We're committed to continuously improving your experience.

Best regards,
The Expense Tracker Team`,
    publishedAt: new Date().toISOString(),
    author: "Expense Tracker Team",
    actionButton: {
      text: "Learn More",
      url: "https://www.google.com",
      action: "open_url"
    },
    tags: ["update", "features", "announcement"]
  },
  data: {
    type: "custom",
    from: "admin_panel",
    notificationType: "announcement",
    customNotificationId: `custom-${Date.now()}`
  }
};

async function sendCustomNotification() {
  try {
    console.log('🚀 Starting custom notification send process...');
    
    // Step 1: Login to get admin token
    console.log('🔐 Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    const authToken = loginData.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Send custom notification
    console.log('📤 Sending custom notification...');
    console.log('📋 Notification details:', {
      title: customNotification.title,
      body: customNotification.body,
      type: customNotification.type,
      customContentId: customNotification.customContent.id
    });

    const notificationResponse = await fetch(`${API_BASE_URL}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(customNotification)
    });

    if (!notificationResponse.ok) {
      const errorText = await notificationResponse.text();
      throw new Error(`Notification send failed: ${notificationResponse.status} ${notificationResponse.statusText} - ${errorText}`);
    }

    const notificationData = await notificationResponse.json();
    if (!notificationData.success) {
      throw new Error(`Notification send failed: ${notificationData.message}`);
    }

    console.log('✅ Custom notification sent successfully!');
    console.log('📊 Response:', notificationData);
    console.log('🎯 Custom notification ID:', customNotification.customContent.id);
    console.log('📱 Users should receive the notification on their devices');

  } catch (error) {
    console.error('❌ Error sending custom notification:', error.message);
    process.exit(1);
  }
}

// Run the script
sendCustomNotification();
