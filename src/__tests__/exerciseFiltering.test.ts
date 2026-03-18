import { filterExercisesByConstraints } from '../services/data/exerciseFilters';
import { Profile } from '../services/storage/profile';
import { exerciseLibrary } from './mocks/exercises';

// Use mock exercise data instead of Supabase fetch
const getMockExercises = () => exerciseLibrary as any[];

describe('Exercise Filtering', () => {
  it('should have exercises available for testing', () => {
    const exercises = getMockExercises();
    expect(exercises.length).toBeGreaterThan(0);
  });

  it('should filter by equipment', async () => {
    const exercises = getMockExercises();
    const profile: Profile = {
      id: 'test-1',
      user_id: 'test-user',
      gender_identity: 'nonbinary',
      primary_goal: 'general_fitness',
      binds_chest: false,
      on_hrt: false,
      surgeries: [],
      equipment: ['bodyweight', 'dumbbells'],
      fitness_experience: 'beginner',
      fitness_level: 'beginner', // Alias for compatibility
      workout_frequency: 3,
      session_duration: 30,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const filtered = filterExercisesByConstraints(exercises, profile);
    
    // All filtered exercises should match user's equipment
    filtered.forEach(ex => {
      const hasMatch = ex.equipment.some((eq: string) => 
        profile.equipment!.includes(eq) || eq === 'bodyweight'
      );
      expect(hasMatch).toBe(true);
    });
  });
  
  it('should exclude binding-unsafe exercises', async () => {
    const exercises = getMockExercises();
    const profile: Profile = {
      id: 'test-2',
      user_id: 'test-user',
      gender_identity: 'nonbinary',
      primary_goal: 'general_fitness',
      equipment: ['bodyweight'],
      fitness_experience: 'intermediate',
      fitness_level: 'intermediate', // Alias for compatibility
      workout_frequency: 3,
      session_duration: 30,
      binds_chest: true,
      binding_frequency: 'daily',
      on_hrt: false,
      surgeries: [],
      constraints: ['binder_aware'],
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const filtered = filterExercisesByConstraints(exercises, profile);
    
    // No filtered exercise should have binding contraindications
    filtered.forEach(ex => {
      if (ex.contraindications) {
        expect(ex.contraindications).not.toContain('heavy_binding');
        expect(ex.contraindications).not.toContain('tight_binder');
      }
    });
  });
});