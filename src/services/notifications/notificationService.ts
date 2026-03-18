import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { db } from '../../utils/database';

export interface NotificationSettings {
  workoutReminders: boolean;
  reminderTime: string; // HH:mm format
  reminderMinutesBefore: number;
  restDayMotivation: boolean;
  streakReminders: boolean;
}

export interface ScheduledNotification {
  id: string;
  type: 'workout_reminder' | 'rest_day' | 'streak' | 'custom';
  scheduledFor: Date;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  workoutReminders: true,
  reminderTime: '09:00',
  reminderMinutesBefore: 30,
  restDayMotivation: true,
  streakReminders: true,
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('⚠️ Push notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Notification permissions not granted');
    return false;
  }

  console.log('✅ Notification permissions granted');
  return true;
}

/**
 * Get the push token for this device
 */
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('⚠️ No EAS project ID found for push notifications');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Register push token in local database
 */
export async function registerPushToken(userId: string): Promise<string | null> {
  const token = await getPushToken();

  if (!token) {
    return null;
  }

  try {
    const stmt = db.prepareSync(`
      INSERT OR REPLACE INTO push_tokens (user_id, token, platform, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `);

    stmt.executeSync([userId, token, Platform.OS]);
    console.log('✅ Push token registered');

    return token;
  } catch (error) {
    console.error('Error registering push token:', error);
    return null;
  }
}

/**
 * Get notification settings for a user
 */
export function getNotificationSettings(userId: string): NotificationSettings {
  try {
    const stmt = db.prepareSync(`
      SELECT settings FROM notification_settings WHERE user_id = ?
    `);

    const result = stmt.executeSync([userId]);
    const row = result.getFirstSync() as { settings: string } | null;

    if (row?.settings) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(row.settings) };
    }

    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save notification settings for a user
 */
export function saveNotificationSettings(userId: string, settings: Partial<NotificationSettings>): void {
  try {
    const currentSettings = getNotificationSettings(userId);
    const newSettings = { ...currentSettings, ...settings };

    const stmt = db.prepareSync(`
      INSERT OR REPLACE INTO notification_settings (user_id, settings, updated_at)
      VALUES (?, ?, datetime('now'))
    `);

    stmt.executeSync([userId, JSON.stringify(newSettings)]);
    console.log('✅ Notification settings saved');
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
}

/**
 * Schedule a workout reminder notification
 */
export async function scheduleWorkoutReminder(
  workoutDate: Date,
  workoutName: string,
  minutesBefore: number = 30
): Promise<string | null> {
  const reminderTime = new Date(workoutDate.getTime() - minutesBefore * 60 * 1000);

  // Don't schedule if the reminder time has already passed
  if (reminderTime <= new Date()) {
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Workout Reminder 💪',
        body: `Your ${workoutName} workout starts in ${minutesBefore} minutes!`,
        data: { type: 'workout_reminder', workoutName },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });

    console.log(`✅ Workout reminder scheduled for ${reminderTime.toISOString()}`);
    return id;
  } catch (error) {
    console.error('Error scheduling workout reminder:', error);
    return null;
  }
}

/**
 * Schedule daily workout reminders for the week
 */
export async function scheduleWeeklyReminders(
  workoutDays: number[], // 0 = Sunday, 1 = Monday, etc.
  reminderTime: string = '09:00'
): Promise<string[]> {
  const scheduledIds: string[] = [];
  const [hours, minutes] = reminderTime.split(':').map(Number);

  // Cancel existing weekly reminders first
  await cancelAllReminders();

  for (const dayOfWeek of workoutDays) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to Train! 🏋️',
          body: "Your workout is waiting for you. Let's make today count!",
          data: { type: 'daily_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: dayOfWeek + 1, // expo-notifications uses 1-7 (Sunday=1)
          hour: hours,
          minute: minutes,
        },
      });

      scheduledIds.push(id);
    } catch (error) {
      console.error(`Error scheduling reminder for day ${dayOfWeek}:`, error);
    }
  }

  console.log(`✅ Scheduled ${scheduledIds.length} weekly reminders`);
  return scheduledIds;
}

/**
 * Schedule a streak reminder if user hasn't worked out today
 */
export async function scheduleStreakReminder(
  currentStreak: number,
  time: Date
): Promise<string | null> {
  if (time <= new Date()) {
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Don't Break Your ${currentStreak} Day Streak! 🔥`,
        body: "You haven't logged a workout today. Keep the momentum going!",
        data: { type: 'streak_reminder', currentStreak },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: time,
      },
    });

    return id;
  } catch (error) {
    console.error('Error scheduling streak reminder:', error);
    return null;
  }
}

/**
 * Send a local notification immediately
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('✅ All scheduled notifications cancelled');
}

/**
 * Cancel a specific notification
 */
export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set the badge count (iOS)
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Initialize the notification service
 */
export async function initNotificationService(): Promise<void> {
  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('workout-reminders', {
      name: 'Workout Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D9C0',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('streak-alerts', {
      name: 'Streak Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  console.log('✅ Notification service initialized');
}
