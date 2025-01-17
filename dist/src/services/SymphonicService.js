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
Object.defineProperty(exports, "__esModule", { value: true });
const labels_1 = require("../constants/labels");
class SymphonicService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.symphonic.com/v1'; // Replace with actual Symphonic API URL
    }
    getAllReleases(page = 1, limit = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let allReleases = [];
                let hasMore = true;
                while (hasMore) {
                    const response = yield fetch(`${this.baseUrl}/releases?page=${page}&limit=${limit}`, {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch releases');
                    }
                    const data = yield response.json();
                    const releases = this.transformReleases(data.releases);
                    allReleases = [...allReleases, ...releases];
                    // Check if there are more pages
                    hasMore = data.has_more || data.next_page;
                    page++;
                    // Add delay between requests to avoid rate limiting
                    yield this.delay(1000);
                }
                return allReleases;
            }
            catch (error) {
                console.error('Error fetching all releases:', error);
                return [];
            }
        });
    }
    syncReleases() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the last sync timestamp from local storage
                const lastSync = localStorage.getItem('lastSyncTimestamp');
                const params = lastSync ? `?updated_after=${lastSync}` : '';
                const response = yield fetch(`${this.baseUrl}/releases/sync${params}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to sync releases');
                }
                const data = yield response.json();
                const releases = this.transformReleases(data.releases);
                // Store releases in local storage or your preferred storage solution
                yield this.storeReleases(releases);
                // Update last sync timestamp
                localStorage.setItem('lastSyncTimestamp', new Date().toISOString());
            }
            catch (error) {
                console.error('Error syncing releases:', error);
            }
        });
    }
    transformReleases(releases) {
        return releases.map(item => {
            var _a, _b, _c;
            return ({
                id: item.id,
                title: item.title,
                artist: item.artist,
                artwork: item.artwork_url,
                releaseDate: new Date(item.release_date).toISOString().split('T')[0],
                tracks: item.tracks.map(track => ({
                    id: track.id,
                    trackTitle: track.title,
                    artist: track.artist,
                    albumCover: item.artwork_url,
                    album: {
                        name: item.title,
                        releaseDate: new Date(item.release_date).toISOString().split('T')[0],
                        images: [{
                                url: item.artwork_url,
                                height: 640,
                                width: 640
                            }]
                    },
                    recordLabel: this.determineLabel(item.label_name),
                    previewUrl: track.preview_url || null,
                    spotifyUrl: track.spotify_id ? `https://open.spotify.com/track/${track.spotify_id}` : '',
                    releaseDate: new Date(item.release_date).toISOString().split('T')[0],
                    beatportUrl: '',
                    soundcloudUrl: ''
                })),
                label: this.determineLabel(item.label_name),
                spotifyUrl: ((_a = item.stores) === null || _a === void 0 ? void 0 : _a.spotify) || '',
                beatportUrl: ((_b = item.stores) === null || _b === void 0 ? void 0 : _b.beatport) || '',
                soundcloudUrl: ((_c = item.stores) === null || _c === void 0 ? void 0 : _c.soundcloud) || ''
            });
        });
    }
    storeReleases(releases) {
        return __awaiter(this, void 0, void 0, function* () {
            // Store in IndexedDB for web or AsyncStorage for mobile
            try {
                const storage = window.localStorage;
                const existingReleases = JSON.parse(storage.getItem('releases') || '[]');
                // Merge new releases with existing ones, avoiding duplicates
                const mergedReleases = [...existingReleases];
                releases.forEach(release => {
                    const index = mergedReleases.findIndex(r => r.id === release.id);
                    if (index >= 0) {
                        mergedReleases[index] = release;
                    }
                    else {
                        mergedReleases.push(release);
                    }
                });
                storage.setItem('releases', JSON.stringify(mergedReleases));
            }
            catch (error) {
                console.error('Error storing releases:', error);
            }
        });
    }
    determineLabel(labelName) {
        const normalizedName = labelName.toLowerCase();
        if (normalizedName.includes('tech')) {
            return labels_1.RECORD_LABELS['buildit-tech'];
        }
        else if (normalizedName.includes('deep')) {
            return labels_1.RECORD_LABELS['buildit-deep'];
        }
        return labels_1.RECORD_LABELS['buildit-records'];
    }
    delay(ms) {
        return new Promise(resolve => {
            const timeoutId = window.setTimeout(resolve, ms);
            return () => window.clearTimeout(timeoutId);
        });
    }
}
exports.default = SymphonicService;
