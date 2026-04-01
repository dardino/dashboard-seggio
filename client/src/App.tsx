import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import {
    Alert,
    AppBar,
    Box,
    Button,
    Container,
    IconButton,
    LinearProgress,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { fetchPresence, fetchPresenceHourlyDiff, putPresence, putPresenceSettings } from './api/presence';
import ConsultFormPage from './pages/ConsultFormPage';
import ConsultsPage from './pages/ConsultsPage';
import DashboardPage from './pages/DashboardPage';
import RilevamentoPage from './pages/RilevamentoPage';
import SettingsPage from './pages/SettingsPage';
import {
    DEFAULT_DASHBOARD_DATA,
    type DashboardData,
    type DashboardMetrics,
    type HourlyDiffDataPoint,
} from './types';

const DASHBOARD_REFRESH_INTERVAL_MS = 5000;

function ConsultationApp() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const location = useLocation();
  const [data, setData] = useState<DashboardData>(DEFAULT_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hourlyDiffData, setHourlyDiffData] = useState<HourlyDiffDataPoint[]>([]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  async function loadPresence(options?: { silent?: boolean }) {
    if (!consultationId) return;
    const silent = options?.silent ?? false;

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const [remoteData, remoteHourlyDiff] = await Promise.all([
        fetchPresence(consultationId),
        fetchPresenceHourlyDiff(consultationId),
      ]);

      setData(remoteData);
      setHourlyDiffData(remoteHourlyDiff);
      setLoadError(null);
    } catch {
      setLoadError('Impossibile caricare i dati dal server.');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!consultationId) return;
    const cid = consultationId;
    let ignore = false;

    async function loadData() {
      try {
        const [remoteData, remoteHourlyDiff] = await Promise.all([
          fetchPresence(cid),
          fetchPresenceHourlyDiff(cid),
        ]);

        if (!ignore) {
          setData(remoteData);
          setHourlyDiffData(remoteHourlyDiff);
          setLoadError(null);
        }
      } catch {
        if (!ignore) {
          setLoadError('Impossibile caricare i dati dal server.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [consultationId]);

  const isDashboardRoute = location.pathname === `/${consultationId}`;

  useEffect(() => {
    if (!isDashboardRoute || isSaving) {
      return undefined;
    }

    void loadPresence({ silent: true });

    const intervalId = window.setInterval(() => {
      void loadPresence({ silent: true });
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSaving, isDashboardRoute, consultationId]);

  const computed = useMemo<DashboardMetrics>(() => {
    const total = data.votersAL + data.votersMZ;
    const percentage = data.totalElectors > 0 ? (total / data.totalElectors) * 100 : 0;

    return {
      total,
      percentage,
    };
  }, [data]);

  const handleSave = async (nextData: DashboardData) => {
    if (!consultationId) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const savedData = await putPresence(consultationId, nextData);
      setData(savedData);
      const remoteHourlyDiff = await fetchPresenceHourlyDiff(consultationId);
      setHourlyDiffData(remoteHourlyDiff);
    } catch {
      setSaveError('Impossibile salvare i dati sul server.');
      throw new Error('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (nextData: DashboardData) => {
    if (!consultationId) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const savedData = await putPresenceSettings(consultationId, nextData);
      setData(savedData);
    } catch {
      setSaveError('Impossibile salvare i dati sul server.');
      throw new Error('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore browser-level fullscreen errors (permissions, unsupported state).
    }
  };

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary.main" fontWeight={800}>
            Referendum 2026
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              to={`/${consultationId}`}
              variant={isDashboardRoute ? 'contained' : 'outlined'}
              color="primary"
            >
              Dashboard
            </Button>
            <Button
              component={Link}
              to={`/${consultationId}/rilevamento`}
              variant={location.pathname === `/${consultationId}/rilevamento` ? 'contained' : 'outlined'}
              color="primary"
            >
              Rilevamento
            </Button>
            <Button
              component={Link}
              to={`/${consultationId}/impostazioni`}
              variant={location.pathname === `/${consultationId}/impostazioni` ? 'contained' : 'outlined'}
              color="primary"
            >
              Impostazioni
            </Button>
            <Tooltip title={isFullscreen ? 'Esci da fullscreen' : 'Vai in fullscreen'}>
              <IconButton
                color="primary"
                aria-label={isFullscreen ? 'Esci da fullscreen' : 'Vai in fullscreen'}
                onClick={() => {
                  void toggleFullscreen();
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Stack spacing={2.5}>
          {isLoading ? <LinearProgress color="primary" /> : null}
          {loadError ? <Alert severity="error">{loadError}</Alert> : null}
          {saveError ? <Alert severity="error">{saveError}</Alert> : null}

          <Routes>
            <Route
              path="/"
              element={(
                <DashboardPage
                  votersAL={data.votersAL}
                  votersMZ={data.votersMZ}
                  total={computed.total}
                  percentage={computed.percentage}
                  totalElectors={data.totalElectors}
                  comune={data.comune}
                  sezione={data.sezione}
                  lastUpdatedAt={data.lastUpdatedAt}
                  hourlyDiffData={hourlyDiffData}
                />
              )}
            />
            <Route
              path="/rilevamento"
              element={(
                <RilevamentoPage
                  initialData={data}
                  isSaving={isSaving}
                  onSave={handleSave}
                />
              )}
            />
            <Route
              path="/impostazioni"
              element={(
                <SettingsPage
                  initialData={data}
                  isSaving={isSaving}
                  onSave={handleSaveSettings}
                />
              )}
            />
          </Routes>
        </Stack>
      </Container>
    </>
  );
}

export default function App() {
  const location = useLocation();

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore browser-level fullscreen errors (permissions, unsupported state).
    }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 20% 10%, #1a2a45 0%, #0f1728 45%, #070c16 100%)',
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/consults" replace />} />
        <Route
          path="/consults"
          element={(
            <>
              <AppBar position="static" color="transparent" elevation={0}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="h6" color="primary.main" fontWeight={800}>
                    Referendum 2026
                  </Typography>
                  <Tooltip title={isFullscreen ? 'Esci da fullscreen' : 'Vai in fullscreen'}>
                    <IconButton
                      color="primary"
                      aria-label={isFullscreen ? 'Esci da fullscreen' : 'Vai in fullscreen'}
                      onClick={() => {
                        void toggleFullscreen();
                      }}
                    >
                      {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>
                  </Tooltip>
                </Toolbar>
              </AppBar>
              <Container maxWidth="xl" sx={{ py: 2 }}>
                <ConsultsPage />
              </Container>
            </>
          )}
        />
        <Route
          path="/consults/new"
          element={(
            <>
              <AppBar position="static" color="transparent" elevation={0}>
                <Toolbar>
                  <Typography variant="h6" color="primary.main" fontWeight={800}>
                    Referendum 2026
                  </Typography>
                </Toolbar>
              </AppBar>
              <Container maxWidth="xl" sx={{ py: 2 }}>
                <ConsultFormPage />
              </Container>
            </>
          )}
        />
        <Route
          path="/consults/:id"
          element={(
            <>
              <AppBar position="static" color="transparent" elevation={0}>
                <Toolbar>
                  <Typography variant="h6" color="primary.main" fontWeight={800}>
                    Referendum 2026
                  </Typography>
                </Toolbar>
              </AppBar>
              <Container maxWidth="xl" sx={{ py: 2 }}>
                <ConsultFormPage />
              </Container>
            </>
          )}
        />
        <Route path="/:consultationId/*" element={<ConsultationApp />} />
      </Routes>
    </Box>
  );
}

