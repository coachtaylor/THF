// Copilot Input Component
// Text input with send button for chat interface

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface CopilotInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function CopilotInput({
  onSend,
  disabled = false,
  placeholder = 'Ask me anything...',
}: CopilotInputProps) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + spacing.s }]}>
        <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
          <LinearGradient
            colors={['#141418', '#0A0A0C']}
            style={StyleSheet.absoluteFill}
          />

          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            value={message}
            onChangeText={setMessage}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSend}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit
            editable={!disabled}
          />

          <Pressable
            style={[styles.sendButton, canSend && styles.sendButtonActive]}
            onPress={handleSend}
            disabled={!canSend}
          >
            {canSend && (
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primaryDark]}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Ionicons
              name="send"
              size={18}
              color={canSend ? colors.text.inverse : colors.text.tertiary}
            />
          </Pressable>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={12} color={colors.text.tertiary} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: colors.accent.primary,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.xs,
    backgroundColor: colors.glass.bg,
    overflow: 'hidden',
  },
  sendButtonActive: {
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  disclaimerText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
  },
});
