// Note: jest-expo handles React Native mocking automatically

// Mock expo modules
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    withTransactionSync: jest.fn((callback) => callback()),
    execSync: jest.fn(),
    prepareSync: jest.fn(() => ({
      executeSync: jest.fn(() => ({
        getAllSync: jest.fn(() => []),
      })),
      finalizeSync: jest.fn(),
    })),
  })),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const React = require('react');
  const RN = require('react-native');
  
  const MockButton = ({ children, onPress, disabled, ...props }) => (
    <RN.TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      testID={props.testID || 'button'}
      accessibilityRole="button"
    >
      <RN.Text>{children}</RN.Text>
    </RN.TouchableOpacity>
  );
  
  const MD3DarkTheme = {
    dark: true,
    colors: {
      primary: '#00D9C0',
      background: '#0A0E0E',
      surface: '#1A1F1F',
    },
  };
  
  return {
    Provider: ({ children }) => children,
    Button: MockButton,
    PaperProvider: ({ children }) => children,
    MD3DarkTheme,
  };
});

// useWindowDimensions is mocked by jest-expo

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock safety rules config loader with test data
jest.mock('./src/services/rulesEngine/configLoader', () => {
  const mockConfig = {
    hrt_estrogen_phases: {
      initial: { min_months: 0, max_months: 1, volume_reduction_percent: 20 },
      early: { min_months: 1, max_months: 3, volume_reduction_percent: 15 },
      adaptation: { min_months: 3, max_months: 6, recovery_multiplier: 1.1 },
    },
    hrt_testosterone_phases: {
      initial: { min_months: 0, max_months: 1, progressive_overload_rate: 0.9, tendon_warning: true },
      early: { min_months: 1, max_months: 3, tendon_warning: true },
      accelerating: { min_months: 6, max_months: 12, progressive_overload_rate: 1.1 },
      peak: { min_months: 24, max_months: 999, progressive_overload_rate: 1.2 },
    },
    hrt_dual_phases: {},
    hrt_body_distribution: {
      mtf_feminization: { lower_body_percent: 65, upper_body_percent: 35 },
      ftm_masculinization: { upper_body_percent: 55, lower_body_percent: 45 },
    },
    binding: {
      commercial: { volume_reduction_percent: 25, rest_seconds_increase: 30 },
      ace_bandage: { volume_reduction_percent: 40, rest_seconds_increase: 45, max_workout_minutes: 30 },
      diy: { volume_reduction_percent: 40, rest_seconds_increase: 45, max_workout_minutes: 30 },
      long_duration: { volume_reduction_percent: 25, rest_seconds_increase: 30, duration_threshold_hours: 8 },
    },
    post_op: {
      top_surgery: [
        {
          weeks_start: 0,
          weeks_end: 6,
          blocked_patterns: ['push', 'pull'],
          blocked_muscle_groups: ['chest', 'shoulders'],
        },
        {
          weeks_start: 6,
          weeks_end: 12,
          volume_reduction_percent: 30,
          max_sets: 3,
          max_weight: '60% 1RM',
        },
      ],
      vaginoplasty: [
        {
          weeks_start: 0,
          weeks_end: 6,
          blocked_patterns: ['squat', 'hinge', 'lunge'],
          blocked_muscle_groups: ['glutes', 'hamstrings', 'adductors'],
        },
        {
          weeks_start: 6,
          weeks_end: 12,
          volume_reduction_percent: 40,
          max_sets: 2,
        },
      ],
      ffs: [
        {
          weeks_start: 0,
          weeks_end: 6,
          blocked_patterns: ['inversion'],
        },
      ],
      phalloplasty: [],
      metoidioplasty: [],
      orchiectomy: [],
      hysterectomy: [],
      breast_augmentation: [],
    },
    dysphoria: [
      {
        trigger: 'looking_at_chest',
        filter_type: 'soft_filter',
        deprioritize_tags: ['chest_focus'],
        prefer_tags: ['back_focus'],
      },
      {
        trigger: 'mirrors',
        filter_type: 'exclude',
        exclude_tags: ['requires_mirror'],
      },
      {
        trigger: 'body_contact',
        filter_type: 'exclude',
        exclude_tags: ['partner_exercise'],
      },
    ],
  };

  return {
    loadSafetyConfig: jest.fn(async () => mockConfig),
    getHrtPhaseConfig: jest.fn((hrtType, phaseName) => {
      if (hrtType === 'estrogen') return mockConfig.hrt_estrogen_phases[phaseName] || null;
      if (hrtType === 'testosterone') return mockConfig.hrt_testosterone_phases[phaseName] || null;
      return null;
    }),
    getBindingConfig: jest.fn((binderType) => mockConfig.binding[binderType] || null),
    getPostOpConfig: jest.fn((surgeryType) => mockConfig.post_op[surgeryType] || []),
    clearConfigCache: jest.fn(),
    isConfigLoaded: jest.fn(() => true),
  };
});

// Mock SensoryModeContext (used by most screens and GlassCard)
jest.mock('./src/contexts/SensoryModeContext', () => ({
  useSensoryMode: jest.fn(() => ({
    lowSensoryMode: false,
    disableAnimations: false,
    disableSounds: false,
    disableHaptics: false,
    hideMedia: false,
    reduceVisualComplexity: false,
  })),
  SensoryModeProvider: ({ children }) => children,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const MockIcon = ({ name, ...props }) => <Text {...props}>{name}</Text>;
  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
    FontAwesome: MockIcon,
    Feather: MockIcon,
  };
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy({}, {
    get: () => (props) => <Text>{props.name || 'icon'}</Text>,
  });
});

// Mock Supabase for exercise filtering tests
jest.mock('./src/utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [
            { id: 1, name: 'Push-up', pattern: 'push', binder_aware: true, contraindications: [] },
            { id: 2, name: 'Squat', pattern: 'squat', pelvic_floor_safe: true, contraindications: [] },
          ],
          error: null,
        })),
      })),
    })),
  },
}));

// Mock react-native-reanimated (manual mock — reanimated/mock fails on Expo SDK 54+ due to ESM)
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      call: () => {},
      View,
      Text: require('react-native').Text,
      ScrollView: require('react-native').ScrollView,
      Image: require('react-native').Image,
      createAnimatedComponent: (component) => component,
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((val) => val),
    withSpring: jest.fn((val) => val),
    withDelay: jest.fn((_, val) => val),
    withSequence: jest.fn((...vals) => vals[vals.length - 1]),
    withRepeat: jest.fn((val) => val),
    FadeIn: { duration: () => ({ delay: () => ({}) }) },
    FadeOut: { duration: () => ({ delay: () => ({}) }) },
    FadeInDown: { duration: () => ({ delay: () => ({}) }) },
    FadeInUp: { duration: () => ({ delay: () => ({}) }) },
    SlideInRight: { duration: () => ({ delay: () => ({}) }) },
    SlideOutLeft: { duration: () => ({ delay: () => ({}) }) },
    Layout: { duration: () => ({}) },
    Easing: { bezier: () => {}, linear: 0, ease: 0 },
    createAnimatedComponent: (component) => component,
    Animated: { View, Text: require('react-native').Text },
    useAnimatedRef: jest.fn(() => ({ current: null })),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: 'clamp' },
  };
});

