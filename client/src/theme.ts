import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4cc9f0',
    },
    secondary: {
      main: '#90caf9',
    },
    background: {
      default: '#0b1320',
      paper: '#121a2a',
    },
    text: {
      primary: '#e6edf7',
      secondary: '#9fb3c8',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});
