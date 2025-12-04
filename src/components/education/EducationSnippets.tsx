// Education Snippets display component
// Shows contextual tips about binding, HRT, and post-op recovery

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { EducationSnippet, SnippetCategory } from '../../services/education/types';

interface EducationSnippetsProps {
  snippets: {
    binder?: EducationSnippet;
    hrt?: EducationSnippet;
    post_op?: EducationSnippet;
    recovery_general?: EducationSnippet;
  };
  maxVisible?: number;
}

// Icon and color mapping for each category
const CATEGORY_CONFIG: Record<
  SnippetCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
> = {
  binder: {
    icon: 'shirt',
    color: colors.accent.primary,
    bgColor: colors.accent.primaryMuted,
  },
  hrt: {
    icon: 'pulse',
    color: '#A78BFA', // Purple for HRT
    bgColor: 'rgba(167, 139, 250, 0.15)',
  },
  post_op: {
    icon: 'medical',
    color: colors.accent.secondary,
    bgColor: colors.accent.secondaryMuted,
  },
  recovery_general: {
    icon: 'heart',
    color: colors.accent.success,
    bgColor: colors.accent.successMuted,
  },
};

function SnippetCard({ snippet }: { snippet: EducationSnippet }) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[snippet.category];
  const isLongText = snippet.text.length > 120;
  const displayText = expanded || !isLongText
    ? snippet.text
    : snippet.text.slice(0, 120) + '...';

  return (
    <Pressable
      style={styles.snippetCard}
      onPress={() => isLongText && setExpanded(!expanded)}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.snippetHeader}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={16} color={config.color} />
        </View>
        {snippet.title && (
          <Text style={[styles.snippetTitle, { color: config.color }]}>
            {snippet.title}
          </Text>
        )}
      </View>

      <Text style={styles.snippetText}>{displayText}</Text>

      {isLongText && (
        <Text style={[styles.readMore, { color: config.color }]}>
          {expanded ? 'Show less' : 'Read more'}
        </Text>
      )}
    </Pressable>
  );
}

export default function EducationSnippets({
  snippets,
  maxVisible = 3,
}: EducationSnippetsProps) {
  // Collect all available snippets in priority order
  const allSnippets: EducationSnippet[] = [];

  // Priority order: binder > post_op > hrt > recovery_general
  if (snippets.binder) allSnippets.push(snippets.binder);
  if (snippets.post_op) allSnippets.push(snippets.post_op);
  if (snippets.hrt) allSnippets.push(snippets.hrt);
  if (snippets.recovery_general) allSnippets.push(snippets.recovery_general);

  // Limit to maxVisible
  const visibleSnippets = allSnippets.slice(0, maxVisible);

  if (visibleSnippets.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="book" size={16} color={colors.accent.primary} />
        </View>
        <Text style={styles.sectionTitle}>Helpful context for today</Text>
      </View>

      <View style={styles.snippetsContainer}>
        {visibleSnippets.map((snippet) => (
          <SnippetCard key={snippet.id} snippet={snippet} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  snippetsContainer: {
    gap: spacing.m,
  },
  snippetCard: {
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.m,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snippetTitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  snippetText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  readMore: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.s,
  },
});
