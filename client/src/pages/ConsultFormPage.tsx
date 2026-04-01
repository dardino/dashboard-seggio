import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createConsultation,
  fetchConsultation,
  updateConsultation,
} from '../api/consultations';
import type { BallotCard, ConsultationType, VotingSession } from '../types';

const CONSULTATION_TYPES: Array<{ value: ConsultationType; label: string }> = [
  { value: 'politiche', label: 'Politiche' },
  { value: 'amministrative', label: 'Amministrative' },
  { value: 'referendarie', label: 'Referendarie' },
];

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function newBallotCard(): BallotCard {
  return { id: crypto.randomUUID(), label: '', color: '#4cc9f0' };
}

function newVotingSession(): VotingSession {
  return { openAt: '', closeAt: '' };
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

function toIso(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}

export default function ConsultFormPage({ onTitleLoaded }: { onTitleLoaded?: (title: string) => void }) {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [type, setType] = useState<ConsultationType | ''>('');
  const [titolo, setTitolo] = useState('');
  const [labelAL, setLabelAL] = useState('A-L');
  const [labelMZ, setLabelMZ] = useState('M-Z');
  const [votingSessions, setVotingSessions] = useState<VotingSession[]>([newVotingSession()]);
  const [ballotCards, setBallotCards] = useState<BallotCard[]>([newBallotCard()]);

  useEffect(() => {
    if (!isEdit || !id) return;
    setIsLoading(true);
    fetchConsultation(id)
      .then((c) => {
        setTitolo(c.titolo);
        setType(c.type);
        setLabelAL(c.labelAL);
        setLabelMZ(c.labelMZ);
        setVotingSessions(c.votingSessions.length > 0 ? c.votingSessions : [newVotingSession()]);
        setBallotCards(c.ballotCards.length > 0 ? c.ballotCards : [newBallotCard()]);
        onTitleLoaded?.(c.titolo);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Errore durante il caricamento');
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!type) {
      errors.type = 'Il tipo è obbligatorio';
    }
    if (!titolo.trim()) {
      errors.titolo = 'Il titolo è obbligatorio';
    }
    if (votingSessions.length === 0) {
      errors.votingSessions = 'Almeno una sessione di voto è richiesta';
    }
    if (ballotCards.length === 0) {
      errors.ballotCards = 'Almeno una scheda elettorale è richiesta';
    }

    votingSessions.forEach((s, i) => {
      if (!s.openAt) errors[`vs_open_${i}`] = 'Data di apertura richiesta';
      if (!s.closeAt) errors[`vs_close_${i}`] = 'Data di chiusura richiesta';
      if (s.openAt && s.closeAt && new Date(s.openAt) >= new Date(s.closeAt)) {
        errors[`vs_order_${i}`] = "La chiusura deve essere successiva all'apertura";
      }
    });

    ballotCards.forEach((c, i) => {
      if (!c.label.trim()) errors[`bc_label_${i}`] = 'Etichetta richiesta';
      if (!HEX_COLOR_RE.test(c.color)) errors[`bc_color_${i}`] = 'Colore HEX non valido';
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        titolo,
        type: type as ConsultationType,
        labelAL,
        labelMZ,
        votingSessions,
        ballotCards,
      };
      if (isEdit && id) {
        await updateConsultation(id, payload);
      } else {
        await createConsultation(payload);
      }
      navigate('/consults');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const addVotingSession = () => setVotingSessions((prev) => [...prev, newVotingSession()]);

  const removeVotingSession = (index: number) =>
    setVotingSessions((prev) => prev.filter((_, i) => i !== index));

  const updateVotingSession = (index: number, field: keyof VotingSession, raw: string) => {
    setVotingSessions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: toIso(raw) };
      return updated;
    });
  };

  const addBallotCard = () => setBallotCards((prev) => [...prev, newBallotCard()]);

  const removeBallotCard = (index: number) =>
    setBallotCards((prev) => prev.filter((_, i) => i !== index));

  const updateBallotCard = (index: number, field: keyof BallotCard, value: string) => {
    setBallotCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{loadError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEdit ? 'Modifica consultazione' : 'Nuova consultazione'}
      </Typography>

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      {/* Informazioni generali */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Informazioni generali
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }} error={!!fieldErrors.type}>
          <InputLabel>Tipo *</InputLabel>
          <Select
            value={type}
            label="Tipo *"
            onChange={(e) => setType(e.target.value as ConsultationType)}
          >
            {CONSULTATION_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
          {fieldErrors.type && <FormHelperText>{fieldErrors.type}</FormHelperText>}
        </FormControl>

        <TextField
          label="Titolo *"
          value={titolo}
          onChange={(e) => setTitolo(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          error={!!fieldErrors.titolo}
          helperText={fieldErrors.titolo}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Label A-L"
            value={labelAL}
            onChange={(e) => setLabelAL(e.target.value)}
            fullWidth
          />
          <TextField
            label="Label M-Z"
            value={labelMZ}
            onChange={(e) => setLabelMZ(e.target.value)}
            fullWidth
          />
        </Box>
      </Paper>

      {/* Sessioni di voto */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Sessioni di voto
          </Typography>
          <Button startIcon={<AddIcon />} onClick={addVotingSession} size="small">
            Aggiungi
          </Button>
        </Box>

        {fieldErrors.votingSessions && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fieldErrors.votingSessions}
          </Alert>
        )}

        {votingSessions.map((session, i) => (
          <Box key={i}>
            {i > 0 && <Divider sx={{ my: 2 }} />}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                label="Apertura"
                type="datetime-local"
                value={toDatetimeLocal(session.openAt)}
                onChange={(e) => updateVotingSession(i, 'openAt', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                error={!!fieldErrors[`vs_open_${i}`] || !!fieldErrors[`vs_order_${i}`]}
                helperText={fieldErrors[`vs_open_${i}`] ?? fieldErrors[`vs_order_${i}`]}
              />
              <TextField
                label="Chiusura"
                type="datetime-local"
                value={toDatetimeLocal(session.closeAt)}
                onChange={(e) => updateVotingSession(i, 'closeAt', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                error={!!fieldErrors[`vs_close_${i}`] || !!fieldErrors[`vs_order_${i}`]}
                helperText={fieldErrors[`vs_close_${i}`]}
              />
              <Tooltip title="Rimuovi sessione">
                <span>
                  <IconButton
                    onClick={() => removeVotingSession(i)}
                    disabled={votingSessions.length <= 1}
                    color="error"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Paper>

      {/* Schede elettorali */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Schede elettorali
          </Typography>
          <Button startIcon={<AddIcon />} onClick={addBallotCard} size="small">
            Aggiungi
          </Button>
        </Box>

        {fieldErrors.ballotCards && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fieldErrors.ballotCards}
          </Alert>
        )}

        {ballotCards.map((card, i) => (
          <Box key={card.id}>
            {i > 0 && <Divider sx={{ my: 2 }} />}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                label="Etichetta"
                value={card.label}
                onChange={(e) => updateBallotCard(i, 'label', e.target.value)}
                fullWidth
                error={!!fieldErrors[`bc_label_${i}`]}
                helperText={fieldErrors[`bc_label_${i}`]}
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 160 }}>
                <TextField
                  label="Colore HEX"
                  value={card.color}
                  onChange={(e) => updateBallotCard(i, 'color', e.target.value)}
                  error={!!fieldErrors[`bc_color_${i}`]}
                  helperText={fieldErrors[`bc_color_${i}`]}
                  sx={{ flex: 1 }}
                />
                <Box
                  component="input"
                  type="color"
                  value={HEX_COLOR_RE.test(card.color) ? card.color : '#000000'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBallotCard(i, 'color', e.target.value)
                  }
                  sx={{ width: 40, height: 40, border: 'none', cursor: 'pointer', borderRadius: 1, mt: 1 }}
                />
              </Box>
              <Tooltip title="Rimuovi scheda">
                <span>
                  <IconButton
                    onClick={() => removeBallotCard(i)}
                    disabled={ballotCards.length <= 1}
                    color="error"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => navigate('/consults')}>
          Annulla
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
        >
          {isEdit ? 'Salva modifiche' : 'Crea consultazione'}
        </Button>
      </Box>
    </Box>
  );
}
