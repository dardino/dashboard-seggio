import { Typography } from '@mui/material';
import type { HourlyDiffDataPoint } from '../../types';

export default function MiniHourlyDiffChart({ data }: { data: HourlyDiffDataPoint[] }) {
  if (data.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        Nessun dato orario
      </Typography>
    );
  }

  const values = data.map((entry) => Math.max(0, entry.diffFromPreviousHour));
  const maxValue = Math.max(...values, 1);
  const padding = 8;
  const chartHeight = 104;
  const barGap = 2;
  const chartWidth = Math.max(220, values.length * 8 + padding * 2);
  const innerWidth = chartWidth - padding * 2;
  const barWidth = (innerWidth - barGap * (values.length - 1)) / values.length;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      width="100%"
      height="104"
      role="img"
      aria-label="Andamento orario votanti"
      preserveAspectRatio="none"
    >
      {values.map((value, index) => {
        const normalizedHeight = (value / maxValue) * (chartHeight - padding * 2);
        const height = Math.max(2, normalizedHeight);
        const x = padding + index * (barWidth + barGap);
        const y = chartHeight - padding - height;

        return (
          <rect
            key={data[index].hourKey}
            x={x}
            y={y}
            width={barWidth}
            height={height}
            rx={1.5}
            fill="rgba(76, 201, 240, 0.85)"
          />
        );
      })}
    </svg>
  );
}
