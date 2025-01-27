const Redis = require('redis');

async function checkRedisContents() {
    const client = Redis.createClient();
    
    try {
        await client.connect();
        console.log('Connected to Redis');

        // Get all keys
        const keys = await client.keys('*');
        console.log(`\nTotal keys in Redis: ${keys.length}`);

        if (keys.length > 0) {
            // Group keys by prefix
            const keyGroups = keys.reduce((acc, key) => {
                const prefix = key.split(':')[0];
                acc[prefix] = (acc[prefix] || 0) + 1;
                return acc;
            }, {});

            console.log('\nKeys by prefix:');
            Object.entries(keyGroups).forEach(([prefix, count]) => {
                console.log(`${prefix}: ${count} keys`);
            });

            // Sample a few keys from each prefix
            console.log('\nSample data from each prefix:');
            for (const prefix of Object.keys(keyGroups)) {
                const sampleKeys = keys.filter(k => k.startsWith(prefix)).slice(0, 1);
                for (const key of sampleKeys) {
                    try {
                        // Try JSON.GET first
                        let value = await client.json.get(key);
                        if (!value) {
                            // If JSON.GET fails, try regular GET
                            value = await client.get(key);
                        }
                        console.log(`\n${key}:`);
                        console.log(JSON.stringify(value, null, 2));
                    } catch (error) {
                        console.log(`Error reading ${key}:`, error.message);
                    }
                }
            }
        } else {
            console.log('Redis database is empty');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.quit();
    }
}

checkRedisContents().catch(console.error);
