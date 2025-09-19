# 🔧 Fix Backend Server Issues

## 🚨 Step 1: Check Backend Service Status

Connect to your VPS and run:
```bash
ssh root@178.16.131.52
```

Check what's wrong with the backend service:
```bash
# Check backend service status
systemctl status talaria-backend

# Check backend logs
journalctl -u talaria-backend -n 50 --no-pager

# Check if Python process is running
ps aux | grep python
ps aux | grep app.py

# Check if port 5000 is in use
netstat -tlnp | grep :5000
```

---

## 🔍 Step 2: Common Backend Issues & Fixes

### Issue A: Service Not Starting

```bash
# Stop the service first
systemctl stop talaria-backend

# Check if the application directory exists
ls -la /var/www/talaria-admin-dashboard/backend/

# Check if app.py exists
ls -la /var/www/talaria-admin-dashboard/backend/app.py

# Check virtual environment
ls -la /var/www/talaria-admin-dashboard/backend/venv/
```

### Issue B: Python Dependencies Missing

```bash
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate

# Check if dependencies are installed
pip list

# Reinstall dependencies if needed
pip install --upgrade pip
pip install flask flask-sqlalchemy flask-migrate flask-cors flask-jwt-extended python-dotenv psycopg2-binary redis celery stripe python-dateutil bcrypt
```

### Issue C: Database Connection Problems

```bash
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate

# Test database connection
python -c "
import os
from dotenv import load_dotenv
import psycopg2
load_dotenv()
try:
    conn = psycopg2.connect('postgresql://talaria_user:talaria_secure_password_2024@localhost/talaria_db')
    print('Database connection successful!')
    conn.close()
except Exception as e:
    print(f'Database connection failed: {e}')
"
```

### Issue D: Environment Variables Missing

```bash
cd /var/www/talaria-admin-dashboard/backend

# Check if .env file exists
cat .env

# If .env doesn't exist, create it
cat > .env << EOF
FLASK_APP=app.py
FLASK_ENV=production
DATABASE_URL=postgresql://talaria_user:talaria_secure_password_2024@localhost/talaria_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-super-secret-jwt-key-$(openssl rand -base64 32)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
EOF
```

---

## 🛠️ Step 3: Manual Backend Setup

If the backend still isn't working, let's set it up manually:

### 3.1 Ensure Application Code Exists

```bash
cd /var/www/talaria-admin-dashboard/backend

# If backend folder is missing or empty, clone again
if [ ! -f "app.py" ]; then
    cd /var/www
    rm -rf talaria-admin-dashboard
    git clone https://github.com/ayoubsiyari/talaria-log-v3.git talaria-admin-dashboard
    cd talaria-admin-dashboard/backend
fi
```

### 3.2 Setup Virtual Environment

```bash
cd /var/www/talaria-admin-dashboard/backend

# Remove old virtual environment and create new one
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install flask flask-sqlalchemy flask-migrate flask-cors flask-jwt-extended python-dotenv psycopg2-binary redis celery stripe python-dateutil bcrypt
```

### 3.3 Test Backend Manually

```bash
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate

# Test if app starts manually
python app.py

# If it starts, press Ctrl+C to stop it and continue with service setup
```

### 3.4 Fix Systemd Service

```bash
# Create new systemd service file
cat > /etc/systemd/system/talaria-backend.service << 'EOF'
[Unit]
Description=Talaria Admin Dashboard Backend
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/var/www/talaria-admin-dashboard/backend
Environment=PATH=/var/www/talaria-admin-dashboard/backend/venv/bin
ExecStart=/var/www/talaria-admin-dashboard/backend/venv/bin/python app.py
Restart=always
RestartSec=3
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=talaria-backend

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
chown -R root:root /var/www/talaria-admin-dashboard
chmod -R 755 /var/www/talaria-admin-dashboard

# Reload systemd
systemctl daemon-reload

# Start the service
systemctl start talaria-backend
systemctl enable talaria-backend

# Check status
systemctl status talaria-backend
```

---

## 🔍 Step 4: Alternative - Run Backend with Screen

If systemd service continues to fail, we can run the backend in a screen session:

```bash
# Install screen if not available
apt install -y screen

# Start backend in screen session
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate
screen -S talaria-backend -d -m python app.py

# Check if it's running
screen -ls
curl http://localhost:5000/api/health
```

---

## 🚨 Step 5: Quick Diagnosis Commands

Run this comprehensive check:

```bash
echo "=== BACKEND SERVICE STATUS ==="
systemctl status talaria-backend

echo -e "\n=== BACKEND LOGS ==="
journalctl -u talaria-backend -n 20 --no-pager

echo -e "\n=== PYTHON PROCESSES ==="
ps aux | grep python

echo -e "\n=== PORT 5000 USAGE ==="
netstat -tlnp | grep :5000

echo -e "\n=== APPLICATION FILES ==="
ls -la /var/www/talaria-admin-dashboard/backend/app.py 2>/dev/null || echo "app.py not found"
ls -la /var/www/talaria-admin-dashboard/backend/venv/ 2>/dev/null || echo "venv not found"

echo -e "\n=== ENVIRONMENT FILE ==="
cat /var/www/talaria-admin-dashboard/backend/.env 2>/dev/null || echo ".env not found"

echo -e "\n=== DATABASE TEST ==="
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate 2>/dev/null && python -c "
try:
    import psycopg2
    conn = psycopg2.connect('postgresql://talaria_user:talaria_secure_password_2024@localhost/talaria_db')
    print('✅ Database connection successful')
    conn.close()
except Exception as e:
    print(f'❌ Database connection failed: {e}')
" 2>/dev/null || echo "Cannot test database connection"

echo -e "\n=== CURL TEST ==="
curl -s http://localhost:5000/api/health || echo "Backend not responding"
```

---

## ✅ Success Indicators

Your backend is working when:

1. ✅ `systemctl status talaria-backend` shows "active (running)"
2. ✅ `curl http://localhost:5000/api/health` returns a response
3. ✅ No error logs in `journalctl -u talaria-backend`
4. ✅ Port 5000 is listening: `netstat -tlnp | grep :5000`

---

## 🆘 Fallback Solution

If all else fails, create a simple startup script:

```bash
# Create startup script
cat > /var/www/talaria-admin-dashboard/start_backend.sh << 'EOF'
#!/bin/bash
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate
export FLASK_APP=app.py
export FLASK_ENV=production
nohup python app.py > backend.log 2>&1 &
echo "Backend started with PID: $!"
EOF

chmod +x /var/www/talaria-admin-dashboard/start_backend.sh

# Run it
/var/www/talaria-admin-dashboard/start_backend.sh

# Check if it's running
ps aux | grep app.py
curl http://localhost:5000/api/health
```

Run these commands and let me know what errors you see!