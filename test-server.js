#!/usr/bin/env node

const http = require('http');

console.log('🔍 Server Connection Test');
console.log('========================\n');

// Test if server is running
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log('✅ Server is running!');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('\n📄 Response preview:');
        console.log(data.substring(0, 200) + '...');
        testLoginEndpoint();
    });
});

req.on('error', (err) => {
    console.log('❌ Server is not running!');
    console.log('Error:', err.message);
    console.log('\n🚀 To start the server:');
    console.log('   npm start');
    console.log('   OR');
    console.log('   node server.js');
});

req.end();

function testLoginEndpoint() {
    console.log('\n🔍 Testing login endpoint...');
    
    const loginData = JSON.stringify({
        username: 'admin',
        password: 'admin123'
    });
    
    const loginOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };
    
    const loginReq = http.request(loginOptions, (res) => {
        console.log(`✅ Login endpoint responded with status: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            console.log('\n📤 Login response:');
            try {
                const parsed = JSON.parse(responseData);
                console.log(JSON.stringify(parsed, null, 2));
                
                if (res.statusCode === 200) {
                    console.log('\n✅ Login endpoint is working correctly!');
                } else {
                    console.log('\n⚠️  Login failed but endpoint is responding');
                }
            } catch (e) {
                console.log('❌ Invalid JSON response:');
                console.log(responseData);
            }
        });
    });
    
    loginReq.on('error', (err) => {
        console.log('❌ Login endpoint error:', err.message);
    });
    
    loginReq.write(loginData);
    loginReq.end();
}
