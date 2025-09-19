# Talaria Admin Dashboard - VPS Connection and Deployment Script
# This script connects to your VPS and runs the fresh deployment

param(
    [string]$VpsIp = "178.16.131.52",
    [string]$Username = "root",
    [string]$Password = "taylorAB@0633225527"
)

Write-Host "🚀 Talaria Admin Dashboard - VPS Deployment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Connection Details:" -ForegroundColor Blue
Write-Host "   VPS IP: $VpsIp" -ForegroundColor White
Write-Host "   Username: $Username" -ForegroundColor White
Write-Host "   Password: [Hidden for security]" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  SECURITY NOTICE:" -ForegroundColor Yellow
Write-Host "   - This script will perform a FRESH deployment (cleans existing installation)" -ForegroundColor Red
Write-Host "   - All existing data will be backed up before cleaning" -ForegroundColor Yellow
Write-Host "   - The deployment will install all necessary packages and services" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Are you sure you want to proceed with fresh VPS deployment? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔄 Starting VPS deployment process..." -ForegroundColor Green
Write-Host ""

# Check if plink is available (from PuTTY)
$plinkPath = Get-Command plink -ErrorAction SilentlyContinue
if (-not $plinkPath) {
    Write-Host "❌ plink (from PuTTY) not found. Please install PuTTY first." -ForegroundColor Red
    Write-Host "   Download from: https://www.putty.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "📡 Connecting to VPS and running deployment script..." -ForegroundColor Blue
Write-Host ""

# Create the deployment command
$deploymentCommand = @"
#!/bin/bash
cd /tmp
curl -sSL https://raw.githubusercontent.com/ayoubsiyari/talaria-log-v3/main/deploy_fresh_vps.sh -o deploy_fresh_vps.sh
chmod +x deploy_fresh_vps.sh
./deploy_fresh_vps.sh
"@

# Execute the deployment
try {
    Write-Host "🌐 Downloading and executing deployment script from GitHub..." -ForegroundColor Green
    
    # Use plink to connect and execute
    $plinkCommand = "echo `"$deploymentCommand`" | plink -ssh -batch -pw `"$Password`" $Username@$VpsIp"
    
    Write-Host "📞 Connecting to $VpsIp..." -ForegroundColor Blue
    Invoke-Expression $plinkCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 VPS deployment completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Access Information:" -ForegroundColor Blue
        Write-Host "   🌐 Application URL: http://$VpsIp" -ForegroundColor White
        Write-Host "   🔧 Admin Login: superadmin@talaria.com" -ForegroundColor White
        Write-Host "   🔑 Admin Password: superadmin123456" -ForegroundColor White
        Write-Host ""
        Write-Host "🤝 Affiliate System Features:" -ForegroundColor Green
        Write-Host "   ✅ Complete affiliate partner management" -ForegroundColor White
        Write-Host "   ✅ End-to-end referral code tracking" -ForegroundColor White
        Write-Host "   ✅ Real-time performance analytics" -ForegroundColor White
        Write-Host "   ✅ Multi-tier commission structure" -ForegroundColor White
        Write-Host "   ✅ Partner onboarding workflow" -ForegroundColor White
        Write-Host ""
        Write-Host "🛡️  Security Features:" -ForegroundColor Green
        Write-Host "   ✅ Enterprise-grade security architecture" -ForegroundColor White
        Write-Host "   ✅ PCI DSS compliance implementation" -ForegroundColor White
        Write-Host "   ✅ Advanced fraud detection system" -ForegroundColor White
        Write-Host "   ✅ Multi-layer authentication" -ForegroundColor White
        Write-Host ""
        Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Visit http://$VpsIp to access the dashboard" -ForegroundColor White
        Write-Host "   2. Login with the admin credentials above" -ForegroundColor White
        Write-Host "   3. Navigate to 'Affiliate Partners' to test the system" -ForegroundColor White
        Write-Host "   4. Click 'View Referrals' on any affiliate to see tracking data" -ForegroundColor White
        Write-Host "   5. Configure Stripe API keys for payment processing" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Deployment failed. Check the output above for errors." -ForegroundColor Red
        Write-Host "💡 Common solutions:" -ForegroundColor Yellow
        Write-Host "   - Ensure VPS has internet connection" -ForegroundColor White
        Write-Host "   - Verify SSH credentials are correct" -ForegroundColor White
        Write-Host "   - Check if VPS has sufficient resources" -ForegroundColor White
        Write-Host "   - Try connecting manually: ssh $Username@$VpsIp" -ForegroundColor White
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Connection or deployment error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Verify VPS IP and credentials" -ForegroundColor White
    Write-Host "   2. Check internet connection" -ForegroundColor White
    Write-Host "   3. Ensure PuTTY is installed" -ForegroundColor White
        Write-Host "   4. Try manual connection: plink -ssh $Username@$VpsIp" -ForegroundColor White
    }
} catch {
Write-Host "📞 SSH Direct Connection Command:" -ForegroundColor Blue
Write-Host "   ssh $Username@$VpsIp" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"