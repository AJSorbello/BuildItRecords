import React from 'react';
import Box from '@mui/material/Box';
import { 
  createBrowserRouter, 
  RouterProvider,
  Route,
  createRoutesFromElements,
  Navigate 
} from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from './theme/ThemeContext';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import RecordsPage from './pages/RecordsPage';
import TechPage from './pages/TechPage';
import DeepPage from './pages/DeepPage';
import ReleasesPage from './pages/ReleasesPage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistDetailPage from './pages/ArtistDetailPage';
import PlaylistPage from './pages/PlaylistPage';
import SubmitPage from './pages/SubmitPage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import TrackManager from './components/admin/TrackManager';

const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: <AdminLogin />
  },
  {
    path: '/admin/dashboard',
    element: <ProtectedRoute><AdminDashboard /></ProtectedRoute>
  },
  {
    path: '/admin/tracks/import/:label',
    element: <ProtectedRoute><TrackManager /></ProtectedRoute>
  },
  {
    path: '/admin',
    element: <Navigate to="/admin/dashboard" replace />
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/records" replace />
      },
      {
        path: 'records',
        children: [
          {
            index: true,
            element: <RecordsPage />
          },
          {
            path: 'releases',
            element: <ReleasesPage label="buildit-records" />
          },
          {
            path: 'artists',
            element: <ArtistsPage label="buildit-records" />
          },
          {
            path: 'artists/:id',
            element: <ArtistDetailPage />
          },
          {
            path: 'playlists',
            element: <PlaylistPage label="records" />
          },
          {
            path: 'submit',
            element: <SubmitPage label="records" />
          },
          {
            path: 'legal',
            element: <LegalPage />
          }
        ]
      },
      {
        path: 'tech',
        children: [
          {
            index: true,
            element: <TechPage />
          },
          {
            path: 'releases',
            element: <ReleasesPage label="buildit-tech" />
          },
          {
            path: 'artists',
            element: <ArtistsPage label="buildit-tech" />
          },
          {
            path: 'artists/:id',
            element: <ArtistDetailPage />
          },
          {
            path: 'playlists',
            element: <PlaylistPage label="tech" />
          },
          {
            path: 'submit',
            element: <SubmitPage label="tech" />
          },
          {
            path: 'legal',
            element: <LegalPage />
          }
        ]
      },
      {
        path: 'deep',
        children: [
          {
            index: true,
            element: <DeepPage />
          },
          {
            path: 'releases',
            element: <ReleasesPage label="buildit-deep" />
          },
          {
            path: 'artists',
            element: <ArtistsPage label="buildit-deep" />
          },
          {
            path: 'artists/:id',
            element: <ArtistDetailPage />
          },
          {
            path: 'playlists',
            element: <PlaylistPage label="deep" />
          },
          {
            path: 'submit',
            element: <SubmitPage label="deep" />
          },
          {
            path: 'legal',
            element: <LegalPage />
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

const App: React.FC = () => {
  return (
    <MuiThemeProvider>
      <CustomThemeProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
          <RouterProvider router={router} />
        </Box>
      </CustomThemeProvider>
    </MuiThemeProvider>
  );
};

export default App;
