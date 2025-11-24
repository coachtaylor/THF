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

// Mock profile data
export const mockProfile: Profile = {
  // NEW REQUIRED FIELDS
  id: 'test-id',
  user_id: 'user-123',
  gender_identity: 'ftm',
  on_hrt: true,
  hrt_type: 'testosterone',
  binds_chest: false,
  surgeries: [],
  primary_goal: 'masculinization',
  fitness_experience: 'intermediate',
  workout_frequency: 4,
  session_duration: 60,
  equipment: ['dumbbells', 'barbell'],
  
  // KEEP OLD FIELDS (for compatibility)
  goals: ['strength', 'flexibility'],
  goal_weighting: { primary: 70, secondary: 30 },
  constraints: ['binder_aware', 'heavy_binding'],
  surgery_flags: ['top_surgery'],
  surgeon_cleared: true,
  hrt_flags: ['testosterone'],
  preferred_minutes: [15, 30],
  block_length: 1,
  low_sensory_mode: false,
  disclaimer_acknowledged_at: '2025-01-01T00:00:00Z',
  
  // METADATA
  created_at: new Date(),
  updated_at: new Date(),
};

// Mock useProfile hook
export const mockUseProfile = {
  profile: null,
  loading: false,
  error: null,
  updateProfile: jest.fn(),
  refreshProfile: jest.fn(),
};

