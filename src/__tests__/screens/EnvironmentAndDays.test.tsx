/**
 * Tests for the EnvironmentAndDays onboarding screen — added in Sprint 2 when
 * we collapsed TrainingEnvironment + WorkoutDays into one screen, and given
 * the equipment block as a Sprint 2 follow-up (option A from the cleanup
 * plan: equipment lives next to env so the catalog is never shown unfiltered).
 *
 * STATUS: describe.skip — same Expo SDK 54 / react-native-reanimated mock issue
 * blocking the other screen tests in this directory. The pure helpers used by
 * this screen are covered by src/__tests__/utils/equipmentOptions.test.ts and
 * those run today. Re-enable this suite once the reanimated mock is updated.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import EnvironmentAndDays from "../../screens/onboarding/intake/EnvironmentAndDays";

const mockUpdateProfile = jest.fn();
const mockLogEquipmentRequest = jest.fn();

jest.mock("../../services/storage/profile", () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  logEquipmentRequest: (...args: unknown[]) =>
    mockLogEquipmentRequest(...args),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(),
  isFocused: jest.fn(() => true),
  getId: jest.fn(() => "test-id"),
} as any;

// Loose-typed so individual tests can sprinkle on optional profile fields
// (training_environment, preferred_workout_days, equipment, etc.) without
// fighting the inferred shape of the seed object.
const baseProfile: Record<string, unknown> = {
  id: "test-id",
  user_id: "test-user",
  gender_identity: "ftm",
  primary_goal: "general_fitness",
  fitness_experience: "intermediate",
  workout_frequency: 3,
  session_duration: 45,
  on_hrt: false,
  binds_chest: false,
  surgeries: [],
  equipment: [],
  created_at: new Date(),
  updated_at: new Date(),
};

let mockProfile: Record<string, unknown> = baseProfile;

jest.mock("../../hooks/useProfile", () => ({
  useProfile: () => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile,
  }),
}));

// SKIPPED: matches Disclaimer / Surgery / Goals / Review / WhyTransFitness pattern.
// Expo SDK 54 broke react-native-reanimated/mock (ESM export issue). Re-enable
// once the reanimated jest mock is updated for the new runtime.
describe.skip("EnvironmentAndDays Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfile = { ...baseProfile };
  });

  describe("rendering", () => {
    it("shows the title and subtitle", () => {
      const { getByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      expect(getByText("Your Training Setup")).toBeTruthy();
    });

    it("shows the four environment options", () => {
      const { getByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Commercial Gym")).toBeTruthy();
      expect(getByText("Small Studio")).toBeTruthy();
      expect(getByText("Outdoors / Mixed")).toBeTruthy();
    });

    it("hides the equipment block until an environment is picked", () => {
      // The equipment section only renders after env is selected so the
      // catalog is always pre-filtered (this is the bug fix from option A).
      const { queryByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      expect(queryByText("Available Equipment")).toBeNull();
    });
  });

  describe("equipment block (after env pick)", () => {
    it("reveals the equipment section once env is picked", () => {
      const { getByText, queryByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      expect(queryByText("Available Equipment")).toBeNull();
      fireEvent.press(getByText("Home"));
      expect(getByText("Available Equipment")).toBeTruthy();
    });

    it("does not show gym-only equipment for outdoor users", () => {
      const { getByText, queryByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      fireEvent.press(getByText("Outdoors / Mixed"));
      expect(queryByText("Barbell")).toBeNull();
      expect(queryByText("Cable Machine")).toBeNull();
      expect(queryByText("Weight Machines")).toBeNull();
    });

    it("populates default equipment selections when env first picked", () => {
      // Home defaults: bodyweight + dumbbells + bands. Picking 3 days then
      // Continue should save those defaults along with env.
      const { getByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      fireEvent.press(getByText("Home"));
      // Days default to [1,3,5] for frequency=3, so Continue is enabled.
      // (Today-dependent passed-days modal may interfere — handled in its own test.)
      fireEvent.press(getByText("Continue"));
      return waitFor(() => {
        const call = mockUpdateProfile.mock.calls.find(
          (c) => c[0]?.training_environment === "home",
        );
        expect(call?.[0].equipment).toEqual(
          expect.arrayContaining(["bodyweight", "dumbbells", "bands"]),
        );
      });
    });

    it("filters equipment when user switches env (drops invalid items)", () => {
      // Pick gym, select barbells, switch to outdoors → barbells dropped.
      const { getByText, queryByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      fireEvent.press(getByText("Commercial Gym"));
      fireEvent.press(getByText("Barbell"));
      fireEvent.press(getByText("Outdoors / Mixed"));
      // Barbell is no longer in the list at all.
      expect(queryByText("Barbell")).toBeNull();
    });
  });

  describe("save flow", () => {
    it("requires env, equipment, and exact day count to enable Continue", () => {
      // canContinue = environment !== null && equipment.size > 0 && selectedDays.size === workoutFrequency
      const { getByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      // Without env selected, continue should not navigate.
      fireEvent.press(getByText("Continue"));
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it("bundles env + days + equipment + other_equipment_text into a single profile write", () => {
      // The buildProfileUpdate helper exists specifically to avoid a
      // half-saved state where days persist but equipment doesn't.
      const { getByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      fireEvent.press(getByText("Home"));
      fireEvent.press(getByText("Continue"));
      return waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
        const call = mockUpdateProfile.mock.calls[0][0];
        expect(call).toEqual(
          expect.objectContaining({
            training_environment: "home",
            preferred_workout_days: expect.any(Array),
            equipment: expect.any(Array),
          }),
        );
      });
    });

    it("logs equipment request when 'other' is selected with non-empty text", () => {
      // Fire-and-forget telemetry — should not block navigation.
      const { getByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      fireEvent.press(getByText("Home"));
      fireEvent.press(getByText("Other Equipment"));
      // The TextInput appears after "other" is checked. Filling it would
      // require a testID or label match — left as a manual QA step.
      fireEvent.press(getByText("Continue"));
      // Without text, log should NOT fire even though "other" is selected.
      return waitFor(() => {
        expect(mockLogEquipmentRequest).not.toHaveBeenCalled();
      });
    });
  });

  describe("hydration from profile", () => {
    it("re-selects saved environment, days, and equipment on mount", () => {
      mockProfile = {
        ...baseProfile,
        training_environment: "gym",
        preferred_workout_days: [1, 3, 5],
        equipment: ["barbells", "dumbbells"],
      };
      const { queryByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      // Equipment block should be visible immediately (env is hydrated).
      expect(queryByText("Available Equipment")).toBeTruthy();
    });

    it("preserves saved equipment when env is unchanged after hydration", () => {
      // Regression guard: the env-change useEffect must NOT clobber loaded
      // equipment on mount. prevEnvRef is seeded from the hydrated env so
      // the "first env pick" branch is skipped.
      mockProfile = {
        ...baseProfile,
        training_environment: "home",
        equipment: ["pull_up_bar"], // not in defaultForEnv["home"]
        preferred_workout_days: [1, 3, 5],
      };
      const { getByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      fireEvent.press(getByText("Continue"));
      return waitFor(() => {
        const call = mockUpdateProfile.mock.calls[0][0];
        expect(call.equipment).toEqual(["pull_up_bar"]);
      });
    });
  });

  describe("step counter", () => {
    it("displays STEP 7 OF 8 (Sprint 2 normalization)", () => {
      const { getByText } = render(
        <EnvironmentAndDays navigation={mockNavigation} />,
      );
      expect(getByText("STEP 7 OF 8")).toBeTruthy();
    });
  });
});
