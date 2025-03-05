import { 
  createBrowserRouter, 
  RouterProvider,
  Route,
  Navigate
} from 'react-router-dom';
import { Layout } from '../components/Layout';
import RecordsHome from '../pages/labels/RecordsHome';
import TechHome from '../pages/labels/TechHome';
import DeepHome from '../pages/labels/DeepHome';
import { ReleasesPage } from '../pages/ReleasesPage';
import ArtistsPage from '../pages/ArtistsPage';
import PlaylistsPage from '../pages/PlaylistsPage';
import SubmitPage from '../pages/SubmitPage';
import NotFoundPage from '../pages/NotFoundPage';
import LegalPage from '../pages/LegalPage';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ArtistDetailPage from '../pages/ArtistDetailPage';
import TrackManager from '../pages/admin/TrackManager';
import { RECORD_LABELS } from '../constants/labels';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

// Router configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/records" replace />,
  },
  {
    path: '/records',
    element: <Layout />,
    children: [
      {
        path: '/records',
        element: <RecordsHome />,
      },
      {
        path: '/records/releases',
        element: <ReleasesPage label="records" />,
      },
      {
        path: '/records/artists',
        element: <ArtistsPage />,
      },
      {
        path: '/records/artists/:id',
        element: <ArtistDetailPage />,
      },
      {
        path: '/records/playlists',
        element: <PlaylistsPage />,
      },
      {
        path: '/records/submit',
        element: <SubmitPage />,
      },
      {
        path: '/records/legal',
        element: <LegalPage />,
      }
    ],
  },
  {
    path: '/deep',
    element: <Layout />,
    children: [
      {
        path: '/deep',
        element: <DeepHome />,
      },
      {
        path: '/deep/releases',
        element: <ReleasesPage label="deep" />,
      },
      {
        path: '/deep/artists',
        element: <ArtistsPage />,
      },
      {
        path: '/deep/artists/:id',
        element: <ArtistDetailPage />,
      },
      {
        path: '/deep/playlists',
        element: <PlaylistsPage />,
      }
    ],
  },
  {
    path: '/tech',
    element: <Layout />,
    children: [
      {
        path: '/tech',
        element: <TechHome />,
      },
      {
        path: '/tech/releases',
        element: <ReleasesPage label="tech" />,
      },
      {
        path: '/tech/artists',
        element: <ArtistsPage />,
      },
      {
        path: '/tech/artists/:id',
        element: <ArtistDetailPage />,
      },
      {
        path: '/tech/playlists',
        element: <PlaylistsPage />,
      }
    ],
  },
  {
    path: '/admin',
    children: [
      {
        path: '/admin/login',
        element: <AdminLogin />,
      },
      {
        path: '/admin',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: '/admin/dashboard',
        element: <ProtectedRoute><AdminDashboard /></ProtectedRoute>,
      },
      {
        path: '/admin/tracks',
        element: <ProtectedRoute><TrackManager /></ProtectedRoute>,
      }
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  }
]);

export default router;