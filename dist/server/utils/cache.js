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
const Redis = require('ioredis');
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});
const CACHE_TTL = 3600; // 1 hour in seconds
const cacheMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method !== 'GET')
        return next();
    const cacheKey = `spotify:${req.originalUrl}`;
    try {
        const cachedData = yield redis.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
        // Modify res.json to cache the response
        const originalJson = res.json;
        res.json = function (data) {
            redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
            return originalJson.call(this, data);
        };
        next();
    }
    catch (error) {
        console.error('Cache error:', error);
        next();
    }
});
const clearCache = (pattern) => __awaiter(void 0, void 0, void 0, function* () {
    const keys = yield redis.keys(`spotify:${pattern}`);
    if (keys.length > 0) {
        yield redis.del(keys);
    }
});
module.exports = {
    redis,
    cacheMiddleware,
    clearCache
};
