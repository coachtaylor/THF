// Note: jest-expo handles React Native mocking automatically

// Mock expo modules
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

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

