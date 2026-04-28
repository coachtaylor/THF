import { useReducedMotion } from "framer-motion";

// Centralized motion tokens. Source of truth: DESIGN.md §7
export const duration = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  entrance: 0.6,
} as const;

export const ease = {
  default: [0.25, 0.1, 0.25, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
} as const;

export const stagger = {
  delay: 0.1,
  child: 0.1,
} as const;

// Hook: returns motion props that disable animation when prefers-reduced-motion is set.
export function useMotionPreference() {
  const prefersReduced = useReducedMotion();
  return {
    prefersReduced,
    transition: prefersReduced ? { duration: 0 } : undefined,
    initial: prefersReduced ? false : undefined,
  };
}
