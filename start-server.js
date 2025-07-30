#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 AttendSys Server Starter');
console.log('=========================\n');

// Check if we're in the right directory
const serverPath = path.join(process.cwd(), 'server.js');
if (!fs.existsSync(serverPath)) {
    console.error('❌ Error: server.js not found in current directory');
    console.error('Please run this script from the AttendSys root directory');
    process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    const install = spawn('npm', ['install'], { stdio: 'inherit' });
    
    install.on('close', (code) => {
        if (code !== 0) {
            console.error('❌ Failed to install dependencies');
            process.exit(1);
        }
        startServer();
    });
} else {
    startServer();
}

function startServer() {
    console.log('🌟 Starting AttendSys server...\n');
    
    const server = spawn('node', ['server.js'], { stdio: 'inherit' });
    
    server.on('close', (code) => {
        console.log(`\n🛑 Server exited with code ${code}`);
    });
    
    server.on('error', (err) => {
        console.error('❌ Failed to start server:', err);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.kill('SIGINT');
        process.exit(0);
    });
}
