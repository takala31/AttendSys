@echo off
echo Checking AttendSys Server Status...
echo.

:: Check if port 3000 is in use
netstat -ano | findstr :3000 > nul
if %errorlevel% == 0 (
    echo ✅ Server is running on port 3000
    echo.
    echo 🌐 Access your app at: http://localhost:3000
    echo.
    echo Demo Credentials:
    echo   Admin: admin / admin123
    echo   Employee: jdoe / employee123
) else (
    echo ❌ Server is NOT running
    echo.
    echo 🚀 To start the server:
    echo   npm start
    echo   OR
    echo   node server.js
)

echo.
pause
