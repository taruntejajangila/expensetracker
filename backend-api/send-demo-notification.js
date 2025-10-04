// Quick script to send demo notifications
// Usage: node send-demo-notification.js [type] [target]

const { demoNotifications, simpleNotifications } = require('./test-custom-notifications.js');

// Quick demo notifications for testing
const quickDemos = {
  // App Update - Most comprehensive
  update: {
    title: "🚀 App Update Available - Version 2.1",
    body: "New features and improvements! Tap to see what's new",
    type: "custom",
    customContent: {
      id: "update-v2-1-demo",
      type: "update",
      content: `# 🚀 Expense Tracker Version 2.1 Update

## New Features:
- **Smart Categorization**: AI automatically categorizes your transactions
- **Bill Reminders**: Never miss a payment again with smart reminders
- **Spending Insights**: Get personalized tips to save more money
- **Dark Mode**: Beautiful dark theme for comfortable viewing

## Improvements:
- 50% faster app loading
- Better sync reliability
- Enhanced security features
- Bug fixes and performance improvements

## How to Update:
1. Visit your app store
2. Tap "Update" on Expense Tracker
3. Enjoy the new features!

Thank you for using Expense Tracker!`,
      author: "Expense Tracker Team",
      actionButton: {
        text: "Update Now",
        action: "open_app_store"
      },
      tags: ["update", "features", "improvements"]
    }
  },

  // Blog Post - Educational content
  blog: {
    title: "💡 3 Simple Ways to Save $100 This Month",
    body: "Discover easy money-saving tips from our finance experts",
    type: "custom",
    customContent: {
      id: "money-saving-tips-demo",
      type: "blog_post",
      content: `# 💡 3 Simple Ways to Save $100 This Month

*By our Finance Experts*

Saving money doesn't have to be complicated. Here are three simple strategies that can help you save $100 or more this month:

## 1. Cancel Unused Subscriptions 💳
**Potential Savings: $30-50/month**

Most people have subscriptions they forgot about:
- Check your bank statements for recurring charges
- Cancel unused streaming services, apps, or memberships
- Use our app's subscription tracker to monitor all recurring payments

## 2. Cook at Home More Often 🍳
**Potential Savings: $40-60/month**

Dining out adds up quickly:
- Plan your meals for the week
- Cook in batches and freeze leftovers
- Pack lunch instead of buying it
- Even cooking 2 extra meals per week can save $50+

## 3. Use the 24-Hour Rule 🛍️
**Potential Savings: $30-50/month**

Wait 24 hours before making non-essential purchases:
- Add items to a wishlist instead of buying immediately
- Sleep on major purchases
- Often, you'll realize you don't actually need the item

## 💰 Quick Start Challenge
Try all three strategies this month and track your savings in our app!

*Track your progress with our "Savings Goals" feature*`,
      author: "Finance Team",
      actionButton: {
        text: "Set Savings Goal",
        url: "https://expensetracker.com/savings-tips"
      },
      tags: ["savings", "tips", "money-management"]
    }
  },

  // Promotion - Special offer
  promotion: {
    title: "🎁 Special Offer: Premium Features 50% Off!",
    body: "Limited time offer - unlock advanced budgeting tools",
    type: "custom",
    customContent: {
      id: "premium-offer-demo",
      type: "promotion",
      content: `# 🎁 Premium Features - 50% Off!

**Limited Time Offer - Expires Soon!**

## What You Get:
- Advanced analytics and reports
- AI-powered budget recommendations
- Unlimited categories and tags
- Priority customer support
- Ad-free experience

## Regular Price: $9.99/month
## Your Price: $4.99/month (50% off!)

## How to Claim:
1. Tap "Upgrade Now" below
2. Use code: SAVE50
3. Enjoy premium features immediately

**Offer expires in 48 hours - don't miss out!**

*Questions? Contact our support team.*`,
      author: "Marketing Team",
      actionButton: {
        text: "Upgrade Now",
        url: "https://expensetracker.com/premium"
      },
      tags: ["premium", "offer", "discount"]
    }
  },

  // Simple notification for comparison
  simple: {
    title: "💡 Budget Alert",
    body: "You've spent 75% of your monthly dining budget",
    type: "simple"
  }
};

async function sendNotification(notification, targetUser = null) {
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

    console.log(`📤 Sending: "${notification.title}"`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Target: ${targetUser || 'All users'}`);
    
    if (notification.type === 'custom') {
      console.log(`   Content Type: ${notification.customContent.type}`);
    }

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
      console.log(`✅ Success! Notification sent.`);
    } else {
      console.error(`❌ Failed: ${result.message}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'update';
  const targetUser = args[1] || null;

  console.log('🚀 Demo Notification Sender\n');

  if (!quickDemos[type]) {
    console.log('Available notification types:');
    Object.keys(quickDemos).forEach(key => {
      const demo = quickDemos[key];
      console.log(`  ${key}: "${demo.title}"`);
    });
    return;
  }

  const notification = quickDemos[type];
  await sendNotification(notification, targetUser);
  
  console.log('\n✨ Demo notification sent!');
  console.log('\nTo test on mobile:');
  console.log('1. Make sure your mobile app is running');
  console.log('2. Check for the push notification');
  console.log('3. Tap the notification to see the detail screen');
}

if (require.main === module) {
  main();
}

module.exports = { quickDemos, sendNotification };
