const http = require('http');

const options = {
  hostname: 'localhost',
  port: 7050,
  path: '/api/auth/check-auth',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  process.exit(0);
});

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
  process.exit(1);
});

req.end();
