'use client';

import {
  ResponsiveContainer,
  type ResponsiveContainerProps
} from 'recharts';

const CHART_INITIAL_DIMENSION = {
  width: 320,
  height: 240
};

export function ChartResponsiveContainer({
  initialDimension = CHART_INITIAL_DIMENSION,
  minHeight = 0,
  minWidth = 0,
  ...props
}: ResponsiveContainerProps) {
  return (
    <ResponsiveContainer
      initialDimension={initialDimension}
      minHeight={minHeight}
      minWidth={minWidth}
      {...props}
    />
  );
}
