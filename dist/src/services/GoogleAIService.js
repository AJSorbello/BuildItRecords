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
exports.googleAIService = void 0;
class GoogleAIService {
    constructor() {
        this.apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY || '';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        if (!this.apiKey) {
            console.error('Google AI API key is not configured');
        }
    }
    generateContent(prompt) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requestBody = {
                    contents: [{
                            parts: [{
                                    text: prompt
                                }]
                        }]
                };
                const response = yield fetch(`${this.baseUrl}/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = yield response.json();
                return ((_b = (_a = data.candidates[0]) === null || _a === void 0 ? void 0 : _a.content.parts[0]) === null || _b === void 0 ? void 0 : _b.text) || '';
            }
            catch (error) {
                console.error('Error generating content:', error);
                throw error;
            }
        });
    }
}
exports.googleAIService = new GoogleAIService();
