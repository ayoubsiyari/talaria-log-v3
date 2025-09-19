# 🚀 Quick Fix: Backend Server (run.py)

## 🎯 The Problem
Your systemd service is configured to run `app.py` but your server file is `run.py`!

## ⚡ Immediate Fix

Connect to your VPS and run these commands:

```bash
ssh root@178.16.131.52
```

### Step 1: Stop the Current Service
```bash
systemctl stop talaria-backend
```

### Step 2: Update Systemd Service Configuration
```bash
# Create correct systemd service file
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
ExecStart=/var/www/talaria-admin-dashboard/backend/venv/bin/python run.py
Restart=always
RestartSec=3
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=talaria-backend

[Install]
WantedBy=multi-user.target
EOF
```

### Step 3: Reload and Start Service
```bash
# Reload systemd configuration
systemctl daemon-reload

# Start the service
systemctl start talaria-backend

# Enable auto-start
systemctl enable talaria-backend

# Check status
systemctl status talaria-backend
```

### Step 4: Verify It's Working
```bash
# Check if backend is responding
curl http://localhost:5000/api/health

# Check if port 5000 is open
netstat -tlnp | grep :5000

# Check logs
journalctl -u talaria-backend -f
```

---

## 🔧 Alternative: Manual Start (If Service Still Fails)

If the systemd service still has issues:

```bash
# Stop the service
systemctl stop talaria-backend

# Start manually in background
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate
nohup python run.py > backend.log 2>&1 &

# Check if it's running
ps aux | grep run.py
curl http://localhost:5000/api/health
```

---

## 🔍 Verify Environment Setup

Make sure you have the right environment file:

```bash
cd /var/www/talaria-admin-dashboard/backend

# Check if .env exists and has correct content
cat .env

# If .env is missing, create it:
cat > .env << EOF
FLASK_APP=run.py
FLASK_ENV=production
DATABASE_URL=postgresql://talaria_user:talaria_secure_password_2024@localhost/talaria_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-super-secret-jwt-key-$(openssl rand -base64 32)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
EOF
```

---

## 🚨 Troubleshooting Commands

If you encounter issues, run these diagnostic commands:

```bash
echo "=== CHECK FILES ==="
ls -la /var/www/talaria-admin-dashboard/backend/run.py
ls -la /var/www/talaria-admin-dashboard/backend/venv/

echo -e "\n=== TEST MANUAL RUN ==="
cd /var/www/talaria-admin-dashboard/backend
source venv/bin/activate
python run.py &
sleep 5
curl http://localhost:5000/api/health
pkill -f run.py

echo -e "\n=== SERVICE STATUS ==="
systemctl status talaria-backend

echo -e "\n=== SERVICE LOGS ==="
journalctl -u talaria-backend -n 10 --no-pager
```

---

## ✅ Success Check

Your backend is working when:

1. ✅ `systemctl status talaria-backend` shows "active (running)"
2. ✅ `curl http://localhost:5000/api/health` returns a response
3. ✅ `netstat -tlnp | grep :5000` shows python process listening
4. ✅ No errors in `journalctl -u talaria-backend`

---

## 🎉 Final Verification

Once the backend is running, test your full application:

```bash
# Test backend API
curl http://localhost:5000/api/health

# Test frontend (should return HTML)
curl -I http://localhost

# Check all services
systemctl status nginx postgresql redis-server talaria-backend
```

Your Talaria Admin Dashboard should now be accessible at:
**http://178.16.131.52**

Login with:
- **Email:** superadmin@talaria.com
- **Password:** superadmin123456

---

**The key fix was changing `app.py` to `run.py` in the systemd service configuration!** 🚀