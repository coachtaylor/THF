import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface GlassModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
}

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  actions: GlassModalAction[];
  showCloseButton?: boolean;
}

export default function GlassModal({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor = colors.text.primary,
  actions,
  showCloseButton = false,
}: GlassModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getButtonStyle = (variant: GlassModalAction['variant'] = 'primary') => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'danger':
        return styles.dangerButton;
      case 'ghost':
        return styles.ghostButton;
      default:
        return styles.primaryButton;
    }
  };

  const getButtonTextStyle = (variant: GlassModalAction['variant'] = 'primary') => {
    switch (variant) {
      case 'primary':
        return styles.primaryButtonText;
      case 'secondary':
        return styles.secondaryButtonText;
      case 'danger':
        return styles.dangerButtonText;
      case 'ghost':
        return styles.ghostButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Glass background */}
          <View style={styles.glassBackground}>
            <LinearGradient
              colors={['rgba(30, 30, 35, 0.95)', 'rgba(20, 20, 25, 0.98)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassHighlight} />
          </View>

          {/* Close button */}
          {showCloseButton && (
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </Pressable>
          )}

          {/* Icon */}
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
              <Ionicons name={icon} size={32} color={iconColor} />
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.button,
                  getButtonStyle(action.variant),
                  pressed && styles.buttonPressed,
                  action.loading && styles.buttonLoading,
                ]}
                onPress={action.onPress}
                disabled={action.loading}
              >
                {action.variant === 'primary' && (
                  <LinearGradient
                    colors={[colors.accent.primary, colors.accent.primaryDark]}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                {action.variant === 'danger' && (
                  <LinearGradient
                    colors={[colors.error, '#B91C1C']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.buttonText, getButtonTextStyle(action.variant)]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    maxWidth: 340,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.l,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.s,
  },
  message: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
    marginBottom: spacing.l,
  },
  actionsContainer: {
    padding: spacing.l,
    gap: spacing.m,
  },
  button: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  primaryButton: {
    // Gradient applied via LinearGradient
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  dangerButton: {
    // Gradient applied via LinearGradient
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLoading: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.text.inverse,
  },
  secondaryButtonText: {
    color: colors.text.primary,
  },
  dangerButtonText: {
    color: colors.text.inverse,
  },
  ghostButtonText: {
    color: colors.text.secondary,
  },
});
