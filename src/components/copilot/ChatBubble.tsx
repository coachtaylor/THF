// Chat Bubble Component for Copilot
// Displays user and assistant messages with appropriate styling

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { CopilotMessage } from '../../services/copilot';

interface ChatBubbleProps {
  message: CopilotMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isRedFlag = message.metadata?.isRedFlag;

  return (
    <View style={[styles.container, isUser && styles.containerUser]}>
      {!isUser && (
        <View style={[styles.avatar, isRedFlag && styles.avatarWarning]}>
          <Ionicons
            name={isRedFlag ? 'warning' : 'chatbubble-ellipses'}
            size={16}
            color={isRedFlag ? colors.warning : colors.accent.primary}
          />
        </View>
      )}

      <View style={[styles.bubbleContainer, isUser && styles.bubbleContainerUser]}>
        {isUser ? (
          <View style={styles.userBubble}>
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.primaryDark]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.userText}>{message.content}</Text>
          </View>
        ) : (
          <View style={[styles.assistantBubble, isRedFlag && styles.warningBubble]}>
            {isRedFlag && (
              <LinearGradient
                colors={['rgba(251, 191, 36, 0.1)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text style={styles.assistantText}>{formatMarkdown(message.content)}</Text>

            {message.metadata?.relatedGuide && (
              <View style={styles.guideBadge}>
                <Ionicons name="book-outline" size={12} color={colors.accent.primary} />
                <Text style={styles.guideBadgeText}>
                  See {message.metadata.relatedGuide === 'binder_safety' ? 'Binder Safety' : 'Post-Op'} Guide
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {isUser && (
        <View style={styles.avatarUser}>
          <Ionicons name="person" size={16} color={colors.text.inverse} />
        </View>
      )}
    </View>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMarkdown(text: string): string {
  // Simple markdown-like formatting - just clean up for now
  // In a full implementation, you'd use a markdown renderer
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers (we'd style separately)
    .replace(/\*(.*?)\*/g, '$1');     // Remove italic markers
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    paddingHorizontal: spacing.m,
    alignItems: 'flex-start',
  },
  containerUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  avatarWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.s,
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  bubbleContainerUser: {
    alignItems: 'flex-end',
  },
  userBubble: {
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  userText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.inverse,
    lineHeight: 20,
  },
  assistantBubble: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    overflow: 'hidden',
  },
  warningBubble: {
    borderColor: colors.warning,
  },
  assistantText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 22,
  },
  guideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.s,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  guideBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.accent.primary,
  },
  timestamp: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  timestampUser: {
    textAlign: 'right',
  },
});
