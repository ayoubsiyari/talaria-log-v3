# Talaria Admin Dashboard - VPS Deployment Script (Windows)
# This script helps you prepare your project for VPS deployment

Write-Host "🚀 Talaria Admin Dashboard - VPS Deployment Preparation" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# Check if required files exist
$requiredFiles = @(
    "backend/run_production.py",
    "backend/requirements.txt", 
    "deploy-to-vps.sh",
    "VPS_DEPLOYMENT_GUIDE.md"
)

Write-Host "🔍 Checking required files..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - MISSING!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 VPS Deployment Steps:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 📤 Upload your project to VPS:" -ForegroundColor White
Write-Host "   git clone https://github.com/yourusername/talaria-admin-dashboard.git" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🔧 Configure your settings in deploy-to-vps.sh:" -ForegroundColor White
Write-Host "   - Update SERVER_IP with your VPS IP" -ForegroundColor Gray
Write-Host "   - Update DOMAIN with your domain name" -ForegroundColor Gray
Write-Host "   - Update SSL_EMAIL with your email" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 🚀 Run deployment on VPS:" -ForegroundColor White
Write-Host "   chmod +x deploy-to-vps.sh" -ForegroundColor Gray
Write-Host "   ./deploy-to-vps.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 🌐 Access your website:" -ForegroundColor White
Write-Host "   http://YOUR_VPS_IP or https://yourdomain.com" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For detailed instructions, see: VPS_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Your project is ready for VPS deployment!" -ForegroundColor Green
