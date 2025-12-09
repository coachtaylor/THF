import { initDatabase } from '../utils/database';
import { initProfileStorage } from './storage/profile';
import { initPlanStorage } from './storage/plan';
import { initAnalytics } from './analytics';

/**
 * Initialize all app services (database, storage, etc.)
 */
export async function initializeApp(): Promise<void> {
  try {
    await initDatabase();
    await initProfileStorage();
    await initPlanStorage();
    await initAnalytics();
    console.log('✅ App initialization complete');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    throw error;
  }
}

