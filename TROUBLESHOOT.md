# Network Error Troubleshooting Guide

## Quick Fix Steps:

### 1. **Start the Server** (Choose ONE method):

**Method A - Using npm:**
```powershell
npm start
```

**Method B - Direct Node.js:**
```powershell
node server.js
```

**Method C - Using our startup script:**
```powershell
node start-server.js
```

### 2. **Verify Server is Running:**
- You should see: `Attendance Tracking Server running on port 3000`
- You should see: `Connected to SQLite database`

### 3. **Test the Login:**
- Open browser to: `http://localhost:3000`
- Try demo credentials:
  - **Admin**: `admin` / `admin123`
  - **Employee**: `jdoe` / `employee123`

## If Still Getting Network Error:

### Step 1: Check if Server is Actually Running
```powershell
netstat -ano | findstr :3000
```
If you see output, the server is running. If not, start it again.

### Step 2: Check Browser Console
1. Press `F12` in your browser
2. Go to **Console** tab
3. Try logging in
4. Look for specific error messages

### Step 3: Check Server Terminal
Look at the terminal where you started the server:
- Are there any error messages?
- Did it say "Connected to SQLite database"?
- Did it say "Server running on port 3000"?

### Step 4: Browser Network Tab
1. Press `F12` → **Network** tab
2. Try logging in
3. Look for the request to `/api/auth/login`
4. Check the status code and response

## Common Issues and Solutions:

### Issue: "Server is not running" error
**Solution:** Start the server first using `npm start`

### Issue: Port 3000 is already in use
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace XXXX with actual PID)
taskkill /F /PID XXXX
```

### Issue: "Cannot find module" errors
```powershell
# Reinstall dependencies
npm install
```

### Issue: Database not initialized
```powershell
# Delete database and restart
Remove-Item ./database/attendance.db -ErrorAction SilentlyContinue
npm start
```

### Issue: CORS or browser security
- Make sure you're accessing `http://localhost:3000` (not file://)
- Clear browser cache (Ctrl+Shift+Delete)

## Test URLs:
- **Main App**: http://localhost:3000
- **Login API**: http://localhost:3000/api/auth/login (POST request)
- **Dashboard**: http://localhost:3000/dashboard

## Debug Commands:
```powershell
# Check if everything is set up
node diagnose.js

# Start server with detailed logging
node server.js

# Check if port is in use
netstat -ano | findstr :3000
```
