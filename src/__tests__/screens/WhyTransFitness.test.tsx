import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WhyTransFitness from '../../screens/onboarding/WhyTransFitness';
import { mockNavigation, mockUseProfile } from '../mocks';

// Mock useProfile hook
jest.mock('../../hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

import { useProfile } from '../../hooks/useProfile';

describe('WhyTransFitness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useProfile as jest.Mock).mockReturnValue(mockUseProfile);
  });

  it('renders headline correctly', () => {
    const { getByText } = render(<WhyTransFitness navigation={mockNavigation} />);
    expect(getByText('Safety-first workouts for trans bodies')).toBeTruthy();
  });

  it('renders all bullet points', () => {
    const { getByText } = render(<WhyTransFitness navigation={mockNavigation} />);
    expect(getByText('Binder-aware exercises with safe alternatives')).toBeTruthy();
    expect(getByText('5-45 minute options for any energy level')).toBeTruthy();
    expect(getByText('Privacy-first: your data stays on your device')).toBeTruthy();
  });

  it('renders Get Started button', () => {
    const { getByText } = render(<WhyTransFitness navigation={mockNavigation} />);
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('navigates to Disclaimer on Get Started press', () => {
    const { getByText } = render(<WhyTransFitness navigation={mockNavigation} />);
    const button = getByText('Get Started');
    fireEvent.press(button);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Disclaimer');
  });

  it('hides hero image when low_sensory_mode is true', () => {
    (useProfile as jest.Mock).mockReturnValue({
      ...mockUseProfile,
      profile: { low_sensory_mode: true },
    });
    const { queryByTestId } = render(<WhyTransFitness navigation={mockNavigation} />);
    // Hero image should not be rendered
    expect(queryByTestId('hero-image')).toBeNull();
  });

  it('shows hero image when low_sensory_mode is false', () => {
    (useProfile as jest.Mock).mockReturnValue({
      ...mockUseProfile,
      profile: { low_sensory_mode: false },
    });
    const { UNSAFE_getByType } = render(<WhyTransFitness navigation={mockNavigation} />);
    // Check if Image component exists (hero image)
    const { Image } = require('react-native');
    const images = UNSAFE_getByType(Image);
    expect(images).toBeTruthy();
  });
});

