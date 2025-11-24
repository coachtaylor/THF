// src/data/equipmentOptions.ts

import { supabase } from '../utils/supabase';

/** Types */
export type RawEquipmentOption = {
  value: string; // raw DB string, e.g. "BODY WEIGHT"
  label: string; // pretty label, e.g. "Body Weight"
};

/** Load distinct equipment values from Supabase */
function prettyLabelFromRaw(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[_\s]+/g, ' ');
  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function getRawEquipmentOptions(): Promise<RawEquipmentOption[]> {
  if (!supabase) {
    console.error('Supabase not initialized');
    return [];
  }
  const { data, error } = await supabase
    .from('exercises')
    .select('equipment');

  if (error) {
    console.error('Error loading equipment options', error);
    return [];
  }

  const seen = new Set<string>();
  const options: RawEquipmentOption[] = [];

  for (const row of data ?? []) {
    const equipmentArray = Array.isArray(row.equipment) ? row.equipment : [];
    for (const equip of equipmentArray) {
      const raw = String(equip).trim();
      if (!raw || seen.has(raw)) continue;
      seen.add(raw);
      options.push({
        value: raw,
        label: prettyLabelFromRaw(raw),
      });
    }
  }

  return options;
}

/** Canonical equipment mapping lives HERE (step #3) */

export type CanonicalEquipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'bands'
  | 'kettlebell'
  | 'barbell'
  | 'machine'
  | 'cable'
  | 'other';

export function mapRawToCanonicalEquipment(rawList: string[]): CanonicalEquipment[] {
  const canonSet = new Set<CanonicalEquipment>();

  for (const raw of rawList) {
    const val = raw.toLowerCase();

    if (val.includes('body') && val.includes('weight')) {
      canonSet.add('bodyweight');
    } else if (val.includes('dumbbell') || val === 'db') {
      canonSet.add('dumbbells');
    } else if (val.includes('kettlebell') || val === 'kb') {
      canonSet.add('kettlebell');
    } else if (val.includes('band') || val.includes('resistance band')) {
      canonSet.add('bands');
    } else if (val.includes('barbell') || val === 'bb') {
      canonSet.add('barbell');
    } else if (val.includes('cable')) {
      canonSet.add('cable');
    } else if (val.includes('machine') || val.includes('lever') || val.includes('smith')) {
      canonSet.add('machine');
    } else {
      canonSet.add('other');
    }
  }

  // Safety: never return an empty array
  if (canonSet.size === 0) {
    canonSet.add('bodyweight');
  }

  return Array.from(canonSet);
}
