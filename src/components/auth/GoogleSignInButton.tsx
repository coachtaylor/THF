import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  mode?: 'signin' | 'signup';
}

// Google "G" logo as SVG component
function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
  mode = 'signin',
}: GoogleSignInButtonProps) {
  const buttonText = mode === 'signin'
    ? 'Continue with Google'
    : 'Sign up with Google';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        (disabled || loading) && styles.containerDisabled,
        pressed && styles.containerPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={buttonText}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {/* Glass background */}
      <LinearGradient
        colors={['#141418', '#0A0A0C']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top highlight for glass effect */}
      <View style={styles.glassHighlight} />

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.text.primary} size="small" />
        ) : (
          <>
            {/* Google Logo */}
            <View style={styles.logoContainer}>
              <GoogleLogo />
            </View>

            <Text style={styles.text}>{buttonText}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  containerDisabled: {
    opacity: 0.5,
  },
  containerPressed: {
    opacity: 0.8,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
    paddingHorizontal: spacing.l,
  },
  logoContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
});
