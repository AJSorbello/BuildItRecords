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
exports.refreshCache = exports.clearData = void 0;
const config_1 = require("../config");
// Function to clear local storage data
const clearData = () => {
    // Keep authentication data
    const adminToken = localStorage.getItem('adminToken');
    const selectedLabel = localStorage.getItem('selectedLabel');
    // Clear all data
    localStorage.clear();
    // Restore authentication data
    if (adminToken)
        localStorage.setItem('adminToken', adminToken);
    if (selectedLabel)
        localStorage.setItem('selectedLabel', selectedLabel);
};
exports.clearData = clearData;
// Function to refresh data from database
const refreshCache = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Clear local data
        (0, exports.clearData)();
        // Call the server's database warmup endpoint
        const response = yield fetch(`${config_1.API_URL}/postgres/warmup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to refresh data');
        }
        return true;
    }
    catch (error) {
        console.error('Error refreshing data:', error);
        return false;
    }
});
exports.refreshCache = refreshCache;
