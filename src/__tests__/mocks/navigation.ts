// src/__tests__/mocks/navigation.ts
// Mock navigation objects for testing

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

