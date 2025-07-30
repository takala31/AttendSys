# AttendSys - Development Setup

## Issue: "Network Error" when pulled from GitHub

This is a common issue when working between different environments (office vs home). Here's what's happening and how to fix it:

### Problem:
- Database files (.db) are not committed to GitHub (and shouldn't be)
- When you pull the code, you only get the source code, not the database
- The demo users don't exist yet because the database hasn't been initialized

### Solution:

#### 1. Install Dependencies
```powershell
npm install
```

#### 2. Create Environment File
The `.env` file has been created with default values. You can modify it if needed.

#### 3. Start the Server
```powershell
npm start
```
OR
```powershell
node server.js
```

#### 4. Alternative: Use the Startup Scripts
- **Windows Command Prompt**: Double-click `start.bat`
- **PowerShell**: `.\start.ps1`

### What Happens When You Start the Server:

1. **Database Creation**: SQLite database is automatically created at `./database/attendance.db`
2. **Table Creation**: All necessary tables are created
3. **Demo Data**: Default users are automatically created:
   - **Admin**: `admin` / `admin123`
   - **Employee**: `jdoe` / `employee123`
4. **Server Start**: Server runs on `http://localhost:3000`

### Troubleshooting:

#### If you get "Cannot find module" errors:
```powershell
# Delete node_modules and package-lock.json, then reinstall
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

#### If database doesn't initialize:
1. Check if `./database/` directory exists
2. Delete the database file and restart: `Remove-Item ./database/attendance.db`
3. Restart the server

#### If port 3000 is in use:
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>
```

### Development Workflow:

1. **First Time Setup** (after pulling from GitHub):
   ```powershell
   npm install
   npm start
   ```

2. **Daily Development**:
   ```powershell
   npm start
   ```

3. **If you need to reset the database**:
   ```powershell
   Remove-Item ./database/attendance.db -ErrorAction SilentlyContinue
   npm start
   ```

### File Structure After Setup:
```
AttendSys/
├── database/
│   └── attendance.db          # SQLite database (created automatically)
├── node_modules/              # Dependencies (created by npm install)
├── public/                    # Frontend files
├── routes/                    # API routes
├── config/                    # Database configuration
├── .env                       # Environment variables
└── server.js                  # Main server file
```

### Demo Credentials:
- **Admin Panel**: `admin` / `admin123`
- **Employee Portal**: `jdoe` / `employee123`

The system will automatically create these users with proper password hashing when the database is initialized.
