import * as SQLite from "expo-sqlite";
import { Plan } from "../../types/plan";

// Lazy-initialized database connection for plan storage
// Prevents crash when module is imported before React Native runtime is ready
let planDb: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!planDb) {
    planDb = SQLite.openDatabaseSync("transfitness.db");
  }
  return planDb;
}

// Ensure plans table exists with correct schema
export async function initPlanStorage(): Promise<void> {
  try {
    getDb().withTransactionSync(() => {
      // Check if table exists and has old schema
      try {
        const checkStmt = getDb().prepareSync("PRAGMA table_info(plans);");
        const columns = checkStmt.executeSync().getAllSync() as Array<{
          name: string;
        }>;
        checkStmt.finalizeSync();

        const hasGoals = columns.some((col) => col.name === "goals");
        const hasGoalWeighting = columns.some(
          (col) => col.name === "goal_weighting",
        );
        const hasSyncedAt = columns.some((col) => col.name === "synced_at");

        // If table exists but missing columns, drop and recreate
        if (
          columns.length > 0 &&
          (!hasGoals || !hasGoalWeighting || !hasSyncedAt)
        ) {
          console.log("⚠️ Plans table has old schema, recreating...");
          getDb().execSync("DROP TABLE IF EXISTS plans;");
        }
      } catch (e) {
        // Table doesn't exist, will be created below
      }

      // Create table with correct schema
      getDb().execSync(`
        CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          block_length INTEGER,
          start_date TEXT,
          goals TEXT,
          goal_weighting TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          plan_data TEXT,
          synced_at TEXT
        );
      `);
    });
    console.log("✅ Plan storage initialized");
  } catch (error) {
    console.error("❌ Plan storage initialization failed:", error);
    throw error;
  }
}

// Save plan to database
export async function savePlan(
  plan: Plan,
  userId: string = "default",
): Promise<void> {
  try {
    const planDataJson = JSON.stringify(plan);
    const goalsJson = JSON.stringify(plan.goals);
    const goalWeightingJson = JSON.stringify(plan.goalWeighting);
    const startDateStr = plan.startDate.toISOString();

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `INSERT OR REPLACE INTO plans 
         (id, user_id, block_length, start_date, goals, goal_weighting, plan_data, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      );
      stmt.executeSync([
        plan.id,
        userId,
        plan.blockLength,
        startDateStr,
        goalsJson,
        goalWeightingJson,
        planDataJson,
        null, // synced_at
      ]);
      stmt.finalizeSync();
    });

    console.log("✅ Plan saved:", plan.id);
  } catch (error) {
    console.error("❌ Error saving plan:", error);
    throw error;
  }
}

// Get current plan
export async function getPlan(
  userId: string = "default",
): Promise<Plan | null> {
  try {
    type PlanRow = {
      id: string;
      plan_data: string;
    };

    const resultRef: { value: PlanRow | null } = { value: null };

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        "SELECT id, plan_data FROM plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1;",
      );
      const rows = stmt.executeSync([userId]).getAllSync() as any[];
      if (rows.length > 0) {
        resultRef.value = rows[0] as PlanRow;
      }
      stmt.finalizeSync();
    });

    const result = resultRef.value;
    if (result) {
      const planData = JSON.parse(result.plan_data || "{}");
      // Convert date strings back to Date objects
      if (planData.startDate) {
        planData.startDate = new Date(planData.startDate);
      }
      if (planData.days && Array.isArray(planData.days)) {
        planData.days = planData.days.map((day: any) => ({
          ...day,
          date: new Date(day.date),
        }));
      }
      return planData as Plan;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting plan:", error);
    throw error;
  }
}

// Delete plan
export async function deletePlan(planId: string): Promise<void> {
  try {
    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync("DELETE FROM plans WHERE id = ?;");
      stmt.executeSync([planId]);
      stmt.finalizeSync();
    });
    console.log("✅ Plan deleted:", planId);
  } catch (error) {
    console.error("❌ Error deleting plan:", error);
    throw error;
  }
}
