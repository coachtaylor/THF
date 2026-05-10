import { useState, useEffect, useCallback } from 'react';
import { getPlan, savePlan as savePlanService } from '../services/storage/plan';
import { Plan } from '../types/plan';

export function usePlan(userId?: string) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // IMPORTANT: keep loadPlan stable across renders. Consumers (e.g. HomeScreen
  // useFocusEffect) put refreshPlan in their dependency arrays — if this
  // function reference changes every render, the focus effect re-fires
  // immediately, calls refreshPlan, triggers a re-render, and we get
  // "Maximum update depth exceeded".
  const loadPlan = useCallback(async () => {
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
          startDate: data.startDate,
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
  }, [userId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const savePlan = useCallback(
    async (planData: Plan, saveUserId: string = 'default') => {
      try {
        setError(null);
        await savePlanService(planData, saveUserId);
        await loadPlan(); // Reload plan after save
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Error saving plan:', error);
        throw error;
      }
    },
    [loadPlan],
  );

  return {
    plan,
    loading,
    error,
    savePlan,
    refreshPlan: loadPlan,
  };
}

