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
const axios = require('axios');
// Test track ID - using Daft Punk's "Get Lucky" as an example
const TEST_TRACK_ID = '2Foc5Q5nqNiosCNqttzHof';
const BASE_URL = 'http://localhost:3001';
function testEndpoints() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Testing single track endpoint...');
            const singleTrackResponse = yield axios.get(`${BASE_URL}/api/tracks/${TEST_TRACK_ID}`);
            console.log('\nSingle Track Response:');
            console.log(JSON.stringify(singleTrackResponse.data, null, 2));
            console.log('\nTesting batch tracks endpoint...');
            const batchTrackResponse = yield axios.post(`${BASE_URL}/api/tracks/batch`, {
                trackIds: [
                    '2Foc5Q5nqNiosCNqttzHof',
                    '3MrRksHupTVEQ7YbA0FsZK' // Billie Jean
                ]
            });
            console.log('\nBatch Tracks Response:');
            console.log(JSON.stringify(batchTrackResponse.data, null, 2));
        }
        catch (error) {
            console.error('Error during testing:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
testEndpoints();
