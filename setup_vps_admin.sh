#!/bin/bash

# VPS Admin Setup Script
# This script sets up the super admin user with all permissions

echo "🚀 Setting up VPS Admin with all permissions..."

# Navigate to project directory
cd /var/www/talaria-admin

# Activate virtual environment
source backend/venv/bin/activate

# Run the admin setup script
python setup_vps_admin.py

echo "✅ VPS Admin setup completed!"
echo "🔑 You can now login with:"
echo "   Email: superadmin@talaria.com"
echo "   Password: superadmin123456"
