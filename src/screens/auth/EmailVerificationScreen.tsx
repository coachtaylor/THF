import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resendVerificationEmail } from '../../services/auth/auth';
import { palette, spacing, typography } from '../../theme';

export default function EmailVerificationScreen({
  route,
  navigation,
}: any) {
  const insets = useSafeAreaInsets();
  const { userId, email } = route.params;

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);

  const handleResend = async () => {
    if (!canResend) return;

    try {
      setResending(true);
      setError(null);

      await resendVerificationEmail(email);

      setResent(true);
      setCanResend(false);

      // Re-enable after 5 minutes
      setTimeout(() => {
        setCanResend(true);
        setResent(false);
      }, 5 * 60 * 1000);
    } catch (err: any) {
      console.error('Resend failed:', err);
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Your Email</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Email Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📧</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Check Your Email!</Text>

        {/* Instructions */}
        <Text style={styles.instructions}>
          We've sent a verification link to:
        </Text>

        <Text style={styles.email}>{email}</Text>

        <Text style={styles.instructions}>
          Click the link in the email to verify your account.{'\n'}
          The link will expire in 24 hours.
        </Text>

        {/* Troubleshooting */}
        <View style={styles.troubleshooting}>
          <Text style={styles.troubleshootingTitle}>
            Didn't receive the email?
          </Text>

          <View style={styles.tips}>
            <Text style={styles.tip}>• Check your spam or junk folder</Text>
            <Text style={styles.tip}>• Make sure {email} is correct</Text>
            <Text style={styles.tip}>
              • Wait a few minutes and check again
            </Text>
          </View>
        </View>

        {/* Success/Error Messages */}
        {resent && (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={palette.tealPrimary}
            />
            <Text style={styles.successText}>Verification email sent!</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={palette.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Resend Button */}
        <TouchableOpacity
          style={[
            styles.resendButton,
            (!canResend || resending) && styles.resendButtonDisabled,
          ]}
          onPress={handleResend}
          disabled={!canResend || resending}
        >
          {resending ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <Text style={styles.resendButtonText}>
              {canResend
                ? 'Resend Verification Email'
                : 'Wait 5 minutes to resend'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Change Email */}
        <TouchableOpacity
          style={styles.changeEmailButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.changeEmailButtonText}>
            Change Email Address
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already verified? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    ...typography.h2,
    color: palette.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.xxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    ...typography.h1,
    color: palette.white,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  instructions: {
    ...typography.body,
    color: palette.lightGray,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  email: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  troubleshooting: {
    marginTop: spacing.xl,
    marginBottom: spacing.l,
  },
  troubleshootingTitle: {
    ...typography.bodyLarge,
    color: palette.white,
    marginBottom: spacing.m,
  },
  tips: {
    gap: spacing.s,
  },
  tip: {
    ...typography.body,
    color: palette.midGray,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: palette.tealPrimary + '20',
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.l,
  },
  successText: {
    ...typography.body,
    color: palette.tealPrimary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: palette.error + '20',
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.l,
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    flex: 1,
  },
  resendButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.l,
    marginBottom: spacing.m,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '600',
  },
  changeEmailButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  changeEmailButtonText: {
    ...typography.button,
    color: palette.white,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    ...typography.body,
    color: palette.midGray,
  },
  loginLink: {
    ...typography.body,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
});



