import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import {
  initNotificationService,
  requestPermissions,
  registerPushToken,
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
} from '../services/notifications';

interface NotificationContextValue {
  hasPermission: boolean;
  isLoading: boolean;
  settings: NotificationSettings;
  lastNotification: Notifications.Notification | null;
  requestPermission: () => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const DEFAULT_SETTINGS: NotificationSettings = {
  workoutReminders: true,
  reminderTime: '09:00',
  reminderMinutesBefore: 30,
  restDayMotivation: true,
  streakReminders: true,
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Initialize notification service
  useEffect(() => {
    const init = async () => {
      try {
        await initNotificationService();

        // Check current permission status
        const { status } = await Notifications.getPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        if (__DEV__) console.error('Error initializing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Load user settings when user changes
  useEffect(() => {
    if (user?.id) {
      const userSettings = getNotificationSettings(user.id);
      setSettings(userSettings);
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [user?.id]);

  // Register push token when user is authenticated and has permission
  useEffect(() => {
    if (user?.id && hasPermission) {
      registerPushToken(user.id);
    }
  }, [user?.id, hasPermission]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setLastNotification(notification);
      if (__DEV__) console.log('Notification received:', notification.request.content.title);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const { data } = response.notification.request.content;
      if (__DEV__) console.log('Notification tapped:', data);

      // Handle notification tap based on type
      if (data?.type === 'workout_reminder') {
        // Navigate to workout screen - handled by navigation in App.tsx
      } else if (data?.type === 'streak_reminder') {
        // Navigate to home screen
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

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

  return (
    <NotificationContext.Provider
      value={{
        hasPermission,
        isLoading,
        settings,
        lastNotification,
        requestPermission,
        updateSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
