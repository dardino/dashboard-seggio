import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { DashboardData } from '../types';

interface RilevamentoPageProps {
  initialData: DashboardData;
  isSaving: boolean;
  onSave: (nextData: DashboardData) => Promise<void>;
}

function sanitizeNumber(value: string): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? Math.floor(numericValue) : 0;
}

export default function RilevamentoPage({ initialData, isSaving, onSave }: RilevamentoPageProps) {
  const [votersAL, setVotersAL] = useState(() => String(initialData.votersAL));
  const [votersMZ, setVotersMZ] = useState(() => String(initialData.votersMZ));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setVotersAL(String(initialData.votersAL));
    setVotersMZ(String(initialData.votersMZ));
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await onSave({
        ...initialData,
        votersAL: sanitizeNumber(votersAL),
        votersMZ: sanitizeNumber(votersMZ),
      });

      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(false);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        maxWidth: 700,
        mx: 'auto',
        border: '1px solid',
        borderColor: 'rgba(76, 201, 240, 0.25)',
        background: 'linear-gradient(145deg, #162237 0%, #10192b 100%)',
      }}
    >
      <Stack spacing={2.5}>
        <Typography variant="h4" color="primary.main" fontWeight={800}>
          Rilevamento
        </Typography>

        <TextField
          label="Votanti A-L"
          type="number"
          value={votersAL}
          onChange={(event) => setVotersAL(event.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
          required
        />

        <TextField
          label="Votanti M-Z"
          type="number"
          value={votersMZ}
          onChange={(event) => setVotersMZ(event.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
          required
        />

        <Button type="submit" variant="contained" size="large" disabled={isSaving}>
          {isSaving ? 'Salvataggio...' : 'Salva'}
        </Button>

        {saved ? <Alert severity="success">Valori salvati con successo.</Alert> : null}
      </Stack>
    </Paper>
  );
}
