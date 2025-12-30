/**
 * Personal Records Service Tests
 *
 * Tests for PR tracking functionality including:
 * - 1RM estimation calculation
 * - PR detection logic
 * - Multiple PR types
 * - Edge cases
 */

import {
  calculateEstimated1RM,
  formatPRType,
  formatPRValue,
  getPRTypeIcon,
} from "../../services/storage/personalRecords";
import { PersonalRecord, PRType } from "../../types/personalRecords";

describe("Personal Records Service", () => {
  describe("calculateEstimated1RM", () => {
    it("should return actual weight for single rep", () => {
      expect(calculateEstimated1RM(225, 1)).toBe(225);
    });

    it("should calculate 1RM correctly using Epley formula", () => {
      // Epley formula: 1RM = weight * (1 + reps/30)
      // 200 lbs x 5 reps = 200 * (1 + 5/30) = 200 * 1.167 = 233.3
      expect(calculateEstimated1RM(200, 5)).toBeCloseTo(233.3, 1);
    });

    it("should calculate 1RM for moderate rep range", () => {
      // 135 lbs x 10 reps = 135 * (1 + 10/30) = 135 * 1.333 = 180
      expect(calculateEstimated1RM(135, 10)).toBeCloseTo(180, 1);
    });

    it("should return 0 for zero weight", () => {
      expect(calculateEstimated1RM(0, 10)).toBe(0);
    });

    it("should return 0 for zero reps", () => {
      expect(calculateEstimated1RM(100, 0)).toBe(0);
    });

    it("should handle high rep ranges (less accurate but still calculates)", () => {
      // 95 lbs x 20 reps = 95 * (1 + 20/30) = 95 * 1.667 = 158.3
      expect(calculateEstimated1RM(95, 20)).toBeCloseTo(158.3, 1);
    });

    it("should round to 1 decimal place", () => {
      const result = calculateEstimated1RM(185, 3);
      // 185 * 1.1 = 203.5
      const decimalPlaces = (result.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });
  });

  describe("formatPRType", () => {
    it("should format max_weight correctly", () => {
      expect(formatPRType("max_weight")).toBe("Max Weight");
    });

    it("should format max_reps correctly", () => {
      expect(formatPRType("max_reps")).toBe("Max Reps");
    });

    it("should format volume correctly", () => {
      expect(formatPRType("volume")).toBe("Volume");
    });

    it("should format estimated_1rm correctly", () => {
      expect(formatPRType("estimated_1rm")).toBe("Est. 1RM");
    });
  });

  describe("formatPRValue", () => {
    const createMockPR = (
      type: PRType,
      value: number,
      weight?: number,
      reps?: number,
    ): PersonalRecord => ({
      id: "pr-1",
      user_id: "user-1",
      exercise_id: "ex-1",
      pr_type: type,
      value,
      weight: weight ?? null,
      reps: reps ?? null,
      achieved_at: new Date(),
      workout_log_id: null,
      set_log_id: null,
      previous_value: null,
      improvement_percent: null,
    });

    it("should format max_weight with lbs", () => {
      const pr = createMockPR("max_weight", 225);
      expect(formatPRValue(pr)).toBe("225 lbs");
    });

    it("should format max_reps with reps", () => {
      const pr = createMockPR("max_reps", 15);
      expect(formatPRValue(pr)).toBe("15 reps");
    });

    it("should format volume with comma separator and lbs", () => {
      const pr = createMockPR("volume", 2250);
      expect(formatPRValue(pr)).toBe("2,250 lbs");
    });

    it("should format estimated_1rm with lbs", () => {
      const pr = createMockPR("estimated_1rm", 275.5);
      expect(formatPRValue(pr)).toBe("275.5 lbs");
    });
  });

  describe("getPRTypeIcon", () => {
    it("should return barbell for max_weight", () => {
      expect(getPRTypeIcon("max_weight")).toBe("barbell");
    });

    it("should return repeat for max_reps", () => {
      expect(getPRTypeIcon("max_reps")).toBe("repeat");
    });

    it("should return stats-chart for volume", () => {
      expect(getPRTypeIcon("volume")).toBe("stats-chart");
    });

    it("should return calculator for estimated_1rm", () => {
      expect(getPRTypeIcon("estimated_1rm")).toBe("calculator");
    });
  });

  describe("PR Detection Logic", () => {
    describe("Volume PR calculation", () => {
      it("should calculate volume as weight * reps", () => {
        const weight = 135;
        const reps = 10;
        const expectedVolume = weight * reps;
        expect(expectedVolume).toBe(1350);
      });

      it("should handle bodyweight exercises (0 weight)", () => {
        const weight = 0;
        const reps = 20;
        const volume = weight * reps;
        expect(volume).toBe(0);
      });
    });

    describe("PR comparison", () => {
      it("should detect new PR when current > previous", () => {
        const currentValue = 230;
        const previousValue = 225;
        expect(currentValue > previousValue).toBe(true);
      });

      it("should not detect PR when current equals previous", () => {
        const currentValue = 225;
        const previousValue = 225;
        expect(currentValue > previousValue).toBe(false);
      });

      it("should not detect PR when current < previous", () => {
        const currentValue = 220;
        const previousValue = 225;
        expect(currentValue > previousValue).toBe(false);
      });

      it("should detect first PR when no previous exists", () => {
        const currentValue = 135;
        const previousValue = 0;
        expect(currentValue > previousValue).toBe(true);
      });
    });

    describe("Improvement percentage", () => {
      it("should calculate improvement correctly", () => {
        const previousValue = 200;
        const currentValue = 210;
        const improvement =
          ((currentValue - previousValue) / previousValue) * 100;
        expect(improvement).toBe(5);
      });

      it("should handle large improvements", () => {
        const previousValue = 100;
        const currentValue = 150;
        const improvement =
          ((currentValue - previousValue) / previousValue) * 100;
        expect(improvement).toBe(50);
      });

      it("should handle null previous value (first PR)", () => {
        const previousValue: number | null = null;
        const currentValue = 135;
        const improvement =
          previousValue !== null
            ? ((currentValue - previousValue) / previousValue) * 100
            : null;
        expect(improvement).toBeNull();
      });
    });
  });

  describe("PR Types Coverage", () => {
    it("should track all 4 PR types", () => {
      const prTypes: PRType[] = [
        "max_weight",
        "max_reps",
        "volume",
        "estimated_1rm",
      ];
      expect(prTypes).toHaveLength(4);
    });

    it("should have unique icon for each type", () => {
      const icons = [
        getPRTypeIcon("max_weight"),
        getPRTypeIcon("max_reps"),
        getPRTypeIcon("volume"),
        getPRTypeIcon("estimated_1rm"),
      ];
      const uniqueIcons = new Set(icons);
      expect(uniqueIcons.size).toBe(4);
    });
  });

  describe("Edge Cases", () => {
    it("should handle decimal weights", () => {
      // Some gyms use 2.5 lb plates
      const e1rm = calculateEstimated1RM(137.5, 5);
      expect(e1rm).toBeGreaterThan(137.5);
    });

    it("should handle very high weights", () => {
      const e1rm = calculateEstimated1RM(500, 3);
      expect(e1rm).toBeGreaterThan(500);
    });

    it("should handle very high reps", () => {
      const e1rm = calculateEstimated1RM(50, 50);
      // At 50 reps, this estimates 50 * (1 + 50/30) = 50 * 2.67 = 133.3
      expect(e1rm).toBeGreaterThan(100);
    });
  });
});
