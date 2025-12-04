import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { statCardStyles } from '../../theme/components';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { DumbbellIcon } from '../icons/DumbbellIcon';

type StatColorVariant = 'red' | 'cyan';

interface StatCardProps {
  value: number | string;
  label: string;
  colorVariant: StatColorVariant;
  iconType?: 'flame' | 'dumbbell' | 'time';
}

export default function StatCard({ value, label, colorVariant, iconType = 'dumbbell' }: StatCardProps) {
  const valueStyle = colorVariant === 'red' ? statCardStyles.valueRed : statCardStyles.valueCyan;
  
  const renderIcon = () => {
    const iconSize = 16;
    // Flame icon uses #F43F5E, others use white per Figma SVG
    const iconColor = iconType === 'flame' ? colors.red.flame : '#FFFFFF';
    
    if (iconType === 'flame') {
      return (
        <View style={styles.iconContainerRed}>
          <Ionicons name="flame" size={iconSize} color={iconColor} />
        </View>
      );
    } else if (iconType === 'dumbbell') {
      return (
        <View style={styles.iconContainerGray}>
          <DumbbellIcon size={iconSize} color={iconColor} />
        </View>
      );
    } else if (iconType === 'time') {
      return (
        <View style={styles.iconContainerGray}>
          <Ionicons name="time-outline" size={iconSize} color={iconColor} />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={statCardStyles.card}>
      {/* Icon at top */}
      <View style={styles.iconWrapper}>
        {renderIcon()}
      </View>
      
      {/* Value in middle */}
      <Text style={valueStyle} numberOfLines={1}>{value}</Text>
      
      {/* Label at bottom */}
      <Text style={statCardStyles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    // Spacing handled by card gap: 12px
    alignSelf: 'flex-start', // Align icon to left (align-items: flex-start from Figma)
  },
  iconContainerRed: {
    width: 32, // 32px diameter circle from Figma
    height: 32,
    borderRadius: 16, // Perfect circle
    backgroundColor: '#FEECEF', // background: #FEECEF from Figma
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerGray: {
    width: 32, // 32px diameter circle from Figma
    height: 32,
    borderRadius: 16, // Perfect circle
    backgroundColor: '#72777A', // background: #72777A from Figma
    justifyContent: 'center',
    alignItems: 'center',
  },
});