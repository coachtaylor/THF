// src/utils/equipment.ts
// Canonical equipment mapping + options for the Trans Health & Fitness app

import { supabase } from './supabase';

export type CanonicalEquipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'bands'
  | 'kettlebells'
  | 'barbells'
  | 'cable'
  | 'machine'
  | 'step'
  | 'medicine_ball'
  | 'stability_ball'
  | 'rope'
  | 'roller'
  | 'other';

export interface EquipmentOption {
  raw: string;              // representative raw label (optional nicety)
  value: CanonicalEquipment; // value used in profile + filters
  label: string;            // UI label
  description: string;      // UI helper text
  canonical: CanonicalEquipment;
  count?: number;           // how many exercises use this equipment
}

/**
 * Map a raw equipment string from Supabase to a canonical category.
 * Handles things like "BODY WEIGHT", "Dumbbells", "kettlebell", "smith machine", etc.
 */
export function mapRawEquipmentToCanonical(
  raw: string | null | undefined
): CanonicalEquipment | null {
  if (!raw) return null;

  const normalized = raw.trim().toUpperCase();

  // Bodyweight / assisted / weighted bodyweight
  if (
    normalized.includes('BODY WEIGHT') ||
    normalized === 'BODYWEIGHT' ||
    normalized.includes('ASSISTED') ||
    normalized.includes('WEIGHTED')
  ) {
    return 'bodyweight';
  }

  // Dumbbells
  if (normalized.includes('DUMBBELL')) {
    return 'dumbbells';
  }

  // Kettlebells (singular or plural → plural canonical)
  if (normalized.includes('KETTLEBELL')) {
    return 'kettlebells';
  }

  // Barbells (barbell, EZ bar, smith machine)
  if (
    normalized.includes('BARBELL') ||
    normalized.includes('EZ BAR') ||
    normalized.includes('EZ-BAR') ||
    normalized.includes('SMITH MACHINE')
  ) {
    return 'barbells';
  }

  // Bands
  if (normalized.includes('BAND')) {
    return 'bands';
  }

  // Cable machines
  if (normalized.includes('CABLE')) {
    return 'cable';
  }

  // General machines / cardio / sled / leverage
  if (
    normalized.includes('MACHINE') ||
    normalized.includes('ELLIPTICAL') ||
    normalized.includes('STATIONARY BIKE') ||
    normalized.includes('STEPMILL') ||
    normalized.includes('SKIERG') ||
    normalized.includes('SLED')
  ) {
    return 'machine';
  }

  // Step / box
  if (normalized.includes('STEP')) {
    return 'step';
  }

  // Stability / BOSU ball
  if (normalized.includes('STABILITY BALL') || normalized.includes('BOSU')) {
    return 'stability_ball';
  }

  // Medicine ball
  if (normalized.includes('MEDICINE BALL')) {
    return 'medicine_ball';
  }

  // Rope / battle ropes
  if (normalized.includes('ROPE')) {
    return 'rope';
  }

  // Roller / ab wheel / foam roller
  if (
    normalized.includes('ROLLER') ||
    normalized.includes('FOAM ROLLER') ||
    normalized.includes('WHEEL')
  ) {
    return 'roller';
  }

  return 'other';
}

// ─────────────────────────────────────────────
// Labels & descriptions
// ─────────────────────────────────────────────

export function getEquipmentLabelFromCanonical(canonical: CanonicalEquipment): string {
  const labels: Record<CanonicalEquipment, string> = {
    bodyweight: 'Bodyweight',
    dumbbells: 'Dumbbells',
    bands: 'Resistance Bands',
    kettlebells: 'Kettlebells',
    barbells: 'Barbells',
    cable: 'Cable Machine',
    machine: 'Machines / Cardio',
    step: 'Step / Box',
    medicine_ball: 'Medicine Ball',
    stability_ball: 'Stability Ball / BOSU',
    rope: 'Rope / Battle Ropes',
    roller: 'Foam Roller / Wheel',
    other: 'Other Equipment',
  };
  return labels[canonical];
}

export function getEquipmentDescription(canonical: CanonicalEquipment): string {
  const descriptions: Record<CanonicalEquipment, string> = {
    bodyweight: 'Only uses your bodyweight or simple assistance.',
    dumbbells: 'Hand-held free weights like fixed or adjustable dumbbells.',
    bands: 'Elastic resistance bands or tubes.',
    kettlebells: 'Cast iron weights with handles for swings, carries, and full-body drills.',
    barbells: 'Long bar with plates, including Smith machine and EZ-bar variations.',
    cable: 'Cable stack machines with adjustable pulleys.',
    machine: 'Selectorized or cardio machines (bike, sled, elliptical, skierg, etc.).',
    step: 'Step platform or box for step-ups and jumps.',
    medicine_ball: 'Weighted ball for slams, throws, and partner work.',
    stability_ball: 'Stability or BOSU ball for balance and core control.',
    rope: 'Battle ropes or similar rope-based equipment.',
    roller: 'Foam roller or ab wheel for core and mobility.',
    other: 'Any other equipment that doesn’t fit the main categories.',
  };
  return descriptions[canonical];
}

/**
 * Format any equipment string into a display label.
 * Accepts either canonical or raw DB strings.
 */
export function formatEquipmentLabel(equipment: string): string {
  if (!equipment) return '';

  if (isCanonicalEquipment(equipment as CanonicalEquipment)) {
    return getEquipmentLabelFromCanonical(equipment as CanonicalEquipment);
  }

  const canonical = mapRawEquipmentToCanonical(equipment);
  if (canonical) return getEquipmentLabelFromCanonical(canonical);

  // Fallback: title-case it
  return equipment
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function isCanonicalEquipment(value: string): value is CanonicalEquipment {
  return (
    [
      'bodyweight',
      'dumbbells',
      'bands',
      'kettlebells',
      'barbells',
      'cable',
      'machine',
      'step',
      'medicine_ball',
      'stability_ball',
      'rope',
      'roller',
      'other',
    ] as string[]
  ).includes(value);
}

// ─────────────────────────────────────────────
// Fetch options from Supabase
// ─────────────────────────────────────────────

/**
 * Main function your UI calls.
 * Returns canonical equipment options with exercise counts.
 */
export async function getEquipmentOptions(): Promise<EquipmentOption[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('equipment, raw_equipment');

  if (error) {
    console.error('❌ Failed to fetch equipment from Supabase:', error);
    return [];
  }

  const counts = new Map<CanonicalEquipment, number>();

  for (const row of data ?? []) {
    const rawArray = normalizeToStringArray(row.raw_equipment);
    const equipArray = normalizeToStringArray(row.equipment);

    const canonicalFromRaw = rawArray
      .map(r => mapRawEquipmentToCanonical(r))
      .filter((c): c is CanonicalEquipment => c !== null);

    const canonicalFromEquip = equipArray
      .map(e => mapRawEquipmentToCanonical(e))
      .filter((c): c is CanonicalEquipment => c !== null);

    const canonicalSet = new Set<CanonicalEquipment>([
      ...canonicalFromRaw,
      ...canonicalFromEquip,
    ]);

    // If we somehow got nothing, assume bodyweight as a super-safe fallback
    if (canonicalSet.size === 0) canonicalSet.add('bodyweight');

    for (const c of canonicalSet) {
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }

  const order: CanonicalEquipment[] = [
    'bodyweight',
    'dumbbells',
    'bands',
    'kettlebells',
    'barbells',
    'cable',
    'machine',
    'step',
    'medicine_ball',
    'stability_ball',
    'rope',
    'roller',
    'other',
  ];

  const options: EquipmentOption[] = order
    .filter(c => (counts.get(c) ?? 0) > 0)
    .map(c => ({
      raw: c, // we can swap this to a more “raw” label later if you want
      value: c,
      label: getEquipmentLabelFromCanonical(c),
      description: getEquipmentDescription(c),
      canonical: c,
      count: counts.get(c) ?? 0,
    }));

  return options;
}

export function getEquipmentCount(
  equipment: CanonicalEquipment,
  options: EquipmentOption[]
): number {
  const option = options.find(opt => opt.canonical === equipment);
  return option?.count ?? 0;
}

/**
 * Map an array of raw equipment strings to canonical categories (deduped).
 * Used by workout generation when normalizing profile.equipment, etc.
 */
export function mapRawEquipmentArrayToCanonical(
  rawEquipment: string[]
): CanonicalEquipment[] {
  const canonical = rawEquipment
    .map(raw => mapRawEquipmentToCanonical(raw))
    .filter((c): c is CanonicalEquipment => c !== null);

  return Array.from(new Set(canonical));
}

// Internal helper: normalize DB field (array/json/string) into string[]
function normalizeToStringArray(field: any): string[] {
  if (!field) return [];

  if (Array.isArray(field)) {
    return field.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }

  if (typeof field === 'string') {
    // Try JSON first
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) {
        return parsed.filter((v: any): v is string => typeof v === 'string' && v.trim().length > 0);
      }
      if (typeof parsed === 'string' && parsed.trim().length > 0) {
        return [parsed.trim()];
      }
    } catch {
      if (field.trim().length > 0) return [field.trim()];
    }
  }

  return [];
}
