import { Profile } from '../services/storage/profile';

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(),
  isFocused: jest.fn(() => true),
  getId: jest.fn(() => 'test-id'),
} as any; // Use 'as any' to bypass strict typing in tests

// Mock profile data with NEW Profile structure
export const mockProfile: Profile = {
  // REQUIRED NEW FIELDS
  id: 'test-id',
  user_id: 'user-123',
  gender_identity: 'ftm',
  primary_goal: 'masculinization',
  on_hrt: true,
  hrt_type: 'testosterone',
  hrt_start_date: new Date('2023-01-01'),
  hrt_months_duration: 24,
  binds_chest: true,
  binding_frequency: 'daily',
  binding_duration_hours: 8,
  binder_type: 'commercial',
  surgeries: [
    {
      type: 'top_surgery',
      date: new Date('2022-06-15'),
      weeks_post_op: 130,
      notes: 'Test surgery',
    },
  ],
  fitness_experience: 'intermediate',
  workout_frequency: 4,
  session_duration: 60,
  equipment: ['dumbbells', 'barbell', 'bodyweight'],
  created_at: new Date('2023-01-01'),
  updated_at: new Date(),
  
  // DEPRECATED FIELDS (kept for backwards compatibility)
  goals: ['strength', 'flexibility'],
  goal_weighting: { primary: 70, secondary: 30 },
  constraints: ['binder_aware', 'heavy_binding'],
  surgery_flags: ['top_surgery'],
  surgeon_cleared: true,
  hrt_flags: ['testosterone'],
  fitness_level: 'intermediate',
  preferred_minutes: [15, 30],
  block_length: 1,
  low_sensory_mode: false,
  disclaimer_acknowledged_at: '2025-01-01T00:00:00Z',
};

// Mock useProfile hook
export const mockUseProfile = {
  profile: null,
  loading: false,
  error: null,
  updateProfile: jest.fn(),
  refreshProfile: jest.fn(),
};

