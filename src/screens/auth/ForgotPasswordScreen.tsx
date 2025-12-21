import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { requestPasswordReset } from '../../services/auth/auth';
import { palette, spacing, typography } from '../../theme';

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔑</Text>
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
              color={palette.tealPrimary}
            />
            <Text style={styles.successText}>
              Reset link sent! Check your email for instructions.
            </Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={palette.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={palette.midGray}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading && !success}
          />
        </View>

        {/* Send Reset Link Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!canSubmit || loading || success) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendResetLink}
          disabled={!canSubmit || loading || success}
        >
          {loading ? (
            <ActivityIndicator color={palette.deepBlack} />
          ) : (
            <Text style={styles.sendButtonText}>
              {success ? 'Email Sent ✓' : 'Send Reset Link →'}
            </Text>
          )}
        </TouchableOpacity>

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
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
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
    marginBottom: spacing.m,
  },
  instructions: {
    ...typography.body,
    color: palette.lightGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
    flex: 1,
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
  inputGroup: {
    marginBottom: spacing.l,
  },
  label: {
    ...typography.body,
    color: palette.white,
    marginBottom: spacing.s,
  },
  input: {
    ...typography.body,
    backgroundColor: palette.darkCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    color: palette.white,
  },
  sendButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  infoBox: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
  },
  infoTitle: {
    ...typography.bodyLarge,
    color: palette.white,
    marginBottom: spacing.s,
  },
  infoText: {
    ...typography.body,
    color: palette.lightGray,
    lineHeight: 24,
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



