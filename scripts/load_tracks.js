require('dotenv').config();
const axios = require('axios');
const Redis = require('redis');

const RECORD_LABELS = {
    RECORDS: 'Build It Records',
    TECH: 'Build It Tech',
    DEEP: 'Build It Deep'
};

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSpotifyToken(clientId, clientSecret) {
    try {
        const tokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'client_credentials'
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(
                        `${clientId}:${clientSecret}`
                    ).toString('base64')}`
                }
            }
        );
        return tokenResponse.data.access_token;
    } catch (error) {
        console.error('Error getting Spotify token:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

async function searchLabelReleases(label, accessToken) {
    const tracks = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await axios.get(
                'https://api.spotify.com/v1/search',
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    params: {
                        q: `label:"${label}"`,
                        type: 'track',
                        offset,
                        limit,
                        market: 'US'
                    }
                }
            );

            const items = response.data.tracks.items;
            if (items && items.length > 0) {
                tracks.push(...items);
            }

            // Check if we've reached the end
            if (!items || items.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
                console.log(`Fetched ${tracks.length} tracks so far...`);
                await delay(100); // Rate limiting
            }
        } catch (error) {
            console.error(`Error searching tracks at offset ${offset}:`, error.message);
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'] || 1;
                console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
                await delay(retryAfter * 1000);
                continue;
            }
            break;
        }
    }

    return tracks;
}

async function processTracks(tracks, client, label) {
    console.log(`\nProcessing ${tracks.length} tracks for ${label}`);
    const results = {
        success: [],
        failed: []
    };

    for (const track of tracks) {
        try {
            const trackData = {
                id: track.id,
                name: track.name,
                artists: track.artists.map(artist => ({
                    id: artist.id,
                    name: artist.name
                })),
                album: {
                    id: track.album.id,
                    name: track.album.name,
                    images: track.album.images,
                    release_date: track.album.release_date
                },
                duration_ms: track.duration_ms,
                popularity: track.popularity,
                preview_url: track.preview_url,
                external_urls: track.external_urls,
                label,
                cached_at: Date.now()
            };

            await client.set(`track:${track.id}`, JSON.stringify(trackData));
            await client.expire(`track:${track.id}`, 24 * 60 * 60); // 24 hours TTL
            results.success.push(track.id);
            console.log(`Cached: ${track.name}`);
        } catch (error) {
            results.failed.push({ id: track.id, error: error.message });
            console.error(`Failed: ${track.id} - ${error.message}`);
        }
        await delay(100); // Rate limiting
    }

    return results;
}

async function loadTracks() {
    const client = Redis.createClient();
    let accessToken;
    
    try {
        await client.connect();
        console.log('Connected to Redis');

        const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Missing Spotify credentials in environment variables');
        }

        console.log('Authenticating with Spotify...');
        accessToken = await getSpotifyToken(clientId, clientSecret);
        console.log('Successfully authenticated with Spotify');

        const results = {
            success: [],
            failed: []
        };

        // Process each record label
        for (const [key, label] of Object.entries(RECORD_LABELS)) {
            console.log(`\nSearching for releases from ${label}`);
            const tracks = await searchLabelReleases(label, accessToken);
            console.log(`Found ${tracks.length} tracks for ${label}`);

            const labelResults = await processTracks(tracks, client, label);
            results.success.push(...labelResults.success);
            results.failed.push(...labelResults.failed);

            // Add delay between labels
            if (key !== Object.keys(RECORD_LABELS).slice(-1)[0]) {
                console.log('\nWaiting before processing next label...');
                await delay(2000);
            }
        }

        // Print summary
        console.log('\n=== Final Summary ===');
        console.log(`Successfully cached: ${results.success.length} tracks`);
        console.log(`Failed to cache: ${results.failed.length} tracks`);

        if (results.failed.length > 0) {
            console.log('\nFailed tracks:');
            results.failed.forEach(({ id, error }) => {
                console.log(`- ${id}: ${error}`);
            });
        }

        // Verify Redis contents
        const keys = await client.keys('track:*');
        console.log(`\nTotal tracks in Redis: ${keys.length}`);

        if (keys.length > 0) {
            const sampleKey = keys[0];
            const sampleData = await client.get(sampleKey);
            console.log('\nSample track data:');
            console.log(JSON.parse(sampleData));
        }

    } catch (error) {
        console.error('Fatal error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    } finally {
        await client.quit();
        console.log('\nRedis connection closed');
    }
}

loadTracks().catch(console.error);
