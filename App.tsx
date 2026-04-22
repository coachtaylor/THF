import React, { useState, useEffect } from "react";
import {
  NavigationContainer,
  useNavigationContainerRef,
  LinkingOptions,
} from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import * as Sentry from "@sentry/react-native";
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Anton_400Regular } from "@expo-google-fonts/anton";
import "./src/index.css";
import OnboardingNavigator from "./src/navigation/OnboardingNavigator";
import MainNavigator from "./src/navigation/MainNavigator";
import { checkOnboardingStatus } from "./src/services/storage/onboarding";
import { initializeApp } from "./src/services/init";
import { setupDeepLinking } from "./src/services/auth/deepLinking";
import {
  onOnboardingComplete,
  clearOnboardingCallback,
  onLogout,
  clearLogoutCallback,
} from "./src/services/events/onboardingEvents";
import { AuthProvider } from "./src/contexts/AuthContext";
import { SubscriptionProvider } from "./src/contexts/SubscriptionContext";
import { ToastProvider } from "./src/contexts/ToastContext";
import { SensoryModeProvider } from "./src/contexts/SensoryModeContext";
import { SyncProvider } from "./src/contexts/SyncContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { NetworkProvider } from "./src/contexts/NetworkContext";
import { theme } from "./src/theme";
import ErrorBoundary from "./src/components/common/ErrorBoundary";

/**
 * Sensitive field patterns that should be scrubbed from error reports
 * These patterns match field names that contain sensitive health data
 */
const SENSITIVE_PATTERNS = [
  // HRT-related
  /hrt/i,
  /hormone/i,
  /estrogen/i,
  /testosterone/i,
  /injection/i,
  // Surgery-related
  /surgery/i,
  /surgical/i,
  /operative/i,
  /recovery/i,
  /top.?surgery/i,
  /bottom.?surgery/i,
  /vaginoplasty/i,
  /phalloplasty/i,
  /mastectomy/i,
  /orchiectomy/i,
  // Binding-related
  /bind/i,
  /binder/i,
  /chest/i,
  // Dysphoria-related
  /dysphoria/i,
  /trigger/i,
  // Personal identifiers
  /email/i,
  /password/i,
  /token/i,
  /user_?id/i,
  /birth/i,
  /gender/i,
  /identity/i,
];

/**
 * Scrub sensitive data from a string
 */
function scrubSensitiveString(str: string): string {
  if (!str || typeof str !== 'string') return str;

  let result = str;

  // Scrub email addresses
  result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');

  // Scrub UUIDs (user IDs, etc.)
  result = result.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[UUID_REDACTED]');

  // Scrub JWT tokens
  result = result.replace(/eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[TOKEN_REDACTED]');

  // Scrub dates that might be medical dates
  result = result.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[DATE_REDACTED]');

  // Scrub sensitive field names and their values in JSON-like patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    // Match "field_name": "value" or "field_name":value patterns
    const fieldPattern = new RegExp(
      `"?([^"]*${pattern.source}[^"]*)"?\\s*[:=]\\s*("[^"]*"|[^,}\\]\\s]+)`,
      'gi'
    );
    result = result.replace(fieldPattern, '"$1": "[REDACTED]"');
  }

  return result;
}

/**
 * Deep scrub an object for sensitive data
 */
function scrubSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return scrubSensitiveString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(scrubSensitiveData);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      // Check if key matches sensitive patterns
      const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitiveKey) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = scrubSensitiveData(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

// Initialize Sentry for error tracking
// Privacy-safe: Enhanced PII filtering for trans health data
Sentry.init({
  dsn: process.env.SENTRY_DSN || "", // Add your Sentry DSN to .env
  enabled: !__DEV__,
  debug: __DEV__, // Enable debug mode in development
  tracesSampleRate: 0.2, // Sample 20% of transactions for performance monitoring

  // SECURITY: Comprehensive PII and health data scrubbing
  beforeSend(event) {
    // Remove any potential PII from the user object
    if (event.user) {
      delete event.user.id;
      delete event.user.email;
      delete event.user.username;
      delete event.user.ip_address;
    }

    // Scrub error messages for sensitive health data
    if (event.message) {
      event.message = scrubSensitiveString(event.message);
    }

    // Scrub exception values
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.value) {
          exception.value = scrubSensitiveString(exception.value);
        }
        // Scrub stack trace local variables if present
        if (exception.stacktrace?.frames) {
          for (const frame of exception.stacktrace.frames) {
            if (frame.vars) {
              frame.vars = scrubSensitiveData(frame.vars);
            }
          }
        }
      }
    }

    // Scrub extra data
    if (event.extra) {
      event.extra = scrubSensitiveData(event.extra);
    }

    // Scrub contexts
    if (event.contexts) {
      event.contexts = scrubSensitiveData(event.contexts);
    }

    // Scrub tags
    if (event.tags) {
      event.tags = scrubSensitiveData(event.tags);
    }

    return event;
  },

  // SECURITY: Enhanced breadcrumb filtering
  beforeBreadcrumb(breadcrumb) {
    // Filter out console breadcrumbs that might contain sensitive info
    if (breadcrumb.category === "console") {
      return null;
    }

    // Filter out navigation breadcrumbs with sensitive route params
    if (breadcrumb.category === "navigation") {
      if (breadcrumb.data) {
        breadcrumb.data = scrubSensitiveData(breadcrumb.data);
      }
    }

    // Filter out fetch/xhr breadcrumbs with sensitive URLs or data
    if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
      if (breadcrumb.data?.url) {
        // Scrub query parameters that might contain tokens
        breadcrumb.data.url = breadcrumb.data.url
          .replace(/token[^&]*/gi, 'token=[REDACTED]')
          .replace(/email=[^&]*/gi, 'email=[REDACTED]');
      }
      if (breadcrumb.data?.body) {
        breadcrumb.data.body = '[BODY_REDACTED]';
      }
    }

    // Scrub any message content
    if (breadcrumb.message) {
      breadcrumb.message = scrubSensitiveString(breadcrumb.message);
    }

    return breadcrumb;
  },

  // SECURITY: Don't attach user identity
  autoSessionTracking: true,
  enableAutoSessionTracking: true,

  // Additional privacy settings
  sendDefaultPii: false,
});

// Deep linking configuration for React Navigation
const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    Linking.createURL("/"),
    "transfitness://",
    "https://transfitness.app",
  ],
  config: {
    screens: {
      // Auth screens (OnboardingNavigator)
      Login: "login",
      EmailVerification: "verify-email",
      ResetPassword: "reset-password",
      // Main app screens
      Home: "home",
      Workouts: "workouts",
      Progress: "progress",
      Settings: "settings",
    },
  },
};

export default Sentry.wrap(function App() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Anton_400Regular,
    // Map to simple names for easier use
    Poppins: Poppins_400Regular,
    "Poppins-Light": Poppins_300Light,
    "Poppins-Medium": Poppins_500Medium,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "Poppins-Bold": Poppins_700Bold,
    Anton: Anton_400Regular,
  });

  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    initialize();
  }, []);

  // Listen for onboarding completion event
  useEffect(() => {
    onOnboardingComplete(() => {
      if (__DEV__) console.log("📱 App received onboarding complete signal");
      setHasCompletedOnboarding(true);
    });

    return () => {
      clearOnboardingCallback();
    };
  }, []);

  // Listen for logout event
  useEffect(() => {
    onLogout(() => {
      if (__DEV__) console.log("📱 App received logout signal");
      setHasCompletedOnboarding(false);
    });

    return () => {
      clearLogoutCallback();
    };
  }, []);

  useEffect(() => {
    // Setup deep linking once navigation is ready
    if (isReady && navigationRef.current) {
      const cleanup = setupDeepLinking(navigationRef.current);
      return cleanup;
    }
  }, [isReady, navigationRef]);

  const initialize = async () => {
    try {
      // Initialize database, storage, services
      await initializeApp();

      // Check if user has completed onboarding
      const completed = await checkOnboardingStatus();

      // Debug logging (development only) - SECURITY: Do not log sensitive profile fields
      if (__DEV__) {
        console.log("🔍 App initialization - Onboarding status:", completed);
        const { getProfile } =
          await import("./src/services/storage/profile");
        const profile = await getProfile();
        console.log(
          "🔍 Current profile on app start:",
          profile ? "EXISTS" : "NULL",
        );
      }

      setHasCompletedOnboarding(completed);

      setIsReady(true);
    } catch (error) {
      console.error("❌ App initialization failed:", error);
      setIsReady(true); // Still show app even if initialization fails
    }
  };

  if (!fontsLoaded || !isReady) {
    return null; // Wait for fonts and initialization
  }

  if (__DEV__) {
    console.log(
      "🔍 App render - hasCompletedOnboarding:",
      hasCompletedOnboarding,
    );
    console.log(
      "🔍 App render - Rendering:",
      hasCompletedOnboarding ? "MainNavigator" : "OnboardingNavigator",
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors.background }}>
      <PaperProvider theme={theme}>
        <NetworkProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>
                <SensoryModeProvider>
                  <SyncProvider>
                    <SubscriptionProvider>
                      <NavigationContainer ref={navigationRef} linking={linking}>
                        <ErrorBoundary>
                          {hasCompletedOnboarding ? (
                            <MainNavigator />
                          ) : (
                            <OnboardingNavigator />
                          )}
                        </ErrorBoundary>
                      </NavigationContainer>
                    </SubscriptionProvider>
                  </SyncProvider>
                </SensoryModeProvider>
              </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </NetworkProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
});
