// src/components/exercise/ExerciseFilterBar.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';

export interface ExerciseFilters {
  targetMuscle: string | null;
  equipment: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  binderSafe: boolean;
  heavyBindingSafe: boolean;
  pelvicFloorSafe: boolean;
}

interface ExerciseFilterBarProps {
  filters: ExerciseFilters;
  onFiltersChange: (filters: ExerciseFilters) => void;
  onClear: () => void;
  muscleOptions: string[];
  equipmentOptions: string[];
}

type FilterType = 'muscle' | 'equipment' | 'difficulty';

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

const ExerciseFilterBar: React.FC<ExerciseFilterBarProps> = ({
  filters,
  onFiltersChange,
  onClear,
  muscleOptions,
  equipmentOptions,
}) => {
  const [activeModal, setActiveModal] = useState<FilterType | null>(null);

  const handleFilterSelect = (type: FilterType, value: string | null) => {
    const newFilters = { ...filters };
    switch (type) {
      case 'muscle':
        newFilters.targetMuscle = value;
        break;
      case 'equipment':
        newFilters.equipment = value;
        break;
      case 'difficulty':
        newFilters.difficulty = value as ExerciseFilters['difficulty'];
        break;
    }
    onFiltersChange(newFilters);
    setActiveModal(null);
  };

  const toggleSafetyFilter = (key: 'binderSafe' | 'heavyBindingSafe' | 'pelvicFloorSafe') => {
    onFiltersChange({ ...filters, [key]: !filters[key] });
  };

  const renderFilterChip = (
    label: string,
    value: string | null,
    type: FilterType
  ) => {
    const isActive = value !== null;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveModal(type)}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {value || label}
        </Text>
        <Ionicons
          name={isActive ? 'close-circle' : 'chevron-down'}
          size={16}
          color={isActive ? colors.text.inverse : colors.text.secondary}
          onPress={isActive ? (e) => {
            e.stopPropagation?.();
            handleFilterSelect(type, null);
          } : undefined}
        />
      </TouchableOpacity>
    );
  };

  const renderSafetyChip = (
    label: string,
    isActive: boolean,
    onToggle: () => void,
    icon: string,
    color: string,
    mutedColor: string
  ) => (
    <TouchableOpacity
      style={[
        styles.safetyChip,
        { backgroundColor: mutedColor, borderColor: color },
        isActive && { backgroundColor: color },
      ]}
      onPress={onToggle}
    >
      <Ionicons
        name={icon as any}
        size={14}
        color={isActive ? colors.text.inverse : color}
      />
      <Text
        style={[
          styles.safetyChipText,
          { color: color },
          isActive && styles.safetyChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderModal = () => {
    if (!activeModal) return null;

    let options: { value: string; label: string }[] = [];
    let title = '';
    let currentValue: string | null = null;

    switch (activeModal) {
      case 'muscle':
        options = muscleOptions.map(m => ({ value: m, label: formatMuscleLabel(m) }));
        title = 'Target Muscle';
        currentValue = filters.targetMuscle;
        break;
      case 'equipment':
        options = equipmentOptions.map(e => ({ value: e, label: formatEquipmentLabel(e) }));
        title = 'Equipment';
        currentValue = filters.equipment;
        break;
      case 'difficulty':
        options = DIFFICULTY_OPTIONS.map(d => ({ value: d.value, label: d.label }));
        title = 'Difficulty';
        currentValue = filters.difficulty;
        break;
    }

    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(30, 30, 35, 0.98)', 'rgba(20, 20, 25, 0.99)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions} showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    currentValue === option.value && styles.modalOptionActive,
                  ]}
                  onPress={() => handleFilterSelect(activeModal, option.value)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      currentValue === option.value && styles.modalOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {currentValue === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.accent.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Chips Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {renderFilterChip('Muscle', filters.targetMuscle ? formatMuscleLabel(filters.targetMuscle) : null, 'muscle')}
        {renderFilterChip('Equipment', filters.equipment ? formatEquipmentLabel(filters.equipment) : null, 'equipment')}
        {renderFilterChip('Difficulty', filters.difficulty ? capitalizeFirst(filters.difficulty) : null, 'difficulty')}
      </ScrollView>

      {/* Safety Filters Row */}
      <View style={styles.safetyRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.safetyChipsContainer}
        >
          {renderSafetyChip(
            'Binder Safe',
            filters.binderSafe,
            () => toggleSafetyFilter('binderSafe'),
            'shield-checkmark',
            colors.accent.primary,
            colors.accent.primaryMuted
          )}
          {renderSafetyChip(
            'Heavy Binding',
            filters.heavyBindingSafe,
            () => toggleSafetyFilter('heavyBindingSafe'),
            'shield',
            colors.accent.secondary,
            colors.accent.secondaryMuted
          )}
          {renderSafetyChip(
            'Pelvic Floor Safe',
            filters.pelvicFloorSafe,
            () => toggleSafetyFilter('pelvicFloorSafe'),
            'heart',
            colors.success,
            colors.accent.successMuted
          )}
        </ScrollView>
      </View>

      {/* Clear Button */}
      {(filters.targetMuscle || filters.equipment || filters.difficulty ||
        filters.binderSafe || filters.heavyBindingSafe || filters.pelvicFloorSafe) && (
        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Ionicons name="refresh" size={14} color={colors.accent.primary} />
          <Text style={styles.clearButtonText}>Clear all</Text>
        </TouchableOpacity>
      )}

      {renderModal()}
    </View>
  );
};

// Helper functions
const formatMuscleLabel = (muscle: string): string => {
  return muscle
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatEquipmentLabel = (equipment: string): string => {
  const labels: Record<string, string> = {
    bodyweight: 'Bodyweight',
    dumbbells: 'Dumbbells',
    bands: 'Resistance Bands',
    kettlebell: 'Kettlebell',
    barbell: 'Barbell',
    step: 'Step/Box',
    wall: 'Wall',
    chair: 'Chair',
    mat: 'Mat',
  };
  return labels[equipment] || equipment.charAt(0).toUpperCase() + equipment.slice(1);
};

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.secondary,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  chipsContainer: {
    paddingHorizontal: spacing.l,
    gap: spacing.s,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  filterChipText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.m,
    paddingHorizontal: spacing.l,
  },
  safetyChipsContainer: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  safetyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  safetyChipActive: {
    backgroundColor: colors.accent.primary,
  },
  safetyChipText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  safetyChipTextActive: {
    color: colors.text.inverse,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.m,
    marginLeft: spacing.l,
    gap: spacing.xs,
  },
  clearButtonText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalOptions: {
    padding: spacing.m,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
  },
  modalOptionActive: {
    backgroundColor: colors.accent.primaryMuted,
  },
  modalOptionText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.primary,
  },
  modalOptionTextActive: {
    fontWeight: '500',
    color: colors.accent.primary,
  },
});

export default ExerciseFilterBar;
