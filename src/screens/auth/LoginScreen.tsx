import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../../services/auth/auth';
import { saveSession } from '../../services/auth/session';
import { palette, spacing, typography } from '../../theme';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canSubmit =
    email.length > 0 && password.length >= 8 && isValidEmail(email);

  const handleLogin = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError(null);

      const response = await login({ email, password });

      // Save session
      await saveSession(response.user, response.tokens);

      // Navigate based on user status
      if (
        response.user.email_verified &&
        response.user.onboarding_completed
      ) {
        navigation.replace('Main');
      } else if (
        response.user.email_verified &&
        !response.user.onboarding_completed
      ) {
        navigation.replace('Onboarding');
      } else {
        navigation.navigate('EmailVerification', {
          userId: response.user.id,
          email: response.user.email,
        });
      }
    } catch (err: any) {
      console.error('Login failed:', err);

      if (err.message.includes('locked')) {
        Alert.alert(
          'Account Locked',
          'Your account has been locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.',
          [
            {
              text: 'Reset Password',
              onPress: () => navigation.navigate('ForgotPassword'),
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        setError(err.message || 'Invalid email or password');
      }
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
        <Text style={styles.headerTitle}>Log In</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Welcome */}
        <Text style={styles.welcome}>Welcome Back! 👋</Text>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={palette.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Email */}
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
              autoComplete="password"
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
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            (!canSubmit || loading) && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color={palette.deepBlack} />
          ) : (
            <Text style={styles.loginButtonText}>Log In →</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign up</Text>
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
    paddingTop: spacing.xl,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    ...typography.body,
    color: palette.tealPrimary,
  },
  loginButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    ...typography.body,
    color: palette.midGray,
  },
  signupLink: {
    ...typography.body,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
});

