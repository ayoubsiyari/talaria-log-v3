# Clean Startup Script - No Docker, Simple Configuration
Write-Host "🧹 CLEANING UP AND STARTING FRESH..." -ForegroundColor Green

# Kill any existing processes
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean up any Docker containers
Write-Host "🧹 Stopping Docker containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Set simple environment variables
$env:FLASK_ENV = "development"
$env:FLASK_DEBUG = "True"
$env:DEV_DATABASE_URL = "sqlite:///app.db"
$env:DATABASE_URL = "sqlite:///app.db"
$env:CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"

Write-Host "✅ Environment set to simple SQLite configuration" -ForegroundColor Green

# Start Backend
Write-Host "🚀 Starting Backend (SQLite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; python run.py" -WindowStyle Minimized

# Wait for backend
Start-Sleep -Seconds 8

# Start Frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; pnpm dev" -WindowStyle Minimized

# Wait for frontend
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🎉 CLEAN SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "Email: superadmin@talaria.com" -ForegroundColor White
Write-Host "Password: superadmin123456" -ForegroundColor White
Write-Host ""
Write-Host "✅ Simple SQLite database - No Docker complexity!" -ForegroundColor Green
