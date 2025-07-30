# AttendSys Server Starter - PowerShell Version
Write-Host "🚀 Starting AttendSys Server..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Change to the correct directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "📂 Working Directory: $PWD" -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js Version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if server.js exists
if (-not (Test-Path "server.js")) {
    Write-Host "❌ server.js not found in current directory" -ForegroundColor Red
    Write-Host "Make sure you're running this from the AttendSys folder" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ server.js found" -ForegroundColor Green
Write-Host ""

# Check if .env exists, create if not
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file created" -ForegroundColor Green
    }
}

Write-Host "🌐 Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔑 Demo Credentials:" -ForegroundColor Cyan
Write-Host "   Admin: admin / admin123" -ForegroundColor White
Write-Host "   Employee: jdoe / employee123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this window open while using the app!" -ForegroundColor Yellow
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
try {
    node server.js
} catch {
    Write-Host ""
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
