import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  NotificationSettings,
  requestPermissions,
  registerPushToken,
  getNotificationSettings,
  saveNotificationSettings,
  scheduleWeeklyReminders,
  cancelAllReminders,
  getScheduledNotifications,
} from '../services/notifications';

interface UseNotificationsReturn {
  isEnabled: boolean;
  hasPermission: boolean;
  settings: NotificationSettings;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  scheduleReminders: (workoutDays: number[]) => Promise<void>;
  cancelReminders: () => Promise<void>;
  scheduledCount: number;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    workoutReminders: true,
    reminderTime: '09:00',
    reminderMinutesBefore: 30,
    restDayMotivation: true,
    streakReminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const userSettings = getNotificationSettings(user.id);
        setSettings(userSettings);

        // Check permission status
        const granted = await requestPermissions();
        setHasPermission(granted);

        // Get scheduled notification count
        const scheduled = await getScheduledNotifications();
        setScheduledCount(scheduled.length);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermissions();
    setHasPermission(granted);

    if (granted && user?.id) {
      await registerPushToken(user.id);
    }

    return granted;
  }, [user?.id]);

  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      if (!user?.id) return;

      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      saveNotificationSettings(user.id, updated);
    },
    [user?.id, settings]
  );

  const scheduleReminders = useCallback(
    async (workoutDays: number[]) => {
      if (!hasPermission || !settings.workoutReminders) {
        return;
      }

      const ids = await scheduleWeeklyReminders(workoutDays, settings.reminderTime);
      setScheduledCount(ids.length);
    },
    [hasPermission, settings.workoutReminders, settings.reminderTime]
  );

  const cancelReminders = useCallback(async () => {
    await cancelAllReminders();
    setScheduledCount(0);
  }, []);

  return {
    isEnabled: settings.workoutReminders && hasPermission,
    hasPermission,
    settings,
    isLoading,
    requestPermission,
    updateSettings,
    scheduleReminders,
    cancelReminders,
    scheduledCount,
  };
}
