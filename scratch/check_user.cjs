const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
console.log('--- .env content ---');
console.log(envContent);
