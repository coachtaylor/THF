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
import { signup } from '../../services/auth/auth';
import { palette, spacing, typography } from '../../theme';

export default function SignupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
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

  const canSubmit =
    firstName.length > 0 &&
    lastName.length > 0 &&
    isValidEmail(email) &&
    password.length >= 8 &&
    passwordStrength >= 2;

  const handleSignup = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError(null);

      const response = await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });

      // Navigate to email verification
      navigation.replace('EmailVerification', {
        userId: response.user.id,
        email: response.user.email,
      });
    } catch (err: any) {
      console.error('Signup failed:', err);
      setError(err.message || 'Signup failed. Please try again.');
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
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <Text style={styles.welcome}>Let's Get Started! 🎉</Text>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={palette.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Alex"
            placeholderTextColor={palette.midGray}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoComplete="name-given"
            editable={!loading}
          />
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Rodriguez"
            placeholderTextColor={palette.midGray}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            autoComplete="name-family"
            editable={!loading}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="alex@example.com"
            placeholderTextColor={palette.midGray}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••••••"
              placeholderTextColor={palette.midGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color={palette.midGray}
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength */}
          {password.length > 0 && (
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
              {password.length >= 8 ? '✓' : '○'} At least 8 characters
            </Text>
            <Text style={styles.requirementText}>
              {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
            </Text>
            <Text style={styles.requirementText}>
              {/[0-9]/.test(password) ? '✓' : '○'} One number
            </Text>
          </View>
        </View>

        {/* Signup Button */}
        <TouchableOpacity
          style={[
            styles.signupButton,
            (!canSubmit || loading) && styles.signupButtonDisabled,
          ]}
          onPress={handleSignup}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color={palette.deepBlack} />
          ) : (
            <Text style={styles.signupButtonText}>Create Account →</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  welcome: {
    ...typography.h1,
    color: palette.white,
    marginBottom: spacing.xl,
    textAlign: 'center',
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
  signupButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  signupButtonDisabled: {
    opacity: 0.5,
  },
  signupButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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

