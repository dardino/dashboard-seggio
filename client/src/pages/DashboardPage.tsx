import { Grid, Stack, Typography } from '@mui/material';
import type { HourlyDiffDataPoint } from '../types';
import { formatLastUpdatedAt } from './dashboard/formatLastUpdatedAt';
import MetricCard from './dashboard/MetricCard';
import MiniHourlyDiffChart from './dashboard/MiniHourlyDiffChart';

interface DashboardPageProps {
  votersAL: number;
  votersMZ: number;
  total: number;
  percentage: number;
  totalElectors: number;
  comune: string;
  sezione: string;
  lastUpdatedAt: string | null;
  hourlyDiffData: HourlyDiffDataPoint[];
}

export default function DashboardPage({
  votersAL,
  votersMZ,
  total,
  percentage,
  totalElectors,
  comune,
  sezione,
  lastUpdatedAt,
  hourlyDiffData,
}: DashboardPageProps) {
  return (
    <Stack spacing={3} sx={{ minHeight: { xs: 'auto', md: 'calc(100vh - 110px)' } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'flex-start' }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight={800} color="primary.main">
            {comune}
          </Typography>
          <Typography variant="h6" fontWeight={600} color="text.secondary">
            {sezione}
          </Typography>
        </Stack>

        <Stack spacing={0.25} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Ultimo rilevamento
          </Typography>
          <Typography variant="h6" color="common.white" fontWeight={700} textAlign={{ xs: 'left', md: 'right' }}>
            {formatLastUpdatedAt(lastUpdatedAt)}
          </Typography>
        </Stack>
      </Stack>

      <Grid container spacing={2.5} sx={{ flexGrow: 1 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <MetricCard title="Votanti A-L" value={votersAL.toLocaleString('it-IT')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <MetricCard title="Votanti M-Z" value={votersMZ.toLocaleString('it-IT')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <MetricCard
            title="Totale"
            value={total.toLocaleString('it-IT')}
            chart={<MiniHourlyDiffChart data={hourlyDiffData} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <MetricCard
            title="Percentuale"
            value={`${percentage.toFixed(2)}%`}
            caption={`su ${totalElectors.toLocaleString('it-IT')} elettori`}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
