"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.NotFoundError = exports.AuthenticationError = exports.ValidationError = exports.SpotifyApiError = exports.DatabaseApiError = void 0;
class DatabaseApiError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseApiError';
    }
}
exports.DatabaseApiError = DatabaseApiError;
class SpotifyApiError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SpotifyApiError';
    }
}
exports.SpotifyApiError = SpotifyApiError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
