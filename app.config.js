import 'dotenv/config';

export default {
  expo: {
    name: 'TransFitness',
    slug: 'transfitness',
    scheme: 'transfitness',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.transfitness.app',
      buildNumber: '1',
      infoPlist: {
        NSUserTrackingUsageDescription:
          'We use analytics to improve the app. Your data is anonymized and never shared.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.transfitness.app',
      versionCode: 1,
      permissions: [],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-av', 'expo-notifications'],
  },
};

