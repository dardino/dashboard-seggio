import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface MetricCardProps {
  title: string;
  value: string;
  caption?: string;
  chart?: ReactNode;
  centered?: boolean;
}

export default function MetricCard({ title, value, caption, chart, centered = false }: MetricCardProps) {
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
      <Stack
        spacing={1.25}
        height="100%"
        alignItems={centered ? 'center' : undefined}
      >
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
        <Typography variant="h6" color="text.secondary" fontWeight={400}>
          {caption}{" "}
        </Typography>
        {chart ? <Box sx={{ pt: 0.5, width: '100%', mt: 'auto' }}>{chart}</Box> : null}
      </Stack>
    </Paper>
  );
}
