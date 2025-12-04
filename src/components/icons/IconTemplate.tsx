/**
 * TEMPLATE FOR CREATING NEW ICONS FROM FIGMA
 * 
 * Steps:
 * 1. Export SVG from Figma (right-click → Copy/Paste as → SVG)
 * 2. Replace the Path/Shape elements below with your Figma SVG paths
 * 3. Update the viewBox to match your Figma frame size
 * 4. Rename the component
 * 5. Update the exports
 */

import React from 'react';
import Svg, { Path, Circle, Rect, Polygon, Line, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const YourIconName: React.FC<IconProps> = ({
  size = 24,
  color = '#06b6d4', // Default to your theme cyan
  strokeWidth = 2,
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" // Update to match your Figma frame size
    fill="none"
  >
    {/* 
      PASTE YOUR FIGMA SVG PATHS HERE
      Common conversions:
      - Replace fill="currentColor" → fill={color}
      - Replace stroke="currentColor" → stroke={color}
      - Replace stroke-width="2" → strokeWidth={strokeWidth}
      - Remove xmlns, x, y attributes if present
    */}
    
    {/* Example: Replace this with your actual Figma paths */}
    <Path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      fill={color}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

