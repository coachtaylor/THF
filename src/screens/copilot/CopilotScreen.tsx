// Copilot Screen
// PRD 3.0: Simple chat for questions about workouts, binding, HRT, surgery
// Uses retrieval-based responses with red flag deflection

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatBubble, CopilotInput } from '../../components/copilot';
import {
  generateResponse,
  getWelcomeMessage,
  getSuggestedQuestions,
  CopilotMessage,
  UserContext,
} from '../../services/copilot';
import { useProfile } from '../../hooks/useProfile';
import { useCopilotEntitlement } from '../../hooks/useEntitlement';
import { colors, spacing, borderRadius } from '../../theme/theme';

// Storage key for daily question count
const COPILOT_DAILY_COUNT_KEY = 'copilot_daily_count';

interface DailyQuestionCount {
  date: string; // ISO date string (YYYY-MM-DD)
  count: number;
}

// Get today's date as YYYY-MM-DD
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Load daily question count from storage
async function getDailyQuestionCount(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(COPILOT_DAILY_COUNT_KEY);
    if (!stored) return 0;

    const data: DailyQuestionCount = JSON.parse(stored);
    // Reset count if it's a new day
    if (data.date !== getTodayDateString()) {
      return 0;
    }
    return data.count;
  } catch {
    return 0;
  }
}

// Save daily question count to storage
async function incrementDailyQuestionCount(): Promise<number> {
  try {
    const today = getTodayDateString();
    const currentCount = await getDailyQuestionCount();
    const newCount = currentCount + 1;

    const data: DailyQuestionCount = {
      date: today,
      count: newCount,
    };
    await AsyncStorage.setItem(COPILOT_DAILY_COUNT_KEY, JSON.stringify(data));
    return newCount;
  } catch {
    return 0;
  }
}

export default function CopilotScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const { profile } = useProfile();
  const { isPremium, dailyLimit } = useCopilotEntitlement();

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questionsAskedToday, setQuestionsAskedToday] = useState(0);

  // Load question count on mount
  useEffect(() => {
    getDailyQuestionCount().then(setQuestionsAskedToday);
  }, []);

  // Calculate remaining questions
  const remainingQuestions = isPremium
    ? Infinity
    : Math.max(0, dailyLimit - questionsAskedToday);
  const canAsk = isPremium || remainingQuestions > 0;

  // Build user context from profile
  const userContext: UserContext | undefined = profile
    ? {
        binds_chest: profile.binds_chest,
        on_hrt: profile.on_hrt,
        has_surgery: profile.surgeries && profile.surgeries.length > 0,
        hrt_type: profile.hrt_type as UserContext['hrt_type'],
        primary_goal: profile.primary_goal,
        fitness_experience: profile.fitness_experience,
      }
    : undefined;

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMsg = getWelcomeMessage(userContext);
    setMessages([welcomeMsg]);
  }, []);

  const suggestedQuestions = getSuggestedQuestions(userContext);

  const handleSend = async (text: string) => {
    // Check if user can ask (free tier limit)
    if (!canAsk) {
      navigation.navigate('Paywall');
      return;
    }

    // Add user message
    const userMessage: CopilotMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Increment question count for free users
      if (!isPremium) {
        const newCount = await incrementDailyQuestionCount();
        setQuestionsAskedToday(newCount);
      }

      // Generate response
      const response = await generateResponse(text, userContext);
      setMessages(prev => [...prev, response]);

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error generating response:', error);

      // Add error message
      const errorMessage: CopilotMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  const handleClearChat = () => {
    const welcomeMsg = getWelcomeMessage(userContext);
    setMessages([welcomeMsg]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.s }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.accent.primary} />
          </View>
          <Text style={styles.headerTitle}>Copilot</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaBadgeText}>BETA</Text>
          </View>
        </View>

        <Pressable onPress={handleClearChat} hitSlop={8}>
          <Ionicons name="refresh" size={22} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Questions Remaining Banner (Free users only) */}
      {!isPremium && (
        <View style={styles.questionLimitBanner}>
          {canAsk ? (
            <>
              <Ionicons name="chatbubble-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.questionLimitText}>
                {remainingQuestions} question{remainingQuestions !== 1 ? 's' : ''} remaining today
              </Text>
            </>
          ) : (
            <Pressable
              style={styles.limitReachedContainer}
              onPress={() => navigation.navigate('Paywall')}
            >
              <Ionicons name="lock-closed" size={14} color={colors.accent.secondary} />
              <Text style={styles.limitReachedText}>
                Daily limit reached.{' '}
                <Text style={styles.upgradeLink}>Upgrade for unlimited</Text>
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Chat Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          </View>
        )}

        {/* Suggested Questions - show at bottom when chat is short */}
        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Quick questions:</Text>
            <View style={styles.suggestionsGrid}>
              {suggestedQuestions.map((question, index) => (
                <Pressable
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestedQuestion(question)}
                >
                  <Text style={styles.suggestionText}>{question}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Disclaimer */}
      <View style={styles.disclaimerBar}>
        <Ionicons name="information-circle-outline" size={14} color={colors.text.tertiary} />
        <Text style={styles.disclaimerText}>
          Not medical advice. Always consult your healthcare provider.
        </Text>
      </View>

      {/* Input */}
      <CopilotInput
        onSend={handleSend}
        disabled={isLoading}
        placeholder="Ask about binding, HRT, post-op..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  betaBadge: {
    backgroundColor: colors.accent.secondaryMuted,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  betaBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '700',
    color: colors.accent.secondary,
    letterSpacing: 0.5,
  },
  questionLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.s,
    backgroundColor: colors.glass.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  questionLimitText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  limitReachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  limitReachedText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.accent.secondary,
  },
  upgradeLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: spacing.m,
  },
  loadingContainer: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  loadingBubble: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    alignSelf: 'flex-start',
    marginLeft: 40, // Account for avatar space
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.tertiary,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
  },
  suggestionsTitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginBottom: spacing.m,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  suggestionChip: {
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  suggestionText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
  },
  disclaimerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: colors.glass.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  disclaimerText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
  },
});
