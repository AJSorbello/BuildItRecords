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
exports.login = exports.getImportDetails = exports.startImport = exports.getImportLogs = void 0;
const config_1 = require("../config");
const getImportLogs = (token, params) => __awaiter(void 0, void 0, void 0, function* () {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value)
            queryParams.append(key, value.toString());
    });
    const response = yield fetch(`${config_1.API_URL}/admin/imports?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch import logs');
    }
    return response.json();
});
exports.getImportLogs = getImportLogs;
const startImport = (token, labelId) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${config_1.API_URL}/admin/imports/${labelId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to start import');
    }
});
exports.startImport = startImport;
const getImportDetails = (token, type, spotifyId) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${config_1.API_URL}/admin/imports/${type}/${spotifyId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch import details');
    }
    return response.json();
});
exports.getImportDetails = getImportDetails;
const login = (credentials) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${config_1.API_URL}/admin/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    if (!response.ok) {
        throw new Error('Invalid credentials');
    }
    return response.json();
});
exports.login = login;
