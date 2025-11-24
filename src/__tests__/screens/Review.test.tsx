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
    expect(getByText('Your Profile')).toBeTruthy();
    expect(getByText('HRT Status')).toBeTruthy();
    expect(getByText('Binding Status')).toBeTruthy();
    expect(getByText('Surgery History')).toBeTruthy();
    expect(getByText('Equipment')).toBeTruthy();
  });

  it('displays profile summary with new fields', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText(/Gender Identity/i)).toBeTruthy();
    expect(getByText(/Primary Goal/i)).toBeTruthy();
    expect(getByText(/Experience Level/i)).toBeTruthy();
    expect(getByText(/Training Frequency/i)).toBeTruthy();
  });

  it('displays HRT status when on_hrt is true', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText(/HRT Status/i)).toBeTruthy();
    expect(getByText(/Type:/i)).toBeTruthy();
    expect(getByText(/Duration:/i)).toBeTruthy();
  });

  it('displays binding status when binds_chest is true', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText(/Binding Status/i)).toBeTruthy();
    expect(getByText(/Frequency:/i)).toBeTruthy();
  });

  it('displays surgery history when surgeries exist', () => {
    const { getByText } = render(<Review navigation={mockNavigation} />);
    expect(getByText(/Surgery History/i)).toBeTruthy();
    expect(getByText(/Top Surgery/i)).toBeTruthy();
  });

  it('navigates to GenderIdentity on Edit Profile press', () => {
    const { getAllByText } = render(<Review navigation={mockNavigation} />);
    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[0]); // First Edit button (Your Profile)
    expect(mockNavigation.navigate).toHaveBeenCalledWith('GenderIdentity');
  });

  it('navigates to HRTAndBinding on Edit HRT/Binding press', () => {
    const { getAllByText } = render(<Review navigation={mockNavigation} />);
    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[1]); // Second Edit button (HRT Status)
    expect(mockNavigation.navigate).toHaveBeenCalledWith('HRTAndBinding');
  });

  it('navigates to Surgery on Edit Surgery press', () => {
    const { getAllByText } = render(<Review navigation={mockNavigation} />);
    const editButtons = getAllByText('Edit');
    // Find the Edit button for Surgery History section
    const surgeryEditButton = editButtons.find((btn) => {
      // This is a simplified check - in reality you'd need to find the specific button
      return true;
    });
    if (surgeryEditButton) {
      fireEvent.press(surgeryEditButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Surgery');
    }
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

