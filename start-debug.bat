@echo off
echo Starting AttendSys Server...
echo.

cd /d "%~dp0"

echo Current directory: %CD%
echo.

echo Checking Node.js version:
node --version
echo.

echo Checking npm version:
npm --version
echo.

echo Starting server with node server.js:
node server.js

pause
