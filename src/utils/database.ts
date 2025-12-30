import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('transfitness.db');

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    goals TEXT,
    goal_weighting TEXT,
    constraints TEXT,
    preferences TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    block_length INTEGER,
    start_date TEXT,
    goals TEXT,
    goal_weighting TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    plan_data TEXT,
    synced_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    plan_id TEXT,
    workout_data TEXT,
    started_at TEXT,
    completed_at TEXT,
    duration_minutes INTEGER,
    synced_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_workout_date TEXT,
    grace_days_used_this_week INTEGER DEFAULT 0,
    week_start_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS weekly_aggregates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    week_start_date TEXT,
    total_minutes INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    avg_rpe REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS saved_workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT,
    day_number INTEGER,
    duration INTEGER NOT NULL,
    workout_name TEXT NOT NULL,
    workout_data TEXT NOT NULL,
    notes TEXT,
    saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_used_at TEXT,
    use_count INTEGER DEFAULT 0,
    synced_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS week_transitions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    last_plan_week_start TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  );`,
  `CREATE TABLE IF NOT EXISTS feedback_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT,
    context TEXT NOT NULL,
    exercise_id TEXT,
    exercise_name TEXT,
    workout_id TEXT,
    set_number INTEGER,
    quick_feedback TEXT,
    description TEXT,
    device_info TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    synced_at TEXT
  );`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_unsynced ON feedback_reports(synced_at) WHERE synced_at IS NULL;`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback_reports(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback_reports(category);`
];

export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      db.withTransactionSync(() => {
        tableStatements.forEach(statement => {
          db.execSync(statement);
        });
      });
      console.log('✅ Database initialized successfully');
      resolve();
    } catch (error) {
      console.error('Database initialization failed:', error);
      reject(error);
    }
  });
}

export { db };
