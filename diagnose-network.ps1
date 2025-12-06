# Network Error Diagnostic
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Network Error Diagnostic" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Backend
Write-Host "[1] Checking Backend Server (port 4000)..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:4000" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "  BACKEND OK - Server is responding" -ForegroundColor Green
}
catch {
    Write-Host "  BACKEND ERROR - Server not responding" -ForegroundColor Red
    Write-Host "  Make sure npm start window is open and shows 'Server run successfully'" -ForegroundColor Yellow
}

# Check Frontend  
Write-Host ""
Write-Host "[2] Checking Frontend Server (port 3000)..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "  FRONTEND OK - Server is responding" -ForegroundColor Green
}
catch {
    Write-Host "  FRONTEND ERROR - Server not responding" -ForegroundColor Red
    Write-Host "  Make sure npm run dev window is open" -ForegroundColor Yellow
}

# Check .env
Write-Host ""
Write-Host "[3] Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path "c:\PS_sample\.env") {
    $content = Get-Content "c:\PS_sample\.env"
    if ($content -match "MONGO_URI") {
        Write-Host "  MONGO_URI configured" -ForegroundColor Green
    }
    if ($content -match "PORT=4000") {
        Write-Host "  PORT is set to 4000" -ForegroundColor Green
    }
    if ($content -match "CLIENT_URL=http://localhost:3000") {
        Write-Host "  CLIENT_URL is set correctly" -ForegroundColor Green
    }
}
else {
    Write-Host "  .env file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SOLUTION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If Backend shows ERROR:" -ForegroundColor White
Write-Host "  1. Look at the Backend Server PowerShell window" -ForegroundColor Gray
Write-Host "  2. Check for MongoDB connection errors" -ForegroundColor Gray
Write-Host "  3. Make sure internet is connected" -ForegroundColor Gray
Write-Host "  4. Restart: STOP.bat then START.bat" -ForegroundColor Gray
Write-Host ""
