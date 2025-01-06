import { 
  createBrowserRouter, 
  createRoutesFromElements,
  Route,
  Navigate
} from 'react-router-dom';
import { Layout } from '../components/Layout';
import RecordsHome from '../pages/labels/RecordsHome';
import TechHome from '../pages/labels/TechHome';
import DeepHome from '../pages/labels/DeepHome';
import ReleasesPage from '../pages/ReleasesPage';
import ArtistsPage from '../pages/ArtistsPage';
import PlaylistsPage from '../pages/PlaylistsPage';
import SubmitPage from '../pages/SubmitPage';
import NotFoundPage from '../pages/NotFoundPage';
import LegalPage from '../pages/LegalPage';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ArtistDetailPage from '../pages/ArtistDetailPage';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

// Router configuration with v7 future flags
export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/records" replace />} />
      
      {/* Records Routes */}
      <Route path="/records" element={<Layout />}>
        <Route index element={<RecordsHome />} />
        <Route path="releases" element={<ReleasesPage label="records" />} />
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="artists/:artistName" element={<ArtistDetailPage />} />
        <Route path="playlists" element={<PlaylistsPage label="records" />} />
        <Route path="submit" element={<SubmitPage label="records" />} />
        <Route path="legal" element={<LegalPage />} />
      </Route>

      {/* Tech Routes */}
      <Route path="/tech" element={<Layout />}>
        <Route index element={<TechHome />} />
        <Route path="releases" element={<ReleasesPage label="tech" />} />
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="artists/:artistName" element={<ArtistDetailPage />} />
        <Route path="playlists" element={<PlaylistsPage label="tech" />} />
        <Route path="submit" element={<SubmitPage label="tech" />} />
        <Route path="legal" element={<LegalPage />} />
      </Route>

      {/* Deep Routes */}
      <Route path="/deep" element={<Layout />}>
        <Route index element={<DeepHome />} />
        <Route path="releases" element={<ReleasesPage label="deep" />} />
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="artists/:artistName" element={<ArtistDetailPage />} />
        <Route path="playlists" element={<PlaylistsPage label="deep" />} />
        <Route path="submit" element={<SubmitPage label="deep" />} />
        <Route path="legal" element={<LegalPage />} />
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

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </>
  ),
  {
    // Enable all v7 future flags
    future: {
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    }
  }
);