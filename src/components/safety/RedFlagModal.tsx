// Red Flag Deflection Modal
// Displays when user input contains concerning symptoms or medical questions
// PRD 3.0 requirement: Clear deflection to medical care

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme/theme';
import {
  RedFlagCategory,
  CRISIS_RESOURCES,
} from '../../services/safety/redFlagDeflection';

interface RedFlagModalProps {
  visible: boolean;
  onClose: () => void;
  category?: RedFlagCategory;
  message: string;
}

export default function RedFlagModal({
  visible,
  onClose,
  category,
  message,
}: RedFlagModalProps) {
  const insets = useSafeAreaInsets();
  const isCrisis = category === 'medical_emergency';

  const handleCall = (number: string) => {
    const phoneUrl = `tel:${number.replace(/[^0-9]/g, '')}`;
    Linking.openURL(phoneUrl).catch((err) =>
      console.error('Failed to open phone:', err)
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { paddingBottom: insets.bottom + spacing.l },
          ]}
        >
          <LinearGradient
            colors={['#1A1A1A', '#0F0F0F']}
            style={StyleSheet.absoluteFill}
          />

          {/* Header Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isCrisis ? colors.error : colors.warning },
            ]}
          >
            <Ionicons
              name={isCrisis ? 'alert-circle' : 'medical'}
              size={32}
              color={colors.text.inverse}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isCrisis ? 'Please Seek Help' : 'We Can\'t Help With This'}
          </Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Crisis Resources (only for emergencies) */}
          {isCrisis && (
            <ScrollView
              style={styles.resourcesContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.resourcesTitle}>Crisis Resources</Text>

              {Object.values(CRISIS_RESOURCES).map((resource, index) => (
                <Pressable
                  key={index}
                  style={styles.resourceItem}
                  onPress={() => handleCall(resource.number)}
                >
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName}>{resource.name}</Text>
                    <Text style={styles.resourceDesc}>{resource.description}</Text>
                  </View>
                  <View style={styles.callButton}>
                    <Ionicons name="call" size={16} color={colors.accent.primary} />
                    <Text style={styles.callText}>{resource.number}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Non-crisis guidance */}
          {!isCrisis && (
            <View style={styles.guidanceContainer}>
              <View style={styles.guidanceItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.success}
                />
                <Text style={styles.guidanceText}>
                  Contact your healthcare provider
                </Text>
              </View>
              <View style={styles.guidanceItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.success}
                />
                <Text style={styles.guidanceText}>
                  Follow your surgeon's instructions
                </Text>
              </View>
              <View style={styles.guidanceItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.success}
                />
                <Text style={styles.guidanceText}>
                  Seek medical care if symptoms persist
                </Text>
              </View>
            </View>
          )}

          {/* Dismiss Button */}
          <Pressable style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissText}>I Understand</Text>
          </Pressable>

          {/* Footer */}
          <Text style={styles.footer}>
            TransFitness provides fitness guidance only.{'\n'}
            We cannot provide medical advice or diagnosis.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
    ...Platform.select({
      ios: {
        shadowColor: colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.m,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  resourcesContainer: {
    width: '100%',
    maxHeight: 200,
    marginBottom: spacing.l,
  },
  resourcesTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.m,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  resourceInfo: {
    flex: 1,
    marginRight: spacing.m,
  },
  resourceName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  resourceDesc: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.sm,
  },
  callText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  guidanceContainer: {
    width: '100%',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  guidanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  guidanceText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  dismissButton: {
    width: '100%',
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.m,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  dismissText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  footer: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
