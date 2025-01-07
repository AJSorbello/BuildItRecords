import * as React from 'react';
import { 
  Route, 
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider 
} from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { Layout } from './components/Layout';
import { darkTheme } from './theme/theme';
import './styles/global.css';

// Import pages
import RecordsHome from './pages/labels/RecordsHome';
import TechHome from './pages/labels/TechHome';
import DeepHome from './pages/labels/DeepHome';
import ReleasesPage from './pages/ReleasesPage';
import ArtistsPage from './pages/ArtistsPage';
import PlaylistPage from './pages/PlaylistsPage';
import SubmitPage from './pages/SubmitPage';
import NotFoundPage from './pages/NotFoundPage';
import LegalPage from './pages/LegalPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ArtistDetailPage from './pages/ArtistDetailPage';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Admin Routes */}
      <Route path="/admin">
        <Route path="login" element={<AdminLogin />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route index element={
          localStorage.getItem('adminToken') ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <Navigate to="/admin/login" replace />
        } />
      </Route>

      {/* Main Routes */}
      <Route path="/" element={<Layout />}>
        {/* Default redirect */}
        <Route index element={<Navigate to="/records" replace />} />
        
        {/* Records Routes */}
        <Route path="records">
          <Route index element={<RecordsHome />} />
          <Route path="releases" element={<ReleasesPage label="buildit-records" />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="artists/:id" element={<ArtistDetailPage />} />
          <Route path="playlists" element={<PlaylistPage label="records" />} />
          <Route path="submit" element={<SubmitPage label="records" />} />
          <Route path="legal" element={<LegalPage />} />
        </Route>

        {/* Tech Routes */}
        <Route path="tech">
          <Route index element={<TechHome />} />
          <Route path="releases" element={<ReleasesPage label="buildit-tech" />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="artists/:id" element={<ArtistDetailPage />} />
          <Route path="playlists" element={<PlaylistPage label="tech" />} />
          <Route path="submit" element={<SubmitPage label="tech" />} />
          <Route path="legal" element={<LegalPage />} />
        </Route>

        {/* Deep Routes */}
        <Route path="deep">
          <Route index element={<DeepHome />} />
          <Route path="releases" element={<ReleasesPage label="buildit-deep" />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="artists/:id" element={<ArtistDetailPage />} />
          <Route path="playlists" element={<PlaylistPage label="deep" />} />
          <Route path="submit" element={<SubmitPage label="deep" />} />
          <Route path="legal" element={<LegalPage />} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </>
  )
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <RouterProvider router={router} />
      </Box>
    </ThemeProvider>
  );
};

export default App;
