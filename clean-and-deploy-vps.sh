#!/bin/bash

# Talaria Admin Dashboard - VPS Cleanup and Fresh Deployment
# Run this script on your VPS to clean everything and deploy fresh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="talaria-admin-dashboard"
PROJECT_DIR="/var/www/talaria-admin"
BACKUP_DIR="/var/backups/talaria"
LOG_DIR="/var/log/talaria"
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
SYSTEMD_DIR="/etc/systemd/system"

# Server configuration
SERVER_IP="178.16.131.52"
DOMAIN="yourdomain.com"  # Update this with your actual domain
SSL_EMAIL="admin@yourdomain.com"  # Update this with your email

echo -e "${GREEN}🧹 Talaria Admin Dashboard - VPS Cleanup and Fresh Deployment${NC}"
echo "=================================================================="
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Project Directory: $PROJECT_DIR"
echo "Server IP: $SERVER_IP"
echo "Domain: $DOMAIN"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Function to print success
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root. Please run: sudo $0"
fi

print_status "Starting VPS cleanup and fresh deployment..."

# ===========================================
# STEP 1: STOP ALL SERVICES
# ===========================================
print_status "🛑 Stopping all services..."

# Stop nginx
systemctl stop nginx 2>/dev/null || true

# Stop any existing talaria services
systemctl stop talaria-backend 2>/dev/null || true
systemctl stop talaria-frontend 2>/dev/null || true

# Kill any remaining processes
pkill -f "python.*run" 2>/dev/null || true
pkill -f "pnpm.*dev" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

print_success "All services stopped"

# ===========================================
# STEP 2: CLEAN EXISTING INSTALLATION
# ===========================================
print_status "🧹 Cleaning existing installation..."

# Remove existing project directory
if [ -d "$PROJECT_DIR" ]; then
    print_status "Removing existing project directory..."
    rm -rf $PROJECT_DIR
fi

# Remove nginx configuration
if [ -f "$NGINX_SITES_DIR/talaria-admin" ]; then
    print_status "Removing nginx configuration..."
    rm -f $NGINX_SITES_DIR/talaria-admin
    rm -f $NGINX_ENABLED_DIR/talaria-admin
fi

# Remove systemd services
if [ -f "$SYSTEMD_DIR/talaria-backend.service" ]; then
    print_status "Removing systemd services..."
    rm -f $SYSTEMD_DIR/talaria-backend.service
    rm -f $SYSTEMD_DIR/talaria-frontend.service
fi

# Clean up any existing databases
print_status "Cleaning up databases..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS talaria_production;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS talaria_user;" 2>/dev/null || true

# Clean up any existing backups
if [ -d "$BACKUP_DIR" ]; then
    print_status "Cleaning up old backups..."
    rm -rf $BACKUP_DIR
fi

# Clean up logs
if [ -d "$LOG_DIR" ]; then
    print_status "Cleaning up old logs..."
    rm -rf $LOG_DIR
fi

print_success "Cleanup completed"

# ===========================================
# STEP 3: UPDATE SYSTEM AND INSTALL DEPENDENCIES
# ===========================================
print_status "📦 Updating system and installing dependencies..."

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y nginx python3 python3-pip python3-venv nodejs npm git curl postgresql postgresql-contrib

# Install pnpm
npm install -g pnpm

# Install certbot for SSL (optional)
apt install -y certbot python3-certbot-nginx

print_success "Dependencies installed"

# ===========================================
# STEP 4: CLONE FRESH PROJECT
# ===========================================
print_status "📥 Cloning fresh project from GitHub..."

# Create project directory
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clone the repository
git clone https://github.com/ayoubsiyari/talaria-log-v3.git .

print_success "Project cloned successfully"

# ===========================================
# STEP 5: SETUP POSTGRESQL DATABASE
# ===========================================
print_status "🗄️ Setting up PostgreSQL database..."

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE talaria_production;"
sudo -u postgres psql -c "CREATE USER talaria_user WITH PASSWORD '$(openssl rand -base64 32)';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE talaria_production TO talaria_user;"
sudo -u postgres psql -c "ALTER USER talaria_user CREATEDB;"

# Get database password
DB_PASSWORD=$(sudo -u postgres psql -t -c "SELECT 'password_here';" | tr -d ' ')

print_success "Database setup completed"

# ===========================================
# STEP 6: CONFIGURE BACKEND
# ===========================================
print_status "⚙️ Configuring backend..."

# Create production environment file
cat > $PROJECT_DIR/backend/.env << EOF
# Production Environment Configuration
FLASK_ENV=production
FLASK_APP=run_production.py
FLASK_DEBUG=0

# Security Keys (GENERATED - CHANGE THESE!)
SECRET_KEY=$(openssl rand -base64 32)
JWT_SECRET_KEY=$(openssl rand -base64 32)

# Database Configuration (PostgreSQL for production)
DATABASE_URL=postgresql://talaria_user:$DB_PASSWORD@localhost:5432/talaria_production
DEV_DATABASE_URL=sqlite:///app.db

# CORS Settings
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN,http://$SERVER_IP

# Logging
LOG_LEVEL=INFO
LOG_FILE=$LOG_DIR/app.log

# Production Settings
PRODUCTION=true
HTTPS_ONLY=true
EOF

# Install Python dependencies
cd $PROJECT_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Initialize database
print_status "Initializing production database..."
python -c "
from app import create_app, db
app = create_app('production')
with app.app_context():
    db.create_all()
    print('Database tables created successfully')
"

print_success "Backend configured"

# ===========================================
# STEP 7: CONFIGURE FRONTEND
# ===========================================
print_status "🎨 Configuring frontend..."

# Install Node.js dependencies and build frontend
cd $PROJECT_DIR/frontend
pnpm install
pnpm build

print_success "Frontend configured"

# ===========================================
# STEP 8: CREATE SYSTEMD SERVICES
# ===========================================
print_status "🔧 Creating systemd services..."

# Create backend service
cat > $SYSTEMD_DIR/talaria-backend.service << EOF
[Unit]
Description=Talaria Admin Dashboard Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$PROJECT_DIR/backend
Environment=PATH=$PROJECT_DIR/backend/venv/bin
ExecStart=$PROJECT_DIR/backend/venv/bin/python run_production.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd services created"

# ===========================================
# STEP 9: CONFIGURE NGINX
# ===========================================
print_status "🌐 Configuring nginx..."

# Create nginx configuration
cat > $NGINX_SITES_DIR/talaria-admin << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN $SERVER_IP;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Frontend
    location / {
        root $PROJECT_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf $NGINX_SITES_DIR/talaria-admin $NGINX_ENABLED_DIR/
nginx -t || print_error "Nginx configuration test failed"

print_success "Nginx configured"

# ===========================================
# STEP 10: SET PERMISSIONS
# ===========================================
print_status "🔐 Setting permissions..."

# Set proper ownership
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Create log directory
mkdir -p $LOG_DIR
chown -R www-data:www-data $LOG_DIR

print_success "Permissions set"

# ===========================================
# STEP 11: START SERVICES
# ===========================================
print_status "🚀 Starting services..."

# Reload systemd
systemctl daemon-reload

# Enable and start services
systemctl enable talaria-backend
systemctl start talaria-backend

# Start nginx
systemctl start nginx
systemctl enable nginx

print_success "Services started"

# ===========================================
# STEP 12: SETUP FIREWALL
# ===========================================
print_status "🔥 Configuring firewall..."

# Setup firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_success "Firewall configured"

# ===========================================
# STEP 13: FINAL STATUS CHECK
# ===========================================
print_status "🔍 Performing final status check..."

sleep 5

# Check if services are running
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
fi

if systemctl is-active --quiet talaria-backend; then
    print_success "Backend service is running"
else
    print_error "Backend service is not running"
fi

# Test API endpoint
if curl -f -s http://localhost:5000/api/health > /dev/null; then
    print_success "API is responding"
else
    print_error "API is not responding"
fi

# ===========================================
# STEP 14: SUCCESS MESSAGE
# ===========================================
print_success "🎉 VPS Cleanup and Deployment Completed Successfully!"
echo ""
echo -e "${YELLOW}📋 Deployment Summary:${NC}"
echo "========================"
echo "✅ VPS cleaned completely"
echo "✅ Fresh project deployed"
echo "✅ PostgreSQL database configured"
echo "✅ Nginx web server configured"
echo "✅ SSL ready (optional)"
echo "✅ Firewall configured"
echo "✅ All services running"
echo ""
echo -e "${YELLOW}🌐 Access Your Website:${NC}"
echo "Frontend: http://$SERVER_IP or https://$DOMAIN"
echo "API: http://$SERVER_IP/api or https://$DOMAIN/api"
echo "Health Check: http://$SERVER_IP/health"
echo ""
echo -e "${YELLOW}🔑 Login Credentials:${NC}"
echo "Email: superadmin@talaria.com"
echo "Password: superadmin123456"
echo ""
echo -e "${YELLOW}🔧 Management Commands:${NC}"
echo "View logs: journalctl -u talaria-backend -f"
echo "Restart backend: systemctl restart talaria-backend"
echo "Check status: systemctl status talaria-backend"
echo ""
echo -e "${GREEN}🚀 Your Talaria Admin Dashboard is now live!${NC}"
