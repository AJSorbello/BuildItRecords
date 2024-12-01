const Redis = require('ioredis');
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

const CACHE_TTL = 3600; // 1 hour in seconds

const cacheMiddleware = async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = `spotify:${req.originalUrl}`;
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
        
        // Modify res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
            redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
            return originalJson.call(this, data);
        };
        
        next();
    } catch (error) {
        console.error('Cache error:', error);
        next();
    }
};

const clearCache = async (pattern) => {
    const keys = await redis.keys(`spotify:${pattern}`);
    if (keys.length > 0) {
        await redis.del(keys);
    }
};

module.exports = {
    redis,
    cacheMiddleware,
    clearCache
};
