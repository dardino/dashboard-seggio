import { Alert, Box, CircularProgress, Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConsultations } from '../api/consultations';
import type { Consultation } from '../types';

const CONSULTATION_TYPE_LABELS: Record<string, string> = {
  politiche: 'Elezioni Politiche',
  amministrative: 'Elezioni Amministrative',
  referendarie: 'Referendum',
};

export default function ConsultationSelectPage() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const list = await fetchConsultations();

        if (!ignore) {
          setConsultations(list);
          setLoadError(null);

          if (list.length === 1) {
            navigate(`/${list[0].id}`, { replace: true });
          }
        }
      } catch {
        if (!ignore) {
          setLoadError('Impossibile caricare le consultazioni dal server.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  if (consultations.length === 0) {
    return (
      <Alert severity="info">
        Nessuna consultazione attiva. Creane una dal pannello di amministrazione.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" color="primary.main" fontWeight={700} mb={2}>
        Seleziona consultazione
      </Typography>
      <List disablePadding>
        {consultations.map((consultation, index) => {
          const firstSession = consultation.votingSessions[0];
          const dateLabel = firstSession
            ? new Date(firstSession.openAt).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })
            : '';

          return (
            <Box key={consultation.id}>
              {index > 0 && <Divider />}
              <ListItemButton
                onClick={() => {
                  navigate(`/${consultation.id}`);
                }}
              >
                <ListItemText
                  primary={CONSULTATION_TYPE_LABELS[consultation.type] ?? consultation.type}
                  secondary={dateLabel}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </Box>
          );
        })}
      </List>
    </Box>
  );
}
