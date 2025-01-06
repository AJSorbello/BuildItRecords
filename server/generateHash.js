const bcrypt = require('bcryptjs');

// Set a simple password for testing
const password = 'admin123';

async function generateHash() {
    try {
        const salt = await bcrypt.genSalt(10);
        console.log('Salt generated:', salt);

        const hash = await bcrypt.hash(password, salt);
        console.log('\nPassword:', password);
        console.log('Generated hash:', hash);

        // Verify the hash works
        const isValid = await bcrypt.compare(password, hash);
        console.log('\nHash verification:', isValid ? 'SUCCESSFUL' : 'FAILED');

        console.log('\nAdd these to your .env file:');
        console.log('ADMIN_USERNAME=admin');
        console.log(`ADMIN_PASSWORD_HASH=${hash}`);
        console.log('JWT_SECRET=buildit_records_jwt_secret_key');
    } catch (error) {
        console.error('Error generating hash:', error);
    }
}

generateHash();
