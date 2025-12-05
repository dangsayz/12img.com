'use client';

import { cn } from '@/lib/utils/cn';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const fontSizeMap = {
  xs: 6,
  sm: 9,
  md: 12,
  lg: 18,
  xl: 24,
};

const textYMap = {
  xs: 10.5,
  sm: 15.5,
  md: 20,
  lg: 30,
  xl: 40,
};

export function Logo({ size = 'md', className }: LogoProps) {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const textY = textYMap[size];
  const center = dimension / 2;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox={`0 0 ${dimension} ${dimension}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
    >
      <circle cx={center} cy={center} r={center} fill="#2D2D2D" />
      <text
        x={center}
        y={textY}
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize={fontSize}
        fontWeight="600"
        fill="white"
      >
        12
      </text>
    </svg>
  );
}

export default Logo;
