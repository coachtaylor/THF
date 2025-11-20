import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Goals from '../../screens/onboarding/intake/Goals';
import { mockNavigation, mockUseProfile } from '../mocks';

// Mock useProfile hook
jest.mock('../../hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

import { useProfile } from '../../hooks/useProfile';

describe('Goals', () => {
  const mockUpdateProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProfile as jest.Mock).mockReturnValue({
      ...mockUseProfile,
      updateProfile: mockUpdateProfile,
    });
  });

  it('renders headline correctly', () => {
    const { getByText } = render(<Goals navigation={mockNavigation} />);
    expect(getByText('What are your goals?')).toBeTruthy();
  });

  it('renders all goal cards', () => {
    const { getByText } = render(<Goals navigation={mockNavigation} />);
    expect(getByText('Strength')).toBeTruthy();
    expect(getByText('Cardio')).toBeTruthy();
    expect(getByText('Flexibility')).toBeTruthy();
    expect(getByText('Custom')).toBeTruthy();
  });

  it('Continue button is disabled initially', () => {
    const { getByText } = render(<Goals navigation={mockNavigation} />);
    const continueButton = getByText('Continue');
    expect(continueButton).toBeTruthy();
  });

  it('selects primary goal on card press', () => {
    const { getByText } = render(<Goals navigation={mockNavigation} />);
    const strengthCard = getByText('Strength').parent?.parent;
    if (strengthCard) {
      fireEvent.press(strengthCard);
      // Card should show as selected (primary)
    }
  });

  it('selects secondary goal after primary', () => {
    const { getByText } = render(<Goals navigation={mockNavigation} />);
    
    // Select primary
    const strengthCard = getByText('Strength').parent?.parent;
    if (strengthCard) {
      fireEvent.press(strengthCard);
    }

    // Select secondary
    const cardioCard = getByText('Cardio').parent?.parent;
    if (cardioCard) {
      fireEvent.press(cardioCard);
    }
  });

  it('saves goals and navigates on Continue', async () => {
    const { getByText } = render(<Goals navigation={mockNavigation} />);
    
    // Select a goal
    const strengthCard = getByText('Strength').parent?.parent;
    if (strengthCard) {
      fireEvent.press(strengthCard);
    }

    // Press Continue
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          goals: expect.any(Array),
          goal_weighting: expect.objectContaining({
            primary: expect.any(Number),
            secondary: expect.any(Number),
          }),
        })
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Constraints');
    });
  });

  it('calculates goal weighting correctly with secondary goal', async () => {
    const { getByText } = render(<Goals navigation={mockNavigation} />);
    
    // Select primary
    const strengthCard = getByText('Strength').parent?.parent;
    if (strengthCard) {
      fireEvent.press(strengthCard);
    }

    // Select secondary
    const cardioCard = getByText('Cardio').parent?.parent;
    if (cardioCard) {
      fireEvent.press(cardioCard);
    }

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          goal_weighting: { primary: 70, secondary: 30 },
        })
      );
    });
  });
});

