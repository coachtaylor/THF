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
export const mockProfile = {
  id: 'default',
  goals: ['strength', 'flexibility'],
  goal_weighting: { primary: 70, secondary: 30 },
  constraints: ['binder_aware', 'heavy_binding'],
  surgery_flags: ['top_surgery'],
  surgeon_cleared: true,
  hrt_flags: ['testosterone'],
  preferred_minutes: [15, 30],
  block_length: 1,
  equipment: ['bodyweight', 'dumbbells'],
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

