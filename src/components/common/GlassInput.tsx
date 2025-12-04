import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../theme/theme';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  optional?: boolean;
}

export default function GlassInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  optional = false,
  secureTextEntry,
  ...textInputProps
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry !== undefined;
  const actualSecureTextEntry = isPassword && !showPassword;

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.accent.primary;
    return colors.glass.border;
  };

  const inputContainerStyle: ViewStyle = {
    ...styles.inputContainer,
    borderColor: getBorderColor(),
    ...Platform.select({
      ios: isFocused && !error
        ? {
            shadowColor: colors.accent.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
          }
        : error
        ? {
            shadowColor: colors.error,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
          }
        : {},
      android: {},
    }),
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {optional && <Text style={styles.optional}>(Optional)</Text>}
        </View>
      )}

      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? colors.accent.primary : colors.text.tertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          {...textInputProps}
          secureTextEntry={actualSecureTextEntry}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={colors.text.tertiary}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconButton}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.tertiary}
            />
          </Pressable>
        )}

        {rightIcon && !isPassword && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            hitSlop={8}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.text.tertiary}
            />
          </Pressable>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {hint && !error && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.l,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.xs,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  optional: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  inputContainer: {
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  leftIcon: {
    marginRight: spacing.s,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.primary,
    height: '100%',
  },
  inputWithLeftIcon: {
    marginLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: spacing.s,
  },
  rightIconButton: {
    padding: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.s,
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.error,
  },
  hintText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
    marginTop: spacing.s,
  },
});
