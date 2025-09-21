import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler for daily reminders
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface DailyReminderConfig {
  isEnabled: boolean;
  eveningTime: string; // Format: "20:00" (8 PM)
  morningTime: string; // Format: "09:00" (9 AM)
  lastNotificationDate: string | null;
  lastTransactionDate: string | null;
  salaryReminderEnabled: boolean;
  lastSalaryReminderDate: string | null;
}

class DailyReminderService {
  private static instance: DailyReminderService;
  private config: DailyReminderConfig = {
    isEnabled: true,
    eveningTime: "20:00", // 8:00 PM
    morningTime: "09:00", // 9 AM
    lastNotificationDate: null,
    lastTransactionDate: null,
    salaryReminderEnabled: true,
    lastSalaryReminderDate: null,
  };

  private constructor() {}

  public static getInstance(): DailyReminderService {
    if (!DailyReminderService.instance) {
      DailyReminderService.instance = new DailyReminderService();
    }
    return DailyReminderService.instance;
  }

  /**
   * Initialize daily reminders - call this when app starts
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.requestPermissions();
      await this.scheduleDailyReminders();
      console.log('🔔 Daily reminders initialized with times:', {
        evening: this.config.eveningTime,
        morning: this.config.morningTime
      });
    } catch (error) {
      console.error('Error initializing daily reminders:', error);
    }
  }

  /**
   * Force reinitialize daily reminders (useful for testing time changes)
   */
  async reinitialize(): Promise<void> {
    try {
      console.log('🔄 Reinitializing daily reminders...');
      await this.cancelExistingReminders();
      await this.scheduleDailyReminders();
      console.log('✅ Daily reminders reinitialized with times:', {
        evening: this.config.eveningTime,
        morning: this.config.morningTime
      });
    } catch (error) {
      console.error('Error reinitializing daily reminders:', error);
    }
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('daily_reminder_config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading daily reminder config:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('daily_reminder_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving daily reminder config:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<void> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permission not granted for daily reminders');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }

  /**
   * Schedule daily reminders
   */
  async scheduleDailyReminders(): Promise<void> {
    if (!this.config.isEnabled) return;

    try {
      // Cancel existing daily reminders
      await this.cancelExistingReminders();

      // Always schedule evening reminder (8 PM)
      await this.scheduleEveningReminder();

      // Only schedule morning reminder if user missed logging yesterday
      const shouldSendMorningReminder = await this.shouldSendMorningReminder();
      if (shouldSendMorningReminder) {
        console.log('📅 User missed logging yesterday, scheduling morning reminder');
        await this.scheduleMorningReminder();
      } else {
        console.log('✅ User logged expenses yesterday, skipping morning reminder');
      }

      // Schedule monthly salary reminder if enabled
      if (this.config.salaryReminderEnabled) {
        await this.scheduleMonthlySalaryReminder();
      }

    } catch (error) {
      console.error('Error scheduling daily reminders:', error);
    }
  }

  /**
   * Schedule evening reminder at configured time
   */
  private async scheduleEveningReminder(): Promise<void> {
    try {
      const [hours, minutes] = this.config.eveningTime.split(':').map(Number);
      
      console.log(`🕘 Scheduling evening reminder for ${hours}:${minutes.toString().padStart(2, '0')}`);
      
      // Create trigger for daily at specified time
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
        repeats: true, // Repeat daily
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 Reminder: Log Today's Expenses",
          body: "Tap here to add what you spent today.",
          data: { 
            type: 'daily_spending_reminder',
            reminderType: 'evening',
            action: 'add_transaction'
          },
        },
        trigger: trigger as any,
      });

      console.log(`✅ Evening reminder scheduled with ID: ${notificationId} for ${hours}:${minutes.toString().padStart(2, '0')}`);

    } catch (error) {
      console.error('❌ Error scheduling evening reminder:', error);
    }
  }

  /**
   * Schedule monthly salary reminder on 1st of every month at 9:00 AM
   * Uses date-based trigger instead of calendar trigger for Android compatibility
   */
  private async scheduleMonthlySalaryReminder(): Promise<void> {
    try {
      console.log('💰 Scheduling monthly salary reminder for 1st of every month at 9:00 AM');
      
      // Check if we already sent salary reminder this month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastSalaryReminderDate = this.config.lastSalaryReminderDate;
      
      if (lastSalaryReminderDate) {
        const lastReminderDate = new Date(lastSalaryReminderDate);
        const lastReminderMonth = lastReminderDate.getMonth();
        const lastReminderYear = lastReminderDate.getFullYear();
        
        // If we already sent reminder this month, don't schedule again
        if (lastReminderMonth === currentMonth && lastReminderYear === currentYear) {
          console.log('✅ Monthly salary reminder already sent this month, skipping');
          return;
        }
      }

      // Schedule for 1st of next month at 9:00 AM
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      nextMonth.setHours(9, 0, 0, 0); // 9:00 AM

      // Calculate seconds from now to the target date
      const triggerTime = Math.floor((nextMonth.getTime() - now.getTime()) / 1000);

      // Only schedule if the date is in the future
      if (triggerTime > 0) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "New Month, New Budget",
            body: "Salary received? Add it now to plan your expenses.",
            data: { 
              type: 'monthly_salary_reminder',
              reminderType: 'salary',
              action: 'add_income'
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: nextMonth,
          },
        });

        console.log(`✅ Monthly salary reminder scheduled with ID: ${notificationId} for ${nextMonth.toDateString()} at 9:00 AM`);
      } else {
        console.log('📅 Monthly salary reminder date has passed, will schedule for next month');
        // Schedule for the month after next
        const monthAfterNext = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        monthAfterNext.setHours(9, 0, 0, 0);
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "New Month, New Budget",
            body: "Salary received? Add it now to plan your expenses.",
            data: { 
              type: 'monthly_salary_reminder',
              reminderType: 'salary',
              action: 'add_income'
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: monthAfterNext,
          },
        });

        console.log(`✅ Monthly salary reminder scheduled with ID: ${notificationId} for ${monthAfterNext.toDateString()} at 9:00 AM`);
      }

    } catch (error) {
      console.error('❌ Error scheduling monthly salary reminder:', error);
    }
  }

  /**
   * Schedule morning fallback reminder at 9 AM
   */
  private async scheduleMorningReminder(): Promise<void> {
    try {
      const [hours, minutes] = this.config.morningTime.split(':').map(Number);
      
      console.log(`🌅 Scheduling morning reminder for ${hours}:${minutes.toString().padStart(2, '0')}`);
      
      // Create trigger for daily at 9 AM
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
        repeats: true, // Repeat daily
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌅 Morning Check: Log Yesterday's Expenses",
          body: "Did you forget to log any expenses from yesterday?",
          data: { 
            type: 'daily_spending_reminder',
            reminderType: 'morning',
            action: 'add_transaction'
          },
        },
        trigger: trigger as any,
      });

      console.log(`✅ Morning reminder scheduled with ID: ${notificationId} for ${hours}:${minutes.toString().padStart(2, '0')}`);

    } catch (error) {
      console.error('❌ Error scheduling morning reminder:', error);
    }
  }

  /**
   * Cancel existing daily reminder notifications
   */
  private async cancelExistingReminders(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.type === 'daily_spending_reminder' || 
            notification.content.data?.type === 'monthly_salary_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling existing reminders:', error);
    }
  }

  /**
   * Check if user has logged transactions today
   */
  async hasLoggedTransactionsToday(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const lastTransactionDate = this.config.lastTransactionDate;
      
      return lastTransactionDate === today;
    } catch (error) {
      console.error('Error checking transaction log status:', error);
      return false;
    }
  }

  /**
   * Update last transaction date when user adds a transaction
   * Call this whenever a transaction is added
   */
  async updateLastTransactionDate(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      this.config.lastTransactionDate = today;
      await this.saveConfig();
    } catch (error) {
      console.error('Error updating last transaction date:', error);
    }
  }

  /**
   * Enable/disable daily reminders
   */
  async setEnabled(enabled: boolean): Promise<void> {
    try {
      this.config.isEnabled = enabled;
      await this.saveConfig();
      
      if (enabled) {
        await this.scheduleDailyReminders();
      } else {
        await this.cancelExistingReminders();
      }
    } catch (error) {
      console.error('Error setting daily reminders enabled:', error);
    }
  }

  /**
   * Update reminder times
   */
  async updateReminderTimes(eveningTime: string, morningTime: string): Promise<void> {
    try {
      this.config.eveningTime = eveningTime;
      this.config.morningTime = morningTime;
      await this.saveConfig();
      await this.scheduleDailyReminders();
    } catch (error) {
      console.error('Error updating reminder times:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DailyReminderConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable monthly salary reminders
   */
  async setSalaryReminderEnabled(enabled: boolean): Promise<void> {
    try {
      this.config.salaryReminderEnabled = enabled;
      await this.saveConfig();
      
      if (enabled) {
        await this.scheduleMonthlySalaryReminder();
      } else {
        // Cancel existing salary reminders
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        for (const notification of scheduledNotifications) {
          if (notification.content.data?.type === 'monthly_salary_reminder') {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          }
        }
      }
    } catch (error) {
      console.error('Error setting salary reminder enabled:', error);
    }
  }

  /**
   * Debug function to check scheduled notifications
   */
  async debugScheduledNotifications(): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Currently scheduled notifications:', notifications.length);
      
      notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.identifier}`);
        console.log(`   Title: ${notification.content.title}`);
        console.log(`   Data: ${JSON.stringify(notification.content.data)}`);
        console.log(`   Trigger: ${JSON.stringify(notification.trigger)}`);
      });
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
    }
  }

  /**
   * Handle notification response (when user taps notification)
   */
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    try {
      const data = response.notification.request.content.data;
      
      // Track notification tap for monetization analytics
      console.log('💰 Notification-driven app launch detected - monetization opportunity');
      console.log('📊 Notification type:', data?.type || 'unknown');
      
      if (data?.type === 'daily_spending_reminder') {
        // Update last notification date
        this.config.lastNotificationDate = new Date().toISOString();
        await this.saveConfig();
        
        console.log('📝 Daily reminder notification tapped - user will see splash ad for revenue');
        // Navigate to add transaction screen (this would be handled by the app)
        // The actual navigation would be handled by the calling component
        console.log('Daily reminder notification tapped - should navigate to add transaction');
      } else if (data?.type === 'monthly_salary_reminder') {
        // Update last salary reminder date
        this.config.lastSalaryReminderDate = new Date().toISOString();
        await this.saveConfig();
        
        // Reschedule for next month since we can't use repeating calendar triggers
        console.log('📅 Monthly salary reminder triggered, rescheduling for next month');
        await this.scheduleMonthlySalaryReminder();
        
        console.log('💵 Monthly salary reminder notification tapped - high-value monetization opportunity');
        // Navigate to add income screen (this would be handled by the app)
        console.log('Monthly salary reminder notification tapped - should navigate to add income');
      } else if (data?.type === 'budget_allocation_reminder') {
        // Handle budget allocation reminder
        console.log('Budget allocation reminder notification tapped - should navigate to budget planning screen');
        
        // Store the notification data for navigation handling
        await AsyncStorage.setItem('pendingBudgetReminder', JSON.stringify({
          action: data.action || 'open_budget_planning',
          userId: data.userId,
          month: data.month,
          hasExistingBudgets: data.hasExistingBudgets || false,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  }

  /**
   * Check for pending budget allocation reminder and clear it
   */
  async checkPendingBudgetReminder(): Promise<any | null> {
    try {
      const pendingReminder = await AsyncStorage.getItem('pendingBudgetReminder');
      if (pendingReminder) {
        const reminderData = JSON.parse(pendingReminder);
        
        // Clear the pending reminder
        await AsyncStorage.removeItem('pendingBudgetReminder');
        
        console.log('Found pending budget reminder:', reminderData);
        return reminderData;
      }
      return null;
    } catch (error) {
      console.error('Error checking pending budget reminder:', error);
      return null;
    }
  }

  /**
   * Check if we should send a morning reminder
   * This checks if user missed logging transactions yesterday
   */
  async shouldSendMorningReminder(): Promise<boolean> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const lastTransactionDate = this.config.lastTransactionDate;
      const lastNotificationDate = this.config.lastNotificationDate;
      const today = new Date().toISOString().split('T')[0];
      
      console.log('🔍 Checking morning reminder conditions:');
      console.log(`   Yesterday: ${yesterdayStr}`);
      console.log(`   Last transaction date: ${lastTransactionDate}`);
      console.log(`   Last notification date: ${lastNotificationDate}`);
      console.log(`   Today: ${today}`);
      
      // Send morning reminder if:
      // 1. User didn't log transactions yesterday
      // 2. We haven't sent a notification today yet
      const shouldSend = lastTransactionDate !== yesterdayStr && lastNotificationDate !== today;
      
      console.log(`   Should send morning reminder: ${shouldSend}`);
      
      return shouldSend;
    } catch (error) {
      console.error('❌ Error checking morning reminder condition:', error);
      return false;
    }
  }
}

export default DailyReminderService;
