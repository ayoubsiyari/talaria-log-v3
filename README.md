# Talaria Admin Dashboard

🚀 **Advanced Administrative Interface for Trading Platform Management**

Talaria Admin Dashboard is a comprehensive administrative interface built with React and Flask, designed for managing modern trading platforms with enterprise-grade security and scalability.

## 🌟 Key Features

### Core Administration
- **User Management**: Complete CRUD operations with role-based permissions
- **Affiliate Management**: Full affiliate partner tracking system with referral codes
- **Analytics Dashboard**: Real-time metrics, performance insights, and reporting
- **Payment Processing**: Secure payment handling with comprehensive fraud detection
- **Subscription Management**: Flexible subscription plans and automated billing
- **Support System**: Integrated ticketing with real-time chat functionality

### Affiliate Program Features ✨ *NEW*
- **Partner Onboarding**: Streamlined affiliate registration and approval process
- **Referral Code Generation**: Dynamic code creation with custom discount rates
- **Conversion Tracking**: End-to-end referral journey from click to conversion
- **Commission Management**: Automated commission calculation and payout tracking
- **Performance Analytics**: Detailed affiliate performance metrics and insights
- **Multi-tier Commission**: Support for different commission rates and performance tiers

### Security & Compliance
- **Enterprise Security**: Multi-layer security with PCI DSS compliance
- **Fraud Detection**: AI-powered fraud prevention with real-time monitoring
- **Data Protection**: End-to-end encryption and secure data handling
- **Audit Logging**: Comprehensive activity tracking and webhook security
- **RBAC System**: Granular role-based access control with permissions management

### Modern Technology Stack
- **Frontend**: React 18+ with Vite, TailwindCSS, and shadcn/ui components
- **Backend**: Flask with SQLAlchemy ORM, JWT authentication, and webhook handling
- **Database**: PostgreSQL with Alembic migrations and optimized queries
- **Payment**: Stripe integration with secure webhook processing
- **Real-time**: WebSocket support for live updates and chat functionality
- **Testing**: Comprehensive test suites for API endpoints and workflows

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (3.13 recommended)
- Node.js 18+ with pnpm
- PostgreSQL 14+ (or SQLite for development)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/talaria-admin-dashboard.git
cd talaria-admin-dashboard
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
pnpm install  # or npm install
```

4. **Environment Configuration**
```bash
# Copy and configure environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

5. **Database Setup**
```bash
cd backend
flask db upgrade

# Optional: Create sample data
python seed_affiliates.py
python test_affiliate_referral_flow.py
```

6. **Start Development Servers**
```bash
# Backend (from backend/ directory)
python run.py

# Frontend (from frontend/ directory)
pnpm run dev
```

## 🔧 Quick Start (Simplified)

For rapid local development:

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

## 🛠️ Key Components

### Backend Features
- **Flask Application**: Modular route structure with blueprints
- **SQLAlchemy Models**: Comprehensive data models with relationships
- **RBAC Middleware**: Role-based access control system
- **Payment Services**: Stripe integration with fraud detection
- **Affiliate System**: Complete referral tracking and commission management
- **Security Services**: PCI compliance, request signing, and input sanitization
- **Real-time Services**: WebSocket chat and notification system

### Frontend Features
- **Modern React**: Hooks, Context API, and component composition
- **UI Components**: shadcn/ui with custom styling and themes
- **State Management**: Efficient data fetching and caching strategies
- **Real-time Updates**: WebSocket integration for live data
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Form Handling**: Comprehensive form validation and error handling

## 📊 Affiliate Management System

The affiliate management system includes:

### Partner Management
- Create and manage affiliate partners
- Approval workflow for new applications
- Performance tracking and tier management
- Custom commission rates per partner

### Referral Tracking
- Dynamic referral code generation
- End-to-end conversion tracking
- User journey analytics (referred → registered → converted)
- Commission calculation and payout management

### Analytics & Reporting
- Real-time performance metrics
- Conversion rate analysis
- Revenue attribution
- Partner performance comparisons

## 🛠️ API Documentation

### Affiliate Endpoints
```
GET    /admin/affiliates                 # List all affiliates
POST   /admin/affiliates                 # Create new affiliate
GET    /admin/affiliates/:id             # Get specific affiliate
PUT    /admin/affiliates/:id             # Update affiliate
DELETE /admin/affiliates/:id             # Delete affiliate
GET    /admin/affiliates/:id/codes       # Get referral codes
POST   /admin/affiliates/:id/generate-code # Generate new code
GET    /admin/affiliates/:id/referrals   # Get affiliate referrals
GET    /admin/affiliates/analytics       # Get analytics data
```

### Authentication
All admin endpoints require JWT authentication with appropriate permissions.

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Backend tests
cd backend
python -m pytest

# Test affiliate system
python test_affiliate_referral_flow.py
python verify_affiliate_data.py

# Frontend tests
cd frontend
pnpm test
```

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

### Production Environment Variables
Key environment variables to configure:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Flask secret key
- `STRIPE_SECRET_KEY`: Stripe API key
- `FRONTEND_URL`: Frontend application URL
- `REDIS_URL`: Redis connection (optional)

## 📁 Project Structure

```
talaria-admin-dashboard/
├── backend/                    # Flask backend (Python)
│   ├── app/                   # Main application code
│   │   ├── models/            # SQLAlchemy models
│   │   │   ├── affiliate.py   # Affiliate partner model
│   │   │   ├── user_referral.py # Referral tracking model
│   │   │   └── ...            # Other models
│   │   ├── routes/            # API route blueprints
│   │   ├── services/          # Business logic services
│   │   └── middleware/        # Security and auth middleware
│   ├── migrations/            # Database migrations
│   ├── run.py                 # Development startup
│   ├── run_production.py      # Production startup
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React frontend
│   ├── src/                   # Source code
│   │   ├── api/               # API service layer
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   └── services/          # Frontend services
│   └── package.json           # Node.js dependencies
├── start-clean.ps1            # Local development startup
├── deploy-to-vps.sh           # VPS deployment script
└── README.md                  # This file
```

## 🛠️ Technology Stack

### Frontend
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Lucide React](https://lucide.dev/) - Icon library

### Backend
- [Flask](https://flask.palletsprojects.com/) - Web framework
- [SQLAlchemy](https://sqlalchemy.org/) - ORM
- [Alembic](https://alembic.sqlalchemy.org/) - Database migrations
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/) - JWT handling
- [Stripe](https://stripe.com/) - Payment processing

### Database & Infrastructure
- [PostgreSQL](https://postgresql.org/) - Primary database
- [SQLite](https://sqlite.org/) - Development database
- [Redis](https://redis.io/) - Caching and sessions
- [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) - Real-time features

## 📚 Documentation

- [Security Implementation](SECURITY_IMPLEMENTATION.md)
- [PCI Compliance Guide](PCI_COMPLIANCE_IMPLEMENTATION.md)
- [Cookie Authentication](COOKIE_AUTHENTICATION_SECURITY_IMPLEMENTATION.md)
- [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md)
- [Payment Security Fixes](backend/PAYMENT_SECURITY_CRITICAL_FIXES.md)

## ✅ Features

### Core Features
- User authentication and management
- Role-based access control (RBAC)
- Admin dashboard with analytics
- Trading journal management
- Subscription management
- Payment processing with Stripe
- Support ticket system
- Clean, responsive UI

### Advanced Features
- **Affiliate Management System**: Complete partner onboarding and tracking
- **Referral Code System**: Dynamic code generation with conversion tracking
- **Real-time Chat**: WebSocket-powered support chat
- **Fraud Detection**: AI-powered payment security
- **Analytics & Reporting**: Comprehensive business intelligence
- **Multi-tenant Support**: Role-based data isolation
- **API Security**: Request signing and validation

## 🔧 Development vs Production

### Development (Local)
- Backend: `python run.py` (port 5000)
- Frontend: `pnpm dev` (port 5173)
- Database: SQLite file
- Simple startup: `start-clean.ps1`

### Production (VPS)
- Backend: Gunicorn + systemd service
- Frontend: Nginx static files
- Database: PostgreSQL with connection pooling
- SSL: Let's Encrypt
- Deployment: `deploy-to-vps.sh`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comprehensive tests for new features
- Update documentation for API changes
- Ensure security best practices are followed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Security-first approach with enterprise-grade features
- Optimized for both development and production environments
- Comprehensive affiliate management system

---

**Made with ❤️ for modern trading platforms**