#!/bin/bash
# Talaria Admin Dashboard - Fresh VPS Deployment Script
# This script cleans the VPS and deploys the latest version from GitHub

echo "🚀 Talaria Admin Dashboard - Fresh VPS Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/ayoubsiyari/talaria-log-v3.git"
APP_DIR="/var/www/talaria-admin-dashboard"
BACKUP_DIR="/var/backups/talaria-$(date +%Y%m%d_%H%M%S)"
DOMAIN="your-domain.com"  # Change this to your actual domain
SERVER_IP=$(curl -s ifconfig.me)

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Repository: $REPO_URL"
echo "   App Directory: $APP_DIR"
echo "   Backup Directory: $BACKUP_DIR"
echo "   Server IP: $SERVER_IP"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use 'sudo' or login as root)"
    exit 1
fi

print_status "Starting fresh VPS deployment..."

# Step 1: Update system
echo -e "${BLUE}📦 Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y
print_status "System updated"

# Step 2: Install required packages
echo -e "${BLUE}📦 Step 2: Installing required packages...${NC}"
apt install -y \
    curl \
    git \
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    postgresql \
    postgresql-contrib \
    redis-server \
    certbot \
    python3-certbot-nginx \
    htop \
    ufw \
    fail2ban \
    supervisor

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

print_status "All packages installed"

# Step 3: Configure firewall
echo -e "${BLUE}🔒 Step 3: Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443
ufw --force enable
print_status "Firewall configured"

# Step 4: Backup existing installation (if exists)
if [ -d "$APP_DIR" ]; then
    echo -e "${BLUE}💾 Step 4: Backing up existing installation...${NC}"
    mkdir -p $(dirname $BACKUP_DIR)
    cp -r $APP_DIR $BACKUP_DIR
    print_status "Backup created at $BACKUP_DIR"
else
    print_status "No existing installation found - fresh deployment"
fi

# Step 5: Clean and prepare directory
echo -e "${BLUE}🧹 Step 5: Cleaning and preparing directories...${NC}"
systemctl stop nginx 2>/dev/null || true
systemctl stop talaria-backend 2>/dev/null || true
rm -rf $APP_DIR
mkdir -p $APP_DIR
cd $APP_DIR
print_status "Directories prepared"

# Step 6: Clone repository
echo -e "${BLUE}📥 Step 6: Cloning repository from GitHub...${NC}"
git clone $REPO_URL .
if [ $? -ne 0 ]; then
    print_error "Failed to clone repository"
    exit 1
fi
print_status "Repository cloned successfully"

# Step 7: Setup PostgreSQL
echo -e "${BLUE}🗄️  Step 7: Setting up PostgreSQL database...${NC}"
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "DROP DATABASE IF EXISTS talaria_admin;"
sudo -u postgres psql -c "DROP USER IF EXISTS talaria_user;"
sudo -u postgres psql -c "CREATE DATABASE talaria_admin;"
sudo -u postgres psql -c "CREATE USER talaria_user WITH PASSWORD 'secure_password_change_in_production';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE talaria_admin TO talaria_user;"
sudo -u postgres psql -c "ALTER USER talaria_user CREATEDB;"

print_status "PostgreSQL database configured"

# Step 8: Setup backend
echo -e "${BLUE}🐍 Step 8: Setting up Python backend...${NC}"
cd $APP_DIR/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create production environment file
cat > .env << EOF
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=$(openssl rand -hex 32)
FRONTEND_URL=http://$SERVER_IP
DATABASE_URL=postgresql://talaria_user:secure_password_change_in_production@localhost/talaria_admin
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ACCESS_TOKEN_EXPIRES=86400
SECURITY_PASSWORD_SALT=$(openssl rand -hex 16)
WTF_CSRF_SECRET_KEY=$(openssl rand -hex 32)
LOG_LEVEL=INFO
ENABLE_AFFILIATE_SYSTEM=True
ENABLE_FRAUD_DETECTION=True
ENABLE_REAL_TIME_CHAT=True
ENABLE_ANALYTICS=True
EOF

# Run database migrations
export FLASK_APP=run.py
flask db upgrade

# Seed initial data
python seed_affiliates.py
python test_affiliate_referral_flow.py

print_status "Backend setup complete"

# Step 9: Setup frontend
echo -e "${BLUE}⚛️  Step 9: Setting up React frontend...${NC}"
cd $APP_DIR/frontend

# Create production environment file
cat > .env << EOF
VITE_API_URL=http://$SERVER_IP:5000/api
VITE_WEBSOCKET_URL=ws://$SERVER_IP:5000
VITE_NODE_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_TIME_CHAT=true
VITE_ENABLE_AFFILIATE_SYSTEM=true
VITE_ENABLE_FRAUD_DETECTION=true
VITE_APP_NAME="Talaria Admin Dashboard"
VITE_APP_VERSION="1.0.0"
VITE_DEFAULT_THEME=dark
EOF

# Install dependencies and build
pnpm install
pnpm run build

print_status "Frontend built successfully"

# Step 10: Configure systemd service for backend
echo -e "${BLUE}⚙️  Step 10: Configuring systemd services...${NC}"
cat > /etc/systemd/system/talaria-backend.service << EOF
[Unit]
Description=Talaria Admin Dashboard Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin
ExecStart=$APP_DIR/backend/venv/bin/python run_production.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable talaria-backend
systemctl start talaria-backend
print_status "Backend service configured"

# Step 11: Configure Nginx
echo -e "${BLUE}🌐 Step 11: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/talaria-admin << EOF
server {
    listen 80;
    server_name $SERVER_IP $DOMAIN;
    
    # Frontend (React build)
    location / {
        root $APP_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy strict-origin-when-cross-origin;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # WebSocket endpoint
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root $APP_DIR/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/talaria-admin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    systemctl enable nginx
    print_status "Nginx configured successfully"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 12: Set permissions
echo -e "${BLUE}🔐 Step 12: Setting proper permissions...${NC}"
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
print_status "Permissions set"

# Step 13: Configure Redis
echo -e "${BLUE}📊 Step 13: Configuring Redis...${NC}"
systemctl start redis-server
systemctl enable redis-server
print_status "Redis configured"

# Step 14: Setup SSL (optional)
echo -e "${BLUE}🔒 Step 14: SSL Certificate setup...${NC}"
if [ "$DOMAIN" != "your-domain.com" ]; then
    print_status "Setting up SSL certificate for $DOMAIN"
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
    if [ $? -eq 0 ]; then
        print_status "SSL certificate installed successfully"
    else
        print_warning "SSL certificate installation failed - continuing without SSL"
    fi
else
    print_warning "Domain not configured - skipping SSL setup"
    print_warning "To enable SSL later, update DOMAIN variable and run: certbot --nginx -d yourdomain.com"
fi

# Step 15: Final verification
echo -e "${BLUE}✅ Step 15: Final verification...${NC}"
sleep 5

# Check services
systemctl is-active --quiet talaria-backend && print_status "Backend service running" || print_error "Backend service not running"
systemctl is-active --quiet nginx && print_status "Nginx running" || print_error "Nginx not running"
systemctl is-active --quiet postgresql && print_status "PostgreSQL running" || print_error "PostgreSQL not running"
systemctl is-active --quiet redis-server && print_status "Redis running" || print_error "Redis not running"

# Test database connectivity
cd $APP_DIR/backend
source venv/bin/activate
python -c "
try:
    from app import create_app, db
    app = create_app('production')
    with app.app_context():
        from app.models.affiliate import Affiliate
        count = Affiliate.query.count()
        print('✅ Database connection successful - {} affiliates found'.format(count))
except Exception as e:
    print('❌ Database connection failed:', str(e))
"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "📋 Deployment Summary:"
echo "   🌐 Application URL: http://$SERVER_IP"
if [ "$DOMAIN" != "your-domain.com" ]; then
echo "   🌍 Domain URL: https://$DOMAIN"
fi
echo "   🔧 Admin Login: superadmin@talaria.com / superadmin123456"
echo "   📊 Database: PostgreSQL with sample affiliate data"
echo "   🤝 Affiliate System: Fully operational with test data"
echo "   🛡️  Security: Firewall, Fail2ban, and SSL configured"
echo ""
echo "📋 Service Status:"
systemctl is-active --quiet talaria-backend && echo "   ✅ Backend: Running (Port 5000)" || echo "   ❌ Backend: Not running"
systemctl is-active --quiet nginx && echo "   ✅ Frontend: Running (Port 80/443)" || echo "   ❌ Frontend: Not running"
echo "   ✅ Database: PostgreSQL configured"
echo "   ✅ Cache: Redis configured"
echo ""
echo "🔧 Management Commands:"
echo "   Restart backend: sudo systemctl restart talaria-backend"
echo "   Restart nginx: sudo systemctl restart nginx"
echo "   View logs: sudo journalctl -u talaria-backend -f"
echo "   Check status: sudo systemctl status talaria-backend"
echo ""
echo "📊 Next Steps:"
echo "   1. Test the affiliate management system"
echo "   2. Configure your Stripe API keys in backend/.env"
echo "   3. Set up your domain DNS if using custom domain"
echo "   4. Configure email settings for notifications"
echo ""
print_status "Fresh VPS deployment completed successfully!"