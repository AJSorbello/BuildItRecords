const bcrypt = require('bcryptjs');

const password = 'admin123';

bcrypt.hash(password, 10).then(hash => {
  console.log('Use this hash in your .env file:');
  console.log(hash);
});
