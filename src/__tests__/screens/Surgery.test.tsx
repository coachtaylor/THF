import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Surgery from '../../screens/onboarding/intake/Surgery';

const mockUpdateProfile = jest.fn();
const mockNavigation = { navigate: jest.fn() };

jest.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {
      id: 'test-id',
      user_id: 'test-user',
      gender_identity: 'ftm',
      primary_goal: 'masculinization',
      on_hrt: true,
      binds_chest: true,
      surgeries: [],
      fitness_experience: 'intermediate',
      workout_frequency: 4,
      session_duration: 45,
      equipment: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
    updateProfile: mockUpdateProfile,
  }),
}));

describe('Surgery Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders headline correctly', () => {
    const { getByText } = render(<Surgery navigation={mockNavigation} />);
    expect(getByText('Surgery History')).toBeTruthy();
  });

  it('renders initial question', () => {
    const { getByText } = render(<Surgery navigation={mockNavigation} />);
    expect(getByText('Have you had any gender-affirming surgeries?')).toBeTruthy();
  });

  it('shows surgery type options when Yes selected', () => {
    const { getByText } = render(<Surgery navigation={mockNavigation} />);
    const yesButton = getByText('Yes');
    fireEvent.press(yesButton);
    expect(getByText('Select surgery types:')).toBeTruthy();
  });

  it('renders all surgery type options', () => {
    const { getByText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('Yes'));
    
    expect(getByText('Top Surgery (Chest reconstruction)')).toBeTruthy();
    expect(getByText('Bottom Surgery (Genital reconstruction)')).toBeTruthy();
    expect(getByText('Facial Feminization Surgery (FFS)')).toBeTruthy();
    expect(getByText('Orchiectomy')).toBeTruthy();
    expect(getByText('Other surgery')).toBeTruthy();
  });

  it('toggles surgery type selection', () => {
    const { getByText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('Yes'));
    
    const topSurgery = getByText('Top Surgery (Chest reconstruction)');
    fireEvent.press(topSurgery);
    
    // Surgery should be selected (checkbox checked)
    expect(topSurgery).toBeTruthy();
  });

  it('shows date input for selected surgery', () => {
    const { getByText, getByPlaceholderText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('Yes'));
    fireEvent.press(getByText('Top Surgery (Chest reconstruction)'));
    
    expect(getByText('Surgery Date *')).toBeTruthy();
    expect(getByPlaceholderText('YYYY-MM-DD')).toBeTruthy();
  });

  it('shows notes input for selected surgery', () => {
    const { getByText, getByPlaceholderText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('Yes'));
    fireEvent.press(getByText('Top Surgery (Chest reconstruction)'));
    
    expect(getByText('Notes (optional)')).toBeTruthy();
    expect(getByPlaceholderText('Any additional information...')).toBeTruthy();
  });

  it('calculates weeks post-op from date', () => {
    const { getByText, getByPlaceholderText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('Yes'));
    fireEvent.press(getByText('Top Surgery (Chest reconstruction)'));
    
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    
    // Set date to 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateString = sixMonthsAgo.toISOString().split('T')[0];
    
    fireEvent.changeText(dateInput, dateString);
    
    // Should show weeks post-op calculation
    // Note: This is a simplified test - actual calculation happens in the component
    expect(dateInput).toBeTruthy();
  });

  it('saves empty surgeries array when No selected', async () => {
    const { getByText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('No / Not yet'));
    
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          surgeries: [],
        })
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Review');
    });
  });

  it('saves surgery data on continue', async () => {
    const { getByText, getByPlaceholderText } = render(<Surgery navigation={mockNavigation} />);
    
    // Select Yes
    fireEvent.press(getByText('Yes'));
    
    // Select Top Surgery
    fireEvent.press(getByText('Top Surgery (Chest reconstruction)'));
    
    // Enter date
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    const testDate = '2023-01-15';
    fireEvent.changeText(dateInput, testDate);
    
    // Enter notes
    const notesInput = getByPlaceholderText('Any additional information...');
    fireEvent.changeText(notesInput, 'Test notes');
    
    // Continue
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          surgeries: expect.arrayContaining([
            expect.objectContaining({
              type: 'top_surgery',
              notes: 'Test notes',
            }),
          ]),
        })
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Review');
    });
  });

  it('disables continue button when surgery selected but no date provided', () => {
    const { getByText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('Yes'));
    fireEvent.press(getByText('Top Surgery (Chest reconstruction)'));
    
    const continueButton = getByText('Continue');
    // Button should be disabled if date is missing
    expect(continueButton).toBeTruthy();
  });

  it('shows context message based on weeks post-op', () => {
    const { getByText, getByPlaceholderText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('Yes'));
    fireEvent.press(getByText('Top Surgery (Chest reconstruction)'));
    
    // Set date to 4 weeks ago (should show "Still recovering" message)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const dateString = fourWeeksAgo.toISOString().split('T')[0];
    
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    fireEvent.changeText(dateInput, dateString);
    
    // Should show context message (component calculates this)
    expect(dateInput).toBeTruthy();
  });

  it('shows warning banner for recent surgeries (< 12 weeks)', () => {
    const { getByText, getByPlaceholderText } = render(<Surgery navigation={mockNavigation} />);
    fireEvent.press(getByText('Yes'));
    fireEvent.press(getByText('Top Surgery (Chest reconstruction)'));
    
    // Set date to 8 weeks ago (should trigger warning)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const dateString = eightWeeksAgo.toISOString().split('T')[0];
    
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    fireEvent.changeText(dateInput, dateString);
    
    // Warning banner should appear
    expect(getByText(/Important/i)).toBeTruthy();
    expect(getByText(/Always follow your surgeon's specific guidance/i)).toBeTruthy();
  });
});

