@echo off
title AttendSys Server
color 0A
echo.
echo  ===============================================
echo    🚀 AttendSys Server Launcher
echo  ===============================================
echo.

cd /d "%~dp0"

echo 📂 Current Directory: %CD%
echo.

echo 🔍 Checking Node.js installation...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version
echo.

echo 🔍 Checking if server file exists...
if not exist "server.js" (
    echo ❌ server.js not found in current directory
    echo Make sure you're running this from the AttendSys folder
    pause
    exit /b 1
)

echo ✅ server.js found
echo.

echo 🚀 Starting AttendSys Server...
echo.
echo ⚠️  IMPORTANT: Keep this window open while using the app
echo 🌐 Once started, access: http://localhost:3000
echo 🛑 Press Ctrl+C to stop the server
echo.
echo ===============================================
echo.

node server.js

echo.
echo Server has stopped.
pause
