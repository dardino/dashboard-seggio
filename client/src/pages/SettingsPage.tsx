import {
    Alert,
    Button,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { DashboardData } from '../types';

interface SettingsPageProps {
  initialData: DashboardData;
  isSaving: boolean;
  onSave: (nextData: DashboardData) => Promise<void>;
}

function sanitizeNumber(value: string): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? Math.floor(numericValue) : 0;
}

export default function SettingsPage({ initialData, isSaving, onSave }: SettingsPageProps) {
  const [totalElectors, setTotalElectors] = useState(() => String(initialData.totalElectors));
  const [votersAL, setVotersAL] = useState(() => String(initialData.votersAL));
  const [votersMZ, setVotersMZ] = useState(() => String(initialData.votersMZ));
  const [comune, setComune] = useState(() => initialData.comune);
  const [sezione, setSezione] = useState(() => initialData.sezione);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTotalElectors(String(initialData.totalElectors));
    setVotersAL(String(initialData.votersAL));
    setVotersMZ(String(initialData.votersMZ));
    setComune(initialData.comune);
    setSezione(initialData.sezione);
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await onSave({
        totalElectors: sanitizeNumber(totalElectors),
        votersAL: sanitizeNumber(votersAL),
        votersMZ: sanitizeNumber(votersMZ),
        comune,
        sezione,
        lastUpdatedAt: initialData.lastUpdatedAt,
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
          Impostazioni Totali
        </Typography>

        <TextField
          label="Totale elettori (XXX)"
          type="number"
          value={totalElectors}
          onChange={(event) => setTotalElectors(event.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
          required
        />

        <TextField
          label="Totale votanti A-L"
          type="number"
          value={votersAL}
          onChange={(event) => setVotersAL(event.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
          required
        />

        <TextField
          label="Totale votanti M-Z"
          type="number"
          value={votersMZ}
          onChange={(event) => setVotersMZ(event.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
          required
        />

        <TextField
          label="Comune"
          value={comune}
          onChange={(event) => setComune(event.target.value)}
          fullWidth
          required
        />

        <TextField
          label="Sezione / Seggio"
          value={sezione}
          onChange={(event) => setSezione(event.target.value)}
          fullWidth
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
