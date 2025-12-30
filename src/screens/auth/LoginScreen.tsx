import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { checkOnboardingStatus } from '../../services/storage/onboarding';
import { checkTierSelection } from '../../services/storage/tierSelection';
import { signalOnboardingComplete } from '../../services/events/onboardingEvents';
import { colors, spacing, borderRadius, timing, gradients, layout } from '../../theme/theme';
import { headerStyles, screenStyles } from '../../theme/components';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import OrDivider from '../../components/auth/OrDivider';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const { login, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: timing.shimmer,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: timing.shimmer,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

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

      await login(email, password);

      // Check if user has completed onboarding
      const hasCompletedOnboarding = await checkOnboardingStatus();

      if (hasCompletedOnboarding) {
        // Returning user - go to main app
        signalOnboardingComplete();
      } else {
        // Check if user has selected a tier yet
        const hasTierSelected = await checkTierSelection();
        if (hasTierSelected) {
          // Continue onboarding from where they left off
          navigation.replace('WhyTransFitness');
        } else {
          // New user - show tier selection first
          navigation.replace('TierSelection');
        }
      }
    } catch (err: any) {
      console.error('Login failed:', err);

      // Check for Supabase error codes first (more reliable than string matching)
      const errorCode = err?.code || err?.error_code || err?.__isAuthError && err?.status;
      const errorMessage = err.message?.toLowerCase() || '';

      if (errorMessage.includes('locked') || errorCode === 'too_many_requests') {
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
      } else if (
        errorCode === 'email_not_confirmed' ||
        errorCode === 'user_not_confirmed' ||
        errorMessage.includes('email not confirmed') ||
        errorMessage.includes('not confirmed')
      ) {
        // Email verification required - use error codes for reliable detection
        Alert.alert(
          'Email Verification Required',
          'Please check your email and click the verification link to activate your account.',
          [
            { text: 'OK', style: 'default' },
          ]
        );
      } else if (
        errorCode === 'invalid_credentials' ||
        errorMessage.includes('invalid login credentials') ||
        errorMessage.includes('invalid credentials')
      ) {
        setError('Invalid email or password');
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      const result = await signInWithGoogle();

      if (result.success) {
        // Check onboarding status
        const hasCompletedOnboarding = await checkOnboardingStatus();

        if (hasCompletedOnboarding) {
          signalOnboardingComplete();
        } else {
          const hasTierSelected = await checkTierSelection();
          if (hasTierSelected) {
            navigation.replace('WhyTransFitness');
          } else {
            navigation.replace('TierSelection');
          }
        }
      } else if (result.error && result.error !== 'Sign-in was cancelled' && result.error !== 'Sign-in was dismissed') {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          <Text style={headerStyles.title}>Log In</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome */}
          <Text style={styles.welcome}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtext}>
            Sign in to continue your fitness journey
          </Text>

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
            <View style={[
              styles.inputContainer,
              emailFocused && styles.inputContainerFocused,
            ]}>
              <LinearGradient
                colors={gradients.inputBg}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glassHighlight} />
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? colors.accent.primary : colors.text.tertiary}
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
                editable={!loading}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.inputContainer,
              passwordFocused && styles.inputContainerFocused,
            ]}>
              <LinearGradient
                colors={gradients.inputBg}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glassHighlight} />
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? colors.accent.primary : colors.text.tertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.disabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!loading}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={colors.text.tertiary}
                />
              </Pressable>
            </View>
          </View>

          {/* Forgot Password */}
          <Pressable
            style={({ pressed }) => [
              styles.forgotPassword,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>

          {/* Login Button */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              (!canSubmit || loading) && styles.loginButtonDisabled,
              pressed && canSubmit && !loading && styles.buttonPressed,
            ]}
            onPress={handleLogin}
            disabled={!canSubmit || loading}
          >
            <LinearGradient
              colors={canSubmit && !loading
                ? [colors.accent.primary, colors.accent.primaryDark]
                : [colors.glass.bg, colors.glass.bg]
              }
              style={StyleSheet.absoluteFill}
            />
            {canSubmit && !loading && (
              <>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                  style={styles.buttonGlassOverlay}
                />
                <Animated.View
                  style={[
                    styles.buttonShimmer,
                    { transform: [{ translateX: shimmerTranslate }] },
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.15)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </>
            )}
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <Text style={[
                  styles.loginButtonText,
                  (!canSubmit) && styles.loginButtonTextDisabled,
                ]}>
                  Log In
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={canSubmit ? colors.text.inverse : colors.text.tertiary}
                />
              </>
            )}
          </Pressable>

          {/* Google Sign-In */}
          <OrDivider />

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={loading}
            mode="signin"
          />

          {/* Sign Up Link */}
          <View style={[styles.signupContainer, { marginTop: spacing.xl }]}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Pressable
              onPress={() => navigation.navigate('Signup')}
              style={({ pressed }) => pressed && styles.buttonPressed}
            >
              <Text style={styles.signupLink}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Note: header, headerTitle, backButton now use headerStyles from components.ts
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
  },
  welcome: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  welcomeSubtext: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
  inputContainerFocused: {
    borderColor: colors.accent.primary,
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
  eyeButton: {
    padding: spacing.m,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  loginButtonDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  loginButtonText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  loginButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.secondary,
  },
  signupLink: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});


