import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider,
  Route,
  createRoutesFromElements,
  Navigate 
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import { SnackbarProvider } from 'notistack';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import DebugConsole from './components/DebugConsole';
import SystemHealthMonitor from './components/SystemHealthMonitor';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import RecordsPage from './pages/RecordsPage';
import ReleasesPage from './pages/ReleasesPage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistDetailPage from './pages/ArtistDetailPage';
import PlaylistPage from './pages/PlaylistPage';
import SubmitPage from './pages/SubmitPage';
import TechPage from './pages/TechPage';
import DeepPage from './pages/DeepPage';
import LegalPage from './pages/LegalPage';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import NotFoundPage from './pages/NotFoundPage';
import TrackManager from './components/admin/TrackManager';

// Detect the development environment
const isDevEnvironment = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// Create router outside the component to avoid recreation on each render
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route
        path="/"
        element={<Layout />}
        errorElement={<ErrorBoundary />}
      >
        <Route path="login" element={<LoginPage />} />
        
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        >
          <Route path="tracks" element={<TrackManager />} />
        </Route>

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

// Define the AppRouter component separately from the main App
const AppRouter = () => {
  return <RouterProvider router={router} />;
};

// Create a component to hold all the UI elements except the router
const AppUI = () => {
  const [healthMonitorMinimized, setHealthMonitorMinimized] = React.useState(true);
  
  // Check if the health monitor should be shown
  const shouldShowHealthMonitor = () => {
    // Show in dev mode or when requested via URL param
    return isDevEnvironment || new URLSearchParams(window.location.search).has('debug');
  };

  return (
    <>
      {shouldShowHealthMonitor() && (
        <>
          <SystemHealthMonitor 
            minimized={healthMonitorMinimized} 
            onToggleMinimize={() => setHealthMonitorMinimized(!healthMonitorMinimized)} 
          />
          <DebugConsole />
        </>
      )}
    </>
  );
};

// Main App component
const App = () => {
  return (
    <CustomThemeProvider>
      <ThemeProvider theme={createTheme({
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
          <>
            <AppRouter />
            <AppUI />
          </>
        </SnackbarProvider>
      </ThemeProvider>
    </CustomThemeProvider>
  );
};

export default App;
