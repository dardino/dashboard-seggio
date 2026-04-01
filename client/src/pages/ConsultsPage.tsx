import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  archiveConsultation,
  deleteConsultation,
  fetchConsultations,
  restoreConsultation,
} from '../api/consultations';
import type { Consultation, ConsultationType } from '../types';

const typeLabels: Record<ConsultationType, string> = {
  politiche: 'Politiche',
  amministrative: 'Amministrative',
  referendarie: 'Referendarie',
};

export default function ConsultsPage() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Consultation | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const reload = () => setReloadTrigger((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchConsultations(includeArchived)
      .then((data) => {
        if (!cancelled) setConsultations(data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Errore durante il caricamento');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [includeArchived, reloadTrigger]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConsultation(deleteTarget.id);
      setSnackbar({ message: 'Consultazione eliminata', severity: 'success' });
      setDeleteTarget(null);
      reload();
    } catch {
      setSnackbar({ message: "Errore durante l'eliminazione", severity: 'error' });
    }
  };

  const handleArchive = async (c: Consultation) => {
    try {
      await archiveConsultation(c.id);
      setSnackbar({ message: 'Consultazione archiviata', severity: 'success' });
      reload();
    } catch {
      setSnackbar({ message: "Errore durante l'archiviazione", severity: 'error' });
    }
  };

  const handleRestore = async (c: Consultation) => {
    try {
      await restoreConsultation(c.id);
      setSnackbar({ message: 'Consultazione ripristinata', severity: 'success' });
      reload();
    } catch {
      setSnackbar({ message: 'Errore durante il ripristino', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h5" sx={{ flex: 1 }}>
          Consultazioni
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
          }
          label="Mostra archiviate"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/consults/new')}
        >
          Nuova
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Titolo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Label AL</TableCell>
                <TableCell>Label MZ</TableCell>
                <TableCell>Sessioni</TableCell>
                <TableCell>Schede</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">Nessuna consultazione trovata</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                consultations.map((c) => (
                  <TableRow key={c.id} sx={{ opacity: c.archived ? 0.6 : 1 }}>
                    <TableCell>{c.titolo || '—'}</TableCell>
                    <TableCell>{typeLabels[c.type]}</TableCell>
                    <TableCell>{c.labelAL}</TableCell>
                    <TableCell>{c.labelMZ}</TableCell>
                    <TableCell>{c.votingSessions.length}</TableCell>
                    <TableCell>{c.ballotCards.length}</TableCell>
                    <TableCell>
                      {c.archived ? (
                        <Chip label="Archiviata" size="small" />
                      ) : (
                        <Chip label="Attiva" color="primary" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Apri dashboard">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/${c.id}`)}
                            disabled={c.archived}
                          >
                            <DashboardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Modifica">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/consults/${c.id}`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={c.archived ? 'Ripristina' : 'Archivia'}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            c.archived ? void handleRestore(c) : void handleArchive(c)
                          }
                        >
                          {c.archived ? (
                            <UnarchiveIcon fontSize="small" />
                          ) : (
                            <ArchiveIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Elimina consultazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler eliminare questa consultazione? L&apos;operazione è irreversibile.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
        {snackbar ? (
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
