import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';

export type GlassListItemVariant = 'default' | 'danger' | 'success' | 'warning';

interface GlassListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightValue?: string;
  showChevron?: boolean;
  leftAccent?: boolean;
  accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  variant?: GlassListItemVariant;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  isFirst?: boolean;
  isLast?: boolean;
}

const accentColors = {
  primary: colors.accent.primary,
  secondary: colors.accent.secondary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
};

export default function GlassListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightValue,
  showChevron = false,
  leftAccent = false,
  accentColor = 'primary',
  variant = 'default',
  onPress,
  disabled = false,
  style,
  isFirst = false,
  isLast = false,
}: GlassListItemProps) {
  const accent = accentColors[accentColor];

  const getTextColor = () => {
    if (disabled) return colors.text.disabled;
    switch (variant) {
      case 'danger':
        return colors.error;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      default:
        return colors.text.primary;
    }
  };

  const getIconColor = () => {
    if (disabled) return colors.text.disabled;
    switch (variant) {
      case 'danger':
        return colors.error;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      default:
        return colors.text.tertiary;
    }
  };

  const containerStyle: ViewStyle = {
    ...styles.container,
    borderTopLeftRadius: isFirst ? borderRadius.md : 0,
    borderTopRightRadius: isFirst ? borderRadius.md : 0,
    borderBottomLeftRadius: isLast ? borderRadius.md : 0,
    borderBottomRightRadius: isLast ? borderRadius.md : 0,
    borderBottomWidth: isLast ? 0 : 1,
    opacity: disabled ? 0.5 : 1,
  };

  const content = (
    <View style={[containerStyle, style]}>
      {/* Left accent indicator */}
      {leftAccent && (
        <View style={[styles.leftAccent, { backgroundColor: accent }]} />
      )}

      {/* Left icon */}
      {leftIcon && (
        <View
          style={[
            styles.leftIconContainer,
            variant === 'danger' && styles.leftIconDanger,
          ]}
        >
          <Ionicons name={leftIcon} size={20} color={getIconColor()} />
        </View>
      )}

      {/* Text content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: getTextColor() }]}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Right content */}
      {rightValue && (
        <Text style={styles.rightValue}>{rightValue}</Text>
      )}

      {rightIcon && (
        <Ionicons name={rightIcon} size={20} color={getIconColor()} />
      )}

      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.text.tertiary}
          style={styles.chevron}
        />
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.glass.bgLight : 'transparent',
        })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// Container component for grouping list items
interface GlassListProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassList({ children, style }: GlassListProps) {
  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.listContainer, style]}>
      {/* Glass background */}
      <LinearGradient
        colors={['rgba(25, 25, 30, 0.7)', 'rgba(18, 18, 22, 0.8)']}
        style={StyleSheet.absoluteFill}
      />
      {/* Glass highlight */}
      <View style={styles.listGlassHighlight} />

      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<GlassListItemProps>(child)) {
          return React.cloneElement(child, {
            isFirst: index === 0,
            isLast: index === childArray.length - 1,
          });
        }
        return child;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  listGlassHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    minHeight: 52,
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: spacing.s,
    bottom: spacing.s,
    width: 3,
    borderRadius: 1.5,
  },
  leftIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  leftIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
    marginTop: 2,
  },
  rightValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.tertiary,
    marginRight: spacing.s,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
