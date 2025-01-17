"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const RedisService = require('../services/RedisService');
const sampleArtists = {
    'build it records': [
        {
            id: '1',
            name: 'DJ Cascade',
            recordLabel: 'build it records',
            image: 'https://example.com/djcascade.jpg',
            bio: 'Deep house and techno producer from San Francisco',
            spotifyUrl: 'https://open.spotify.com/artist/example1',
            soundcloudUrl: 'https://soundcloud.com/djcascade',
            beatportUrl: 'https://www.beatport.com/artist/djcascade',
            genre: 'deep-house'
        },
        {
            id: '2',
            name: 'TechFlow',
            recordLabel: 'build it records',
            image: 'https://example.com/techflow.jpg',
            bio: 'Underground techno artist pushing boundaries',
            spotifyUrl: 'https://open.spotify.com/artist/example2',
            soundcloudUrl: 'https://soundcloud.com/techflow',
            beatportUrl: 'https://www.beatport.com/artist/techflow',
            genre: 'techno'
        }
    ],
    'tech': [
        {
            id: '3',
            name: 'Binary Beats',
            recordLabel: 'tech',
            image: 'https://example.com/binarybeats.jpg',
            bio: 'Electronic music producer specializing in tech house',
            spotifyUrl: 'https://open.spotify.com/artist/example3',
            soundcloudUrl: 'https://soundcloud.com/binarybeats',
            beatportUrl: 'https://www.beatport.com/artist/binarybeats',
            genre: 'tech-house'
        },
        {
            id: '4',
            name: 'Digital Dreams',
            recordLabel: 'tech',
            image: 'https://example.com/digitaldreams.jpg',
            bio: 'Progressive house and techno fusion artist',
            spotifyUrl: 'https://open.spotify.com/artist/example4',
            soundcloudUrl: 'https://soundcloud.com/digitaldreams',
            beatportUrl: 'https://www.beatport.com/artist/digitaldreams',
            genre: 'techno'
        }
    ],
    'deep': [
        {
            id: '5',
            name: 'Deep Dive',
            recordLabel: 'deep',
            image: 'https://example.com/deepdive.jpg',
            bio: 'Deep house producer with melodic influences',
            spotifyUrl: 'https://open.spotify.com/artist/example5',
            soundcloudUrl: 'https://soundcloud.com/deepdive',
            beatportUrl: 'https://www.beatport.com/artist/deepdive',
            genre: 'deep-house'
        },
        {
            id: '6',
            name: 'Ocean Waves',
            recordLabel: 'deep',
            image: 'https://example.com/oceanwaves.jpg',
            bio: 'Atmospheric deep house and ambient producer',
            spotifyUrl: 'https://open.spotify.com/artist/example6',
            soundcloudUrl: 'https://soundcloud.com/oceanwaves',
            beatportUrl: 'https://www.beatport.com/artist/oceanwaves',
            genre: 'deep-house'
        }
    ]
};
const sampleTracks = {
    'build it records': [
        {
            id: '1',
            title: 'Digital Dreams',
            artist: 'DJ Cascade',
            recordLabel: 'build it records',
            releaseDate: '2024-01-15',
            spotifyUrl: 'https://open.spotify.com/track/example1',
            soundcloudUrl: 'https://soundcloud.com/djcascade/digital-dreams',
            beatportUrl: 'https://www.beatport.com/track/digital-dreams',
            genre: 'deep-house',
            artwork: 'https://example.com/artwork1.jpg'
        },
        {
            id: '2',
            title: 'Techno Revolution',
            artist: 'TechFlow',
            recordLabel: 'build it records',
            releaseDate: '2024-02-01',
            spotifyUrl: 'https://open.spotify.com/track/example2',
            soundcloudUrl: 'https://soundcloud.com/techflow/techno-revolution',
            beatportUrl: 'https://www.beatport.com/track/techno-revolution',
            genre: 'techno',
            artwork: 'https://example.com/artwork2.jpg'
        }
    ],
    'tech': [
        {
            id: '3',
            title: 'Code Sequence',
            artist: 'Binary Beats',
            recordLabel: 'tech',
            releaseDate: '2024-01-20',
            spotifyUrl: 'https://open.spotify.com/track/example3',
            soundcloudUrl: 'https://soundcloud.com/binarybeats/code-sequence',
            beatportUrl: 'https://www.beatport.com/track/code-sequence',
            genre: 'tech-house',
            artwork: 'https://example.com/artwork3.jpg'
        },
        {
            id: '4',
            title: 'Digital Fusion',
            artist: 'Digital Dreams',
            recordLabel: 'tech',
            releaseDate: '2024-02-10',
            spotifyUrl: 'https://open.spotify.com/track/example4',
            soundcloudUrl: 'https://soundcloud.com/digitaldreams/digital-fusion',
            beatportUrl: 'https://www.beatport.com/track/digital-fusion',
            genre: 'techno',
            artwork: 'https://example.com/artwork4.jpg'
        }
    ],
    'deep': [
        {
            id: '5',
            title: 'Ocean Floor',
            artist: 'Deep Dive',
            recordLabel: 'deep',
            releaseDate: '2024-01-25',
            spotifyUrl: 'https://open.spotify.com/track/example5',
            soundcloudUrl: 'https://soundcloud.com/deepdive/ocean-floor',
            beatportUrl: 'https://www.beatport.com/track/ocean-floor',
            genre: 'deep-house',
            artwork: 'https://example.com/artwork5.jpg'
        },
        {
            id: '6',
            title: 'Midnight Waves',
            artist: 'Ocean Waves',
            recordLabel: 'deep',
            releaseDate: '2024-02-15',
            spotifyUrl: 'https://open.spotify.com/track/example6',
            soundcloudUrl: 'https://soundcloud.com/oceanwaves/midnight-waves',
            beatportUrl: 'https://www.beatport.com/track/midnight-waves',
            genre: 'deep-house',
            artwork: 'https://example.com/artwork6.jpg'
        }
    ]
};
function loadSampleData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const redisService = new RedisService();
            yield redisService.init();
            console.log('Connected to Redis');
            // Load artists for each label
            for (const [label, artists] of Object.entries(sampleArtists)) {
                console.log(`Loading artists for ${label}...`);
                yield redisService.setArtistsForLabel(label, artists);
            }
            console.log('Artists loaded successfully');
            // Load tracks for each label
            for (const [label, tracks] of Object.entries(sampleTracks)) {
                console.log(`Loading tracks for ${label}...`);
                yield redisService.setTracksForLabel(label, tracks);
            }
            console.log('Tracks loaded successfully');
            process.exit(0);
        }
        catch (error) {
            console.error('Error loading sample data:', error);
            process.exit(1);
        }
    });
}
loadSampleData();
