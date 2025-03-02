import React from 'react';
import Box from '@mui/material/Box';
import { 
  createBrowserRouter, 
  RouterProvider,
  Route,
  createRoutesFromElements,
  Navigate 
} from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import { SnackbarProvider } from 'notistack';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import RecordsPage from './pages/RecordsPage';
import TechPage from './pages/TechPage';
import DeepPage from './pages/DeepPage';
import { ReleasesPage } from './pages/ReleasesPage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistDetailPage from './pages/ArtistDetailPage';
import PlaylistPage from './pages/PlaylistPage';
import SubmitPage from './pages/SubmitPage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import TrackManager from './components/admin/TrackManager';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* Admin Routes */}
      <Route path="/admin">
        <Route path="login" element={<AdminLogin />} />
        <Route path="dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="tracks/import/:label" element={<ProtectedRoute><TrackManager /></ProtectedRoute>} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Main App Routes */}
      <Route path="/" element={<Layout />}>
        <Route path="records">
          <Route path="artists" element={<ArtistsPage label="records" />} />
          <Route path="artists/:id" element={<ArtistDetailPage />} />
          <Route path="releases" element={<ReleasesPage label="records" />} />
          <Route path="playlists" element={<PlaylistPage label="records" />} />
          <Route path="submit" element={<SubmitPage label="records" />} />
          <Route index element={<RecordsPage />} />
        </Route>

        <Route path="tech">
          <Route path="artists" element={<ArtistsPage label="tech" />} />
          <Route path="artists/:id" element={<ArtistDetailPage />} />
          <Route path="releases" element={<ReleasesPage label="tech" />} />
          <Route path="playlists" element={<PlaylistPage label="tech" />} />
          <Route path="submit" element={<SubmitPage label="tech" />} />
          <Route index element={<TechPage />} />
        </Route>

        <Route path="deep">
          <Route path="artists" element={<ArtistsPage label="deep" />} />
          <Route path="artists/:id" element={<ArtistDetailPage />} />
          <Route path="releases" element={<ReleasesPage label="deep" />} />
          <Route path="playlists" element={<PlaylistPage label="deep" />} />
          <Route path="submit" element={<SubmitPage label="deep" />} />
          <Route index element={<DeepPage />} />
        </Route>

        <Route path="legal" element={<LegalPage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route index element={<Navigate to="/records" replace />} />
      </Route>
    </Route>
  )
);

const App: React.FC = () => {
  return (
    <CustomThemeProvider>
      <MuiThemeProvider theme={createTheme({
        palette: {
          mode: 'dark',
          primary: {
            main: '#1DB954',
          },
          background: {
            default: '#000000',
            paper: '#000000',
          },
        },
      })}>
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <RouterProvider router={router} />
          </Box>
        </SnackbarProvider>
      </MuiThemeProvider>
    </CustomThemeProvider>
  );
};

export default App;
