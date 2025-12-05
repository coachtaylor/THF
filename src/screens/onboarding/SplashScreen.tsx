import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import type { OnboardingStackParamList } from '../../types/onboarding';
import { colors, spacing, borderRadius } from '../../theme/theme';

type SplashScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Staggered animations
    Animated.parallel([
      // Middle content (title)
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Bottom button
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(buttonAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(buttonSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Welcome');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/onboarding-hero-pullup-corrected.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
        imageStyle={styles.imageStyle}
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.8)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />

        {/* Content */}
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl * 2) }]}>
            {/* Middle Section - Main Message */}
            <Animated.View
              style={[
                styles.middleSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>TRANS HEALTH &</Text>
                <Text style={styles.mainTitleSecond}>FITNESS</Text>
              </View>
            </Animated.View>

            {/* Bottom Section - CTA */}
            <Animated.View
              style={[
                styles.bottomSection,
                {
                  opacity: buttonAnim,
                  transform: [{ translateY: buttonSlideAnim }],
                },
              ]}
            >
              {/* Get Started Button */}
              <TouchableOpacity
                onPress={handleGetStarted}
                style={styles.getStartedButton}
                activeOpacity={0.8}
              >
                <View style={styles.buttonInner}>
                  <Text style={styles.getStartedText}>Get Started</Text>
                  <View style={styles.iconCircle}>
                    <View style={styles.iconCircleGlow} />
                    <MaterialCommunityIcons name="dumbbell" size={22} color="#FFFFFF" style={{ transform: [{ scaleX: -1 }] }} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Privacy Notice */}
              <View style={styles.privacyNotice}>
                <View style={styles.privacyIconContainer}>
                  <MaterialCommunityIcons name="lock" size={18} color="rgba(255, 255, 255, 0.7)" />
                </View>
                <Text style={styles.privacyText}>
                  Your data stays private. All information is stored locally on your device.
                </Text>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    opacity: 1,
    left: 30,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 1.5,
    justifyContent: 'space-between',
  },
  middleSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  mainTitle: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    lineHeight: 32 * 1.4,
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  mainTitleSecond: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 8,
    lineHeight: 32 * 1.4,
    color: '#B8B8B8',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bottomSection: {
    gap: spacing.base,
  },
  getStartedButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2A2A2E',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  buttonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.xl,
    paddingRight: 4,
    gap: spacing.xl,
  },
  getStartedText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: '#8A8A8E',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3A3A3E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconCircleGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  privacyNotice: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  privacyIconContainer: {
    paddingTop: 2,
  },
  privacyText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 13 * 1.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

