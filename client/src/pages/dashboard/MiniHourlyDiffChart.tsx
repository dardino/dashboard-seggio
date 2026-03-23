import { Typography } from '@mui/material';
import type { HourlyDiffDataPoint } from '../../types';

interface MiniHourlyDiffChartProps {
  data: HourlyDiffDataPoint[];
  mode?: 'diff' | 'total' | 'percentage';
  totalElectors?: number;
}

export default function MiniHourlyDiffChart({
  data,
  mode = 'diff',
  totalElectors,
}: MiniHourlyDiffChartProps) {
  if (data.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        Nessun dato orario
      </Typography>
    );
  }

  const values = data.map((entry) => {
    if (mode === 'percentage') {
      if (!totalElectors || totalElectors <= 0) {
        return 0;
      }

      return Math.max(0, Math.round((entry.recordedTotal / totalElectors) * 100));
    }

    if (mode === 'total') {
      return Math.max(0, entry.recordedTotal);
    }

    return Math.max(0, entry.diffFromPreviousHour);
  });
  const maxValue = Math.max(...values, 1);

  const labelFontSize = 10;
  const padding = 8;
  const topLabelArea = 16;
  const bottomLabelArea = 16;
  const barAreaHeight = 72;
  const innerBarPadding = 4;
  const barGap = 3;
  const chartHeight = topLabelArea + barAreaHeight + bottomLabelArea;
  const chartWidth = Math.max(220, values.length * 22 + padding * 2);
  const innerWidth = chartWidth - padding * 2;
  const barWidth = (innerWidth - barGap * (values.length - 1)) / values.length;

  const barAreaBottom = topLabelArea + barAreaHeight;
  const maxBarHeight = barAreaHeight - innerBarPadding * 2;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      width="100%"
      role="img"
      aria-label={
        mode === 'percentage'
          ? 'Percentuale votanti per ora'
          : mode === 'total'
            ? 'Totale votanti per ora'
            : 'Andamento orario votanti'
      }
    >
      {values.map((value, index) => {
        const normalizedHeight = (value / maxValue) * maxBarHeight;
        const height = Math.max(2, normalizedHeight);
        const x = padding + index * (barWidth + barGap);
        const y = barAreaBottom - innerBarPadding - height;
        const barCenterX = x + barWidth / 2;
        const hourLabel = data[index].hourKey.split('-')[1] ?? '';

        return (
          <g key={data[index].hourKey}>
            {value > 0 && (
              <text
                x={barCenterX}
                y={y - 2}
                textAnchor="middle"
                dominantBaseline="auto"
                fontSize={labelFontSize}
                fill="rgba(76, 201, 240, 1)"
              >
                {value}
              </text>
            )}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={height}
              rx={1.5}
              fill="rgba(76, 201, 240, 0.85)"
            />
            <text
              x={barCenterX}
              y={barAreaBottom + innerBarPadding}
              textAnchor="middle"
              dominantBaseline="hanging"
              fontSize={labelFontSize}
              fill="rgba(255, 255, 255, 0.45)"
            >
              {hourLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
