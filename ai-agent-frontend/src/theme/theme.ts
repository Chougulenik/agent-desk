import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#10b981', // Emerald
      light: '#34d399',
    },
    background: {
      default: '#070b14', // Ultra deep space blue
      paper: 'rgba(15, 23, 42, 0.6)', // Glassmorphic slate
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", sans-serif',
    h6: { fontWeight: 600, letterSpacing: '-0.02em' },
    body1: { lineHeight: 1.7 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#070b14',
          backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 25%), radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.05) 0%, transparent 25%)',
          backgroundAttachment: 'fixed',
          margin: 0,
          padding: 0,
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' },
        },
        '#root': {
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.02em',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
          }
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            transition: 'all 0.2s',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)', borderWidth: '1px' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1px', boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' },
          },
        },
      },
    },
  },
});
