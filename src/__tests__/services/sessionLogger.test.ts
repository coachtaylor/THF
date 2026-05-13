// Unit tests for the skip-set detection + serialization behavior added 2026-05-13.
//
// Why these matter: handleSkipSet writes {reps:0, weight:0, rpe:0, skipped:true}
// to mid-session state. Before this change, buildSessionData dropped the
// `skipped` flag, so the saved session had no way to distinguish a skip from
// a legitimate (but unlikely) 0/0/0 set. Reporting aggregates over-counted
// totalSets as a result.

import { buildSessionData, isSetSkipped } from '../../services/sessionLogger';
import { CompletedSet } from '../../types/session';

describe('isSetSkipped', () => {
  it('returns true when the explicit skipped flag is set', () => {
    expect(
      isSetSkipped({ skipped: true, reps: 8, weight: 50, rpe: 7 })
    ).toBe(true);
  });

  it('returns false when skipped is explicitly false', () => {
    expect(
      isSetSkipped({ skipped: false, reps: 8, weight: 50, rpe: 7 })
    ).toBe(false);
  });

  it('detects legacy skip shape (reps=0, rpe=0, weight=0) without flag', () => {
    // Sets saved by handleSkipSet before the flag was persisted have this
    // exact shape. We don't backfill the DB — we detect at read time.
    expect(isSetSkipped({ reps: 0, weight: 0, rpe: 0 })).toBe(true);
  });

  it('detects legacy skip shape with undefined weight (bodyweight path)', () => {
    expect(isSetSkipped({ reps: 0, weight: undefined, rpe: 0 })).toBe(true);
  });

  it('keeps a genuine 0-rep set counted when RPE or weight is non-zero', () => {
    // A failed lift attempt: 0 reps but real weight on the bar and a felt
    // RPE. This is data, not a skip — the heuristic must not eat it.
    expect(isSetSkipped({ reps: 0, weight: 135, rpe: 10 })).toBe(false);
    expect(isSetSkipped({ reps: 0, weight: 0, rpe: 8 })).toBe(false);
  });

  it('keeps real work-set data counted', () => {
    expect(isSetSkipped({ reps: 10, weight: 50, rpe: 7 })).toBe(false);
    expect(isSetSkipped({ reps: 10, weight: undefined, rpe: 7 })).toBe(false);
  });
});

describe('buildSessionData skip serialization', () => {
  const baseTimestamp = '2026-05-13T12:00:00.000Z';

  function makeSet(overrides: Partial<CompletedSet>): CompletedSet {
    return {
      exerciseId: 'ex-1',
      setNumber: 1,
      rpe: 7,
      reps: 10,
      weight: 50,
      completedAt: baseTimestamp,
      ...overrides,
    };
  }

  it('passes skipped:true through to the saved session set', () => {
    const sets: CompletedSet[] = [
      makeSet({ setNumber: 1 }),
      makeSet({
        setNumber: 2,
        rpe: 0,
        reps: 0,
        weight: 0,
        skipped: true,
      }),
    ];

    const session = buildSessionData(
      sets,
      'plan-id',
      45,
      baseTimestamp,
      '2026-05-13T12:30:00.000Z',
      undefined,
      undefined,
      'Push Day',
    );

    expect(session.exercises).toHaveLength(1);
    const [exercise] = session.exercises;
    expect(exercise.sets).toHaveLength(2);
    expect(exercise.sets[0].skipped).toBeUndefined();
    expect(exercise.sets[1].skipped).toBe(true);
  });

  it('omits the skipped field entirely when false (keeps saved JSON tidy)', () => {
    const sets: CompletedSet[] = [makeSet({ skipped: false })];

    const session = buildSessionData(
      sets,
      'plan-id',
      45,
      baseTimestamp,
      '2026-05-13T12:30:00.000Z',
    );

    const [exercise] = session.exercises;
    // Presence-as-meaning: only true is serialized. Absence === not skipped.
    expect(Object.prototype.hasOwnProperty.call(exercise.sets[0], 'skipped')).toBe(false);
  });
});
