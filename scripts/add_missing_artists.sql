-- Add missing artists
INSERT INTO artists (
    id,
    name,
    image_url,
    bio,
    spotify_url,
    monthly_listeners,
    label_id,
    created_at,
    updated_at
) VALUES (
    'john-okins', -- We'll need to update this with the actual Spotify ID once we have it
    'John Okins',
    '', -- We'll need to update this with the actual image URL
    '',
    '', -- We'll need to update this with the actual Spotify URL
    0,
    'buildit-records',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
