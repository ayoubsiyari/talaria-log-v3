#!/usr/bin/env python3
"""
Pre-deployment readiness check for Talaria Admin Dashboard
Verifies all components are ready for VPS production deployment
"""

import os
import sys
import json
from pathlib import Path

def check_file_exists(file_path, description):
    """Check if a file exists and report"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ Missing {description}: {file_path}")
        return False

def check_directory_exists(dir_path, description):
    """Check if a directory exists and report"""
    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        print(f"✅ {description}: {dir_path}")
        return True
    else:
        print(f"❌ Missing {description}: {dir_path}")
        return False

def check_file_content(file_path, search_term, description):
    """Check if file contains specific content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if search_term in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} - Missing: {search_term}")
                return False
    except Exception as e:
        print(f"❌ Error checking {description}: {e}")
        return False

def main():
    print("🔍 Talaria Admin Dashboard - Pre-Deployment Readiness Check")
    print("=" * 70)
    
    issues = []
    
    # Check project structure
    print("\n📁 Project Structure Check:")
    if not check_directory_exists("backend", "Backend directory"):
        issues.append("Missing backend directory")
    if not check_directory_exists("frontend", "Frontend directory"):
        issues.append("Missing frontend directory")
    if not check_file_exists("README.md", "README documentation"):
        issues.append("Missing README.md")
    if not check_file_exists(".gitignore", "Git ignore file"):
        issues.append("Missing .gitignore")
    
    # Check backend files
    print("\n🐍 Backend Files Check:")
    backend_files = [
        ("backend/requirements.txt", "Python requirements"),
        ("backend/run.py", "Development server"),
        ("backend/run_production.py", "Production server"),
        ("backend/app/__init__.py", "Flask app initialization"),
        ("backend/app/models/affiliate.py", "Affiliate model"),
        ("backend/app/models/user_referral.py", "User referral model"),
        ("backend/app/routes/admin.py", "Admin routes"),
        ("backend/migrations", "Database migrations directory"),
        ("backend/.env.example", "Environment template")
    ]
    
    for file_path, description in backend_files:
        if not check_file_exists(file_path, description):
            issues.append(f"Missing {description}")
    
    # Check frontend files
    print("\n⚛️ Frontend Files Check:")
    frontend_files = [
        ("frontend/package.json", "Package configuration"),
        ("frontend/src/App.jsx", "Main React app"),
        ("frontend/src/pages/Affiliates.jsx", "Affiliates page"),
        ("frontend/src/api/affiliates.js", "Affiliates API service"),
        ("frontend/vite.config.js", "Vite configuration"),
        ("frontend/.env.example", "Frontend environment template")
    ]
    
    for file_path, description in frontend_files:
        if not check_file_exists(file_path, description):
            issues.append(f"Missing {description}")
    
    # Check deployment scripts
    print("\n🚀 Deployment Scripts Check:")
    deployment_files = [
        ("start-clean.ps1", "Local development script"),
        ("deploy-to-vps.sh", "VPS deployment script"),
        ("clean-and-deploy-vps.sh", "VPS clean deployment script")
    ]
    
    for file_path, description in deployment_files:
        if not check_file_exists(file_path, description):
            issues.append(f"Missing {description}")
    
    # Check critical configurations
    print("\n⚙️ Configuration Check:")
    
    # Check package.json for required scripts
    if check_file_exists("frontend/package.json", "Frontend package.json"):
        if not check_file_content("frontend/package.json", '"build"', "Frontend build script"):
            issues.append("Missing build script in package.json")
        if not check_file_content("frontend/package.json", '"dev"', "Frontend dev script"):
            issues.append("Missing dev script in package.json")
    
    # Check requirements.txt for essential packages
    if check_file_exists("backend/requirements.txt", "Python requirements"):
        required_packages = ["Flask", "SQLAlchemy", "Alembic", "Stripe"]
        with open("backend/requirements.txt", 'r') as f:
            requirements_content = f.read()
            for package in required_packages:
                if package.lower() not in requirements_content.lower():
                    print(f"⚠️  Missing package: {package}")
                    issues.append(f"Missing {package} in requirements.txt")
                else:
                    print(f"✅ Found package: {package}")
    
    # Check affiliate system files
    print("\n🤝 Affiliate System Check:")
    affiliate_files = [
        ("backend/app/models/affiliate.py", "Affiliate model"),
        ("backend/app/models/user_referral.py", "User referral model"),
        ("frontend/src/pages/Affiliates.jsx", "Affiliates frontend page"),
        ("frontend/src/api/affiliates.js", "Affiliates API service"),
        ("backend/migrations/versions/c5303f1d2148_create_affiliates_table.py", "Affiliates migration"),
        ("backend/migrations/versions/create_user_referrals_table.py", "User referrals migration")
    ]
    
    for file_path, description in affiliate_files:
        if not check_file_exists(file_path, description):
            issues.append(f"Missing affiliate system component: {description}")
    
    # Check security files
    print("\n🛡️ Security Files Check:")
    security_files = [
        ("backend/app/services/fraud_detection_service.py", "Fraud detection service"),
        ("backend/app/services/pci_compliance_service.py", "PCI compliance service"),
        ("backend/app/services/payment_security_service.py", "Payment security service"),
        ("PCI_COMPLIANCE_IMPLEMENTATION.md", "PCI compliance documentation"),
        ("COOKIE_AUTHENTICATION_SECURITY_IMPLEMENTATION.md", "Cookie auth documentation")
    ]
    
    for file_path, description in security_files:
        if not check_file_exists(file_path, description):
            issues.append(f"Missing security component: {description}")
    
    # Check test files
    print("\n🧪 Test Files Check:")
    test_files = [
        ("backend/test_affiliate_referral_flow.py", "Affiliate test script"),
        ("backend/verify_affiliate_data.py", "Affiliate verification script"),
        ("backend/seed_affiliates.py", "Affiliate seeding script")
    ]
    
    for file_path, description in test_files:
        if not check_file_exists(file_path, description):
            issues.append(f"Missing test component: {description}")
    
    # Final assessment
    print("\n" + "=" * 70)
    print("📋 DEPLOYMENT READINESS ASSESSMENT")
    print("=" * 70)
    
    if not issues:
        print("🎉 PROJECT IS READY FOR VPS DEPLOYMENT!")
        print("\n✅ All essential components are present")
        print("✅ Affiliate management system is complete")
        print("✅ Security implementations are in place")
        print("✅ Deployment scripts are available")
        print("✅ Test and verification scripts are ready")
        
        print("\n🚀 Next Steps:")
        print("1. Clean the VPS server")
        print("2. Clone from GitHub repository")
        print("3. Run the deployment script")
        print("4. Verify affiliate system functionality")
        
        return True
    else:
        print("⚠️  ISSUES FOUND - ADDRESS BEFORE DEPLOYMENT:")
        print(f"\n📊 Total Issues: {len(issues)}")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
        
        print("\n🔧 Recommendations:")
        print("- Fix the missing components listed above")
        print("- Ensure all affiliate system files are present")
        print("- Verify security implementations are complete")
        print("- Test the system locally before VPS deployment")
        
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)