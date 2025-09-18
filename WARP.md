# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Local Development

Start the full application (recommended):
```powershell
powershell -ExecutionPolicy Bypass -File start-clean.ps1
```

Start components individually:
```powershell
# Backend (from backend/ directory)
cd backend && python run.py

# Frontend (from frontend/ directory)
cd frontend && pnpm dev
```

### Access URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Default login: `superadmin@talaria.com` / `superadmin123456`

### Testing

Frontend testing:
```powershell
cd frontend
pnpm test              # Run tests
pnpm test:ui           # Run tests with UI
pnpm test:coverage     # Run with coverage
pnpm test:run          # Run tests once (CI mode)
```

Backend testing (referenced in CI):
```powershell
cd backend
python -m pytest tests/ -v --cov=app --cov-report=xml
```

### Linting and Code Quality

Frontend:
```powershell
cd frontend
pnpm lint              # ESLint
```

Backend (from CI configuration):
```powershell
cd backend
flake8 app/ tests/ --max-line-length=100 --exclude=__pycache__
black --check app/ tests/
mypy app/ --ignore-missing-imports
```

Pre-commit hooks (configured):
```powershell
pre-commit install
pre-commit run --all-files
```

### Build Commands

```powershell
cd frontend
pnpm build             # Production build
pnpm preview           # Preview build
```

### VPS Deployment

```powershell
# Prepare deployment package
powershell -ExecutionPolicy Bypass -File deploy-to-vps.ps1

# On VPS
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

## Architecture Overview

### Full-Stack Structure
This is a monorepo containing a **Flask backend** and **React frontend** for a trading journal admin dashboard.

### Backend (Python/Flask)
- **Framework**: Flask with SQLAlchemy, JWT auth, SocketIO
- **Database**: SQLite (development), supports PostgreSQL (production)
- **Key Features**: RBAC system, payment processing, real-time chat, fraud detection

**Core Backend Components**:
- `app/__init__.py` - Flask app factory with middleware and blueprint registration
- `app/models/` - SQLAlchemy models (User, Admin, RBAC, Payments, Journal, etc.)
- `app/routes/` - API endpoints organized by feature
- `app/services/` - Business logic (fraud detection, payment monitoring, PCI compliance)
- `app/middleware/` - RBAC middleware, security headers
- `run.py` - Development server entry point

**Authentication Flow**:
- JWT-based authentication with role-based access control
- Cookie-based auth routes (`auth_cookie.py`) alongside token-based
- Admin users bypass subscription checks
- Regular users require active subscriptions

### Frontend (React/Vite)
- **Framework**: React 19 with Vite, TypeScript support
- **UI**: Tailwind CSS + Radix UI components + Framer Motion
- **State Management**: React hooks, context providers
- **Routing**: React Router v7

**Core Frontend Structure**:
- `src/App.jsx` - Main app with authentication and routing logic  
- `src/pages/` - Page components (Dashboard, Login, User Management, etc.)
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom hooks (useAuth, usePermissions, etc.)
- `src/services/` - API clients and business logic
- `main.jsx` - App entry point with error boundary

**Key Features**:
- Real-time notifications and chat (SocketIO)
- Stripe payment integration
- Admin dashboard with user management
- Trading journal functionality
- Responsive design with dark/light themes

### Data Flow
1. **Authentication**: JWT tokens stored in localStorage, validated on backend
2. **Role Detection**: `userTypeService` determines admin status, `roleService` handles RBAC
3. **API Communication**: Centralized in `services/` with automatic token refresh
4. **Real-time**: SocketIO for live chat and notifications
5. **Payments**: Stripe integration with webhook processing

### Security Implementation
- CORS configuration with environment-specific origins
- CSRF protection with custom middleware
- Request signing service for sensitive operations
- PCI DSS compliance measures
- Fraud detection and monitoring
- Security headers middleware

### Development vs Production
- **Development**: SQLite, local CORS, debug mode
- **Production**: PostgreSQL/SQLite, HTTPS-only CORS, Gunicorn + Nginx
- Environment detection in Flask app factory handles configuration

### Package Management
- **Backend**: pip with `requirements.txt` 
- **Frontend**: pnpm with `package.json`
- **Version**: pnpm@10.4.1 specified in packageManager

## Important Notes

### User Types and Access
- **Admin Users**: Full dashboard access, no subscription required
- **Regular Users**: Subscription-gated access to trading journal features
- Authentication determines routing (`/dashboard` vs `/user-dashboard`)

### Database Models
Key models to understand: `User`, `AdminUser`, `AdminRole`, `Permission`, `JournalEntry`, `Payment`, `UserSubscription`

### Real-time Features
- Chat service initialized in app factory
- SocketIO with CORS-aware origins
- Polling fallback mechanisms

### Error Handling
- Global error boundaries in React
- Flask error handlers for 404/500
- Graceful fallbacks for service initialization failures

### CI/CD Pipeline
- GitHub Actions with separate backend/frontend testing
- Codecov integration for coverage reporting  
- Automated linting and security scanning
- Staging/production deployment workflows