import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import { glassStyles, textStyles } from '../../theme/components';

interface SelectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export default function SelectionCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: SelectionCardProps) {
  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.7}
      style={[
        glassStyles.card,
        styles.card,
        selected && styles.cardSelected,
      ]}
    >
      <View style={styles.content}>
        <View style={[glassStyles.circle, styles.iconCircle]}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={selected ? colors.cyan[500] : colors.text.secondary} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={textStyles.h3}>{title}</Text>
          <Text style={[textStyles.bodySmall, styles.description]}>
            {description}
          </Text>
        </View>
        {selected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={20} color={colors.text.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.cyan[500],
    backgroundColor: colors.glass.bgHero,
  },
  content: {
    flexDirection: 'row',
    gap: spacing.base,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  description: {
    lineHeight: 20,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cyan[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});