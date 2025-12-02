import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { statCardStyles } from '../../theme/components';

type StatColorVariant = 'red' | 'cyan';

interface StatCardProps {
  value: number | string;
  label: string;
  colorVariant: StatColorVariant;
}

export default function StatCard({ value, label, colorVariant }: StatCardProps) {
  const valueStyle = colorVariant === 'red' ? statCardStyles.valueRed : statCardStyles.valueCyan;

  return (
    <View style={statCardStyles.card}>
      {/* Label at top */}
      <View style={statCardStyles.topSection}>
        <Text style={statCardStyles.label}>{label}</Text>
      </View>
      
      {/* Value at bottom */}
      <Text style={valueStyle}>{value}</Text>
    </View>
  );
}