// Demo data for testing custom notifications
// Run this script to populate test notifications

const demoNotifications = [
  {
    title: "🎉 Major App Update - Version 2.0 Released!",
    body: "Exciting new features await! Tap to discover what's new in version 2.0",
    type: "custom",
    customContent: {
      id: "update-v2-0-2024",
      type: "update",
      content: `# 🎉 Welcome to Expense Tracker 2.0!

We're thrilled to announce the release of our biggest update yet! Version 2.0 brings revolutionary features that will transform how you manage your finances.

## 🚀 New Features

### Smart Budgeting
- **AI-Powered Insights**: Get personalized spending recommendations
- **Predictive Budgeting**: Forecast your monthly expenses with 95% accuracy
- **Goal Tracking**: Set and achieve financial goals with visual progress indicators

### Enhanced Analytics
- **Interactive Charts**: Beautiful, interactive spending visualizations
- **Trend Analysis**: Spot spending patterns and optimize your budget
- **Export Reports**: Generate detailed PDF reports for tax season

### Security Upgrades
- **Biometric Login**: Secure your data with fingerprint and face recognition
- **End-to-End Encryption**: Bank-level security for all your financial data
- **Privacy Dashboard**: Control exactly what data is shared and how

## 🔧 Performance Improvements
- 3x faster app loading times
- Offline mode for viewing transactions
- Reduced battery usage by 40%
- Improved sync reliability

## 🎯 How to Update
Simply visit your app store and tap "Update". The update is completely free and includes all these amazing features.

## 💡 Pro Tips
1. Enable notifications for budget alerts
2. Set up your first AI budget recommendation
3. Explore the new analytics dashboard
4. Try the biometric login for enhanced security

Thank you for being part of our community! We can't wait to see how these new features help you achieve your financial goals.

Best regards,
The Expense Tracker Team`,
      author: "Expense Tracker Team",
      actionButton: {
        text: "Update Now",
        action: "open_app_store"
      },
      tags: ["update", "features", "v2.0", "major-release"]
    }
  },
  {
    title: "💡 5 Budgeting Tips That Changed Everything",
    body: "Discover the secrets to successful budgeting from our finance experts",
    type: "custom",
    customContent: {
      id: "budgeting-tips-2024",
      type: "blog_post",
      content: `# 💡 5 Budgeting Tips That Changed Everything

*By Sarah Johnson, Certified Financial Planner*

After helping thousands of users take control of their finances, I've discovered the most effective budgeting strategies that actually work. Here are the 5 game-changing tips that transformed my clients' financial lives.

## 1. The 50/30/20 Rule - Your Financial Foundation

**What it is**: Allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment.

**Why it works**: It provides a simple framework that covers all your financial bases without being overly restrictive.

**Implementation**:
- Calculate your monthly take-home pay
- Multiply by 0.5 for needs (rent, groceries, utilities)
- Multiply by 0.3 for wants (entertainment, dining out)
- Multiply by 0.2 for savings and debt

## 2. Zero-Based Budgeting - Every Dollar Has a Purpose

**What it is**: Every dollar of income is assigned a specific purpose before the month begins.

**Why it works**: Eliminates "miscellaneous" spending and ensures intentional money management.

**How to start**:
- List all your income sources
- List all your expenses (including savings goals)
- Adjust until income minus expenses equals zero

## 3. The Envelope System for Digital Age

**What it is**: Allocate specific amounts to spending categories and stick to those limits.

**Why it works**: Creates psychological spending barriers and prevents overspending.

**Modern approach**:
- Use separate bank accounts or prepaid cards
- Set up automatic transfers for each category
- Track spending with our app's category limits

## 4. Weekly Money Meetings

**What it is**: A 15-minute weekly review of your finances with yourself or your partner.

**Why it works**: Regular check-ins prevent small problems from becoming big ones.

**Meeting agenda**:
- Review last week's spending
- Adjust this week's budget if needed
- Celebrate wins and learn from overspending

## 5. The 24-Hour Rule for Non-Essential Purchases

**What it is**: Wait 24 hours before making any non-essential purchase over $50.

**Why it works**: Eliminates impulse buying and ensures thoughtful spending decisions.

**Implementation**:
- Add items to a "wish list" instead of buying immediately
- Sleep on major purchases
- Use this time to research better deals

## 🎯 Putting It All Together

Start with one tip and gradually incorporate others. Remember, the best budgeting system is the one you'll actually use consistently.

## 📱 How Our App Helps

Our Expense Tracker app supports all these strategies:
- Category-based budgeting with the 50/30/20 template
- Weekly spending reports for your money meetings
- Purchase tracking with the 24-hour rule reminders
- Visual progress indicators for your financial goals

## 💬 Your Turn

Which of these tips resonates with you? Share your budgeting success stories in the comments below!

*Sarah Johnson is a Certified Financial Planner with 15 years of experience helping families achieve financial freedom. Follow her on social media for daily financial tips.*`,
      author: "Sarah Johnson, CFP",
      actionButton: {
        text: "Read More Tips",
        url: "https://expensetracker.com/blog/budgeting-tips"
      },
      tags: ["budgeting", "tips", "financial-planning", "money-management"]
    }
  },
  {
    title: "⚠️ Important: New Privacy Policy Update",
    body: "We've updated our privacy policy. Please review the changes that affect your data",
    type: "custom",
    customContent: {
      id: "privacy-policy-update-2024",
      type: "announcement",
      content: `# ⚠️ Important Privacy Policy Update

**Effective Date**: January 15, 2024

Dear Valued User,

We're writing to inform you about important updates to our Privacy Policy that will take effect on January 15, 2024. Your privacy and trust are our top priorities, and we want to ensure you're fully informed about how we handle your data.

## 🔍 What's Changed

### Enhanced Data Protection
- **Stricter Data Retention**: We now automatically delete inactive account data after 3 years
- **Improved Encryption**: Upgraded to AES-256 encryption for all stored financial data
- **Third-Party Audits**: Annual security audits by independent cybersecurity firms

### New Privacy Controls
- **Data Export**: Request a complete copy of your data in machine-readable format
- **Selective Deletion**: Choose which specific data categories to delete
- **Privacy Dashboard**: New in-app privacy controls for granular data management

### Transparency Improvements
- **Clearer Language**: Simplified privacy policy language for better understanding
- **Regular Updates**: Quarterly privacy reports showing how your data is used
- **User Rights**: Expanded section on your rights regarding your personal data

## 📊 How This Affects You

### What Stays the Same
- We still never sell your personal information to third parties
- Your financial data remains encrypted and secure
- You maintain full control over your account and data

### New Features You'll Get
- Enhanced privacy dashboard in the app
- Automated data retention management
- Improved security notifications

## 🛡️ Your Rights

Under the updated policy, you have the right to:
1. **Access**: View all data we have about you
2. **Correction**: Request corrections to inaccurate information
3. **Deletion**: Request deletion of your personal data
4. **Portability**: Export your data in a common format
5. **Objection**: Opt out of certain data processing activities

## 📱 How to Review the Changes

1. Open the Expense Tracker app
2. Go to Settings → Privacy & Security
3. Tap "Review Privacy Policy"
4. Read the updated policy
5. Accept the changes to continue using the app

## ❓ Questions?

If you have any questions about these changes:
- Email us at privacy@expensetracker.com
- Use the in-app support chat
- Call our privacy hotline: 1-800-PRIVACY

## 🚨 Action Required

**You must accept the updated Privacy Policy by January 31, 2024, to continue using the app.**

## 🤝 Our Commitment

We remain committed to protecting your privacy and being transparent about our data practices. These updates strengthen our privacy protections while giving you more control over your personal information.

Thank you for trusting us with your financial data.

Best regards,
The Expense Tracker Privacy Team`,
      author: "Privacy Team",
      actionButton: {
        text: "Review Policy",
        url: "https://expensetracker.com/privacy-policy"
      },
      tags: ["privacy", "policy", "update", "important"]
    }
  },
  {
    title: "🎁 Limited Time: 50% Off Premium Features!",
    body: "Unlock advanced budgeting tools and analytics. Offer expires in 48 hours!",
    type: "custom",
    customContent: {
      id: "premium-offer-2024",
      type: "promotion",
      content: `# 🎁 Special Offer: 50% Off Premium Features!

**Limited Time Only - Expires in 48 Hours!**

Transform your financial management with our premium features at an unbeatable price!

## 💎 What You Get with Premium

### Advanced Analytics
- **Custom Reports**: Generate detailed spending reports for any time period
- **Trend Analysis**: Identify spending patterns and opportunities for savings
- **Goal Tracking**: Set unlimited financial goals with progress tracking
- **Export Options**: Download data as PDF, Excel, or CSV files

### Smart Budgeting
- **AI Budget Recommendations**: Personalized budget suggestions based on your spending
- **Predictive Alerts**: Get notified before you exceed your budget
- **Category Insights**: Deep dive into your spending by category
- **Seasonal Adjustments**: Automatically adjust budgets for holidays and seasons

### Enhanced Security
- **Biometric Login**: Secure access with fingerprint or face recognition
- **Advanced Encryption**: Bank-level security for all your data
- **Privacy Dashboard**: Complete control over your data and privacy settings
- **Priority Support**: Get help from our premium support team

### Exclusive Features
- **Unlimited Categories**: Create as many expense categories as you need
- **Custom Tags**: Organize transactions with personalized tags
- **Backup & Sync**: Automatic cloud backup across all your devices
- **Ad-Free Experience**: Enjoy the app without any advertisements

## 💰 Pricing Comparison

| Feature | Free | Premium (Regular) | Premium (This Offer) |
|---------|------|-------------------|---------------------|
| Basic Budgeting | ✅ | ✅ | ✅ |
| Transaction Tracking | ✅ | ✅ | ✅ |
| Basic Reports | ✅ | ✅ | ✅ |
| Advanced Analytics | ❌ | ✅ | ✅ |
| AI Recommendations | ❌ | ✅ | ✅ |
| Unlimited Categories | ❌ | ✅ | ✅ |
| Export Options | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| **Monthly Cost** | **$0** | **$9.99** | **$4.99** |

## 🎯 How to Claim This Offer

1. **Tap the "Upgrade Now" button below**
2. **Select your preferred billing cycle** (monthly or annual)
3. **Enter code**: SAVE50PREMIUM
4. **Enjoy 50% off for life!**

## ⏰ Why Act Now?

- **Limited Time**: This offer expires in 48 hours
- **Lifetime Discount**: 50% off as long as you remain subscribed
- **No Commitment**: Cancel anytime with no penalties
- **Instant Access**: Premium features activate immediately

## 📊 Success Stories

*"Premium features helped me save $500 in my first month by identifying unnecessary subscriptions I forgot about!"* - Jennifer M.

*"The AI budget recommendations are spot-on. I've never been better at managing my money."* - Michael R.

*"Exporting my data for tax season was so easy. Worth every penny!"* - Sarah L.

## 🔒 Money-Back Guarantee

Not satisfied? Get a full refund within 30 days, no questions asked.

## 🚀 Ready to Transform Your Finances?

Don't miss out on this incredible offer. Upgrade now and start your journey to financial freedom!

**Remember**: This offer expires in 48 hours and cannot be combined with other promotions.

Questions? Contact our support team - we're here to help!

Happy Saving! 💰
The Expense Tracker Team`,
      author: "Marketing Team",
      actionButton: {
        text: "Upgrade Now",
        url: "https://expensetracker.com/premium?offer=save50"
      },
      tags: ["promotion", "premium", "discount", "limited-time"]
    }
  },
  {
    title: "🔧 Scheduled Maintenance - App Unavailable",
    body: "We're performing important updates. The app will be temporarily unavailable tonight",
    type: "custom",
    customContent: {
      id: "maintenance-notice-2024",
      type: "announcement",
      content: `# 🔧 Scheduled Maintenance Notice

**Maintenance Window**: Tonight, 11:00 PM - 2:00 AM EST

We're performing important system updates to improve your experience. During this time, the Expense Tracker app will be temporarily unavailable.

## 📅 What's Happening

### System Upgrades
- **Database Optimization**: Improving data processing speed by 40%
- **Security Updates**: Installing latest security patches
- **Server Maintenance**: Upgrading our infrastructure for better reliability

### New Features Being Deployed
- **Enhanced Sync**: Faster synchronization across devices
- **Improved Notifications**: Better push notification delivery
- **Bug Fixes**: Resolving reported issues with budget calculations

## ⏰ Timeline

- **11:00 PM EST**: App becomes unavailable
- **11:30 PM EST**: Maintenance begins
- **1:30 AM EST**: Testing and verification
- **2:00 AM EST**: App fully restored

## 📱 What You Can Expect

### Before Maintenance
- Save any unsaved transactions
- The app will remain fully functional until 11:00 PM

### During Maintenance
- App will show maintenance message
- No data will be lost
- All your information is safely backed up

### After Maintenance
- All features restored
- Improved performance
- New features available immediately

## 🛡️ Data Safety

Your financial data is completely safe during this maintenance:
- All data is encrypted and backed up
- No data will be lost or compromised
- We follow industry best practices for system updates

## 📞 Support

If you experience any issues after the maintenance window:
- Check our status page: status.expensetracker.com
- Contact support: support@expensetracker.com
- Use the in-app help center

## 🙏 Thank You

We apologize for any inconvenience and appreciate your patience as we work to improve your experience.

The maintenance is necessary to ensure the app continues to run smoothly and securely for all our users.

## 🔔 Stay Updated

Follow us on social media for real-time updates during the maintenance window:
- Twitter: @ExpenseTracker
- Facebook: ExpenseTrackerApp
- Instagram: @expensetracker

Thank you for your understanding!

Best regards,
The Expense Tracker Technical Team`,
      author: "Technical Team",
      actionButton: {
        text: "Check Status",
        url: "https://status.expensetracker.com"
      },
      tags: ["maintenance", "update", "scheduled", "system"]
    }
  }
];

// Simple notifications for comparison
const simpleNotifications = [
  {
    title: "💡 Budget Alert",
    body: "You've spent 80% of your dining budget for this month",
    type: "simple"
  },
  {
    title: "✅ Transaction Added",
    body: "Your coffee purchase of $4.50 has been recorded",
    type: "simple"
  },
  {
    title: "🎯 Goal Update",
    body: "You're 75% towards your savings goal! Keep it up!",
    type: "simple"
  }
];

// Function to send a test notification
async function sendTestNotification(notification, targetUser = null) {
  try {
    const payload = {
      title: notification.title,
      body: notification.body,
      targetAll: !targetUser,
      ...(targetUser ? { userEmails: [targetUser] } : {}),
      ...(notification.type === 'custom' ? {
        type: 'custom',
        customContent: notification.customContent
      } : {
        type: 'simple'
      }),
      data: {
        type: 'admin_notification',
        from: 'admin_panel',
        test: true
      }
    };

    const response = await fetch('http://localhost:5000/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Replace with actual admin token
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Sent notification: "${notification.title}"`);
      console.log(`   Target: ${targetUser || 'All users'}`);
      console.log(`   Type: ${notification.type}`);
      if (notification.type === 'custom') {
        console.log(`   Content Type: ${notification.customContent.type}`);
      }
    } else {
      console.error(`❌ Failed to send notification: "${notification.title}"`);
      console.error(`   Error: ${result.message}`);
    }
  } catch (error) {
    console.error(`❌ Error sending notification: "${notification.title}"`);
    console.error(`   ${error.message}`);
  }
}

// Function to send all demo notifications
async function sendAllDemoNotifications() {
  console.log('🚀 Sending demo notifications...\n');
  
  // Send custom notifications
  console.log('📱 Custom Notifications:');
  for (const notification of demoNotifications) {
    await sendTestNotification(notification);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between notifications
  }
  
  console.log('\n🔔 Simple Notifications:');
  for (const notification of simpleNotifications) {
    await sendTestNotification(notification);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✨ All demo notifications sent!');
}

// Function to send to specific user
async function sendToUser(email) {
  console.log(`🎯 Sending notifications to user: ${email}\n`);
  
  // Send one of each type to the specific user
  await sendTestNotification(demoNotifications[0], email); // App update
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await sendTestNotification(simpleNotifications[0], email); // Budget alert
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Export functions for use
module.exports = {
  demoNotifications,
  simpleNotifications,
  sendTestNotification,
  sendAllDemoNotifications,
  sendToUser
};

// If running directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'all') {
    sendAllDemoNotifications();
  } else if (args[0] === 'user' && args[1]) {
    sendToUser(args[1]);
  } else {
    console.log('📋 Demo Notification Data');
    console.log('========================\n');
    console.log('Available commands:');
    console.log('  node test-custom-notifications.js all          - Send all demo notifications');
    console.log('  node test-custom-notifications.js user <email> - Send notifications to specific user');
    console.log('\nDemo notifications available:');
    console.log(`  ${demoNotifications.length} custom notifications (with detail screens)`);
    console.log(`  ${simpleNotifications.length} simple notifications`);
    console.log('\nCustom notification types:');
    demoNotifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.customContent.type} - "${notif.title}"`);
    });
  }
}
