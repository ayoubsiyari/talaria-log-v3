# 🔧 VPS Troubleshooting & Manual Deployment

## 🚨 Step 1: Diagnose the Issues

First, let's connect to your VPS and see what went wrong:

```bash
ssh root@178.16.131.52
```

### Check System Status

Run these commands to diagnose the current state:

```bash
# Check if services are running
systemctl status nginx
systemctl status postgresql
systemctl status redis-server

# Check if our application directory exists
ls -la /var/www/
ls -la /var/www/talaria-admin-dashboard/ 2>/dev/null || echo "Directory not found"

# Check system resources
free -h
df -h

# Check recent system logs
journalctl -n 50 --no-pager

# Check if our application process is running
ps aux | grep python
ps aux | grep node
```

---

## 🛠️ Step 2: Manual Deployment (Clean Start)

Let's do a clean, step-by-step deployment:

### 2.1 Clean Previous Installation

```bash
# Stop any running services
systemctl stop nginx 2>/dev/null || true
systemctl stop talaria-backend 2>/dev/null || true

# Remove previous installation
rm -rf /var/www/talaria-admin-dashboard
rm -f /etc/systemd/system/talaria-backend.service
rm -f /etc/nginx/sites-enabled/talaria
rm -f /etc/nginx/sites-available/talaria

# Reload systemd
systemctl daemon-reload
```

### 2.2 Update System & Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip software-properties-common

# Install Python 3 and pip
apt install -y python3 python3-pip python3-venv python3-dev

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Redis
apt install -y redis-server

# Install Nginx
apt install -y nginx

# Install build essentials
apt install -y build-essential libpq-dev
```

### 2.3 Setup Database

```bash
# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE talaria_db;
CREATE USER talaria_user WITH PASSWORD 'talaria_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE talaria_db TO talaria_user;
ALTER USER talaria_user CREATEDB;
\q
EOF

# Test database connection
sudo -u postgres psql -c "SELECT version();"
```

### 2.4 Setup Redis

```bash
# Start Redis service
systemctl start redis-server
systemctl enable redis-server

# Test Redis
redis-cli ping
```

### 2.5 Clone and Setup Application

```bash
# Create application directory
mkdir -p /var/www
cd /var/www

# Clone the repository
git clone https://github.com/ayoubsiyari/talaria-log-v3.git talaria-admin-dashboard
cd talaria-admin-dashboard

# Check if files are there
ls -la
```

### 2.6 Setup Python Backend

```bash
cd /var/www/talaria-admin-dashboard/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install flask flask-sqlalchemy flask-migrate flask-cors flask-jwt-extended python-dotenv psycopg2-binary redis celery stripe python-dateutil

# Create .env file
cat > .env << EOF
FLASK_APP=app.py
FLASK_ENV=production
DATABASE_URL=postgresql://talaria_user:talaria_secure_password_2024@localhost/talaria_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-$(openssl rand -base64 32)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
EOF

# Initialize database
python app.py db init || true
python app.py db migrate -m "Initial migration" || true
python app.py db upgrade

# Create superuser
python -c "
from app import create_app, db
from models.user import User
import bcrypt

app = create_app()
with app.app_context():
    # Check if superuser exists
    existing_user = User.query.filter_by(email='superadmin@talaria.com').first()
    if not existing_user:
        hashed_password = bcrypt.hashpw('superadmin123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        superuser = User(
            email='superadmin@talaria.com',
            password=hashed_password,
            full_name='Super Admin',
            role='admin',
            is_active=True
        )
        db.session.add(superuser)
        db.session.commit()
        print('Superuser created successfully!')
    else:
        print('Superuser already exists.')
"
```

### 2.7 Setup React Frontend

```bash
cd /var/www/talaria-admin-dashboard/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify build
ls -la build/
```

### 2.8 Setup Nginx

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/talaria << 'EOF'
server {
    listen 80;
    server_name 178.16.131.52;

    # Serve React frontend
    location / {
        root /var/www/talaria-admin-dashboard/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Proxy API requests to Flask backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Handle static assets
    location /static/ {
        root /var/www/talaria-admin-dashboard/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/talaria /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

### 2.9 Setup Systemd Service

```bash
# Create systemd service file
cat > /etc/systemd/system/talaria-backend.service << 'EOF'
[Unit]
Description=Talaria Admin Dashboard Backend
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/talaria-admin-dashboard/backend
Environment=PATH=/var/www/talaria-admin-dashboard/backend/venv/bin
ExecStart=/var/www/talaria-admin-dashboard/backend/venv/bin/python app.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
chown -R www-data:www-data /var/www/talaria-admin-dashboard
chmod -R 755 /var/www/talaria-admin-dashboard

# Reload systemd and start service
systemctl daemon-reload
systemctl start talaria-backend
systemctl enable talaria-backend
```

---

## 🔍 Step 3: Verify Everything Works

```bash
# Check all services
systemctl status nginx
systemctl status postgresql
systemctl status redis-server
systemctl status talaria-backend

# Check if application is responding
curl -I http://localhost
curl http://localhost/api/health 2>/dev/null || echo "API not responding"

# Check logs if there are issues
journalctl -u talaria-backend -n 20 --no-pager
journalctl -u nginx -n 20 --no-pager

# Check if ports are open
netstat -tlnp | grep :80
netstat -tlnp | grep :5000
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Database Connection Failed
```bash
# Check PostgreSQL status
systemctl status postgresql

# Reset PostgreSQL if needed
sudo -u postgres psql -c "ALTER USER talaria_user WITH PASSWORD 'talaria_secure_password_2024';"
```

### Issue 2: Python Dependencies Failed
```bash
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install flask flask-sqlalchemy flask-migrate flask-cors flask-jwt-extended python-dotenv psycopg2-binary redis
```

### Issue 3: Node.js Build Failed
```bash
cd /var/www/talaria-admin-dashboard/frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

### Issue 4: Permission Denied
```bash
chown -R www-data:www-data /var/www/talaria-admin-dashboard
chmod -R 755 /var/www/talaria-admin-dashboard
```

### Issue 5: Service Won't Start
```bash
# Check detailed service logs
journalctl -u talaria-backend -f

# Manually test the application
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate
python app.py
```

---

## ✅ Success Verification

Your deployment is successful when:

1. ✅ `curl http://178.16.131.52` returns HTML
2. ✅ All services show "active (running)" status
3. ✅ You can access the website at http://178.16.131.52
4. ✅ You can login with superadmin@talaria.com / superadmin123456

---

## 🆘 Need Help?

If you encounter specific errors, run this command and share the output:

```bash
echo "=== SYSTEM STATUS ===" && \
systemctl status nginx postgresql redis-server talaria-backend && \
echo -e "\n=== RECENT LOGS ===" && \
journalctl -u talaria-backend -n 10 --no-pager && \
echo -e "\n=== DISK SPACE ===" && \
df -h && \
echo -e "\n=== MEMORY ===" && \
free -h
```

This will give us all the information needed to troubleshoot any remaining issues!