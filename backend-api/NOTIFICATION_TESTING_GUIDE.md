# 🔔 Custom Notification Testing Guide

This guide provides comprehensive demo data and testing scenarios for the custom notification system.

## 📋 Quick Start

### 1. Send a Single Demo Notification
```bash
# Send an app update notification
node send-demo-notification.js update

# Send a blog post notification  
node send-demo-notification.js blog

# Send a promotion notification
node send-demo-notification.js promotion

# Send a simple notification (for comparison)
node send-demo-notification.js simple
```

### 2. Send to Specific User
```bash
# Send to a specific user by email
node send-demo-notification.js update user@example.com
node send-demo-notification.js blog user@example.com
```

### 3. Send All Demo Notifications
```bash
# Send all demo notifications at once
node test-custom-notifications.js all

# Send to specific user
node test-custom-notifications.js user user@example.com
```

## 🎯 Demo Notification Types

### 📱 App Update Notification
- **Type**: Custom (Update)
- **Features**: Full feature list, action button, tags
- **Use Case**: Major app releases, feature announcements
- **Action Button**: "Update Now" → Opens app store

### 📝 Blog Post Notification  
- **Type**: Custom (Blog Post)
- **Features**: Educational content, author attribution, tags
- **Use Case**: Tips, tutorials, financial advice
- **Action Button**: "Read More Tips" → External URL

### 🎁 Promotion Notification
- **Type**: Custom (Promotion)
- **Features**: Special offers, pricing, urgency
- **Use Case**: Premium upgrades, limited-time offers
- **Action Button**: "Upgrade Now" → Premium page

### ⚠️ Important Announcement
- **Type**: Custom (Announcement)
- **Features**: Policy updates, maintenance notices
- **Use Case**: Privacy policy changes, system maintenance
- **Action Button**: "Review Policy" → Policy page

### 🔔 Simple Notification
- **Type**: Simple
- **Features**: Basic title and message
- **Use Case**: Budget alerts, transaction confirmations
- **Action**: Direct app navigation

## 🧪 Testing Scenarios

### Scenario 1: App Update Flow
```bash
# 1. Send app update notification
node send-demo-notification.js update

# Expected behavior:
# - User receives push notification
# - Taps notification
# - Opens NotificationDetailScreen
# - Sees full update content with features
# - Can tap "Update Now" button
```

### Scenario 2: Educational Content
```bash
# 1. Send blog post notification
node send-demo-notification.js blog

# Expected behavior:
# - User receives notification about money-saving tips
# - Taps to read full content
# - Sees formatted article with author
# - Can tap "Set Savings Goal" button
```

### Scenario 3: Promotional Campaign
```bash
# 1. Send promotion notification
node send-demo-notification.js promotion

# Expected behavior:
# - User receives limited-time offer notification
# - Taps to see full promotion details
# - Sees pricing comparison and benefits
# - Can tap "Upgrade Now" button
```

### Scenario 4: Targeted Messaging
```bash
# 1. Send to specific user
node send-demo-notification.js update user@example.com

# Expected behavior:
# - Only specified user receives notification
# - Other users are not affected
# - Notification appears as custom content
```

## 📊 Testing Checklist

### ✅ Backend Testing
- [ ] Notifications are sent successfully
- [ ] Custom content is stored properly
- [ ] User targeting works correctly
- [ ] Error handling works for invalid requests

### ✅ Mobile App Testing
- [ ] Push notifications are received
- [ ] Notification tap opens detail screen
- [ ] Content is displayed correctly
- [ ] Action buttons work as expected
- [ ] Back navigation works
- [ ] Loading states are handled
- [ ] Error states are handled

### ✅ Admin Panel Testing
- [ ] Custom notification form works
- [ ] All content types can be created
- [ ] Preview functionality works
- [ ] User selection works
- [ ] Form validation works
- [ ] Success/error messages display

## 🎨 Content Examples

### App Update Content
```markdown
# 🚀 App Update Available - Version 2.1

## New Features:
- Smart Categorization
- Bill Reminders  
- Spending Insights
- Dark Mode

## How to Update:
1. Visit your app store
2. Tap "Update"
3. Enjoy new features!
```

### Blog Post Content
```markdown
# 💡 3 Ways to Save $100 This Month

## 1. Cancel Unused Subscriptions
Most people have forgotten subscriptions...

## 2. Cook at Home More
Dining out adds up quickly...

## 3. Use the 24-Hour Rule
Wait before making purchases...
```

### Promotion Content
```markdown
# 🎁 Premium Features - 50% Off!

## What You Get:
- Advanced analytics
- AI recommendations
- Unlimited categories
- Priority support

## Regular: $9.99/month
## Your Price: $4.99/month
```

## 🔧 Troubleshooting

### Common Issues

**1. Notification not received**
- Check push notification permissions
- Verify device token is registered
- Check backend logs for errors

**2. Detail screen not opening**
- Verify notification data includes custom content
- Check mobile app navigation setup
- Ensure NotificationDetailScreen is registered

**3. Action button not working**
- Check button configuration
- Verify URL/action is valid
- Test in different scenarios

**4. Content not displaying**
- Check content formatting
- Verify all required fields are present
- Check for special characters

### Debug Commands
```bash
# Check notification tokens
curl -H "Authorization: Bearer test-token" http://localhost:5000/api/admin/users

# Test notification endpoint
curl -X POST http://localhost:5000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"title":"Test","body":"Test message","type":"simple","targetAll":true}'
```

## 📈 Performance Testing

### Load Testing
```bash
# Send multiple notifications quickly
for i in {1..10}; do
  node send-demo-notification.js update &
done
```

### Content Size Testing
- Test with very long content
- Test with special characters
- Test with empty fields
- Test with maximum field lengths

## 🎯 Best Practices

### Content Guidelines
- Keep titles under 50 characters
- Preview messages under 100 characters
- Use clear, actionable language
- Include relevant emojis
- Test on different screen sizes

### Technical Guidelines
- Always include fallback content
- Handle network errors gracefully
- Provide loading states
- Validate all user input
- Log important events

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review backend logs
3. Test with simple notifications first
4. Verify mobile app permissions
5. Contact the development team

---

**Happy Testing! 🚀**
