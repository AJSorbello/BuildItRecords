const clientId = '4fbf1324f46d4aa78e1533048cda96b5';
const clientSecret = 'b3b096fa2e51458993cb9e381ed25f38';

const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

console.log('Authorization header for Postman:');
console.log(`Basic ${authString}`);

// Instructions for Postman:
console.log('\nIn Postman:');
console.log('1. Create a POST request to: https://accounts.spotify.com/api/token');
console.log('2. Add header: Authorization: Basic [above string]');
console.log('3. Add body (x-www-form-urlencoded):');
console.log('   grant_type: client_credentials');
