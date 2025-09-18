# Clean Deployment Script for Talaria Admin Dashboard
# This script will deploy a fresh, clean version to the VPS

Write-Host "🚀 Starting Clean Deployment of Talaria Admin Dashboard" -ForegroundColor Green

# Step 1: Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
$deploymentDir = "talaria-deployment"
if (Test-Path $deploymentDir) {
    Remove-Item -Recurse -Force $deploymentDir
}
New-Item -ItemType Directory -Path $deploymentDir | Out-Null

# Copy backend
Write-Host "📁 Copying backend files..." -ForegroundColor Yellow
Copy-Item -Recurse -Path "backend" -Destination "$deploymentDir/backend"

# Copy frontend source
Write-Host "📁 Copying frontend source..." -ForegroundColor Yellow
Copy-Item -Recurse -Path "frontend" -Destination "$deploymentDir/frontend"

# Copy essential files
Write-Host "📄 Copying configuration files..." -ForegroundColor Yellow
Copy-Item -Path "requirements.txt" -Destination "$deploymentDir/"
Copy-Item -Path ".env" -Destination "$deploymentDir/"
Copy-Item -Path "README.md" -Destination "$deploymentDir/"

# Create deployment script for VPS
Write-Host "📝 Creating VPS deployment script..." -ForegroundColor Yellow
$vpsScript = @"
#!/bin/bash
set -e

echo "🚀 Starting VPS Deployment..."

# Update system
echo "📦 Updating system packages..."
apt update -y

# Install Python and pip
echo "🐍 Installing Python and pip..."
apt install -y python3 python3-pip python3-venv python3-dev

# Install Node.js and npm
echo "📦 Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL client
echo "🗄️ Installing PostgreSQL client..."
apt install -y postgresql-client

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /var/www/talaria-admin
cd /var/www/talaria-admin

# Copy files from deployment package
echo "📋 Copying project files..."
cp -r /tmp/talaria-deployment/* .

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Create nginx configuration
echo "🌐 Creating nginx configuration..."
cat > /etc/nginx/sites-available/talaria-admin << 'EOF'
server {
    listen 80;
    server_name 178.16.131.52;

    # Frontend
    location / {
        root /var/www/talaria-admin/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
echo "🔗 Enabling nginx site..."
ln -sf /etc/nginx/sites-available/talaria-admin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Create systemd service for backend
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/talaria-backend.service << 'EOF'
[Unit]
Description=Talaria Admin Dashboard Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/talaria-admin/backend
Environment=PATH=/var/www/talaria-admin/venv/bin
ExecStart=/var/www/talaria-admin/venv/bin/python run.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/talaria-admin
chmod -R 755 /var/www/talaria-admin

# Enable and start service
echo "🚀 Starting backend service..."
systemctl daemon-reload
systemctl enable talaria-backend
systemctl start talaria-backend

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at: http://178.16.131.52"
"@

$vpsScript | Out-File -FilePath "$deploymentDir/deploy-vps.sh" -Encoding UTF8

# Create tar.gz package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "$deploymentDir/*" -DestinationPath "talaria-deployment.zip"

Write-Host "✅ Deployment package created: talaria-deployment.zip" -ForegroundColor Green
Write-Host "📤 Ready to upload to VPS!" -ForegroundColor Green
