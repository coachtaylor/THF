import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import QuickStart from '../../screens/onboarding/QuickStart';
import { mockNavigation } from '../mocks';

// Mock planGenerator
jest.mock('../../services/planGenerator', () => ({
  generateQuickStartPlan: jest.fn(() =>
    Promise.resolve({
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
            5: {
              duration: 5,
              exercises: [],
              totalMinutes: 5,
            },
            15: null,
            30: null,
            45: null,
          },
        },
      ],
    })
  ),
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

  it('shows success message after plan generation', async () => {
    const { getByText } = render(<QuickStart navigation={mockNavigation} />);
    await waitFor(
      () => {
        expect(getByText(/Workout Created/i)).toBeTruthy();
      },
      { timeout: 3000 }
    );
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

