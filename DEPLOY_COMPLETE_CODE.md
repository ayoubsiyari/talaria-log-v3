# 🚀 Deploy Complete Code to VPS

## 🔍 Step 1: Check Current VPS Code Status

Connect to your VPS and see what's actually there:

```bash
ssh root@178.16.131.52
```

```bash
# Check if the application directory exists
ls -la /var/www/talaria-admin-dashboard/

# Check backend structure
ls -la /var/www/talaria-admin-dashboard/backend/
ls -la /var/www/talaria-admin-dashboard/backend/*.py

# Check frontend structure  
ls -la /var/www/talaria-admin-dashboard/frontend/

# Check what git repository is there
cd /var/www/talaria-admin-dashboard
git remote -v
git status
git log --oneline -5
```

## 📤 Step 2: Push Your Complete Local Code to GitHub

From your Windows machine (local project directory):

```powershell
# Navigate to your project directory
cd "C:\Users\Hades\Desktop\FINAL WEBSITE\talaria-admin-dashboard"

# Check current status
git status

# Add all your changes
git add .

# Commit with a descriptive message
git commit -m "Complete Talaria Admin Dashboard - Full affiliate system with backend, frontend, models, and migrations"

# Push to GitHub
git push origin main
```

If you encounter any issues with git push, we might need to:
- Check your GitHub authentication
- Verify the remote repository URL
- Handle any merge conflicts

## 📥 Step 3: Pull Latest Code to VPS

Back on your VPS:

```bash
# Stop services first
systemctl stop talaria-backend
systemctl stop nginx

# Navigate to application directory
cd /var/www/talaria-admin-dashboard

# Pull the latest code from GitHub
git pull origin main

# Check what we now have
ls -la backend/
ls -la frontend/

# Verify key files exist
ls -la backend/run.py
ls -la backend/models/
ls -la backend/migrations/
ls -la frontend/src/
ls -la frontend/package.json
```

## 🔧 Step 4: Setup Complete Application

### 4.1 Backend Setup

```bash
cd /var/www/talaria-admin-dashboard/backend

# Remove old virtual environment
rm -rf venv

# Create fresh virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install flask flask-sqlalchemy flask-migrate flask-cors flask-jwt-extended python-dotenv psycopg2-binary redis celery stripe python-dateutil bcrypt

# Create .env file
cat > .env << EOF
FLASK_APP=run.py
FLASK_ENV=production
DATABASE_URL=postgresql://talaria_user:talaria_secure_password_2024@localhost/talaria_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-super-secret-jwt-key-$(openssl rand -base64 32)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
EOF

# Initialize database with your models
python -c "
from run import app, db
with app.app_context():
    db.create_all()
    print('✅ Database initialized with all models')
"

# Test if backend starts
python run.py &
sleep 3
curl http://localhost:5000/api/health
pkill -f run.py
```

### 4.2 Frontend Setup

```bash
cd /var/www/talaria-admin-dashboard/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify build
ls -la build/
ls -la build/static/
```

### 4.3 Update Services

```bash
# Update systemd service to use run.py
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

[Install]
WantedBy=multi-user.target
EOF

# Update Nginx configuration
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

# Set proper permissions
chown -R root:root /var/www/talaria-admin-dashboard
chmod -R 755 /var/www/talaria-admin-dashboard

# Reload and start services
systemctl daemon-reload
systemctl start talaria-backend
systemctl start nginx
systemctl enable talaria-backend
systemctl enable nginx
```

## ✅ Step 5: Verify Complete Deployment

```bash
# Check all services
systemctl status nginx
systemctl status postgresql  
systemctl status redis-server
systemctl status talaria-backend

# Test backend API
curl http://localhost:5000/api/health

# Test frontend
curl -I http://localhost

# Check logs for any errors
journalctl -u talaria-backend -n 10 --no-pager
journalctl -u nginx -n 10 --no-pager

# Test full application
curl http://178.16.131.52
```

## 🎉 Success Indicators

Your complete deployment is successful when:

1. ✅ All services show "active (running)"
2. ✅ Backend API responds: `curl http://localhost:5000/api/health`
3. ✅ Frontend loads: Browser shows your React app at `http://178.16.131.52`
4. ✅ You can login with: `superadmin@talaria.com` / `superadmin123456`
5. ✅ All affiliate management features are visible and functional

## 🚨 If GitHub Push Fails

If you can't push to GitHub from Windows:

1. **Check repository URL:**
   ```powershell
   git remote -v
   ```

2. **Update remote URL if needed:**
   ```powershell
   git remote set-url origin https://github.com/ayoubsiyari/talaria-log-v3.git
   ```

3. **Check GitHub authentication:**
   ```powershell
   git config --global user.name "ayoubsiyari"
   git config --global user.email "your-email@example.com"
   ```

4. **Force push if necessary:**
   ```powershell
   git push -f origin main
   ```

Let me know when you're ready to start with Step 2 (pushing your local code to GitHub)!