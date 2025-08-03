#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing Login API Endpoint');
console.log('=============================\n');

const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
};

console.log('📤 Sending login request...');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Method:', options.method);
console.log('Body:', loginData);
console.log();

const req = http.request(options, (res) => {
    console.log('📥 Response received:');
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log();

    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('📄 Response body:');
        console.log(responseData);
        console.log();

        if (res.statusCode === 200) {
            console.log('✅ Login API is working correctly!');
            try {
                const parsed = JSON.parse(responseData);
                console.log('📊 Parsed response:', JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('⚠️  Response is not valid JSON');
            }
        } else {
            console.log('❌ Login API returned an error');
        }
    });
});

req.on('error', (err) => {
    console.log('❌ Request failed:', err.message);
});

req.write(loginData);
req.end();
