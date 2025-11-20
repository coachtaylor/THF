// src/screens/OnboardingGoalsScreen.tsx
// FIXED VERSION: Properly loads equipment with counts and labels

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { Equipment } from '../types';
import { fetchAllExercises } from '../services/exerciseService';

interface EquipmentOption {
  value: Equipment;
  label: string;
  count: number;
}

interface OnboardingGoalsScreenProps {
  navigation: any;
  route: any;
}

// Equipment label mapping
const EQUIPMENT_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  dumbbells: 'Dumbbells',
  bands: 'Resistance Bands',
  kettlebell: 'Kettlebell',
  barbell: 'Barbell',
  cable: 'Cable Machine',
  machine: 'Weight Machine',
  leverage_machine: 'Leverage Machine',
  sled_machine: 'Sled Machine',
  skierg_machine: 'Ski Erg Machine',
  smith_machine: 'Smith Machine',
  trap_bar: 'Trap Bar',
  resistance_band: 'Resistance Band',
  step: 'Step / Box',
  wall: 'Wall',
  chair: 'Chair',
  mat: 'Exercise Mat',
};

function formatEquipmentLabel(equipment: string): string {
  if (EQUIPMENT_LABELS[equipment.toLowerCase()]) {
    return EQUIPMENT_LABELS[equipment.toLowerCase()];
  }
  
  // Fallback: capitalize first letter of each word
  return equipment
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function OnboardingGoalsScreen({ navigation }: OnboardingGoalsScreenProps) {
  const [primaryGoal, setPrimaryGoal] = useState<string>('strength');
  const [fitnessLevel, setFitnessLevel] = useState<string>('beginner');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEquipmentOptions();
  }, []);

  const loadEquipmentOptions = async () => {
    try {
      setLoadingEquipment(true);
      setError(null);
      
      console.log('🔄 Fetching exercises from database...');
      const exercises = await fetchAllExercises();
      
      console.log(`✅ Fetched ${exercises.length} exercises`);
      
      if (exercises.length === 0) {
        setError('No exercises found in database');
        setLoadingEquipment(false);
        return;
      }

      // Count exercises per equipment type
      const equipmentCounts = new Map<string, number>();
      
      exercises.forEach(exercise => {
        console.log(`Exercise: ${exercise.name}, Equipment:`, exercise.equipment);
        
        if (Array.isArray(exercise.equipment)) {
          exercise.equipment.forEach(eq => {
            const normalized = eq.toLowerCase().trim();
            const current = equipmentCounts.get(normalized) || 0;
            equipmentCounts.set(normalized, current + 1);
          });
        }
      });

      console.log('📊 Equipment counts:', Array.from(equipmentCounts.entries()));

      // Convert to options array
      const options: EquipmentOption[] = Array.from(equipmentCounts.entries())
        .map(([value, count]) => ({
          value: value as Equipment,
          label: formatEquipmentLabel(value),
          count,
        }))
        .sort((a, b) => {
          // Sort: bodyweight first, then by count descending
          if (a.value === 'bodyweight') return -1;
          if (b.value === 'bodyweight') return 1;
          return b.count - a.count;
        });

      console.log('✅ Equipment options:', options);
      setEquipmentOptions(options);
      
      // Auto-select bodyweight if available
      const hasBodyweight = options.some(opt => opt.value === 'bodyweight');
      if (hasBodyweight) {
        setSelectedEquipment(['bodyweight']);
      }
      
    } catch (error) {
      console.error('❌ Failed to load equipment:', error);
      setError('Failed to load equipment options');
    } finally {
      setLoadingEquipment(false);
    }
  };

  const toggleEquipment = (equipment: Equipment) => {
    if (selectedEquipment.includes(equipment)) {
      setSelectedEquipment(prev => prev.filter(eq => eq !== equipment));
    } else {
      setSelectedEquipment(prev => [...prev, equipment]);
    }
  };

  const handleContinue = () => {
    if (selectedEquipment.length === 0) {
      alert('Please select at least one equipment type');
      return;
    }

    navigation.navigate('OnboardingConstraints', {
      primaryGoal,
      fitnessLevel,
      equipment: selectedEquipment,
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text variant="labelMedium" style={styles.progressText}>
          Goals & Preferences (1/3)
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '33%' }]} />
        </View>
      </View>

      {/* Primary Goal Section */}
      <Card style={styles.card}>
        <Card.Title title="What's your primary goal?" />
        <Card.Content>
          <View style={styles.optionGroup}>
            {[
              { value: 'strength', label: 'Strength', subtitle: 'Build muscle and power' },
              { value: 'cardio', label: 'Cardio', subtitle: 'Improve endurance' },
              { value: 'flexibility', label: 'Flexibility', subtitle: 'Increase range of motion' },
              { value: 'mobility', label: 'Mobility', subtitle: 'Move better daily' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  primaryGoal === option.value && styles.optionButtonSelected,
                ]}
                onPress={() => setPrimaryGoal(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text 
                    variant="bodyLarge" 
                    style={primaryGoal === option.value && styles.optionTextSelected}
                  >
                    {option.label}
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    style={[
                      styles.optionSubtitle,
                      primaryGoal === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>
                <View style={[
                  styles.radio,
                  primaryGoal === option.value && styles.radioSelected,
                ]} />
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Fitness Level Section */}
      <Card style={styles.card}>
        <Card.Title title="What's your fitness level?" />
        <Card.Content>
          <View style={styles.optionGroup}>
            {[
              { value: 'beginner', label: 'Beginner', subtitle: 'New to fitness' },
              { value: 'intermediate', label: 'Intermediate', subtitle: 'Regular exercise' },
              { value: 'advanced', label: 'Advanced', subtitle: 'Extensive experience' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  fitnessLevel === option.value && styles.optionButtonSelected,
                ]}
                onPress={() => setFitnessLevel(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text 
                    variant="bodyLarge"
                    style={fitnessLevel === option.value && styles.optionTextSelected}
                  >
                    {option.label}
                  </Text>
                  <Text 
                    variant="bodySmall"
                    style={[
                      styles.optionSubtitle,
                      fitnessLevel === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>
                <View style={[
                  styles.radio,
                  fitnessLevel === option.value && styles.radioSelected,
                ]} />
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Equipment Section */}
      <Card style={styles.card}>
        <Card.Title 
          title="What equipment do you have?" 
          subtitle="Select at least one"
        />
        <Card.Content>
          {loadingEquipment ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00d9c0" />
              <Text style={styles.loadingText}>Loading equipment options...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
              <Button mode="outlined" onPress={loadEquipmentOptions}>
                Retry
              </Button>
            </View>
          ) : (
            <View style={styles.optionGroup}>
              {equipmentOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    selectedEquipment.includes(option.value) && styles.optionButtonSelected,
                  ]}
                  onPress={() => toggleEquipment(option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text 
                      variant="bodyLarge"
                      style={selectedEquipment.includes(option.value) && styles.optionTextSelected}
                    >
                      {option.label}
                    </Text>
                    <Text 
                      variant="bodySmall"
                      style={[
                        styles.optionSubtitle,
                        selectedEquipment.includes(option.value) && styles.optionTextSelected,
                      ]}
                    >
                      {option.count} exercises
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    selectedEquipment.includes(option.value) && styles.checkboxSelected,
                  ]}>
                    {selectedEquipment.includes(option.value) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {equipmentOptions.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text>No equipment found in database</Text>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Selected Equipment Summary */}
      {selectedEquipment.length > 0 && (
        <View style={styles.selectedSummary}>
          <Text variant="labelMedium" style={styles.selectedLabel}>
            Selected: {selectedEquipment.map(eq => {
              const option = equipmentOptions.find(opt => opt.value === eq);
              return option?.label || eq;
            }).join(', ')}
          </Text>
        </View>
      )}

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={selectedEquipment.length === 0 || loadingEquipment}
          style={styles.continueButton}
          buttonColor="#00d9c0"
          textColor="#000"
        >
          Continue
        </Button>
        <Text variant="bodySmall" style={styles.helperText}>
          💡 Don't have equipment? Just select Bodyweight
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  progressText: {
    color: '#888',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00d9c0',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#111',
  },
  optionGroup: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  optionButtonSelected: {
    backgroundColor: '#00d9c020',
    borderColor: '#00d9c0',
  },
  optionContent: {
    flex: 1,
  },
  optionSubtitle: {
    color: '#888',
    marginTop: 2,
  },
  optionTextSelected: {
    color: '#00d9c0',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
  },
  radioSelected: {
    borderColor: '#00d9c0',
    backgroundColor: '#00d9c0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#00d9c0',
    backgroundColor: '#00d9c0',
  },
  checkmark: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#888',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  selectedSummary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedLabel: {
    color: '#00d9c0',
  },
  buttonContainer: {
    padding: 16,
  },
  continueButton: {
    paddingVertical: 8,
  },
  helperText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 12,
  },
});