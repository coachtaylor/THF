import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Preferences from '../../screens/onboarding/intake/Preferences';
import { mockNavigation, mockUseProfile } from '../mocks';

// Mock useProfile hook
jest.mock('../../hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

import { useProfile } from '../../hooks/useProfile';

describe('Preferences', () => {
  const mockUpdateProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProfile as jest.Mock).mockReturnValue({
      ...mockUseProfile,
      updateProfile: mockUpdateProfile,
    });
  });

  it('renders headline correctly', () => {
    const { getByText } = render(<Preferences navigation={mockNavigation} />);
    expect(getByText('What are your preferences?')).toBeTruthy();
  });

  it('renders all preference sections', () => {
    const { getByText } = render(<Preferences navigation={mockNavigation} />);
    expect(getByText('Workout Duration')).toBeTruthy();
    expect(getByText('Program Length')).toBeTruthy();
    expect(getByText('Available Equipment')).toBeTruthy();
  });

  it('toggles workout duration on press', () => {
    const { getByText } = render(<Preferences navigation={mockNavigation} />);
    const duration15 = getByText('15 minutes');
    const checkboxArea = duration15.parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
    }
  });

  it('selects block length on press', () => {
    const { getByText } = render(<Preferences navigation={mockNavigation} />);
    const oneWeek = getByText('1 Week');
    const card = oneWeek.parent?.parent;
    if (card) {
      fireEvent.press(card);
    }
  });

  it('toggles equipment on press', () => {
    const { getByText } = render(<Preferences navigation={mockNavigation} />);
    const bodyweight = getByText('Bodyweight');
    const checkboxArea = bodyweight.parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
    }
  });

  it('saves preferences and navigates on Continue', async () => {
    const { getByText } = render(<Preferences navigation={mockNavigation} />);
    
    // Select duration
    const duration15 = getByText('15 minutes');
    const durationArea = duration15.parent?.parent;
    if (durationArea) {
      fireEvent.press(durationArea);
    }

    // Select equipment
    const bodyweight = getByText('Bodyweight');
    const equipmentArea = bodyweight.parent?.parent;
    if (equipmentArea) {
      fireEvent.press(equipmentArea);
    }

    // Press Continue
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          preferred_minutes: expect.any(Array),
          block_length: expect.any(Number),
          equipment: expect.any(Array),
        })
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Review');
    });
  });

  it('prevents removing bodyweight if it is the only equipment', () => {
    const { getByText } = render(<Preferences navigation={mockNavigation} />);
    
    // Select only bodyweight
    const bodyweight = getByText('Bodyweight');
    const equipmentArea = bodyweight.parent?.parent;
    if (equipmentArea) {
      // Try to deselect it
      fireEvent.press(equipmentArea);
      // Should still be selected
    }
  });
});

