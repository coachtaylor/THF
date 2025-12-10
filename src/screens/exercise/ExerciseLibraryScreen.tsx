// src/screens/exercise/ExerciseLibraryScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../theme';
import { Exercise } from '../../types';
import { fetchAllExercises } from '../../services/exerciseService';
import { getProfile } from '../../services/storage/profile';
import { addExerciseToWorkout } from '../../services/storage/workout';
import ExerciseFilterBar, { ExerciseFilters } from '../../components/exercise/ExerciseFilterBar';
import ExerciseLibraryCard from '../../components/exercise/ExerciseLibraryCard';
import { ExerciseDetailSheet } from '../../components/exercise/ExerciseDetailSheet';

type RouteParams = {
  ExerciseLibrary: {
    mode?: 'browse' | 'swap';
    currentExerciseId?: string;
    returnRoute?: string; // Route to navigate back to with selection
    workoutId?: string; // Workout to add exercises to (for browse mode)
    workoutExerciseIds?: string[]; // Exercise IDs already in the workout
  };
};

const ExerciseLibraryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ExerciseLibrary'>>();

  const { mode = 'browse', currentExerciseId, returnRoute, workoutId, workoutExerciseIds = [] } = route.params || {};

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ExerciseFilters>({
    targetMuscle: null,
    equipment: null,
    difficulty: null,
    binderSafe: false,
    heavyBindingSafe: false,
    pelvicFloorSafe: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);

  // Load exercises and user profile
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allExercises, profile] = await Promise.all([
        fetchAllExercises(),
        getProfile(),
      ]);
      setExercises(allExercises);
      setUserProfile(profile);

      // If user has binder constraint, default to showing binder-safe
      if (profile?.constraints?.includes('binder_aware') || profile?.binds_chest) {
        setFilters(prev => ({ ...prev, binderSafe: true }));
      }
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const muscles = new Set<string>();
    const equipment = new Set<string>();

    exercises.forEach(ex => {
      if (ex.target_muscles) {
        ex.target_muscles.split(',').forEach(m => muscles.add(m.trim()));
      }
      if (ex.equipment) {
        ex.equipment.forEach(e => equipment.add(e));
      }
    });

    return {
      muscles: Array.from(muscles).sort(),
      equipment: Array.from(equipment).filter(e => e !== 'none').sort(),
      difficulties: ['beginner', 'intermediate', 'advanced'] as const,
    };
  }, [exercises]);

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    let result = exercises;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.target_muscles?.toLowerCase().includes(query) ||
        ex.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply target muscle filter
    if (filters.targetMuscle) {
      result = result.filter(ex =>
        ex.target_muscles?.toLowerCase().includes(filters.targetMuscle!.toLowerCase())
      );
    }

    // Apply equipment filter
    if (filters.equipment) {
      result = result.filter(ex =>
        ex.equipment.includes(filters.equipment!) ||
        (filters.equipment === 'bodyweight' && ex.equipment.length === 0)
      );
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      result = result.filter(ex => ex.difficulty === filters.difficulty);
    }

    // Apply binder safety filter
    if (filters.binderSafe) {
      result = result.filter(ex => ex.binder_aware === true);
    }

    // Apply heavy binding safety filter
    if (filters.heavyBindingSafe) {
      result = result.filter(ex => ex.heavy_binding_safe === true);
    }

    // Apply pelvic floor safety filter
    if (filters.pelvicFloorSafe) {
      result = result.filter(ex => ex.pelvic_floor_safe === true);
    }

    // Exclude current exercise if in swap mode
    if (mode === 'swap' && currentExerciseId) {
      result = result.filter(ex => ex.id !== currentExerciseId);
    }

    return result;
  }, [exercises, searchQuery, filters, mode, currentExerciseId]);

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    // Show exercise details modal
    setSelectedExerciseId(Number(exercise.id));
  }, []);

  const handleSwapExercise = useCallback((exerciseId: number) => {
    // Navigate back with the selected exercise ID
    navigation.navigate({
      name: returnRoute || 'SessionPlayer',
      params: { selectedSwapExerciseId: String(exerciseId) },
      merge: true,
    });
  }, [returnRoute, navigation]);

  const handleAddToWorkout = useCallback(async (exerciseId: number) => {
    if (!workoutId) {
      console.log('⚠️ No workoutId provided, cannot add exercise');
      // Just navigate back without adding
      navigation.goBack();
      return;
    }

    console.log('📥 Adding exercise to workout:', { exerciseId, workoutId });

    try {
      const userId = userProfile?.user_id || userProfile?.id || 'default';
      const success = await addExerciseToWorkout(workoutId, String(exerciseId), userId);

      if (success) {
        console.log('✅ Exercise added successfully');
      } else {
        console.log('❌ Failed to add exercise to workout');
      }
    } catch (error) {
      console.error('❌ Error adding exercise:', error);
    }

    navigation.goBack();
  }, [navigation, workoutId, userProfile]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      targetMuscle: null,
      equipment: null,
      difficulty: null,
      binderSafe: false,
      heavyBindingSafe: false,
      pelvicFloorSafe: false,
    });
    setSearchQuery('');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.targetMuscle) count++;
    if (filters.equipment) count++;
    if (filters.difficulty) count++;
    if (filters.binderSafe) count++;
    if (filters.heavyBindingSafe) count++;
    if (filters.pelvicFloorSafe) count++;
    return count;
  }, [filters]);

  const renderExercise = useCallback(({ item }: { item: Exercise }) => (
    <ExerciseLibraryCard
      exercise={item}
      onPress={() => handleSelectExercise(item)}
      isSwapMode={mode === 'swap'}
      isInWorkout={workoutExerciseIds.includes(item.id)}
    />
  ), [handleSelectExercise, mode, workoutExerciseIds]);

  const keyExtractor = useCallback((item: Exercise) => item.id, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {mode === 'swap' ? 'Choose Exercise' : 'Exercise Library'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredExercises.length} exercises
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options"
            size={20}
            color={activeFilterCount > 0 ? colors.text.inverse : colors.text.primary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      {showFilters && (
        <ExerciseFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          muscleOptions={filterOptions.muscles}
          equipmentOptions={filterOptions.equipment}
        />
      )}

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Icon Legend</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.binderLegendIcon]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.accent.primary} />
                </View>
                <Text style={styles.legendText}>Binder Safe</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.heavyBindingLegendIcon]}>
                  <Ionicons name="shield" size={12} color={colors.accent.secondary} />
                </View>
                <Text style={styles.legendText}>Heavy Binding Safe</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.pelvicLegendIcon]}>
                  <Ionicons name="heart" size={12} color={colors.success} />
                </View>
                <Text style={styles.legendText}>Pelvic Floor Safe</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No exercises found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Exercise Detail Modal */}
      {userProfile && (
        <ExerciseDetailSheet
          exerciseId={selectedExerciseId}
          profile={userProfile}
          onClose={() => setSelectedExerciseId(null)}
          onSwapExercise={mode === 'swap' ? handleSwapExercise : undefined}
          onAddToWorkout={mode === 'browse' ? handleAddToWorkout : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    padding: spacing.s,
    marginRight: spacing.s,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    gap: spacing.s,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.m,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.accent.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent.secondary,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  listContent: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.m,
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  clearFiltersButton: {
    marginTop: spacing.l,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    backgroundColor: colors.accent.primaryMuted,
    borderRadius: borderRadius.full,
  },
  clearFiltersText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  legendContainer: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  legendTitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binderLegendIcon: {
    backgroundColor: colors.accent.primaryMuted,
  },
  heavyBindingLegendIcon: {
    backgroundColor: colors.accent.secondaryMuted,
  },
  pelvicLegendIcon: {
    backgroundColor: colors.accent.successMuted,
  },
  legendText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.secondary,
  },
});

export default ExerciseLibraryScreen;
