# Talaria Admin Dashboard - Quick VPS Deployment
# This script uploads and runs the cleanup/deployment script on your VPS

Write-Host "🚀 Talaria Admin Dashboard - VPS Cleanup and Deployment" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

# VPS Configuration
$VPS_IP = "178.16.131.52"
$VPS_USER = "root"

Write-Host "📋 VPS Configuration:" -ForegroundColor Yellow
Write-Host "   IP: $VPS_IP" -ForegroundColor White
Write-Host "   User: $VPS_USER" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Step 1: Uploading deployment script to VPS..." -ForegroundColor Cyan

# Upload the script to VPS using SCP
Write-Host "Uploading clean-and-deploy-vps.sh to VPS..." -ForegroundColor White
scp clean-and-deploy-vps.sh $VPS_USER@$VPS_IP:/root/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Script uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload script. Please check your SSH connection." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Step 2: Making script executable and running it..." -ForegroundColor Cyan

# SSH into VPS and run the script
Write-Host "Connecting to VPS and running deployment script..." -ForegroundColor White
Write-Host "This will take several minutes. Please wait..." -ForegroundColor Yellow
Write-Host ""

ssh $VPS_USER@$VPS_IP "chmod +x /root/clean-and-deploy-vps.sh && /root/clean-and-deploy-vps.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 VPS Cleanup and Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your website is now live at:" -ForegroundColor Yellow
    Write-Host "   http://$VPS_IP" -ForegroundColor White
    Write-Host "   https://yourdomain.com (if SSL configured)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Login Credentials:" -ForegroundColor Yellow
    Write-Host "   Email: superadmin@talaria.com" -ForegroundColor White
    Write-Host "   Password: superadmin123456" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Deployment completed! Your website is ready to use." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    Write-Host "You can also SSH into the VPS and run the script manually:" -ForegroundColor Yellow
    Write-Host "   ssh $VPS_USER@$VPS_IP" -ForegroundColor White
    Write-Host "   chmod +x /root/clean-and-deploy-vps.sh" -ForegroundColor White
    Write-Host "   /root/clean-and-deploy-vps.sh" -ForegroundColor White
}
