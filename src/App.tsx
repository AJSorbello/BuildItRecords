import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import RecordsPage from './pages/RecordsPage';
import TechPage from './pages/TechPage';
import DeepPage from './pages/DeepPage';
import ArtistListPage from './pages/ArtistListPage';
import ReleasesPage from './pages/ReleasesPage';
import SubmitPage from './pages/SubmitPage';
import PlaylistPage from './pages/PlaylistPage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#02FF95',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121212',
          color: '#FFFFFF',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '64px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '64px',
          padding: '12px 16px',
        },
      },
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<RecordsPage />} />
          <Route path="/records/artists" element={<ArtistListPage />} />
          <Route path="/records/releases" element={<ReleasesPage />} />
          <Route path="/records/playlists" element={<PlaylistPage label="records" />} />
          <Route path="/records/submit" element={<SubmitPage />} />
          <Route path="/tech" element={<TechPage />} />
          <Route path="/tech/artists" element={<ArtistListPage />} />
          <Route path="/tech/releases" element={<ReleasesPage />} />
          <Route path="/tech/playlists" element={<PlaylistPage label="tech" />} />
          <Route path="/tech/submit" element={<SubmitPage />} />
          <Route path="/deep" element={<DeepPage />} />
          <Route path="/deep/artists" element={<ArtistListPage />} />
          <Route path="/deep/releases" element={<ReleasesPage />} />
          <Route path="/deep/playlists" element={<PlaylistPage label="deep" />} />
          <Route path="/deep/submit" element={<SubmitPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
