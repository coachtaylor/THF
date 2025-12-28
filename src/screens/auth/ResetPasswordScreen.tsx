import React, { useState, useEffect } from 'react';
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
import { resetPassword } from '../../services/auth/auth';
import { palette, spacing, typography } from '../../theme';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { token } = route.params || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No reset token provided. Please use the link from your email.');
    } else if (typeof token !== 'string' || token.length < 10) {
      setTokenError('Invalid reset token. Please request a new password reset.');
    }
  }, [token]);

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordStrengthLabel =
    ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength] ||
    'Weak';
  const passwordStrengthColor =
    [
      palette.error,
      '#FF6B00',
      '#FFB800',
      palette.tealPrimary,
      '#00C853',
    ][passwordStrength] || palette.error;

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit =
    !tokenError &&
    newPassword.length >= 8 &&
    passwordStrength >= 2 &&
    passwordsMatch &&
    token;

  const handleResetPassword = async () => {
    if (!canSubmit || !token) return;

    try {
      setLoading(true);
      setError(null);

      await resetPassword(token, newPassword);

      setSuccess(true);

      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(
        err.message ||
          'Failed to reset password. The link may have expired. Please request a new one.'
      );
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
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Create New Password</Text>

        {/* Instructions */}
        <Text style={styles.instructions}>
          Enter a new password for your account. Make sure it's strong and
          secure.
        </Text>

        {/* Token Error - Show if token is missing or invalid */}
        {tokenError && (
          <View>
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={palette.error} />
              <Text style={styles.errorText}>{tokenError}</Text>
            </View>
            <TouchableOpacity
              style={styles.requestLinkButton}
              onPress={() => navigation.replace('ForgotPassword')}
            >
              <Text style={styles.requestLinkText}>Request New Reset Link</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success Message */}
        {success && (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={palette.tealPrimary}
            />
            <Text style={styles.successText}>
              Password reset successful! Redirecting to login...
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

        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••••••"
              placeholderTextColor={palette.midGray}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoComplete="password-new"
              editable={!loading && !success}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color={palette.midGray}
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength */}
          {newPassword.length > 0 && (
            <View style={styles.passwordStrength}>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.strengthBar,
                      index < passwordStrength && {
                        backgroundColor: passwordStrengthColor,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[styles.strengthLabel, { color: passwordStrengthColor }]}
              >
                {passwordStrengthLabel}
              </Text>
            </View>
          )}

          {/* Password Requirements */}
          <View style={styles.requirements}>
            <Text style={styles.requirementText}>
              {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
            </Text>
            <Text style={styles.requirementText}>
              {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
            </Text>
            <Text style={styles.requirementText}>
              {/[0-9]/.test(newPassword) ? '✓' : '○'} One number
            </Text>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••••••"
              placeholderTextColor={palette.midGray}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              editable={!loading && !success}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color={palette.midGray}
              />
            </TouchableOpacity>
          </View>

          {/* Password Match Indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchIndicator}>
              {passwordsMatch ? (
                <View style={styles.matchSuccess}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={palette.tealPrimary}
                  />
                  <Text style={styles.matchText}>Passwords match</Text>
                </View>
              ) : (
                <View style={styles.matchError}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={palette.error}
                  />
                  <Text style={styles.matchTextError}>
                    Passwords do not match
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[
            styles.resetButton,
            (!canSubmit || loading || success) && styles.resetButtonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={!canSubmit || loading || success}
        >
          {loading ? (
            <ActivityIndicator color={palette.deepBlack} />
          ) : (
            <Text style={styles.resetButtonText}>
              {success ? 'Password Reset ✓' : 'Reset Password →'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <Text style={styles.helpText}>
          After resetting, you'll be redirected to the login screen.
        </Text>
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.darkCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
  },
  passwordInput: {
    ...typography.body,
    flex: 1,
    padding: spacing.m,
    color: palette.white,
  },
  eyeButton: {
    padding: spacing.m,
  },
  passwordStrength: {
    marginTop: spacing.s,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
  },
  strengthLabel: {
    ...typography.bodySmall,
  },
  requirements: {
    marginTop: spacing.s,
    gap: spacing.xxs,
  },
  requirementText: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  matchIndicator: {
    marginTop: spacing.s,
  },
  matchSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matchError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matchText: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
  },
  matchTextError: {
    ...typography.bodySmall,
    color: palette.error,
  },
  resetButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  helpText: {
    ...typography.bodySmall,
    color: palette.midGray,
    textAlign: 'center',
  },
  requestLinkButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.m,
  },
  requestLinkText: {
    ...typography.button,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
});



