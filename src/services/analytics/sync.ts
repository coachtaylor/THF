// Analytics remote sync
//
// Reads unsynced events from the local SQLite analytics_events table, batches
// them, and uploads to the Supabase analytics_events table. Marks each event
// as synced on success so we don't double-send.
//
// Why this exists:
// - Local-only analytics is invisible across users — no funnel math possible.
// - PRD §9 lists the events we need for beta learning; they need to live
//   somewhere queryable.
// - Supabase already hosts our infra; this avoids adding a new vendor.
//
// Privacy notes:
// - Only event_type, the small properties bag we control in trackEvent(),
//   the auth user id (or a stable per-install anon id), and timestamps are
//   sent. Never raw health data, never user-entered free text.
// - The remote table's RLS allows anon insert only — anon clients can't
//   read back, so a leaked anon key can't be used to exfiltrate this data.

import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { supabase } from '../../utils/supabase';

const BATCH_SIZE = 50;
const ANON_DEVICE_ID_KEY = 'analytics_anon_device_id';

interface LocalRow {
  id: number;
  event_type: string;
  properties: string | null;
  timestamp: string;
}

let _db: SQLite.SQLiteDatabase | null = null;
function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('transfitness.db');
  }
  return _db;
}

let cachedAnonId: string | null = null;
async function getOrCreateAnonDeviceId(): Promise<string> {
  if (cachedAnonId) return cachedAnonId;
  const existing = await SecureStore.getItemAsync(ANON_DEVICE_ID_KEY);
  if (existing) {
    cachedAnonId = existing;
    return existing;
  }
  // Lightweight UUID v4-ish; we don't need crypto strength here, just a
  // stable per-install identifier so we can group events for the same user
  // across sessions.
  const fresh =
    `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await SecureStore.setItemAsync(ANON_DEVICE_ID_KEY, fresh);
  cachedAnonId = fresh;
  return fresh;
}

async function getUserId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) return data.user.id;
  } catch {
    // ignore — fall through to anon id
  }
  return getOrCreateAnonDeviceId();
}

let syncInFlight = false;

/**
 * Upload unsynced analytics events to Supabase. Safe to call repeatedly —
 * concurrent calls short-circuit. Never throws.
 */
export async function syncAnalyticsEvents(): Promise<{
  uploaded: number;
  remaining: number;
}> {
  if (syncInFlight) return { uploaded: 0, remaining: 0 };
  syncInFlight = true;

  try {
    if (!supabase) {
      return { uploaded: 0, remaining: 0 };
    }

    const userId = await getUserId();
    const appVersion = Application.nativeApplicationVersion || 'unknown';
    const platform = Platform.OS;

    let totalUploaded = 0;

    // Loop in batches until either the table is drained or a batch fails.
    while (true) {
      const stmt = getDb().prepareSync(
        `SELECT id, event_type, properties, timestamp
           FROM analytics_events
          WHERE synced = 0
          ORDER BY id ASC
          LIMIT ?;`,
      );
      const rows = stmt.executeSync([BATCH_SIZE]).getAllSync() as LocalRow[];
      stmt.finalizeSync();

      if (rows.length === 0) break;

      const payload = rows.map(row => {
        let props: Record<string, unknown> = {};
        if (row.properties) {
          try {
            const parsed = JSON.parse(row.properties);
            if (parsed && typeof parsed === 'object') {
              props = parsed as Record<string, unknown>;
            }
          } catch {
            // bad JSON shouldn't block the rest of the batch
          }
        }
        // Strip the on-row timestamp from properties to avoid duplication.
        delete props.timestamp;

        return {
          user_id: userId,
          event_type: row.event_type,
          properties: props,
          occurred_at: row.timestamp,
          app_version: appVersion,
          platform,
        };
      });

      const { error } = await supabase
        .from('analytics_events')
        .insert(payload);

      if (error) {
        if (__DEV__) {
          console.warn('📊 Analytics sync batch failed:', error.message);
        }
        // Stop on first failure; we'll retry next time.
        break;
      }

      // Mark these rows as synced. Use the id range from this batch.
      const ids = rows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      const updateStmt = getDb().prepareSync(
        `UPDATE analytics_events SET synced = 1 WHERE id IN (${placeholders});`,
      );
      updateStmt.executeSync(ids);
      updateStmt.finalizeSync();

      totalUploaded += rows.length;

      // If we got fewer than BATCH_SIZE there's nothing left.
      if (rows.length < BATCH_SIZE) break;
    }

    // Count any rows still unsynced (network blip, etc.) for the caller.
    const remStmt = getDb().prepareSync(
      `SELECT COUNT(*) as c FROM analytics_events WHERE synced = 0;`,
    );
    const remRows = remStmt.executeSync([]).getAllSync() as Array<{ c: number }>;
    remStmt.finalizeSync();
    const remaining = remRows[0]?.c ?? 0;

    if (__DEV__ && totalUploaded > 0) {
      console.log(
        `📊 Analytics sync: uploaded ${totalUploaded}, ${remaining} remaining`,
      );
    }

    return { uploaded: totalUploaded, remaining };
  } catch (err) {
    if (__DEV__) {
      console.warn('📊 Analytics sync error:', err);
    }
    return { uploaded: 0, remaining: 0 };
  } finally {
    syncInFlight = false;
  }
}

/**
 * Fire-and-forget wrapper for places that don't want to await sync results.
 */
export function syncAnalyticsEventsInBackground(): void {
  syncAnalyticsEvents().catch(() => {
    // syncAnalyticsEvents never throws, but defensive.
  });
}
