const Redis = require('redis');

async function testRedis() {
    const client = Redis.createClient({
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        }
    });

    try {
        await client.connect();
        console.log('Connected to Redis');

        // Test basic set/get
        await client.set('test_key', 'test_value');
        const value = await client.get('test_key');
        console.log('Test key value:', value);

        // Test JSON operations
        const testTrack = {
            id: 'test_id',
            name: 'Test Track',
            artists: [{ id: 'artist_id', name: 'Test Artist' }],
            album: {
                id: 'album_id',
                name: 'Test Album',
                images: []
            },
            duration_ms: 1000,
            popularity: 50
        };

        await client.json.set('track:test', '$', testTrack);
        const retrievedTrack = await client.json.get('track:test');
        console.log('\nTest track retrieved:', retrievedTrack);

        // Clean up test data
        await client.del('test_key');
        await client.del('track:test');

        console.log('\nRedis operations successful!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.quit();
    }
}

testRedis().catch(console.error);
