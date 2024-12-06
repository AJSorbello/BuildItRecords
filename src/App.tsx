import * as React from 'react';
import { 
  Route, 
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider 
} from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Layout } from './components/Layout';
import { darkTheme } from './theme/theme';

// Import pages
import HomePage from './pages/HomePage';
import ReleasesPage from './pages/ReleasesPage';
import ArtistsPage from './pages/ArtistsPage';
import PlaylistsPage from './pages/PlaylistsPage';
import SubmitPage from './pages/SubmitPage';
import NotFoundPage from './pages/NotFoundPage';
import LegalPage from './pages/LegalPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ArtistDetailPage from './pages/ArtistDetailPage';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

import { initializeData } from './utils/dataInitializer';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/records" replace />} />
      
      {/* Records Routes */}
      <Route path="/records" element={<Layout />}>
        <Route index element={<HomePage label="RECORDS" />} />
        <Route path="releases" element={<ReleasesPage label="RECORDS" />} />
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="artists/:artistName" element={<ArtistDetailPage />} />
        <Route path="playlists" element={<PlaylistsPage label="RECORDS" />} />
        <Route path="submit" element={<SubmitPage label="RECORDS" />} />
      </Route>

      {/* Tech Routes */}
      <Route path="/tech" element={<Layout />}>
        <Route index element={<HomePage label="TECH" />} />
        <Route path="releases" element={<ReleasesPage label="TECH" />} />
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="artists/:artistName" element={<ArtistDetailPage />} />
        <Route path="playlists" element={<PlaylistsPage label="TECH" />} />
        <Route path="submit" element={<SubmitPage label="TECH" />} />
      </Route>

      {/* Deep Routes */}
      <Route path="/deep" element={<Layout />}>
        <Route index element={<HomePage label="DEEP" />} />
        <Route path="releases" element={<ReleasesPage label="DEEP" />} />
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="artists/:artistName" element={<ArtistDetailPage />} />
        <Route path="playlists" element={<PlaylistsPage label="DEEP" />} />
        <Route path="submit" element={<SubmitPage label="DEEP" />} />
      </Route>

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
      </Route>

      {/* Legal Route */}
      <Route path="/legal" element={<LegalPage />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </>
  ),
  {
    future: {
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  React.useEffect(() => {
    // Initialize data when the app starts
    initializeData();
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
