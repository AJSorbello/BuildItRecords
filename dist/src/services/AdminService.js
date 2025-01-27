"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
class AdminService {
    constructor() {
        this.api = axios_1.default.create({
            baseURL: `${API_URL}/admin`,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Add request interceptor to add token
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
    }
}
exports.default = new AdminService();
