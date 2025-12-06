# CRM Sentiment Analysis - Quick Start Script (No npm install)
# Run this script with: .\quick-start.ps1
# Use this when dependencies are already installed

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CRM Sentiment Analysis - Quick Start" -ForegroundColor Cyan
Write-Host "  (Skipping npm install)" -ForegroundColor DarkGray
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker Desktop is running, if not start it
Write-Host "[1/6] Checking Docker Desktop..." -ForegroundColor Yellow
$dockerCheck = $false
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Docker is running" -ForegroundColor Green
        $dockerCheck = $true
    }
}
catch {
    $dockerCheck = $false
}

if ($dockerCheck -eq $false) {
    Write-Host "  Docker not running, starting Docker Desktop..." -ForegroundColor Yellow
    try {
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
        Write-Host "  Waiting 15 seconds for Docker to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        Write-Host "  Docker Desktop started" -ForegroundColor Green
    }
    catch {
        Write-Host "  Could not start Docker Desktop automatically" -ForegroundColor Yellow
        Write-Host "  Please start it manually and try again" -ForegroundColor Yellow
    }
}

# Start Redis (if not already running)
Write-Host ""
Write-Host "[2/6] Starting Redis..." -ForegroundColor Yellow
try {
    $redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" 2>&1 | Select-String "redis"
    if (-not $redisRunning) {
        docker run -d --name redis-local -p 6379:6379 redis:alpine 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            docker start redis-local 2>&1 | Out-Null
        }
    }
    Write-Host "  Redis running on port 6379" -ForegroundColor Green
}
catch {
    Write-Host "  Redis startup skipped" -ForegroundColor Yellow
}

# Start Prometheus and Grafana
Write-Host ""
Write-Host "[3/6] Starting Prometheus and Grafana..." -ForegroundColor Yellow
try {
    Push-Location "$PSScriptRoot\monitoring"
    docker-compose up -d prometheus grafana 2>&1 | Out-Null
    Pop-Location
    Write-Host "  Prometheus running on http://localhost:9090" -ForegroundColor Green
    Write-Host "  Grafana running on http://localhost:3001" -ForegroundColor Green
    Write-Host "    Login: team.808.test@gmail.com / team@808" -ForegroundColor DarkGray
}
catch {
    Write-Host "  Docker Compose services skipped" -ForegroundColor Yellow
}

# Start Backend Server
Write-Host ""
Write-Host "[4/6] Starting Backend Server..." -ForegroundColor Yellow
try {
    $serverCmd = "cd '$PSScriptRoot\server'; npm start"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $serverCmd
    Write-Host "  Backend starting on http://localhost:4000" -ForegroundColor Green
    Write-Host "  Metrics at http://localhost:4000/metrics" -ForegroundColor DarkGray
}
catch {
    Write-Host "  ERROR: Failed to start backend server" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
}

# Wait briefly
Start-Sleep -Seconds 2

# Start Frontend
Write-Host ""
Write-Host "[5/6] Starting Frontend..." -ForegroundColor Yellow
try {
    $clientCmd = "cd '$PSScriptRoot\client'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $clientCmd
    Write-Host "  Frontend starting on http://localhost:3000" -ForegroundColor Green
}
catch {
    Write-Host "  ERROR: Failed to start frontend" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
}

# Wait a moment for services to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:     http://localhost:4000" -ForegroundColor White
Write-Host "  Grafana:     http://localhost:3001" -ForegroundColor White
Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
Write-Host ""
Write-Host "  Admin Login:" -ForegroundColor Yellow
Write-Host "    Email:    team.808.test@gmail.com" -ForegroundColor White
Write-Host "    Password: team@808" -ForegroundColor White
Write-Host ""

# Open browser
Write-Host "[6/6] Opening in browser..." -ForegroundColor Yellow
try {
    Start-Process "http://localhost:3000"
    Write-Host "  Browser opened" -ForegroundColor Green
}
catch {
    Write-Host "  Could not open browser automatically" -ForegroundColor Yellow
}
