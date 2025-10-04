// Test script to verify notification navigation works
// This simulates what happens when a notification is received

const testNotificationData = {
  notification: {
    request: {
      content: {
        title: "🚀 Test Custom Notification",
        body: "This is a test notification with custom content",
        data: {
          type: 'custom',
          customNotificationId: 'test-notification-' + Date.now(),
          notificationType: 'update',
          // Add some additional data that might be present
          from: 'admin_panel',
          test: true
        }
      }
    }
  }
};

console.log('🧪 Test Notification Data:');
console.log(JSON.stringify(testNotificationData, null, 2));

console.log('\n📱 Expected Behavior:');
console.log('1. Custom notification should be detected');
console.log('2. Navigation should occur to NotificationDetail screen');
console.log('3. Detail screen should show test content');

console.log('\n🔍 Debug Information:');
console.log('- Notification type:', testNotificationData.notification.request.content.data.type);
console.log('- Custom notification ID:', testNotificationData.notification.request.content.data.customNotificationId);
console.log('- Notification type:', testNotificationData.notification.request.content.data.notificationType);

console.log('\n✅ If you see this in the mobile app logs, the test data is correct!');
