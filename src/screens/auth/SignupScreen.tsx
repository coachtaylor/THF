import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../theme/theme';

export default function SignupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const { signup } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
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
    ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength] || 'Weak';
  const passwordStrengthColor =
    [
      colors.error,
      '#FF6B00',
      colors.warning,
      colors.accent.primary,
      colors.success,
    ][passwordStrength] || colors.error;

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

      await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });

      // Navigate to email verification screen
      navigation.replace('EmailVerification', {
        email,
      });
    } catch (err: any) {
      console.error('Signup failed:', err);
      setError(err.message || 'Signup failed. Please try again.');
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.m }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Account</Text>
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
          <Text style={styles.welcome}>Let's Get Started!</Text>
          <Text style={styles.welcomeSubtext}>
            Create your account to begin your journey
          </Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Name Row */}
          <View style={styles.nameRow}>
            {/* First Name */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={[
                styles.inputContainer,
                firstNameFocused && styles.inputContainerFocused,
              ]}>
                <LinearGradient
                  colors={['#141418', '#0A0A0C']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.glassHighlight} />
                <TextInput
                  style={styles.input}
                  placeholder="Alex"
                  placeholderTextColor={colors.text.disabled}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoComplete="name-given"
                  editable={!loading}
                  onFocus={() => setFirstNameFocused(true)}
                  onBlur={() => setFirstNameFocused(false)}
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={[
                styles.inputContainer,
                lastNameFocused && styles.inputContainerFocused,
              ]}>
                <LinearGradient
                  colors={['#141418', '#0A0A0C']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.glassHighlight} />
                <TextInput
                  style={styles.input}
                  placeholder="Rodriguez"
                  placeholderTextColor={colors.text.disabled}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoComplete="name-family"
                  editable={!loading}
                  onFocus={() => setLastNameFocused(true)}
                  onBlur={() => setLastNameFocused(false)}
                />
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[
              styles.inputContainer,
              emailFocused && styles.inputContainerFocused,
            ]}>
              <LinearGradient
                colors={['#141418', '#0A0A0C']}
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
                placeholder="alex@example.com"
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

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.inputContainer,
              passwordFocused && styles.inputContainerFocused,
            ]}>
              <LinearGradient
                colors={['#141418', '#0A0A0C']}
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
                placeholder="Create a password"
                placeholderTextColor={colors.text.disabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
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
                <Text style={[styles.strengthLabel, { color: passwordStrengthColor }]}>
                  {passwordStrengthLabel}
                </Text>
              </View>
            )}

            {/* Password Requirements */}
            <View style={styles.requirements}>
              <View style={styles.requirement}>
                <Ionicons
                  name={password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={password.length >= 8 ? colors.success : colors.text.disabled}
                />
                <Text style={[
                  styles.requirementText,
                  password.length >= 8 && styles.requirementMet,
                ]}>
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[A-Z]/.test(password) ? colors.success : colors.text.disabled}
                />
                <Text style={[
                  styles.requirementText,
                  /[A-Z]/.test(password) && styles.requirementMet,
                ]}>
                  One uppercase letter
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[0-9]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[0-9]/.test(password) ? colors.success : colors.text.disabled}
                />
                <Text style={[
                  styles.requirementText,
                  /[0-9]/.test(password) && styles.requirementMet,
                ]}>
                  One number
                </Text>
              </View>
            </View>
          </View>

          {/* Signup Button */}
          <Pressable
            style={({ pressed }) => [
              styles.signupButton,
              (!canSubmit || loading) && styles.signupButtonDisabled,
              pressed && canSubmit && !loading && styles.buttonPressed,
            ]}
            onPress={handleSignup}
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
                  styles.signupButtonText,
                  (!canSubmit) && styles.signupButtonTextDisabled,
                ]}>
                  Create Account
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={canSubmit ? colors.text.inverse : colors.text.tertiary}
                />
              </>
            )}
          </Pressable>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => pressed && styles.buttonPressed}
            >
              <Text style={styles.loginLink}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.m,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.l,
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
  nameRow: {
    flexDirection: 'row',
    gap: spacing.m,
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
    backgroundColor: colors.border.default,
  },
  strengthLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
  },
  requirements: {
    marginTop: spacing.m,
    gap: spacing.xs,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  requirementText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.disabled,
  },
  requirementMet: {
    color: colors.text.secondary,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    marginTop: spacing.m,
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
  signupButtonDisabled: {
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
  signupButtonText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  signupButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
});
