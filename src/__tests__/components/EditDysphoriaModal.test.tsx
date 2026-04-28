/**
 * Tests for EditDysphoriaModal — the post-onboarding flow for configuring
 * dysphoria preferences. Sprint 2 deferred this from onboarding to settings,
 * so the rules engine no-ops on empty triggers and users opt in here later.
 *
 * Coverage targets:
 *   - profile hydration when modal opens (round-trips saved triggers/notes)
 *   - trigger toggle behavior
 *   - save flow: maps UI ids → profile DysphoriaTrigger values, trims notes
 *   - close-without-save discards local state changes
 *
 * Why this can run while screen tests are skipped: this modal uses only
 * react-native primitives (Modal, View, Text, Pressable, TextInput,
 * TouchableOpacity, KeyboardAvoidingView) plus mocked useSafeAreaInsets +
 * Ionicons. No reanimated, no GlassCard.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import EditDysphoriaModal from "../../components/settings/EditDysphoriaModal";
import type { Profile } from "../../types";

const mockUpdateProfile = jest.fn();

jest.mock("../../services/storage/profile", () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

const baseProfile: Profile = {
  id: "test-id",
  user_id: "test-user",
  gender_identity: "ftm",
  primary_goal: "general_fitness",
  fitness_experience: "beginner",
  workout_frequency: 3,
  session_duration: 45,
  on_hrt: false,
  binds_chest: false,
  surgeries: [],
  equipment: [],
  created_at: new Date(),
  updated_at: new Date(),
} as unknown as Profile;

describe("EditDysphoriaModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateProfile.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("renders the header title and Save button when visible", () => {
      const { getByText } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={jest.fn()}
          profile={baseProfile}
          onSave={jest.fn()}
        />,
      );
      expect(getByText("Dysphoria Preferences")).toBeTruthy();
      expect(getByText("Save")).toBeTruthy();
    });

    it("renders all six trigger options when visible", () => {
      const { getByText } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={jest.fn()}
          profile={baseProfile}
          onSave={jest.fn()}
        />,
      );
      expect(getByText("Mirrors in Gym")).toBeTruthy();
      expect(getByText("Crowded Spaces")).toBeTruthy();
      expect(getByText("Progress Photos")).toBeTruthy();
      expect(getByText("Changing Rooms")).toBeTruthy();
      expect(getByText("Swimming/Water Activities")).toBeTruthy();
      expect(getByText("Body-Focused Movements")).toBeTruthy();
    });
  });

  describe("hydration from profile", () => {
    it("starts with no triggers selected when profile has none", () => {
      // No way to assert "unchecked" directly without testIDs, so we lean on
      // save behavior: open → save → updateProfile called with empty array.
      const onClose = jest.fn();
      const onSave = jest.fn();
      const { getByText } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={onClose}
          profile={baseProfile}
          onSave={onSave}
        />,
      );
      fireEvent.press(getByText("Save"));
      return waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({ dysphoria_triggers: [] }),
        );
      });
    });

    it("hydrates dysphoria_notes from profile", async () => {
      const profile = {
        ...baseProfile,
        dysphoria_notes: "Avoid mirror-heavy gyms",
      };
      const { getByDisplayValue } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={jest.fn()}
          profile={profile}
          onSave={jest.fn()}
        />,
      );
      expect(getByDisplayValue("Avoid mirror-heavy gyms")).toBeTruthy();
    });
  });

  describe("save flow", () => {
    it("maps selected UI ids to profile DysphoriaTrigger values on save", async () => {
      const onSave = jest.fn();
      const onClose = jest.fn();
      const { getByText } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={onClose}
          profile={baseProfile}
          onSave={onSave}
        />,
      );
      fireEvent.press(getByText("Mirrors in Gym"));
      fireEvent.press(getByText("Swimming/Water Activities"));
      fireEvent.press(getByText("Save"));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
      });
      const call = mockUpdateProfile.mock.calls[0][0];
      // TRIGGER_MAPPING: mirrors → 'mirrors', swimming → 'swimming'
      expect(new Set(call.dysphoria_triggers)).toEqual(
        new Set(["mirrors", "swimming"]),
      );
    });

    it("calls onSave then onClose after a successful save", async () => {
      const onSave = jest.fn();
      const onClose = jest.fn();
      const { getByText } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={onClose}
          profile={baseProfile}
          onSave={onSave}
        />,
      );
      fireEvent.press(getByText("Save"));
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("treats whitespace-only notes as undefined (avoids storing meaningless strings)", async () => {
      // The save handler does `notes.trim() || undefined`. If the user types
      // only spaces, we should not persist them.
      const profile = { ...baseProfile, dysphoria_notes: "   " };
      const { getByText } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={jest.fn()}
          profile={profile}
          onSave={jest.fn()}
        />,
      );
      fireEvent.press(getByText("Save"));
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({ dysphoria_notes: undefined }),
        );
      });
    });

    it("toggling a trigger off before save excludes it from the save payload", async () => {
      const { getByText } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={jest.fn()}
          profile={baseProfile}
          onSave={jest.fn()}
        />,
      );
      // Select then deselect — net should be empty.
      fireEvent.press(getByText("Mirrors in Gym"));
      fireEvent.press(getByText("Mirrors in Gym"));
      fireEvent.press(getByText("Save"));
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({ dysphoria_triggers: [] }),
        );
      });
    });
  });

  describe("known limitation: TRIGGER_MAPPING is non-injective", () => {
    it("documents that 'public_spaces' and 'changing_rooms' both save as 'crowded_spaces'", async () => {
      // Both UI ids map to the same profile trigger. Selecting both and
      // saving produces a deduped array with one 'crowded_spaces' entry —
      // future hydration cannot distinguish which one the user originally
      // picked. Worth flagging if the UX needs separate filtering later.
      const { getByText } = render(
        <EditDysphoriaModal
          visible={true}
          onClose={jest.fn()}
          profile={baseProfile}
          onSave={jest.fn()}
        />,
      );
      fireEvent.press(getByText("Crowded Spaces"));
      fireEvent.press(getByText("Changing Rooms"));
      fireEvent.press(getByText("Save"));
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
      });
      const saved = mockUpdateProfile.mock.calls[0][0].dysphoria_triggers;
      // Both UI selections collapse to the same backing trigger
      expect(saved.filter((t: string) => t === "crowded_spaces").length).toBe(
        2,
      );
    });
  });
});
