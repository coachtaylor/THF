import React from 'react';
import Svg, { Circle, Path, Polygon, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const MedicalProfessionalIcon: React.FC<IconProps> = ({
  size = 32,
  color = '#9CA3AF',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Stethoscope head - circle */}
    <Circle
      cx="16"
      cy="10"
      r="4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Stethoscope curved tube */}
    <Path
      d="M16 14 Q12 18 8 20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Left earpiece tube */}
    <Path
      d="M8 20 L6 24"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right earpiece tube */}
    <Path
      d="M8 20 L10 24"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Chest piece (bottom circle) */}
    <Circle
      cx="8"
      cy="20"
      r="2.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const EducationIcon: React.FC<IconProps> = ({
  size = 32,
  color = '#9CA3AF',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Book cover - left page */}
    <Path
      d="M8 6 L8 26 L16 24 L24 26 L24 6 L16 8 Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Book spine/binding */}
    <Line
      x1="16"
      y1="8"
      x2="16"
      y2="24"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Text lines on left page */}
    <Line
      x1="10"
      y1="12"
      x2="14"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="10"
      y1="16"
      x2="14"
      y2="16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="10"
      y1="20"
      x2="13"
      y2="20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Text lines on right page */}
    <Line
      x1="18"
      y1="12"
      x2="22"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="18"
      y1="16"
      x2="22"
      y2="16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="18"
      y1="20"
      x2="21"
      y2="20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const FitnessFocusIcon: React.FC<IconProps> = ({
  size = 32,
  color = '#9CA3AF',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Left weight */}
    <Circle
      cx="10"
      cy="16"
      r="3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Center bar */}
    <Line
      x1="13"
      y1="16"
      x2="19"
      y2="16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Right weight */}
    <Circle
      cx="22"
      cy="16"
      r="3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Movement lines - left side */}
    <Line
      x1="6"
      y1="12"
      x2="8"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={0.6}
    />
    <Line
      x1="6"
      y1="16"
      x2="8"
      y2="16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={0.6}
    />
    <Line
      x1="6"
      y1="20"
      x2="8"
      y2="20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={0.6}
    />
    {/* Movement lines - right side */}
    <Line
      x1="24"
      y1="12"
      x2="26"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={0.6}
    />
    <Line
      x1="24"
      y1="16"
      x2="26"
      y2="16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={0.6}
    />
    <Line
      x1="24"
      y1="20"
      x2="26"
      y2="20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={0.6}
    />
  </Svg>
);

export const StopSignalIcon: React.FC<IconProps> = ({
  size = 32,
  color = '#9CA3AF',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Octagon (stop sign shape) */}
    <Polygon
      points="16,4 24,6 28,10 28,18 24,22 16,24 8,22 4,18 4,10 8,6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Exclamation mark - vertical line */}
    <Line
      x1="16"
      y1="10"
      x2="16"
      y2="18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Exclamation mark - dot */}
    <Circle
      cx="16"
      cy="21"
      r="1.5"
      fill={color}
    />
  </Svg>
);

// Combined export object
export const DisclaimerIcons = {
  MedicalProfessional: MedicalProfessionalIcon,
  Education: EducationIcon,
  FitnessFocus: FitnessFocusIcon,
  StopSignal: StopSignalIcon,
};

