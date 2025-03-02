/// <reference types="bun-types" />
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { join } from "path";
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { logger } from 'hono/logger';

// Load environment variables from .env file
config();

const app = new Hono();
const projectRoot = process.cwd();
const publicDir = join(projectRoot, 'public');
const port = 3001; // Backend API port

console.log('Backend API server starting');
console.log('Project root:', projectRoot);
console.log('Public dir:', publicDir);

// Enable logger
app.use('*', logger());

// Enable CORS for frontend
app.use('*', cors({
  origin: 'http://localhost:3000', // Allow frontend origin
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
}));

// Serve public assets (images, etc)
app.use('/public/*', serveStatic({ root: projectRoot }));

// API routes
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Add mock data for development
import type { Release } from './src/types/release';
import type { Track } from './src/types/track';

// Mock data for admin dashboard
const mockReleases: Release[] = [
  {
    id: '1',
    name: 'Deep Vibes Vol. 1',
    type: 'album',
    artists: [{
      id: '1', name: 'Various Artists', type: 'artist',
      uri: '',
      external_urls: undefined
    }],
    tracks: [{ id: '101', name: 'Deep Track 1', uri: 'spotify:track:101' }],
    images: [{ url: '/public/img/BuildIt_Deep_Square-ee43402b821ccce3.png', height: 300, width: 300 }],
    release_date: '2025-01-15',
    release_date_precision: 'day',
    total_tracks: 10,
    external_urls: { spotify: 'https://open.spotify.com/album/1' },
    uri: 'spotify:album:1',
    spotify_uri: 'spotify:album:1',
    label: 'buildit-deep',
    album_type: 'compilation'
  }
];

const mockTracks: Track[] = [
  {
    id: '101',
    name: 'Deep Track 1',
    title: 'Deep Track 1',
    duration_ms: 180000,
    duration: 180000,
    track_number: 1,
    disc_number: 1,
    artists: [{
      id: '1', name: 'Deep Artist', type: 'artist',
      uri: '',
      external_urls: undefined
    }],
    uri: 'spotify:track:101',
    external_urls: { spotify: 'https://open.spotify.com/track/101' },
    preview_url: 'https://audio-sample.spotify.com/101',
    label_id: 'buildit-deep'
  }
];

// Admin authentication
app.post('/api/admin/login', async (c) => {
  const body = await c.req.json();
  const { username, password } = body;
  
  console.log(`Login attempt for username: ${username}`);
  
  // Check credentials (in a real app, you'd use secure auth)
  if (username === 'admin' && password === 'admin') {
    // Generate a simple token (in a real app, use JWT or secure tokens)
    const token = 'admin-token-' + Date.now();
    return c.json({
      success: true,
      token,
      user: {
        id: 1,
        username: 'admin',
        role: 'admin'
      }
    });
  } else {
    return c.json({
      success: false,
      message: 'Invalid credentials'
    }, 401);
  }
});

// Verify admin token
app.get('/api/admin/verify-token', async (c) => {
  // In a real app, you'd verify the token from the Authorization header
  // Here we just return success for demonstration purposes
  return c.json({
    verified: true
  });
});

// Admin dashboard statistics
app.get('/api/admin/stats', async (c) => {
  // In a real app, you'd verify the admin token before returning data
  return c.json({
    totalReleases: mockReleases.length,
    totalTracks: mockTracks.length,
    recentReleases: mockReleases.slice(0, 5),
    recentTracks: mockTracks.slice(0, 5)
  });
});

// Add API endpoints
app.get('/api/labels/:labelId/releases', (c) => {
  const labelId = c.req.param('labelId');
  console.log(`Getting releases for label: ${labelId}`);
  return c.json({ 
    releases: mockReleases.filter(r => r.label === labelId),
    totalReleases: mockReleases.filter(r => r.label === labelId).length 
  });
});

app.get('/api/labels/:labelId/tracks', (c) => {
  const labelId = c.req.param('labelId');
  console.log(`Getting tracks for label: ${labelId}`);
  
  // Map each track to ensure it has both duration and duration_ms properties
  const processedTracks = mockTracks.filter(t => t.label_id === labelId).map(track => {
    // Ensure both duration and duration_ms are properly set
    return {
      ...track,
      duration_ms: track.duration_ms || (track.duration ? track.duration * 1000 : 0),
      duration: track.duration || (track.duration_ms ? track.duration_ms / 1000 : 0)
    };
  });
  
  return c.json({ 
    tracks: processedTracks,
    total: processedTracks.length 
  });
});

app.post('/api/admin/import/spotify', async (c) => {
  console.log('Importing tracks from Spotify');
  return c.json({ 
    success: true, 
    message: 'Tracks imported successfully',
    tracks: mockTracks 
  });
});

console.log(`Backend API server starting on port ${port}...`);
export default {
  port,
  fetch: app.fetch
};
