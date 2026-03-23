import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface MetricCardProps {
  title: string;
  value: string;
  caption?: string;
  chart?: ReactNode;
}

export default function MetricCard({ title, value, caption, chart }: MetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        height: '100%',
        border: '1px solid',
        borderColor: 'rgba(76, 201, 240, 0.25)',
        background: 'linear-gradient(145deg, #162237 0%, #10192b 100%)',
      }}
    >
      <Stack spacing={1.25} height="100%">
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          {title}
        </Typography>
        <Typography
          variant="h2"
          color="common.white"
          sx={{
            wordBreak: 'break-word',
            fontSize: 'clamp(4.5rem, 10vw, 7.5rem)',
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
        {chart ? <Box sx={{ pt: 0.5 }}>{chart}</Box> : null}
        {caption ? (
          <Typography variant="body2" color="text.secondary">
            {caption}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
