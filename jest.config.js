const { getDefaultConfig } = require('@expo/metro-config');

// Get Expo's Metro config to access resolver settings
const metroConfig = getDefaultConfig(__dirname);

// Extract source extensions and asset extensions from Metro config
const sourceExts = metroConfig.resolver?.sourceExts || ['js', 'jsx', 'ts', 'tsx', 'json'];
const assetExts = metroConfig.resolver?.assetExts || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Use Expo's Metro resolver patterns for transform ignore
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
  // Module name mapper for path aliases and asset handling
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle asset imports (images, fonts, etc.) - Expo's Metro config handles these
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__tests__/mocks/json.ts',
  },
  // Use source extensions from Metro config
  moduleFileExtensions: [...sourceExts, 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
};

