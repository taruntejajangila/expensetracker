# 🔄 Reminder Repeat Feature

## ✅ What EXISTS: Reminder Repeat Settings

Your app **DOES have** a repeat feature for reminders:

### **Repeat Options:**
- **`'none'`** - One-time reminder (do not repeat)
- **`'daily'`** - Repeats every day
- **`'weekly'`** - Repeats every week (same day)
- **`'monthly'`** - Repeats every month (same date)

### **Where It's Used:**

**1. Reminder Type Definition:**
```typescript
// ExpenseTrackerExpo/types/PaymentTypes.ts
export interface Reminder {
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  // ... other fields
}
```

**2. Form Default:**
```typescript
// RemindersScreen.tsx
const [formData, setFormData] = useState({
  repeat: 'none' as Reminder['repeat'],  // Default: do not repeat
  // ... other fields
});
```

**3. Notification Scheduling:**
```typescript
// RemindersScreen.tsx → scheduleNotification()
if (reminder.repeat === 'daily') {
  trigger = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: hours,
    minute: minutes,
    repeats: true,
  };
} else if (reminder.repeat === 'weekly') {
  trigger = {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: dayOfWeek + 1,
    hour: hours,
    minute: minutes,
    repeats: true,
  };
} else if (reminder.repeat === 'monthly') {
  // Monthly recurring notification
  trigger = {
    type: 'date',
    date: notificationDate,
  };
} else {
  // One-time notification (repeat === 'none')
  trigger = {
    type: 'date',
    date: notificationDate,
  };
}
```

## ❌ What DOESN'T Exist: "Do Not Show Again" for Alerts

Your app **DOES NOT have** a "do not show again" or "don't show this alert again" feature for:
- Success/error alerts
- Confirmation dialogs
- Warning messages

### **Current Alert Usage:**
All alerts in your app are simple one-time alerts:
```typescript
Alert.alert('Success', 'Reminder marked as paid successfully.');
Alert.alert('Error', 'Failed to save reminder. Please try again.');
```

**No "remember my choice" or "don't show again" checkbox exists.**

## 💡 If You Want to Add "Do Not Show Again" Feature

If you want to add a "do not show again" feature for alerts/dialogs, you would need to:

### **1. Create a Custom Alert Component:**
```typescript
// components/DismissibleAlert.tsx
const DismissibleAlert = ({ 
  title, 
  message, 
  storageKey, 
  onConfirm 
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const handleConfirm = async () => {
    if (dontShowAgain) {
      await AsyncStorage.setItem(storageKey, 'true');
    }
    onConfirm();
  };
  
  return (
    <Modal>
      <Text>{title}</Text>
      <Text>{message}</Text>
      <Checkbox 
        value={dontShowAgain}
        onValueChange={setDontShowAgain}
        label="Don't show this again"
      />
      <Button onPress={handleConfirm}>OK</Button>
    </Modal>
  );
};
```

### **2. Check Before Showing:**
```typescript
const showDismissibleAlert = async (storageKey: string) => {
  const dontShow = await AsyncStorage.getItem(storageKey);
  if (dontShow === 'true') {
    return; // Don't show
  }
  // Show alert with "don't show again" option
};
```

## 📋 Summary

| Feature | Status | Location |
|---------|--------|----------|
| **Reminder Repeat** | ✅ EXISTS | `repeat: 'none' \| 'daily' \| 'weekly' \| 'monthly'` |
| **Do Not Repeat Reminder** | ✅ EXISTS | `repeat: 'none'` (default) |
| **Don't Show Alert Again** | ❌ NOT EXISTS | Would need to be implemented |

## 🎯 Current Reminder Repeat Behavior

1. **Default:** `'none'` (do not repeat) - one-time reminder
2. **Daily:** Repeats every day at the same time
3. **Weekly:** Repeats every week on the same day
4. **Monthly:** Repeats every month on the same date

When a reminder is set to `'none'`, it will:
- Show notification once on the due date
- Not repeat automatically
- Can be manually recreated if needed

