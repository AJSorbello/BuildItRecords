-- Insert test artists
INSERT INTO artists (id, name, images, genres, external_urls, followers, popularity, "labelId")
SELECT 
    'artist1', 
    'Test Artist 1', 
    '[{"url": "https://example.com/image1.jpg", "width": 640, "height": 640}]'::jsonb,
    ARRAY['house', 'techno'],
    '{"spotify": "https://open.spotify.com/artist/1", "beatport": "https://beatport.com/artist/1"}'::jsonb,
    1000,
    80,
    l.id
FROM labels l WHERE l.slug = 'buildit-records'
UNION ALL
SELECT 
    'artist2',
    'Test Artist 2',
    '[{"url": "https://example.com/image2.jpg", "width": 640, "height": 640}]'::jsonb,
    ARRAY['tech house', 'minimal'],
    '{"spotify": "https://open.spotify.com/artist/2", "beatport": "https://beatport.com/artist/2"}'::jsonb,
    2000,
    75,
    l.id
FROM labels l WHERE l.slug = 'buildit-tech'
UNION ALL
SELECT 
    'artist3',
    'Test Artist 3',
    '[{"url": "https://example.com/image3.jpg", "width": 640, "height": 640}]'::jsonb,
    ARRAY['deep house', 'progressive'],
    '{"spotify": "https://open.spotify.com/artist/3", "beatport": "https://beatport.com/artist/3"}'::jsonb,
    3000,
    90,
    l.id
FROM labels l WHERE l.slug = 'buildit-deep'
ON CONFLICT (id) DO NOTHING;

-- Insert test albums
INSERT INTO albums (id, name, "artistId", "labelId", images, release_date, total_tracks, external_urls, popularity)
SELECT 
    'album1',
    'Test Album 1',
    'artist1',
    l.id,
    '[{"url": "https://example.com/album1.jpg", "width": 640, "height": 640}]'::jsonb,
    DATE '2023-12-01',
    12,
    '{"spotify": "https://open.spotify.com/album/1", "beatport": "https://beatport.com/release/1", "soundcloud": "https://soundcloud.com/release/1"}'::jsonb,
    80
FROM labels l WHERE l.slug = 'buildit-records'
UNION ALL
SELECT 
    'album2',
    'Test Album 2',
    'artist2',
    l.id,
    '[{"url": "https://example.com/album2.jpg", "width": 640, "height": 640}]'::jsonb,
    DATE '2023-12-15',
    10,
    '{"spotify": "https://open.spotify.com/album/2", "beatport": "https://beatport.com/release/2", "soundcloud": "https://soundcloud.com/release/2"}'::jsonb,
    75
FROM labels l WHERE l.slug = 'buildit-tech'
UNION ALL
SELECT 
    'album3',
    'Test Album 3',
    'artist3',
    l.id,
    '[{"url": "https://example.com/album3.jpg", "width": 640, "height": 640}]'::jsonb,
    DATE '2023-12-30',
    8,
    '{"spotify": "https://open.spotify.com/album/3", "beatport": "https://beatport.com/release/3", "soundcloud": "https://soundcloud.com/release/3"}'::jsonb,
    90
FROM labels l WHERE l.slug = 'buildit-deep'
ON CONFLICT (id) DO NOTHING;

-- Insert test tracks
INSERT INTO tracks (id, name, "albumId", "artistId", duration_ms, preview_url, external_urls, uri)
VALUES 
    ('track1', 'Test Track 1', 'album1', 'artist1', 180000, 'https://example.com/preview1.mp3',
     '{"spotify": "https://open.spotify.com/track/1", "beatport": "https://beatport.com/track/1"}'::jsonb,
     'spotify:track:1'),
    ('track2', 'Test Track 2', 'album2', 'artist2', 200000, 'https://example.com/preview2.mp3',
     '{"spotify": "https://open.spotify.com/track/2", "beatport": "https://beatport.com/track/2"}'::jsonb,
     'spotify:track:2'),
    ('track3', 'Test Track 3', 'album3', 'artist3', 220000, 'https://example.com/preview3.mp3',
     '{"spotify": "https://open.spotify.com/track/3", "beatport": "https://beatport.com/track/3"}'::jsonb,
     'spotify:track:3')
ON CONFLICT (id) DO NOTHING;

-- Insert artist-label associations
INSERT INTO artist_labels ("artistId", "labelId")
SELECT 'artist1', l.id
FROM labels l WHERE l.slug = 'buildit-records'
UNION ALL
SELECT 'artist2', l.id
FROM labels l WHERE l.slug = 'buildit-tech'
UNION ALL
SELECT 'artist3', l.id
FROM labels l WHERE l.slug = 'buildit-deep'
ON CONFLICT DO NOTHING;
