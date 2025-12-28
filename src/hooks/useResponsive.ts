import { useWindowDimensions } from 'react-native';

/**
 * Hook for responsive design across different device sizes.
 * Provides breakpoints and scaling utilities.
 *
 * Breakpoints:
 * - isSmall: < 375px (iPhone SE, older phones)
 * - isMedium: 375-413px (iPhone 15, standard phones)
 * - isLarge: >= 414px (iPhone Plus/Max, tablets)
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isSmall = width < 375;
  const isMedium = width >= 375 && width < 414;
  const isLarge = width >= 414;

  /**
   * Scale a size value based on screen width.
   * Reduces by 15% on small screens, increases by 5% on large screens.
   */
  const scale = (size: number): number => {
    if (isSmall) return Math.round(size * 0.85);
    if (isLarge) return Math.round(size * 1.05);
    return size;
  };

  /**
   * Scale font size with minimum floor to maintain readability.
   */
  const scaleFont = (size: number, minSize?: number): number => {
    const scaled = scale(size);
    return minSize ? Math.max(scaled, minSize) : scaled;
  };

  /**
   * Get responsive value based on screen size.
   */
  const responsive = <T>(small: T, medium: T, large?: T): T => {
    if (isSmall) return small;
    if (isLarge && large !== undefined) return large;
    return medium;
  };

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge,
    scale,
    scaleFont,
    responsive,
  };
};

export default useResponsive;
