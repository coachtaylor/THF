import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GoalCard from '../../components/onboarding/GoalCard';

describe('GoalCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders goal label', () => {
    const { getByText } = render(
      <GoalCard
        goal="strength"
        isSelected={false}
        selectionType={null}
        onPress={mockOnPress}
      />
    );
    expect(getByText('Strength')).toBeTruthy();
  });

  it('renders goal description', () => {
    const { getByText } = render(
      <GoalCard
        goal="strength"
        isSelected={false}
        selectionType={null}
        onPress={mockOnPress}
      />
    );
    expect(getByText('Build muscle and power')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <GoalCard
        goal="strength"
        isSelected={false}
        selectionType={null}
        onPress={mockOnPress}
      />
    );
    const card = getByText('Strength').parent?.parent;
    if (card) {
      fireEvent.press(card);
      expect(mockOnPress).toHaveBeenCalled();
    }
  });

  it('shows Primary badge when selectionType is primary', () => {
    const { getByText } = render(
      <GoalCard
        goal="strength"
        isSelected={true}
        selectionType="primary"
        onPress={mockOnPress}
      />
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('shows Secondary badge when selectionType is secondary', () => {
    const { getByText } = render(
      <GoalCard
        goal="strength"
        isSelected={true}
        selectionType="secondary"
        onPress={mockOnPress}
      />
    );
    expect(getByText('Secondary')).toBeTruthy();
  });
});

