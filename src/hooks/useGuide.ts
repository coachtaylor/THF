/**
 * useGuide Hook
 *
 * Fetches safety guide content from the database.
 * Provides loading state and fallback for offline scenarios.
 */

import { useState, useEffect } from 'react';
import { getGuideBySlug, SafetyGuide } from '../knowledge';

interface UseGuideResult {
  guide: SafetyGuide | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch a safety guide by slug
 */
export function useGuide(slug: string): UseGuideResult {
  const [guide, setGuide] = useState<SafetyGuide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGuide = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getGuideBySlug(slug);
      setGuide(data);
    } catch (err) {
      console.error(`Error fetching guide ${slug}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to load guide'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuide();
  }, [slug]);

  return {
    guide,
    isLoading,
    error,
    refresh: fetchGuide,
  };
}

export default useGuide;
