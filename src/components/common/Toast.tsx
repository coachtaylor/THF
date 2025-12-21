import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastProps {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: 'checkmark-circle' as const,
    color: colors.accent.success,
    bgColor: colors.accent.successMuted,
  },
  error: {
    icon: 'alert-circle' as const,
    color: colors.error,
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  warning: {
    icon: 'warning' as const,
    color: colors.warning,
    bgColor: colors.accent.warningMuted,
  },
  info: {
    icon: 'information-circle' as const,
    color: colors.accent.primary,
    bgColor: colors.accent.primaryMuted,
  },
};

function ToastItem({ toast, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = toastConfig[toast.type];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          borderLeftColor: config.color,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.message && <Text style={styles.message}>{toast.message}</Text>}
      </View>
      {toast.action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            toast.action?.onPress();
            dismissToast();
          }}
          accessibilityRole="button"
          accessibilityLabel={toast.action.label}
        >
          <Text style={[styles.actionText, { color: config.color }]}>
            {toast.action.label}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={dismissToast}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
      >
        <Ionicons name="close" size={18} color={colors.text.tertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Toast Manager Component - renders at root level
interface ToastManagerProps {
  toasts: ToastConfig[];
  onDismiss: (id: string) => void;
}

export function ToastManager({ toasts, onDismiss }: ToastManagerProps) {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.manager, { top: insets.top + 10 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  manager: {
    position: 'absolute',
    left: spacing.l,
    right: spacing.l,
    zIndex: 9999,
    gap: spacing.s,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    padding: spacing.m,
    gap: spacing.m,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.body,
    fontFamily: 'Poppins-SemiBold',
    color: colors.text.primary,
  },
  message: {
    fontSize: typography.bodySmall,
    fontFamily: 'Poppins',
    color: colors.text.secondary,
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  actionText: {
    fontSize: typography.bodySmall,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: spacing.xs,
  },
});

export default ToastItem;
