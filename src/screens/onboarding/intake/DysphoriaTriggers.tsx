import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

// Trigger options
const TRIGGER_OPTIONS = [
  { value: 'looking_at_chest', label: 'Looking at chest in mirror' },
  { value: 'tight_clothing', label: 'Tight or form-fitting clothing' },
  { value: 'mirrors', label: 'Mirrors / reflective surfaces' },
  { value: 'body_contact', label: 'Body contact (spotting, partner work)' },
  { value: 'crowded_spaces', label: 'Crowded workout spaces' },
  { value: 'locker_rooms', label: 'Locker rooms / changing areas' },
  { value: 'voice', label: 'Voice (grunting, heavy breathing)' },
  { value: 'other', label: 'Other (please specify)' },
];

// SVG Components
const CheckmarkSVG = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path
      d="M2 7 L5.5 10.5 L12 4"
      stroke="#0F1419"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function DysphoriaTriggers({ navigation }: OnboardingScreenProps<'DysphoriaTriggers'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();

  // State
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [otherText, setOtherText] = useState<string>('');
  const [notesText, setNotesText] = useState<string>('');

  // Load from profile
  useEffect(() => {
    if (profile?.dysphoria_triggers) {
      setSelectedTriggers(profile.dysphoria_triggers);
    }
    if (profile?.dysphoria_notes) {
      // Check if notes contain "Other:" prefix
      if (profile.dysphoria_notes.includes('Other:')) {
        const parts = profile.dysphoria_notes.split('Other:');
        if (parts.length > 1) {
          setOtherText(parts[1].trim());
          setNotesText(parts[0].trim());
        } else {
          setNotesText(profile.dysphoria_notes);
        }
      } else {
        setNotesText(profile.dysphoria_notes);
      }
    }
  }, [profile]);

  // Toggle trigger selection
  const toggleTrigger = (value: string) => {
    if (selectedTriggers.includes(value)) {
      setSelectedTriggers(selectedTriggers.filter((t) => t !== value));
      // Clear other text if "other" is deselected
      if (value === 'other') {
        setOtherText('');
      }
    } else {
      setSelectedTriggers([...selectedTriggers, value]);
    }
  };

  // Handle continue
  const handleContinue = async () => {
    try {
      // Combine other trigger text with notes if both exist
      let finalNotes = notesText.trim();
      if (selectedTriggers.includes('other') && otherText.trim()) {
        const otherNote = `Other: ${otherText.trim()}`;
        finalNotes = finalNotes ? `${finalNotes}\n\n${otherNote}` : otherNote;
      }

      const hasData = selectedTriggers.length > 0 || finalNotes.length > 0;

      await updateProfile({
        dysphoria_triggers: hasData && selectedTriggers.length > 0 ? selectedTriggers : undefined,
        dysphoria_notes: hasData && finalNotes.length > 0 ? finalNotes : undefined,
      });
      navigation.navigate('Review');
    } catch (error) {
      console.error('Error saving dysphoria information:', error);
      // Navigate even if save fails
      navigation.navigate('Review');
    }
  };

  // Handle skip
  const handleSkip = async () => {
    try {
      // Clear all data
      await updateProfile({
        dysphoria_triggers: undefined,
        dysphoria_notes: undefined,
      });
    } catch (error) {
      console.error('Error clearing dysphoria information:', error);
    }
    // Navigate to Review regardless
    navigation.navigate('Review');
  };

  const showOtherInput = selectedTriggers.includes('other');

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <ProgressIndicator currentStep={7} totalSteps={8} />
          <Text style={styles.headline}>Dysphoria Triggers</Text>
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
          </View>
          <Text style={styles.subheadline}>
            Help us create a more comfortable experience
          </Text>
        </View>

        {/* INTRO CARD */}
        <View style={styles.introContainer}>
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              This information is entirely optional and private. You can skip this step or share only what feels comfortable. It helps us:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• Suggest clothing alternatives</Text>
              <Text style={styles.bulletPoint}>• Offer mirror-free exercise options</Text>
              <Text style={styles.bulletPoint}>• Provide alternative cues and modifications</Text>
            </View>
          </View>
        </View>

        {/* TRIGGER SELECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Do any of these trigger dysphoria? (Optional)</Text>

          {TRIGGER_OPTIONS.map((option, index) => {
            const isSelected = selectedTriggers.includes(option.value);
            const isLast = index === TRIGGER_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.triggerCard, isSelected && styles.triggerCardSelected, isLast && styles.triggerCardLast]}
                onPress={() => toggleTrigger(option.value)}
              >
                <View style={[styles.checkboxSquare, isSelected && styles.checkboxSquareSelected]}>
                  {isSelected && <CheckmarkSVG />}
                </View>
                <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* OTHER INPUT (conditional) */}
          {showOtherInput && (
            <View style={styles.otherInputContainer}>
              <Text style={styles.inputLabel}>Please describe: (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={otherText}
                onChangeText={(text) => setOtherText(text.slice(0, 500))}
                placeholder="Describe your trigger..."
                placeholderTextColor="#6B7280"
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCounter}>{otherText.length}/500</Text>
            </View>
          )}
        </View>

        {/* ADDITIONAL NOTES */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Anything else? (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Any additional context that would help us support you
          </Text>
          <TextInput
            style={styles.notesInput}
            value={notesText}
            onChangeText={(text) => setNotesText(text.slice(0, 500))}
            placeholder="Additional notes..."
            placeholderTextColor="#6B7280"
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCounter}>{notesText.length}/500</Text>
        </View>

        {/* FOOTER (SCROLLS WITH CONTENT) */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={['#00D9C0', '#00B39D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue to Review</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip this step</Text>
          </TouchableOpacity>

          <Text style={styles.hintText}>
            This information is private and helps us personalize
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'left',
  },
  optionalBadge: {
    backgroundColor: 'rgba(91, 159, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  optionalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B9FFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 22,
    textAlign: 'left',
  },
  introContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  introCard: {
    backgroundColor: 'rgba(91, 159, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#5B9FFF',
  },
  introText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#B8C5C5',
    lineHeight: 21,
    marginBottom: 12,
    textAlign: 'left',
  },
  bulletList: {
    marginTop: 8,
  },
  bulletPoint: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 6,
    textAlign: 'left',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 19,
    textAlign: 'left',
  },
  triggerCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  triggerCardSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  triggerCardLast: {
    marginBottom: 0,
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareSelected: {
    borderColor: '#00D9C0',
    backgroundColor: '#00D9C0',
  },
  cardText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E0E4E8',
    flex: 1,
    textAlign: 'left',
  },
  cardTextSelected: {
    fontWeight: '600',
    color: '#00D9C0',
  },
  otherInputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'left',
  },
  textInput: {
    backgroundColor: '#1A1F26',
    borderWidth: 2,
    borderColor: '#2A2F36',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesInput: {
    backgroundColor: '#1A1F26',
    borderWidth: 2,
    borderColor: '#2A2F36',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCounter: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 0,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  skipButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
