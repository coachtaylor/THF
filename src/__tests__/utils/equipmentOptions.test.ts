/**
 * Unit tests for the equipment catalog and environment-aware helpers.
 *
 * These run today (no React Native render dependencies). They cover the
 * rules that prevent the original Sprint 2 bug — equipment list falling
 * back to ALL options when training_environment is unset, surfacing
 * barbells/cables to outdoor or home users.
 */
import {
  ALL_EQUIPMENT_OPTIONS,
  getEquipmentForEnvironment,
  getDefaultEquipmentForEnvironment,
  filterEquipmentForEnvironment,
} from "../../utils/equipmentOptions";

describe("equipmentOptions catalog", () => {
  it("contains exactly one entry per id (no duplicates)", () => {
    const ids = ALL_EQUIPMENT_OPTIONS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every option declares at least one valid environment", () => {
    for (const opt of ALL_EQUIPMENT_OPTIONS) {
      expect(opt.environments.length).toBeGreaterThan(0);
    }
  });

  it("'other' is available in every environment so users always have an escape hatch", () => {
    const other = ALL_EQUIPMENT_OPTIONS.find((o) => o.id === "other");
    expect(other?.environments).toEqual(
      expect.arrayContaining(["home", "gym", "studio", "outdoors"]),
    );
  });
});

describe("getEquipmentForEnvironment", () => {
  it("returns the full catalog when env is null", () => {
    // Used as a graceful fallback in JSX, but the screen now hides the
    // equipment section until env is picked, so this branch is defensive.
    expect(getEquipmentForEnvironment(null)).toEqual(ALL_EQUIPMENT_OPTIONS);
  });

  it("returns the full catalog when env is undefined", () => {
    expect(getEquipmentForEnvironment(undefined)).toEqual(
      ALL_EQUIPMENT_OPTIONS,
    );
  });

  it("excludes barbells, cables, and machines for home users", () => {
    const ids = getEquipmentForEnvironment("home").map((o) => o.id);
    expect(ids).not.toContain("barbells");
    expect(ids).not.toContain("cables");
    expect(ids).not.toContain("machines");
  });

  it("excludes barbells, dumbbells, kettlebells, cables, machines, bench for outdoor users", () => {
    // Outdoor is the most restrictive — only portable / bodyweight gear.
    const ids = getEquipmentForEnvironment("outdoors").map((o) => o.id);
    expect(ids).not.toContain("barbells");
    expect(ids).not.toContain("dumbbells");
    expect(ids).not.toContain("kettlebells");
    expect(ids).not.toContain("cables");
    expect(ids).not.toContain("machines");
    expect(ids).not.toContain("bench");
  });

  it("includes bodyweight + bands + pull-up bar + other for outdoor users", () => {
    const ids = getEquipmentForEnvironment("outdoors").map((o) => o.id);
    expect(ids).toEqual(
      expect.arrayContaining(["bodyweight", "bands", "pull_up_bar", "other"]),
    );
  });

  it("includes the full catalog for gym users (all options available)", () => {
    const gymIds = getEquipmentForEnvironment("gym").map((o) => o.id);
    // Every catalog entry that lists "gym" in its environments.
    const expectedGymIds = ALL_EQUIPMENT_OPTIONS.filter((o) =>
      o.environments.includes("gym"),
    ).map((o) => o.id);
    expect(gymIds.sort()).toEqual(expectedGymIds.sort());
  });
});

describe("getDefaultEquipmentForEnvironment", () => {
  it("home users get bodyweight, dumbbells, and bands by default", () => {
    expect(getDefaultEquipmentForEnvironment("home")).toEqual(
      new Set(["bodyweight", "dumbbells", "bands"]),
    );
  });

  it("outdoor users get bodyweight and bands by default", () => {
    expect(getDefaultEquipmentForEnvironment("outdoors")).toEqual(
      new Set(["bodyweight", "bands"]),
    );
  });

  it("studio users get dumbbells by default (and bodyweight is gym-default-only here)", () => {
    expect(getDefaultEquipmentForEnvironment("studio")).toEqual(
      new Set(["dumbbells"]),
    );
  });

  it("gym users get an empty default set (forces a deliberate pick)", () => {
    // Gym defaults intentionally empty: too many options to pre-select sanely,
    // and gym users typically know what they want.
    expect(getDefaultEquipmentForEnvironment("gym")).toEqual(new Set());
  });

  it("every default id is also a valid environment for that env", () => {
    // Sanity: a default can never be invalid for the env it defaults into.
    const envs = ["home", "gym", "studio", "outdoors"] as const;
    for (const env of envs) {
      const defaults = getDefaultEquipmentForEnvironment(env);
      const validIds = new Set(
        getEquipmentForEnvironment(env).map((o) => o.id),
      );
      for (const id of defaults) {
        expect(validIds.has(id)).toBe(true);
      }
    }
  });
});

describe("filterEquipmentForEnvironment", () => {
  it("drops items not valid for the new environment", () => {
    // User picked gym, selected barbells + cables + bodyweight, then switched to home.
    const selected = new Set(["barbells", "cables", "bodyweight"]);
    expect(filterEquipmentForEnvironment(selected, "home")).toEqual(
      new Set(["bodyweight"]),
    );
  });

  it("drops every item when none are valid for the new environment", () => {
    // User has only gym-only equipment, switches to outdoors.
    const selected = new Set(["barbells", "cables", "machines"]);
    expect(filterEquipmentForEnvironment(selected, "outdoors")).toEqual(
      new Set(),
    );
  });

  it("preserves all items when all are valid in the new environment", () => {
    // Bodyweight + bands are valid in every environment.
    const selected = new Set(["bodyweight", "bands"]);
    expect(filterEquipmentForEnvironment(selected, "outdoors")).toEqual(
      new Set(["bodyweight", "bands"]),
    );
  });

  it("returns empty set when input is empty", () => {
    expect(filterEquipmentForEnvironment(new Set(), "home")).toEqual(
      new Set(),
    );
  });

  it("'other' survives any environment switch (always valid)", () => {
    const selected = new Set(["other", "barbells"]);
    expect(filterEquipmentForEnvironment(selected, "outdoors")).toEqual(
      new Set(["other"]),
    );
  });
});
