# 🚀 VPS Deployment Guide

## Prerequisites

### 1. VPS Requirements
- **OS**: Ubuntu 20.04+ or CentOS 7+
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 1 core minimum (2 cores recommended)

### 2. Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx python3 python3-pip python3-venv nodejs npm git curl postgresql postgresql-contrib

# Install pnpm
npm install -g pnpm

# Install certbot for SSL (optional)
sudo apt install -y certbot python3-certbot-nginx
```

## 🚀 Quick Deployment

### 1. Upload Your Project
```bash
# Clone your repository
git clone https://github.com/yourusername/talaria-admin-dashboard.git /var/www/talaria-admin
cd /var/www/talaria-admin

# Make deployment script executable
chmod +x deploy-to-vps.sh
```

### 2. Configure Your Settings
Edit the deployment script and update:
```bash
# Update these variables in deploy-to-vps.sh
SERVER_IP="YOUR_VPS_IP"           # Your VPS IP address
DOMAIN="yourdomain.com"           # Your domain name
SSL_EMAIL="admin@yourdomain.com"  # Your email for SSL
```

### 3. Run Deployment
```bash
# Run the deployment script
./deploy-to-vps.sh
```

## 🔧 Manual Deployment Steps

### 1. Backend Setup
```bash
# Create virtual environment
cd /var/www/talaria-admin/backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create production environment file
cat > .env << EOF
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=$(openssl rand -base64 32)
JWT_SECRET_KEY=$(openssl rand -base64 32)
DATABASE_URL=sqlite:///app.db
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
PRODUCTION=true
EOF
```

### 2. Frontend Setup
```bash
# Install dependencies and build
cd /var/www/talaria-admin/frontend
pnpm install
pnpm build
```

### 3. Nginx Configuration
```bash
# Create nginx config
sudo tee /etc/nginx/sites-available/talaria-admin << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com YOUR_VPS_IP;
    
    # Frontend
    location / {
        root /var/www/talaria-admin/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/talaria-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Systemd Service
```bash
# Create backend service
sudo tee /etc/systemd/system/talaria-backend.service << EOF
[Unit]
Description=Talaria Admin Dashboard Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/talaria-admin/backend
Environment=PATH=/var/www/talaria-admin/backend/venv/bin
ExecStart=/var/www/talaria-admin/backend/venv/bin/python run_production.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable talaria-backend
sudo systemctl start talaria-backend
```

## 🔒 SSL Setup (Optional)

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring

### Check Service Status
```bash
# Backend service
sudo systemctl status talaria-backend

# Nginx
sudo systemctl status nginx

# View logs
sudo journalctl -u talaria-backend -f
```

### Health Check
```bash
# Test API
curl http://yourdomain.com/api/health

# Test frontend
curl http://yourdomain.com
```

## 🔄 Updates

### Update Your Application
```bash
cd /var/www/talaria-admin
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Update frontend
cd ../frontend
pnpm install
pnpm build

# Restart services
sudo systemctl restart talaria-backend
sudo systemctl reload nginx
```

## 🆘 Troubleshooting

### Common Issues

1. **Backend not starting**
   ```bash
   sudo journalctl -u talaria-backend -f
   ```

2. **Nginx errors**
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Permission issues**
   ```bash
   sudo chown -R www-data:www-data /var/www/talaria-admin
   ```

4. **Port conflicts**
   ```bash
   sudo netstat -tlnp | grep :5000
   sudo netstat -tlnp | grep :80
   ```

## ✅ Success!

Your Talaria Admin Dashboard should now be live at:
- **HTTP**: http://yourdomain.com or http://YOUR_VPS_IP
- **HTTPS**: https://yourdomain.com (if SSL configured)

**Login Credentials:**
- Email: `superadmin@talaria.com`
- Password: `superadmin123456`
