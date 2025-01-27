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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiService = void 0;
const axios_1 = __importDefault(require("axios"));
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
class ApiService {
    constructor() {
        // Remove trailing slash if present
        this.baseUrl = API_BASE_URL.replace(/\/$/, '');
    }
    static getInstance() {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }
    request(endpoint, config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Remove any leading slashes and ensure no double slashes
                const cleanEndpoint = endpoint.replace(/^\/+/, '');
                const url = `${this.baseUrl}/${cleanEndpoint}`;
                console.log('Making API request to:', url);
                const response = yield (0, axios_1.default)(Object.assign(Object.assign({}, config), { url }));
                return response.data;
            }
            catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        });
    }
    // Labels
    getLabels() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('labels');
        });
    }
    // Artists
    getArtists(params = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryParams = new URLSearchParams();
            if (params.label)
                queryParams.set('label', params.label);
            if (params.search)
                queryParams.set('search', params.search);
            const queryString = queryParams.toString();
            return this.request(`artists${queryString ? `?${queryString}` : ''}`);
        });
    }
    getArtistById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`artists/${id}`);
        });
    }
    // Releases
    getReleases(params = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryParams = new URLSearchParams();
            if (params.artistId)
                queryParams.set('artistId', params.artistId);
            if (params.labelId)
                queryParams.set('labelId', params.labelId);
            const queryString = queryParams.toString();
            return this.request(`releases${queryString ? `?${queryString}` : ''}`);
        });
    }
    getReleaseById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`releases/${id}`);
        });
    }
    getReleasesByArtistId(artistId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getReleases({ artistId });
        });
    }
    getReleasesByLabelId(labelId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getReleases({ labelId });
        });
    }
    getReleasesByLabel(label) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryParams = new URLSearchParams();
            queryParams.set('label', this.getLabelPath(label));
            return this.request(`releases?${queryParams.toString()}`);
        });
    }
    // Search
    searchArtists(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`search/artists?q=${encodeURIComponent(query)}`);
        });
    }
    searchReleases(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`search/releases?q=${encodeURIComponent(query)}`);
        });
    }
    // Tracks
    getTracks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('tracks');
        });
    }
    getTracksByLabel(label) {
        return __awaiter(this, void 0, void 0, function* () {
            const labelPath = this.getLabelPath(label);
            return this.request(`${labelPath}/tracks`);
        });
    }
    getLabelPath(label) {
        // Map full label names to their API path segments
        const labelMap = {
            'Build It Records': 'records',
            'Build It Tech': 'tech',
            'Build It Deep': 'deep'
        };
        // First try to get the direct mapping
        if (labelMap[label]) {
            return labelMap[label];
        }
        // If it's already in the correct format (records, tech, deep), return as is
        if (['records', 'tech', 'deep'].includes(label.toLowerCase())) {
            return label.toLowerCase();
        }
        // Otherwise, try to normalize the input
        const normalized = label.toLowerCase()
            .replace(/build ?it ?/g, '')
            .replace(/-/g, '');
        // Map normalized names to correct paths
        const normalizedMap = {
            'records': 'records',
            'tech': 'tech',
            'deep': 'deep'
        };
        return normalizedMap[normalized] || normalized;
    }
}
exports.apiService = ApiService.getInstance();
