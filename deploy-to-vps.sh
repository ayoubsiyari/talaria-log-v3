#!/bin/bash

# Talaria Admin Dashboard - VPS Deployment Script
# Simple, clean deployment without Docker complexity

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

# Server configuration (UPDATE THESE!)
SERVER_IP="YOUR_VPS_IP"
DOMAIN="yourdomain.com"  # Change this to your actual domain
SSL_EMAIL="admin@yourdomain.com"  # Change this to your email

echo -e "${GREEN}🚀 Talaria Admin Dashboard - VPS Deployment${NC}"
echo "=================================================="
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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check if required commands exist
print_status "Checking system requirements..."
command -v git >/dev/null 2>&1 || print_error "git is required but not installed"
command -v nginx >/dev/null 2>&1 || print_error "nginx is required but not installed"
command -v python3 >/dev/null 2>&1 || print_error "python3 is required but not installed"
command -v node >/dev/null 2>&1 || print_error "node is required but not installed"
command -v pnpm >/dev/null 2>&1 || print_error "pnpm is required but not installed"

print_success "All required commands are available"

# Create project directory
print_status "Setting up project directory..."
sudo mkdir -p $PROJECT_DIR
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $LOG_DIR
sudo chown -R $USER:$USER $PROJECT_DIR
sudo chown -R $USER:$USER $BACKUP_DIR
sudo chown -R $USER:$USER $LOG_DIR

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    print_status "Updating existing repository..."
    cd $PROJECT_DIR
    git pull origin main
else
    print_status "Cloning repository..."
    git clone https://github.com/yourusername/talaria-admin-dashboard.git $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Setup PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE talaria_production;"
sudo -u postgres psql -c "CREATE USER talaria_user WITH PASSWORD '$(openssl rand -base64 32)';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE talaria_production TO talaria_user;"
sudo -u postgres psql -c "ALTER USER talaria_user CREATEDB;"

# Generate and set database password
DB_PASSWORD=$(openssl rand -base64 32)
sudo -u postgres psql -c "ALTER USER talaria_user PASSWORD '$DB_PASSWORD';"

# Create production environment file
print_status "Creating production environment configuration..."
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
print_status "Installing Python dependencies..."
cd $PROJECT_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Initialize database
print_status "Initializing production database..."
source venv/bin/activate
python -c "
from app import create_app, db
app = create_app('production')
with app.app_context():
    db.create_all()
    print('Database tables created successfully')
"

# Install Node.js dependencies and build frontend
print_status "Installing Node.js dependencies and building frontend..."
cd $PROJECT_DIR/frontend
pnpm install
pnpm build

# Create systemd service for the backend
print_status "Creating systemd service..."
sudo tee $SYSTEMD_DIR/talaria-backend.service << EOF
[Unit]
Description=Talaria Admin Dashboard Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/backend
Environment=PATH=$PROJECT_DIR/backend/venv/bin
ExecStart=$PROJECT_DIR/backend/venv/bin/python run_production.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Create nginx configuration
print_status "Creating nginx configuration..."
sudo tee $NGINX_SITES_DIR/talaria-admin << EOF
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
print_status "Enabling nginx site..."
sudo ln -sf $NGINX_SITES_DIR/talaria-admin $NGINX_ENABLED_DIR/
sudo nginx -t || print_error "Nginx configuration test failed"
sudo systemctl reload nginx

# Enable and start the backend service
print_status "Starting backend service..."
sudo systemctl daemon-reload
sudo systemctl enable talaria-backend
sudo systemctl start talaria-backend

# Setup SSL certificate (optional)
print_status "Setting up SSL certificate..."
if command -v certbot >/dev/null 2>&1; then
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $SSL_EMAIL --agree-tos --non-interactive
else
    echo -e "${YELLOW}⚠️ Certbot not found. SSL setup skipped. Install certbot for HTTPS.${NC}"
fi

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create backup script
print_status "Creating backup script..."
sudo tee /usr/local/bin/backup_talaria.sh << EOF
#!/bin/bash
BACKUP_FILE="$BACKUP_DIR/talaria_backup_\$(date +%Y%m%d_%H%M%S).tar.gz"
cd $PROJECT_DIR
tar -czf \$BACKUP_FILE --exclude=node_modules --exclude=.git --exclude=logs .
echo "Backup created: \$BACKUP_FILE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "talaria_backup_*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup_talaria.sh

# Setup daily backup cron job
print_status "Setting up daily backup..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup_talaria.sh") | crontab -

# Final status check
print_status "Performing final status check..."
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

print_success "🎉 Deployment completed successfully!"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update the domain name in nginx configuration if needed"
echo "2. Configure your DNS to point to this server"
echo "3. Test the application at http://$SERVER_IP or https://$DOMAIN"
echo ""
echo -e "${YELLOW}📊 Service URLs:${NC}"
echo "Frontend: http://$SERVER_IP or https://$DOMAIN"
echo "API: http://$SERVER_IP/api or https://$DOMAIN/api"
echo "Health Check: http://$SERVER_IP/health or https://$DOMAIN/health"
echo ""
echo -e "${YELLOW}🔧 Management Commands:${NC}"
echo "View logs: sudo journalctl -u talaria-backend -f"
echo "Restart backend: sudo systemctl restart talaria-backend"
echo "Check status: sudo systemctl status talaria-backend"
echo "Backup: /usr/local/bin/backup_talaria.sh"
echo ""
echo -e "${GREEN}🚀 Your Talaria Admin Dashboard is now live!${NC}"
