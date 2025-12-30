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
      supabaseUrl: process.env.SUPABASE_URL || 'https://xqcwywoqumblogoyzkhf.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxY3d5d29xdW1ibG9nb3l6a2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjU1MDUsImV4cCI6MjA3ODcwMTUwNX0.RNXzHLU_uiWle3bE7ueWgkoW5F6zFLHc-NoS656s03I',
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || '590532149610-4o8ummmenngdprtbm71pr13bsakev3ps.apps.googleusercontent.com',
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '590532149610-c7k0i9bp5b2uom336v5ishq7to834nbe.apps.googleusercontent.com',
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '590532149610-sa5o2oitntrl40rsk8q986c9nkc7jbnf.apps.googleusercontent.com',
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

