import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import QuickStart from '../../screens/onboarding/QuickStart';
import { mockNavigation } from '../mocks';

const mockWorkout = {
  id: 'quick-start-workout',
  duration: 30,
  exercises: [],
  totalMinutes: 30,
};

const mockPlan = {
  id: 'quick-start',
  blockLength: 1,
  startDate: new Date(),
  goals: ['strength'],
  goalWeighting: { primary: 100, secondary: 0 },
  days: [
    {
      dayNumber: 0,
      date: new Date(),
      variants: {
        30: mockWorkout,
        45: null,
        60: null,
        90: null,
      },
    },
  ],
};

// Mock planGenerator
jest.mock('../../services/planGenerator', () => ({
  generateQuickStartPlan: jest.fn(() => Promise.resolve(mockPlan)),
}));

import { generateQuickStartPlan } from '../../services/planGenerator';

describe('QuickStart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<QuickStart navigation={mockNavigation} />);
    expect(getByText('Creating your 5-minute workout...')).toBeTruthy();
  });

  it('calls generateQuickStartPlan on mount', async () => {
    render(<QuickStart navigation={mockNavigation} />);
    await waitFor(() => {
      expect(generateQuickStartPlan).toHaveBeenCalled();
    });
  });

  it('navigates to SessionPlayer after plan generation', async () => {
    render(<QuickStart navigation={mockNavigation} />);
    await waitFor(() => {
      expect(mockNavigation.replace).toHaveBeenCalledWith('SessionPlayer', {
        workout: mockWorkout,
        planId: 'quick-start',
      });
    });
  });

  it('handles generation errors gracefully', async () => {
    (generateQuickStartPlan as jest.Mock).mockRejectedValueOnce(new Error('Generation failed'));
    const { getByText } = render(<QuickStart navigation={mockNavigation} />);
    await waitFor(
      () => {
        expect(getByText(/Something went wrong/i)).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });
});

