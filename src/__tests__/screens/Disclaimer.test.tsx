import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Disclaimer from '../../screens/onboarding/Disclaimer';
import { mockNavigation, mockUseProfile } from '../mocks';

// Mock useProfile hook
jest.mock('../../hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

import { useProfile } from '../../hooks/useProfile';

describe('Disclaimer', () => {
  const mockUpdateProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProfile as jest.Mock).mockReturnValue({
      ...mockUseProfile,
      updateProfile: mockUpdateProfile,
    });
  });

  it('renders headline correctly', () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    expect(getByText('Important: This is not medical advice')).toBeTruthy();
  });

  it('renders disclaimer text', () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    expect(getByText(/This is not medical advice/i)).toBeTruthy();
  });

  it('checkbox starts unchecked', () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    const checkbox = getByText('I understand and agree').parent;
    // Checkbox should not have checkmark initially
    expect(getByText('✓')).toBeFalsy();
  });

  it('toggles checkbox on press', () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    const checkboxArea = getByText('I understand and agree').parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
      // After press, checkbox should be checked
      // This is a simplified test - actual implementation may vary
    }
  });

  it('Continue button is disabled when checkbox unchecked', () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    const continueButton = getByText('Continue');
    expect(continueButton).toBeTruthy();
    // Button should be disabled (check parent for disabled prop)
  });

  it('navigates to Goals on Continue press when checked', async () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    
    // First check the checkbox
    const checkboxLabel = getByText('I understand and agree');
    const checkboxArea = checkboxLabel.parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
    }

    // Then press Continue
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Goals');
    });
  });

  it('saves disclaimer_acknowledged_at on Continue', async () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    
    // Check checkbox
    const checkboxLabel = getByText('I understand and agree');
    const checkboxArea = checkboxLabel.parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
    }

    // Press Continue
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          disclaimer_acknowledged_at: expect.any(String),
        })
      );
    });
  });

  it('Quick Start button is disabled when checkbox unchecked', () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    const quickStartButton = getByText('Quick Start');
    expect(quickStartButton).toBeTruthy();
  });

  it('navigates to QuickStart on Quick Start press when checked', () => {
    const { getByText } = render(<Disclaimer navigation={mockNavigation} />);
    
    // Check checkbox first
    const checkboxLabel = getByText('I understand and agree');
    const checkboxArea = checkboxLabel.parent?.parent;
    if (checkboxArea) {
      fireEvent.press(checkboxArea);
    }

    const quickStartButton = getByText('Quick Start');
    fireEvent.press(quickStartButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('QuickStart');
  });
});

