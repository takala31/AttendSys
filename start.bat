@echo off
echo Starting AttendSys Setup...
echo.

echo Step 1: Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Starting the server...
echo.
echo Server will be available at: http://localhost:3000
echo Demo credentials:
echo   Admin: admin / admin123
echo   Employee: jdoe / employee123
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start
