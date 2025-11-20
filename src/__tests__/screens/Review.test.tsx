import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Review from '../../screens/onboarding/intake/Review';
import { mockNavigation, mockProfile } from '../mocks';

// Mock useProfile hook
jest.mock('../../hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

// Mock planGenerator
jest.mock('../../services/planGenerator', () => ({
  generatePlan: jest.fn(() =>
    Promise.resolve({
      id: 'test-plan',
      blockLength: 1,
      startDate: new Date(),
      goals: ['strength'],
      goalWeighting: { primary: 100, secondary: 0 },
      days: [],
    })
  ),
}));

import { useProfile } from '../../hooks/useProfile';
import { generatePlan } from '../../services/planGenerator';

describe('Review', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useProfile as jest.Mock).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });
  });

  it('renders headline correctly', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText('Review Your Profile')).toBeTruthy();
  });

  it('displays all sections', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText('Goals')).toBeTruthy();
    expect(getByText('Constraints')).toBeTruthy();
    expect(getByText('Preferences')).toBeTruthy();
  });

  it('displays goals summary with labels', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText(/Strength/i)).toBeTruthy();
    expect(getByText(/Flexibility/i)).toBeTruthy();
  });

  it('displays constraints summary with labels', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText(/Binder Aware/i)).toBeTruthy();
    expect(getByText(/Heavy Binding/i)).toBeTruthy();
    expect(getByText(/Testosterone/i)).toBeTruthy();
  });

  it('displays preferences summary', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText(/15, 30 minutes/i)).toBeTruthy();
    expect(getByText(/1 Week/i)).toBeTruthy();
  });

  it('navigates to Goals on Edit press', () => {
    const { getAllByText } = render(<Review navigation={mockNavigation} />);
    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[0]); // First Edit button (Goals)
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Goals');
  });

  it('navigates to Constraints on Edit press', () => {
    const { getAllByText } = render(<Review navigation={mockNavigation} />);
    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[1]); // Second Edit button (Constraints)
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Constraints');
  });

  it('navigates to Preferences on Edit press', () => {
    const { getAllByText } = render(<Review navigation={mockNavigation} />);
    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[2]); // Third Edit button (Preferences)
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Preferences');
  });

  it('generates plan on Generate My Plan press', async () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    const generateButton = getByText('Generate My Plan');
    fireEvent.press(generateButton);

    await waitFor(() => {
      expect(generatePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: mockProfile,
          blockLength: expect.any(Number),
          startDate: expect.any(Date),
        })
      );
    });
  });

  it('shows loading state during plan generation', async () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    const generateButton = getByText('Generate My Plan');
    fireEvent.press(generateButton);

    await waitFor(() => {
      expect(getByText(/Generating Plan/i)).toBeTruthy();
    });
  });

  it('handles missing profile gracefully', () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: null,
      loading: false,
      error: null,
    });
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText(/No profile data found/i)).toBeTruthy();
  });
});

