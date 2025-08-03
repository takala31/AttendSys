@echo off
echo SQLite3 Installation Helper for Windows
echo =====================================
echo.

echo This script will help you set up SQLite3 command-line tool.
echo.

echo Step 1: Download SQLite3
echo ------------------------
echo 1. Go to: https://sqlite.org/download.html
echo 2. Look for "Precompiled Binaries for Windows"
echo 3. Download: sqlite-tools-win32-x86-XXXXXXX.zip
echo 4. Extract to a folder (e.g., C:\sqlite)
echo.

echo Step 2: Add to PATH
echo -------------------
echo Option A: Manual
echo 1. Right-click "This PC" or "Computer"
echo 2. Properties ^> Advanced System Settings
echo 3. Environment Variables
echo 4. Edit PATH variable
echo 5. Add your SQLite folder path (e.g., C:\sqlite)
echo.

echo Option B: PowerShell (Run as Administrator)
echo $env:PATH += ";C:\sqlite"
echo [Environment]::SetEnvironmentVariable("PATH", $env:PATH, [EnvironmentVariableTarget]::Machine)
echo.

echo Step 3: Test Installation
echo -------------------------
echo Open new Command Prompt and run: sqlite3 --version
echo.

echo Step 4: Use with AttendSys
echo --------------------------
echo sqlite3 database/attendance.db
echo.

pause
