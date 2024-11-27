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

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/records" replace />} />
      
      {/* Records Routes */}
      <Route path="/records" element={<Layout />}>
        <Route index element={<HomePage label="records" />} />
        <Route path="releases" element={<ReleasesPage label="records" />} />
        <Route path="artists" element={<ArtistsPage label="records" />} />
        <Route path="playlists" element={<PlaylistsPage label="records" />} />
        <Route path="submit" element={<SubmitPage label="records" />} />
      </Route>

      {/* Tech Routes */}
      <Route path="/tech" element={<Layout />}>
        <Route index element={<HomePage label="tech" />} />
        <Route path="releases" element={<ReleasesPage label="tech" />} />
        <Route path="artists" element={<ArtistsPage label="tech" />} />
        <Route path="playlists" element={<PlaylistsPage label="tech" />} />
        <Route path="submit" element={<SubmitPage label="tech" />} />
      </Route>

      {/* Deep Routes */}
      <Route path="/deep" element={<Layout />}>
        <Route index element={<HomePage label="deep" />} />
        <Route path="releases" element={<ReleasesPage label="deep" />} />
        <Route path="artists" element={<ArtistsPage label="deep" />} />
        <Route path="playlists" element={<PlaylistsPage label="deep" />} />
        <Route path="submit" element={<SubmitPage label="deep" />} />
      </Route>

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

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

export default App;
