#!/usr/bin/env node

console.log('🔍 AttendSys Troubleshoot Tool');
console.log('==============================\n');

const fs = require('fs');
const path = require('path');
const http = require('http');

// Check 1: Required files
console.log('📁 Checking required files...');
const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'config/database.js',
    'public/login.html'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

// Check 2: Environment file
console.log('\n⚙️  Checking environment configuration...');
if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log('  ✅ .env file exists');
    console.log('  📋 Contents:');
    envContent.split('\n').forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
            console.log(`     ${line}`);
        }
    });
} else {
    console.log('  ❌ .env file missing');
    if (fs.existsSync('.env.example')) {
        console.log('  📋 Creating .env from .env.example...');
        fs.copyFileSync('.env.example', '.env');
        console.log('  ✅ .env file created');
    }
}

// Check 3: Dependencies
console.log('\n📦 Checking dependencies...');
if (fs.existsSync('node_modules')) {
    console.log('  ✅ node_modules exists');
    
    // Check critical modules
    const criticalModules = ['express', 'sqlite3', 'bcryptjs'];
    criticalModules.forEach(module => {
        const exists = fs.existsSync(path.join('node_modules', module));
        console.log(`  ${exists ? '✅' : '❌'} ${module}`);
    });
} else {
    console.log('  ❌ node_modules missing');
    console.log('  💡 Run: npm install');
}

// Check 4: Database
console.log('\n🗄️  Checking database...');
if (fs.existsSync('database')) {
    console.log('  ✅ database directory exists');
    if (fs.existsSync('database/attendance.db')) {
        const stats = fs.statSync('database/attendance.db');
        console.log(`  ✅ attendance.db exists (${stats.size} bytes)`);
    } else {
        console.log('  ⚠️  attendance.db not found (will be created on first run)');
    }
} else {
    console.log('  ❌ database directory missing');
    fs.mkdirSync('database', { recursive: true });
    console.log('  ✅ database directory created');
}

// Check 5: Server connectivity
console.log('\n🌐 Checking server connectivity...');
const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 5000
}, (res) => {
    console.log('  ✅ Server is running and responding!');
    console.log(`  📊 Status: ${res.statusCode}`);
    console.log('  🌐 Access: http://localhost:3000');
    process.exit(0);
});

req.on('error', (err) => {
    console.log('  ❌ Server is not running');
    console.log(`  🔍 Error: ${err.message}`);
    
    console.log('\n🚀 To start the server:');
    console.log('  1. Open terminal/command prompt');
    console.log('  2. Navigate to AttendSys folder');
    console.log('  3. Run: node server.js');
    console.log('  4. OR double-click: START-SERVER.bat');
    console.log('  5. OR run: .\\start-server.ps1');
});

req.on('timeout', () => {
    console.log('  ⏱️  Server connection timeout');
    req.destroy();
});

req.end();
