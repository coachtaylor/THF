import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { requestPasswordReset } from '../../services/auth/auth';
import { colors, spacing, borderRadius, gradients, layout } from '../../theme/theme';
import { headerStyles } from '../../theme/components';

export default function ForgotPasswordScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canSubmit = email.length > 0 && isValidEmail(email);

  const handleSendResetLink = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError(null);

      await requestPasswordReset(email);

      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset request failed:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[headerStyles.container, { paddingTop: insets.top + spacing.m }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            headerStyles.backButton,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={headerStyles.title}>Forgot Password</Text>
        <View style={headerStyles.spacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.screenPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={40} color={colors.accent.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Reset Your Password</Text>

        {/* Instructions */}
        <Text style={styles.instructions}>
          Enter your email address and we'll send you a link to reset your
          password.
        </Text>

        {/* Success Message */}
        {success && (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.successText}>
              Reset link sent! Check your email for instructions.
            </Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <LinearGradient
              colors={gradients.inputBg}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassHighlight} />
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.text.tertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.text.disabled}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading && !success}
            />
          </View>
        </View>

        {/* Send Reset Link Button */}
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            (!canSubmit || loading || success) && styles.sendButtonDisabled,
            pressed && canSubmit && !loading && !success && styles.buttonPressed,
          ]}
          onPress={handleSendResetLink}
          disabled={!canSubmit || loading || success}
        >
          <LinearGradient
            colors={canSubmit && !loading && !success
              ? [colors.accent.primary, colors.accent.primaryDark]
              : [colors.glass.bg, colors.glass.bg]
            }
            style={StyleSheet.absoluteFill}
          />
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <>
              <Text style={[
                styles.sendButtonText,
                (!canSubmit || success) && styles.sendButtonTextDisabled,
              ]}>
                {success ? 'Email Sent' : 'Send Reset Link'}
              </Text>
              <Ionicons
                name={success ? 'checkmark' : 'arrow-forward'}
                size={20}
                color={canSubmit && !success ? colors.text.inverse : colors.text.tertiary}
              />
            </>
          )}
        </Pressable>

        {/* Additional Info */}
        {success && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>What's next?</Text>
            <Text style={styles.infoText}>
              • Check your email inbox{'\n'}
              • Click the reset link in the email{'\n'}
              • The link expires in 1 hour{'\n'}
              • Didn't receive it? Check your spam folder
            </Text>
          </View>
        )}

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Remember your password? </Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => pressed && styles.buttonPressed}
          >
            <Text style={styles.loginLink}>Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Note: header, headerTitle, backButton now use headerStyles from components.ts
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  instructions: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.success + '20',
    padding: spacing.m,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  successText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.success,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.error + '20',
    padding: spacing.m,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.l,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.s,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginLeft: spacing.m,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 16,
    color: colors.text.primary,
    padding: spacing.m,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    marginTop: spacing.m,
    marginBottom: spacing.l,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 1,
  },
  sendButtonText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  sendButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  infoBox: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.lg,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  infoTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.s,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.secondary,
  },
  loginLink: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});



