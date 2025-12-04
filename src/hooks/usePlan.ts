import { useState, useEffect } from 'react';
import { getPlan, savePlan as savePlanService } from '../services/storage/plan';
import { Plan } from '../types/plan';

export function usePlan(userId?: string) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadPlan();
  }, [userId]);

  async function loadPlan() {
    try {
      setLoading(true);
      setError(null);
      const effectiveUserId = userId || 'default';
      console.log('🔍 usePlan: Loading plan for userId:', effectiveUserId);
      const data = await getPlan(effectiveUserId);
      console.log('🔍 usePlan: Plan loaded:', data ? 'EXISTS' : 'NULL');
      if (data) {
        console.log('🔍 usePlan: Plan details:', {
          id: data.id,
          daysCount: data.days?.length || 0,
          startDate: data.startDate
        });
      }
      setPlan(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('❌ Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  }

  async function savePlan(planData: Plan, userId: string = 'default') {
    try {
      setError(null);
      await savePlanService(planData, userId);
      await loadPlan(); // Reload plan after save
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error saving plan:', error);
      throw error;
    }
  }

  return {
    plan,
    loading,
    error,
    savePlan,
    refreshPlan: loadPlan,
  };
}

