const Redis = require('redis');

async function checkRedisTracks() {
    const client = Redis.createClient();
    
    try {
        await client.connect();
        console.log('Connected to Redis');

        // Get all keys matching track:*
        const keys = await client.keys('track:*');
        console.log(`Found ${keys.length} tracks in Redis`);

        if (keys.length > 0) {
            // Get a sample track to examine the data structure
            const sampleKey = keys[0];
            const sampleTrack = await client.json.get(sampleKey);
            console.log('\nSample track data structure:');
            console.log(JSON.stringify(sampleTrack, null, 2));

            // Count tracks with complete information
            let completeCount = 0;
            let incompleteCount = 0;
            let missingFields = new Set();

            for (const key of keys) {
                const track = await client.json.get(key);
                
                // Check for required fields
                const requiredFields = ['id', 'name', 'artists', 'album', 'duration_ms', 'popularity'];
                const missingFieldsForTrack = requiredFields.filter(field => !track || !track[field]);
                
                if (missingFieldsForTrack.length === 0) {
                    completeCount++;
                } else {
                    incompleteCount++;
                    missingFieldsForTrack.forEach(field => missingFields.add(field));
                }
            }

            console.log('\nTrack Statistics:');
            console.log(`Complete tracks: ${completeCount}`);
            console.log(`Incomplete tracks: ${incompleteCount}`);
            
            if (missingFields.size > 0) {
                console.log('\nCommonly missing fields:');
                console.log(Array.from(missingFields).join(', '));
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.quit();
    }
}

checkRedisTracks().catch(console.error);
