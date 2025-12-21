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
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
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
      'expo-notifications',
      'expo-web-browser',
      [
        '@react-native-google-signin/google-signin',
        {
          // Extract client ID suffix for URL scheme (format: com.googleusercontent.apps.CLIENT_ID_PREFIX)
          iosUrlScheme: process.env.GOOGLE_IOS_CLIENT_ID
            ? `com.googleusercontent.apps.${process.env.GOOGLE_IOS_CLIENT_ID.split('.')[0]}`
            : 'com.googleusercontent.apps.590532149610-c7k0i9bp5b2uom336v5ishq7to834nbe',
          iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '590532149610-c7k0i9bp5b2uom336v5ishq7to834nbe.apps.googleusercontent.com',
        },
      ],
    ],
  },
};

