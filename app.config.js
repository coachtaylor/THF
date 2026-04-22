import 'dotenv/config';

export default {
  expo: {
    name: 'TransFitness',
    slug: 'transfitness',
    scheme: 'transfitness',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#0A0A0C',
    },
    extra: {
      // SECURITY: API keys must be provided via environment variables
      // For production builds, use EAS Secrets: eas secret:create
      // Empty strings will trigger runtime validation warnings
      supabaseUrl: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
      eas: {
        projectId: 'e0993d53-6954-4acc-80e6-abfb3c5b8e4e',
      },
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.transfitness.app',
      buildNumber: '1',
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
      },
      entitlements: {
        'aps-environment': 'production',
      },
      associatedDomains: [
        'applinks:transfitness.app',
        'applinks:www.transfitness.app',
      ],
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0A0C',
      },
      package: 'com.transfitness.app',
      versionCode: 1,
      permissions: [],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'transfitness.app',
              pathPrefix: '/',
            },
            {
              scheme: 'https',
              host: 'www.transfitness.app',
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-av',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#00D9C0',
          sounds: [],
          android: {
            useNextNotificationsApi: true,
          },
        },
      ],
      'expo-web-browser',
      [
        '@react-native-google-signin/google-signin',
        {
          // Extract client ID suffix for URL scheme (format: com.googleusercontent.apps.CLIENT_ID_PREFIX)
          // SECURITY: Must be provided via environment variables
          iosUrlScheme: (process.env.GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
            ? `com.googleusercontent.apps.${(process.env.GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID).split('.')[0]}`
            : '',
          iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          organization: process.env.SENTRY_ORG || 'your-org', // Set your Sentry org in .env
          project: process.env.SENTRY_PROJECT || 'transfitness', // Set your Sentry project in .env
        },
      ],
    ],
  },
};

