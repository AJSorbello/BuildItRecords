"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArtistsByLabel = exports.artists = void 0;
exports.artists = [
    // Build It Records Artists
    {
        id: '1',
        name: 'AJ Sorbello',
        label: 'records',
        genres: ['House', 'Tech House'],
        spotifyUrl: 'https://open.spotify.com/artist/ajsorbello',
        beatportUrl: 'https://www.beatport.com/artist/aj-sorbello/123456',
        soundcloudUrl: 'https://soundcloud.com/ajsorbello'
    },
    {
        id: '2',
        name: 'DJ Kue',
        label: 'records',
        genres: ['House', 'Tech House'],
        spotifyUrl: 'https://open.spotify.com/artist/djkue',
        beatportUrl: 'https://www.beatport.com/artist/dj-kue/123457',
        soundcloudUrl: 'https://soundcloud.com/djkue'
    },
    {
        id: '3',
        name: 'DJ PP',
        label: 'records',
        genres: ['House', 'Tech House'],
        spotifyUrl: 'https://open.spotify.com/artist/djpp',
        beatportUrl: 'https://www.beatport.com/artist/dj-pp/123458',
        soundcloudUrl: 'https://soundcloud.com/djpp'
    },
    // Build It Tech Artists
    {
        id: '4',
        name: 'Matt Sassari',
        label: 'tech',
        genres: ['Techno', 'Tech House'],
        spotifyUrl: 'https://open.spotify.com/artist/mattsassari',
        beatportUrl: 'https://www.beatport.com/artist/matt-sassari/123459',
        soundcloudUrl: 'https://soundcloud.com/mattsassari'
    },
    {
        id: '5',
        name: 'Ronnie Spiteri',
        label: 'tech',
        genres: ['Techno', 'Tech House'],
        spotifyUrl: 'https://open.spotify.com/artist/ronniespiteri',
        beatportUrl: 'https://www.beatport.com/artist/ronnie-spiteri/123460',
        soundcloudUrl: 'https://soundcloud.com/ronniespiteri'
    },
    {
        id: '6',
        name: 'Marco Bailey',
        label: 'tech',
        genres: ['Techno'],
        spotifyUrl: 'https://open.spotify.com/artist/marcobailey',
        beatportUrl: 'https://www.beatport.com/artist/marco-bailey/123461',
        soundcloudUrl: 'https://soundcloud.com/marcobailey'
    },
    // Build It Deep Artists
    {
        id: '7',
        name: 'Darius Syrossian',
        label: 'deep',
        genres: ['Deep House', 'Tech House'],
        spotifyUrl: 'https://open.spotify.com/artist/dariussyrossian',
        beatportUrl: 'https://www.beatport.com/artist/darius-syrossian/123462',
        soundcloudUrl: 'https://soundcloud.com/dariussyrossian'
    },
    {
        id: '8',
        name: 'Sidney Charles',
        label: 'deep',
        genres: ['Deep House', 'Tech House'],
        spotifyUrl: 'https://open.spotify.com/artist/sidneycharles',
        beatportUrl: 'https://www.beatport.com/artist/sidney-charles/123463',
        soundcloudUrl: 'https://soundcloud.com/sidneycharles'
    },
    {
        id: '9',
        name: 'Seb Zito',
        label: 'deep',
        genres: ['Deep House', 'Tech House'],
        spotifyUrl: 'https://open.spotify.com/artist/sebzito',
        beatportUrl: 'https://www.beatport.com/artist/seb-zito/123464',
        soundcloudUrl: 'https://soundcloud.com/sebzito'
    }
];
const getArtistsByLabel = (label) => {
    return exports.artists.filter(artist => artist.label === label);
};
exports.getArtistsByLabel = getArtistsByLabel;
