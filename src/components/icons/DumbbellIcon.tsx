import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const DumbbellIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#F2F2F2',
  strokeWidth = 1.5,
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
  >
    <Path
      d="M2.45405 13.7677C1.86826 13.1819 1.86826 12.2322 2.45405 11.6464C3.03984 11.0606 3.98958 11.0606 4.57537 11.6464L12.3535 19.4246C12.9393 20.0103 12.9393 20.9601 12.3535 21.5459C11.7678 22.1317 10.818 22.1317 10.2322 21.5459L2.45405 13.7677Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.05024 14.1213L14.1213 7.05018L16.9497 9.87861L9.87867 16.9497L7.05024 14.1213Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.8076 18.3639C2.02655 17.5828 2.02655 16.3165 2.8076 15.5355L3.51471 14.8284L9.17156 20.4852L8.46446 21.1923C7.68341 21.9734 6.41708 21.9734 5.63603 21.1923L2.8076 18.3639Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.7678 2.45399C13.182 1.8682 12.2322 1.8682 11.6464 2.45399C11.0607 3.03977 11.0607 3.98952 11.6464 4.57531L19.4246 12.3535C20.0104 12.9393 20.9601 12.9393 21.5459 12.3535C22.1317 11.7677 22.1317 10.8179 21.5459 10.2322L13.7678 2.45399Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.364 2.80754C17.5829 2.02649 16.3166 2.02649 15.5355 2.80754L14.8284 3.51465L20.4853 9.1715L21.1924 8.4644C21.9734 7.68335 21.9734 6.41702 21.1924 5.63597L18.364 2.80754Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);



