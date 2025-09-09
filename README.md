# Talaria Admin Dashboard

A clean, simple admin dashboard for trading journal management.

## 🚀 Quick Start (Local Development)

1. **Start the application:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File start-clean.ps1
   ```

2. **Access the website:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

3. **Login credentials:**
   - Email: `superadmin@talaria.com`
   - Password: `superadmin123456`

## 🌐 VPS Deployment

### Quick Deployment
1. **Prepare for deployment:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File deploy-to-vps.ps1
   ```

2. **Upload to VPS and run:**
   ```bash
   git clone https://github.com/yourusername/talaria-admin-dashboard.git
   cd talaria-admin-dashboard
   chmod +x deploy-to-vps.sh
   ./deploy-to-vps.sh
   ```

3. **Access your live website:**
   - http://YOUR_VPS_IP or https://yourdomain.com

### Detailed Instructions
See `VPS_DEPLOYMENT_GUIDE.md` for complete deployment instructions.

## 📁 Project Structure

```
talaria-admin-dashboard/
├── backend/                 # Flask backend (Python)
│   ├── app/                # Main application code
│   ├── run.py              # Development startup
│   ├── run_production.py   # Production startup
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/               # Source code
│   └── package.json       # Node.js dependencies
├── start-clean.ps1        # Local development startup
├── deploy-to-vps.sh       # VPS deployment script
├── deploy-to-vps.ps1      # Windows deployment helper
└── VPS_DEPLOYMENT_GUIDE.md # Deployment instructions
```

## 🛠️ Technology Stack

- **Backend:** Flask (Python) with SQLite database
- **Frontend:** React with Vite
- **Database:** SQLite (simple, no Docker needed)
- **Authentication:** JWT tokens
- **Production:** Nginx + Gunicorn

## ✅ Features

- User authentication and management
- Admin dashboard
- Trading journal management
- Subscription management
- Clean, responsive UI
- Production-ready deployment

## 🔧 Development vs Production

### Development (Local)
- Backend: `python run.py` (port 5000)
- Frontend: `pnpm dev` (port 5173)
- Database: SQLite file
- Simple startup: `start-clean.ps1`

### Production (VPS)
- Backend: Gunicorn + systemd service
- Frontend: Nginx static files
- Database: SQLite file
- SSL: Let's Encrypt (optional)
- Deployment: `deploy-to-vps.sh`

## 📝 Notes

This is a clean, production-ready version optimized for both local development and VPS deployment.