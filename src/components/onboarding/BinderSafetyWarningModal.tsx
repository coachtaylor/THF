import React, { useState } from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
}

export default function BinderSafetyWarningModal({
  visible,
  onClose,
  onAcknowledge,
}: Props) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={48} color={colors.semantic.error} />
          </View>

          <Text style={styles.title}>⚠️ Important Safety Warning</Text>
          <Text style={styles.subtitle}>
            Ace bandages and DIY binders can cause serious injuries
          </Text>

          {/* Risks List */}
          <View style={styles.risksList}>
            <View style={styles.riskItem}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.semantic.error}
              />
              <Text style={styles.riskText}>Broken or bruised ribs</Text>
            </View>
            <View style={styles.riskItem}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.semantic.error}
              />
              <Text style={styles.riskText}>
                Restricted breathing and lung damage
              </Text>
            </View>
            <View style={styles.riskItem}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.semantic.error}
              />
              <Text style={styles.riskText}>Permanent tissue damage</Text>
            </View>
            <View style={styles.riskItem}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.semantic.error}
              />
              <Text style={styles.riskText}>Back and spine problems</Text>
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>
              We strongly recommend:
            </Text>
            <Text style={styles.recommendationText}>
              • Using a commercial binder designed for chest binding
            </Text>
            <Text style={styles.recommendationText}>
              • Never binding for more than 8-10 hours
            </Text>
            <Text style={styles.recommendationText}>
              • Taking breaks during workouts
            </Text>
            <Text style={styles.recommendationText}>
              • Never binding while sleeping
            </Text>
          </View>

          {/* Acknowledgment Checkbox */}
          <Pressable
            onPress={() => setHasAcknowledged(!hasAcknowledged)}
            style={styles.checkboxRow}
          >
            <View
              style={[
                styles.checkbox,
                hasAcknowledged && styles.checkboxChecked,
              ]}
            >
              {hasAcknowledged && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand the risks and will use extreme caution
            </Text>
          </Pressable>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={onClose}
              style={[styles.button, styles.buttonSecondary]}
            >
              <Text style={styles.buttonSecondaryText}>Go Back</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (hasAcknowledged) {
                  onAcknowledge();
                  setHasAcknowledged(false); // Reset for next time
                }
              }}
              disabled={!hasAcknowledged}
              style={[
                styles.button,
                styles.buttonDanger,
                !hasAcknowledged && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>Continue Anyway</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 500,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  risksList: {
    marginBottom: spacing.lg,
  },
  riskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  riskText: {
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  recommendationBox: {
    backgroundColor: colors.bg.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  recommendationTitle: {
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  recommendationText: {
    marginBottom: spacing.xs,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: 4,
    marginRight: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: colors.bg.secondary,
  },
  buttonDanger: {
    backgroundColor: colors.semantic.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonSecondaryText: {
    color: colors.text.primary,
    fontWeight: "bold",
  },
});
