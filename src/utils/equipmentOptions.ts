/**
 * Shared equipment catalog and environment-aware helpers.
 *
 * Owns the source of truth for what equipment is available in each training
 * environment (home / gym / studio / outdoors) and which items pre-select
 * by default. Used by:
 *   - src/screens/onboarding/intake/EnvironmentAndDays.tsx (onboarding)
 *   - src/components/settings/EditTrainingModal.tsx (post-onboarding edit)
 *
 * Extracting this keeps the data set in one place and makes it unit-testable
 * without pulling in React Native render dependencies.
 */
import { TrainingEnvironment } from "../types";

export interface EquipmentOption {
  id: string;
  label: string;
  /** Environments where this equipment is realistically available. */
  environments: TrainingEnvironment[];
  /** Pre-selected by default for users in these environments. */
  defaultForEnv?: TrainingEnvironment[];
}

export const ALL_EQUIPMENT_OPTIONS: EquipmentOption[] = [
  {
    id: "bodyweight",
    label: "Bodyweight",
    environments: ["home", "gym", "studio", "outdoors"],
    defaultForEnv: ["home", "outdoors"],
  },
  {
    id: "dumbbells",
    label: "Dumbbells",
    environments: ["home", "gym", "studio"],
    defaultForEnv: ["home", "studio"],
  },
  {
    id: "bands",
    label: "Resistance Bands",
    environments: ["home", "gym", "studio", "outdoors"],
    defaultForEnv: ["home", "outdoors"],
  },
  {
    id: "kettlebells",
    label: "Kettlebell",
    environments: ["home", "gym", "studio"],
  },
  { id: "barbells", label: "Barbell", environments: ["gym", "studio"] },
  { id: "cables", label: "Cable Machine", environments: ["gym"] },
  { id: "machines", label: "Weight Machines", environments: ["gym"] },
  {
    id: "pull_up_bar",
    label: "Pull-up Bar",
    environments: ["home", "gym", "studio", "outdoors"],
  },
  { id: "bench", label: "Bench", environments: ["home", "gym", "studio"] },
  {
    id: "other",
    label: "Other Equipment",
    environments: ["home", "gym", "studio", "outdoors"],
  },
];

/**
 * Filter equipment options by environment.
 * Returns the full catalog when env is null/undefined so empty-state UI can
 * decide how to render.
 */
export function getEquipmentForEnvironment(
  env: TrainingEnvironment | null | undefined,
): EquipmentOption[] {
  if (!env) return ALL_EQUIPMENT_OPTIONS;
  return ALL_EQUIPMENT_OPTIONS.filter((opt) => opt.environments.includes(env));
}

/**
 * Default-selected equipment for a given environment. Used both for fresh
 * onboarding (no saved equipment) and as the fallback when an env change
 * invalidates every previously-selected item.
 */
export function getDefaultEquipmentForEnvironment(
  env: TrainingEnvironment,
): Set<string> {
  return new Set(
    ALL_EQUIPMENT_OPTIONS.filter((opt) =>
      opt.defaultForEnv?.includes(env),
    ).map((opt) => opt.id),
  );
}

/**
 * Drop equipment ids that aren't valid for the given environment.
 * Pure helper version of the env-change reconciliation in EnvironmentAndDays —
 * exposed for unit testing the "user changes env" path without rendering.
 */
export function filterEquipmentForEnvironment(
  selected: Set<string>,
  env: TrainingEnvironment,
): Set<string> {
  const validIds = new Set(
    ALL_EQUIPMENT_OPTIONS.filter((opt) => opt.environments.includes(env)).map(
      (opt) => opt.id,
    ),
  );
  return new Set(Array.from(selected).filter((id) => validIds.has(id)));
}
