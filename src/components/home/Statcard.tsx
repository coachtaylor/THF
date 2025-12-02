import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { statCardStyles, getStatCardIconColor } from '../../theme/components';
import { colors } from '../../theme/theme';

type StatColorVariant = 'red' | 'cyan';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  colorVariant: StatColorVariant;
}

export default function StatCard({ icon, value, label, colorVariant }: StatCardProps) {
  const valueStyle = colorVariant === 'red' ? statCardStyles.valueRed : statCardStyles.valueCyan;
  const iconColor = getStatCardIconColor(colorVariant);

  return (
    <View style={statCardStyles.card}>
      <Ionicons 
        name={icon} 
        size={20} 
        color={iconColor} 
        style={statCardStyles.icon} 
      />
      <Text style={valueStyle}>{value}</Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </View>
  );
}