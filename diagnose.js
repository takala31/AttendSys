#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 AttendSys Diagnostic Tool');
console.log('============================\n');

// Check files
const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'config/database.js',
    'public/login.html',
    'public/js/login.js'
];

console.log('📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

// Check directories
const requiredDirs = [
    'public',
    'config',
    'routes',
    'database'
];

console.log('\n📂 Checking required directories:');
requiredDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
    if (!exists) allFilesExist = false;
});

// Check node_modules
console.log('\n📦 Checking dependencies:');
const nodeModulesExists = fs.existsSync('node_modules');
console.log(`  ${nodeModulesExists ? '✅' : '❌'} node_modules directory`);

if (nodeModulesExists) {
    const criticalModules = ['express', 'sqlite3', 'bcryptjs', 'jsonwebtoken'];
    criticalModules.forEach(module => {
        const moduleExists = fs.existsSync(path.join('node_modules', module));
        console.log(`  ${moduleExists ? '✅' : '❌'} ${module}`);
    });
}

// Check database
console.log('\n🗄️  Checking database:');
const dbExists = fs.existsSync('database/attendance.db');
console.log(`  ${dbExists ? '✅' : '❌'} database/attendance.db`);

// Check .env file content
console.log('\n⚙️  Environment configuration:');
if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const hasPort = envContent.includes('PORT=');
    const hasJwtSecret = envContent.includes('JWT_SECRET=');
    console.log(`  ${hasPort ? '✅' : '❌'} PORT configured`);
    console.log(`  ${hasJwtSecret ? '✅' : '❌'} JWT_SECRET configured`);
} else {
    console.log('  ❌ .env file missing');
}

console.log('\n📊 Summary:');
if (allFilesExist && nodeModulesExists) {
    console.log('✅ All required files and dependencies are present');
    console.log('\n🚀 To start the server, run:');
    console.log('   node start-server.js');
    console.log('   OR');
    console.log('   npm start');
} else {
    console.log('❌ Some files or dependencies are missing');
    console.log('\n🔧 To fix issues:');
    console.log('1. Run: npm install');
    console.log('2. Make sure you\'re in the AttendSys directory');
    console.log('3. Run this diagnostic again');
}

console.log('\n🌐 Once the server is running, access: http://localhost:3000');
