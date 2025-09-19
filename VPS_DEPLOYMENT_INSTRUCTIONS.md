# 🚀 VPS Deployment Instructions

## 📋 Quick Deployment Steps

### Option 1: Direct SSH Connection (Recommended)

1. **Connect to your VPS:**
   ```bash
   ssh root@178.16.131.52
   # Password: taylorAB@0633225527
   ```

2. **Run the deployment script:**
   ```bash
   cd /tmp
   curl -sSL https://raw.githubusercontent.com/ayoubsiyari/talaria-log-v3/main/deploy_fresh_vps.sh -o deploy_fresh_vps.sh
   chmod +x deploy_fresh_vps.sh
   ./deploy_fresh_vps.sh
   ```

### Option 2: Using PuTTY (Windows)

1. **Open PuTTY**
2. **Connection Settings:**
   - Host Name: `178.16.131.52`
   - Port: `22`
   - Connection Type: `SSH`
3. **Click "Open"**
4. **Login:**
   - Username: `root`
   - Password: `taylorAB@0633225527`
5. **Run deployment commands:**
   ```bash
   cd /tmp
   curl -sSL https://raw.githubusercontent.com/ayoubsiyari/talaria-log-v3/main/deploy_fresh_vps.sh -o deploy_fresh_vps.sh
   chmod +x deploy_fresh_vps.sh
   ./deploy_fresh_vps.sh
   ```

## 🔧 What the Deployment Script Does

The `deploy_fresh_vps.sh` script will automatically:

1. ✅ **Update system packages** (Ubuntu/Debian)
2. ✅ **Install dependencies** (Python 3, Node.js, PostgreSQL, Redis, Nginx)
3. ✅ **Configure firewall** (UFW) with proper security settings
4. ✅ **Backup existing installation** (if any)
5. ✅ **Clone latest code** from GitHub repository
6. ✅ **Setup PostgreSQL database** with secure credentials
7. ✅ **Configure Python backend** with virtual environment
8. ✅ **Build React frontend** with production optimizations
9. ✅ **Configure Nginx** as reverse proxy with SSL support
10. ✅ **Setup systemd services** for automatic startup
11. ✅ **Install SSL certificates** (Let's Encrypt)
12. ✅ **Seed affiliate test data** for immediate testing
13. ✅ **Start all services** and verify functionality

## 📊 Expected Results

After successful deployment:

- **🌐 Application URL:** http://178.16.131.52
- **🔧 Admin Login:** superadmin@talaria.com
- **🔑 Admin Password:** superadmin123456

### 🤝 Affiliate System Features:
- ✅ Complete affiliate partner management
- ✅ End-to-end referral code tracking  
- ✅ Real-time performance analytics
- ✅ Multi-tier commission structure
- ✅ Partner onboarding workflow

### 🛡️ Security Features:
- ✅ Enterprise-grade security architecture
- ✅ PCI DSS compliance implementation
- ✅ Advanced fraud detection system
- ✅ Multi-layer authentication

## 🕐 Deployment Time

- **Estimated Duration:** 10-15 minutes
- **Network Requirements:** Stable internet connection
- **VPS Requirements:** 2GB RAM, 20GB storage (minimum)

## 🔍 Verification Steps

After deployment, you can verify the installation:

1. **Check services:**
   ```bash
   systemctl status talaria-backend
   systemctl status nginx
   systemctl status postgresql
   systemctl status redis-server
   ```

2. **Check application logs:**
   ```bash
   journalctl -u talaria-backend -f
   ```

3. **Test database:**
   ```bash
   cd /var/www/talaria-admin-dashboard/backend
   source venv/bin/activate
   python verify_affiliate_data.py
   ```

## 🚨 Troubleshooting

### Common Issues:

**1. Connection Refused:**
- Ensure VPS is running
- Check firewall settings
- Verify SSH service is active

**2. Permission Denied:**
- Make sure you're using the correct credentials
- Check if root login is enabled

**3. Package Installation Fails:**
- Ensure VPS has internet connection
- Try updating package lists: `apt update`

**4. Service Not Starting:**
- Check service logs: `journalctl -u service-name -f`
- Verify configuration files
- Check port availability

## 📞 Manual Connection Commands

If you need to connect manually:

```bash
# SSH connection
ssh root@178.16.131.52

# Service management
sudo systemctl start talaria-backend
sudo systemctl restart nginx
sudo systemctl status postgresql

# View logs
sudo journalctl -u talaria-backend -f
sudo tail -f /var/log/nginx/access.log
```

## 🎉 Success Confirmation

You'll know the deployment was successful when:

1. ✅ All service checks pass
2. ✅ Database connectivity test succeeds
3. ✅ Application accessible at http://178.16.131.52
4. ✅ Admin login works with provided credentials
5. ✅ Affiliate system displays sample data

## 📋 Post-Deployment Tasks

After successful deployment:

1. **Configure Stripe API Keys** (for payment processing)
2. **Set up custom domain** (optional)
3. **Configure email notifications** 
4. **Test affiliate system functionality**
5. **Set up monitoring and backups**

---

🚀 **Ready to deploy your complete affiliate marketing platform!**