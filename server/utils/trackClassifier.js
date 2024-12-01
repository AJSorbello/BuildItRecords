const GENRE_MAPPINGS = {
    BUILD_IT_RECORDS: [
        'pop', 'rock', 'indie', 'alternative', 'punk', 'metal',
        'folk', 'singer-songwriter', 'reggae', 'world-music',
        'jazz', 'blues', 'soul', 'r-n-b', 'hip-hop', 'rap'
    ],
    BUILD_IT_TECH: [
        'electronic', 'techno', 'house', 'dance', 'edm', 'dubstep',
        'drum-and-bass', 'electro', 'trance', 'breakbeat',
        'garage', 'industrial', 'synthwave', 'electronica'
    ],
    BUILD_IT_DEEP: [
        'deep-house', 'tech-house', 'minimal-techno', 'progressive-house',
        'ambient-techno', 'dub-techno', 'detroit-techno', 'acid-house',
        'minimal', 'deep-tech', 'microhouse', 'dub', 'experimental'
    ]
};

// Advanced audio feature thresholds
const AUDIO_PROFILES = {
    BUILD_IT_DEEP: {
        energy: { max: 0.6 },
        instrumentalness: { min: 0.4 },
        acousticness: { max: 0.3 },
        valence: { max: 0.6 },
        tempo: { min: 115, max: 125 }
    },
    BUILD_IT_TECH: {
        energy: { min: 0.6 },
        instrumentalness: { min: 0.3 },
        acousticness: { max: 0.4 },
        tempo: { min: 120 }
    },
    BUILD_IT_RECORDS: {
        speechiness: { min: 0.1 },
        acousticness: { min: 0.2 }
    }
};

// Extract Spotify ID from URL
function extractSpotifyId(url) {
    const patterns = {
        track: /spotify\.com\/track\/([a-zA-Z0-9]+)/,
        album: /spotify\.com\/album\/([a-zA-Z0-9]+)/,
        artist: /spotify\.com\/artist\/([a-zA-Z0-9]+)/,
        playlist: /spotify\.com\/playlist\/([a-zA-Z0-9]+)/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
        const match = url.match(pattern);
        if (match) {
            return {
                type,
                id: match[1]
            };
        }
    }

    throw new Error('Invalid Spotify URL');
}

// Calculate genre score based on genre matches
function calculateGenreScore(normalizedGenres, labelGenres) {
    return normalizedGenres.reduce((score, genre) => {
        if (labelGenres.includes(genre)) {
            score += 1;
        }
        return score;
    }, 0) / normalizedGenres.length;
}

// Check if audio features match a profile
function matchesAudioProfile(audioFeatures, profile) {
    return Object.entries(profile).every(([feature, { min = -Infinity, max = Infinity }]) => {
        const value = audioFeatures[feature];
        return value >= min && value <= max;
    });
}

// Advanced track classification
function classifyTrack(audioFeatures, genres = [], additionalMetadata = {}) {
    // Normalize genres to lowercase and remove spaces
    const normalizedGenres = genres.map(g => g.toLowerCase().replace(/\s+/g, '-'));
    
    // Calculate genre scores for each label
    const genreScores = {
        BUILD_IT_DEEP: calculateGenreScore(normalizedGenres, GENRE_MAPPINGS.BUILD_IT_DEEP),
        BUILD_IT_TECH: calculateGenreScore(normalizedGenres, GENRE_MAPPINGS.BUILD_IT_TECH),
        BUILD_IT_RECORDS: calculateGenreScore(normalizedGenres, GENRE_MAPPINGS.BUILD_IT_RECORDS)
    };

    // Check audio profiles
    const audioMatches = {
        BUILD_IT_DEEP: matchesAudioProfile(audioFeatures, AUDIO_PROFILES.BUILD_IT_DEEP),
        BUILD_IT_TECH: matchesAudioProfile(audioFeatures, AUDIO_PROFILES.BUILD_IT_TECH),
        BUILD_IT_RECORDS: matchesAudioProfile(audioFeatures, AUDIO_PROFILES.BUILD_IT_RECORDS)
    };

    // Calculate final scores combining genre and audio features
    const finalScores = {
        BUILD_IT_DEEP: genreScores.BUILD_IT_DEEP * 0.6 + (audioMatches.BUILD_IT_DEEP ? 0.4 : 0),
        BUILD_IT_TECH: genreScores.BUILD_IT_TECH * 0.6 + (audioMatches.BUILD_IT_TECH ? 0.4 : 0),
        BUILD_IT_RECORDS: genreScores.BUILD_IT_RECORDS * 0.6 + (audioMatches.BUILD_IT_RECORDS ? 0.4 : 0)
    };

    // Additional rules based on metadata
    if (additionalMetadata.explicit) {
        finalScores.BUILD_IT_RECORDS += 0.1;
    }
    if (audioFeatures.tempo < 100) {
        finalScores.BUILD_IT_DEEP += 0.1;
    }

    // Find the label with the highest score
    const [label] = Object.entries(finalScores)
        .sort(([, a], [, b]) => b - a)[0];

    return {
        label,
        confidence: finalScores[label],
        scores: finalScores
    };
}

// Enhanced track data formatting
function formatTrackData(trackData, audioFeatures, artistGenres = []) {
    const classification = classifyTrack(audioFeatures, artistGenres, {
        explicit: trackData.explicit
    });
    
    return {
        id: trackData.id,
        name: trackData.name,
        artists: trackData.artists.map(artist => ({
            id: artist.id,
            name: artist.name
        })),
        album: {
            id: trackData.album.id,
            name: trackData.album.name,
            images: trackData.album.images,
            release_date: trackData.album.release_date
        },
        duration_ms: trackData.duration_ms,
        preview_url: trackData.preview_url,
        explicit: trackData.explicit,
        popularity: trackData.popularity,
        label: classification.label,
        classification: {
            confidence: classification.confidence,
            scores: classification.scores
        },
        audioFeatures: {
            danceability: audioFeatures.danceability,
            energy: audioFeatures.energy,
            tempo: audioFeatures.tempo,
            instrumentalness: audioFeatures.instrumentalness,
            acousticness: audioFeatures.acousticness,
            valence: audioFeatures.valence,
            speechiness: audioFeatures.speechiness
        }
    };
}

module.exports = {
    extractSpotifyId,
    classifyTrack,
    formatTrackData,
    GENRE_MAPPINGS,
    AUDIO_PROFILES
};
