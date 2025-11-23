import { loadExercises } from '../data/exercises';
import { filterExercisesByConstraints } from '../services/data/exerciseFilters';
import { Profile } from '../services/storage/profile';

describe('Exercise Filtering', () => {
  it('should load 137 exercises from database', async () => {
    const exercises = await loadExercises();
    expect(exercises.length).toBe(137);
  });
  
  it('should filter by equipment', async () => {
    const exercises = await loadExercises();
    const profile: Profile = {
      equipment: ['bodyweight', 'dumbbells'],
      fitness_experience: 'beginner',
      binds_chest: false,
      // ... other required fields
    };
    
    const filtered = filterExercisesByConstraints(exercises, profile);
    
    // All filtered exercises should match user's equipment
    filtered.forEach(ex => {
      const hasMatch = ex.equipment.some(eq => 
        profile.equipment!.includes(eq) || eq === 'bodyweight'
      );
      expect(hasMatch).toBe(true);
    });
  });
  
  it('should exclude binding-unsafe exercises', async () => {
    const exercises = await loadExercises();
    const profile: Profile = {
      equipment: ['bodyweight'],
      fitness_experience: 'intermediate',
      binds_chest: true,
      binding_frequency: 'daily',
      // ... other fields
    };
    
    const filtered = filterExercisesByConstraints(exercises, profile);
    
    // No filtered exercise should have binding contraindications
    filtered.forEach(ex => {
      expect(ex.contraindications).not.toContain('heavy_binding');
      expect(ex.contraindications).not.toContain('tight_binder');
    });
  });
});