import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('transfitness.db');

export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          goals TEXT,
          goal_weighting TEXT,
          constraints TEXT,
          preferences TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          block_length INTEGER,
          start_date TEXT,
          plan_data TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          plan_id TEXT,
          workout_data TEXT,
          started_at TEXT,
          completed_at TEXT,
          duration_minutes INTEGER,
          synced_at TEXT
        );`
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS streaks (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_workout_date TEXT,
          grace_days_used_this_week INTEGER DEFAULT 0,
          week_start_date TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS weekly_aggregates (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          week_start_date TEXT,
          total_minutes INTEGER DEFAULT 0,
          total_sessions INTEGER DEFAULT 0,
          avg_rpe REAL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );
    }, (error) => {
      console.error('Database initialization failed:', error);
      reject(error);
    }, () => {
      console.log('✅ Database initialized successfully');
      resolve();
    });
  });
}

export { db };
