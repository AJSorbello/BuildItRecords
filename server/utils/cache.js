const Redis = require('ioredis');
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

const CACHE_TTL = {
    SHORT: 60 * 60,     // 1 hour
    MEDIUM: 24 * 60 * 60, // 24 hours
    LONG: 7 * 24 * 60 * 60 // 7 days
};

const getCacheTTL = (path) => {
    if (path.includes('/search')) return CACHE_TTL.SHORT;
    if (path.includes('/artists')) return CACHE_TTL.MEDIUM;
    if (path.includes('/tracks')) return CACHE_TTL.MEDIUM;
    return CACHE_TTL.SHORT;
};

const cacheMiddleware = async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const redisService = req.app.get('redisService');
    if (!redisService) {
        console.warn('Redis service not available');
        return next();
    }

    const cacheKey = `api:${req.originalUrl}`;
    try {
        const cachedData = await redisService.getCacheByLabel(cacheKey);
        if (cachedData) {
            console.log(`Cache hit for: ${req.originalUrl}`);
            return res.set('X-Data-Source', 'cache').json(cachedData);
        }
        
        // Store original json method
        const originalJson = res.json;
        
        // Override json method to cache response
        res.json = function(data) {
            const ttl = getCacheTTL(req.path);
            redisService.setCacheWithLabel(cacheKey, data, 'api')
                .catch(err => console.error('Failed to cache response:', err));
            
            return originalJson.call(this, data);
        };
        
        next();
    } catch (error) {
        console.error('Cache middleware error:', error);
        next();
    }
};

const clearCache = async (pattern) => {
    const redisService = req.app.get('redisService');
    if (!redisService) {
        console.warn('Redis service not available');
        return;
    }

    try {
        await redisService.clearCache();
        console.log(`Cache cleared for pattern: ${pattern}`);
    } catch (error) {
        console.error('Failed to clear cache:', error);
        throw error;
    }
};

module.exports = {
    redis,
    cacheMiddleware,
    clearCache
};
