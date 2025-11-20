import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Constraints from '../../screens/onboarding/intake/Constraints';
import { mockNavigation, mockUseProfile } from '../mocks';

// Mock useProfile hook
jest.mock('../../hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

import { useProfile } from '../../hooks/useProfile';

describe('Constraints', () => {
  const mockUpdateProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProfile as jest.Mock).mockReturnValue({
      ...mockUseProfile,
      updateProfile: mockUpdateProfile,
    });
  });

  it('renders headline correctly', () => {
    const { getByText } = render(<Constraints navigation={mockNavigation} />);
    expect(getByText('What are your constraints?')).toBeTruthy();
  });

  it('renders all constraint sections', () => {
    const { getByText } = render(<Constraints navigation={mockNavigation} />);
    expect(getByText('General Constraints')).toBeTruthy();
    expect(getByText('Surgery History')).toBeTruthy();
    expect(getByText('Hormone Replacement Therapy')).toBeTruthy();
  });

  it('toggles constraint checkbox on press', () => {
    const { getByText } = render(<Constraints navigation={mockNavigation} />);
    const binderAware = getByText('Binder Aware');
    const checkboxArea = binderAware.parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
    }
  });

  it('shows surgeon clearance banner when surgery flags selected', () => {
    const { getByText } = render(<Constraints navigation={mockNavigation} />);
    
    // Select a surgery flag
    const topSurgery = getByText('Top Surgery');
    const checkboxArea = topSurgery.parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
    }

    // Banner should appear
    expect(getByText(/Surgeon Clearance Required/i)).toBeTruthy();
  });

  it('saves constraints and navigates on Continue', async () => {
    const { getByText } = render(<Constraints navigation={mockNavigation} />);
    
    // Select a constraint
    const binderAware = getByText('Binder Aware');
    const checkboxArea = binderAware.parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
    }

    // Press Continue
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.any(Array),
        })
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Preferences');
    });
  });

  it('saves all constraint types correctly', async () => {
    const { getByText } = render(<Constraints navigation={mockNavigation} />);
    
    // Select general constraint
    const binderAware = getByText('Binder Aware');
    const binderArea = binderAware.parent?.parent;
    if (binderArea) {
      fireEvent.press(binderArea);
    }

    // Select surgery flag
    const topSurgery = getByText('Top Surgery');
    const surgeryArea = topSurgery.parent?.parent;
    if (surgeryArea) {
      fireEvent.press(surgeryArea);
    }

    // Select HRT flag
    const testosterone = getByText('Testosterone');
    const hrtArea = testosterone.parent?.parent;
    if (hrtArea) {
      fireEvent.press(hrtArea);
    }

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining(['binder_aware']),
          surgery_flags: expect.arrayContaining(['top_surgery']),
          hrt_flags: expect.arrayContaining(['testosterone']),
        })
      );
    });
  });
});

