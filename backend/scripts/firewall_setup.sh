#!/bin/bash

# Firewall Setup Script for Talaria VPS
# This script configures UFW firewall with security best practices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔥 Setting up Firewall for Talaria VPS${NC}"
echo "=============================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Install UFW if not present
if ! command -v ufw &> /dev/null; then
    echo -e "${YELLOW}📦 Installing UFW firewall...${NC}"
    apt update
    apt install -y ufw
fi

# Reset UFW to default
echo -e "${YELLOW}🔄 Resetting UFW to default...${NC}"
ufw --force reset

# Set default policies
echo -e "${YELLOW}🔒 Setting default policies...${NC}"
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (important - don't lock yourself out!)
echo -e "${YELLOW}🔑 Allowing SSH access...${NC}"
ufw allow ssh
ufw allow 22/tcp

# Allow HTTP and HTTPS
echo -e "${YELLOW}🌐 Allowing web traffic...${NC}"
ufw allow 80/tcp
ufw allow 443/tcp

# Allow application ports
echo -e "${YELLOW}🚀 Allowing application ports...${NC}"
ufw allow 5000/tcp  # Flask backend
ufw allow 5173/tcp  # Vite dev server
ufw allow 3000/tcp  # React production

# Allow Redis (only from localhost)
echo -e "${YELLOW}🔴 Configuring Redis access...${NC}"
ufw allow from 127.0.0.1 to any port 6379

# Allow PostgreSQL (only from localhost)
echo -e "${YELLOW}🗄️ Configuring PostgreSQL access...${NC}"
ufw allow from 127.0.0.1 to any port 5432

# Allow monitoring ports (optional)
echo -e "${YELLOW}📊 Allowing monitoring ports...${NC}"
ufw allow 8080/tcp  # Prometheus (if using)
ufw allow 9090/tcp  # Grafana (if using)

# Rate limiting for SSH
echo -e "${YELLOW}🛡️ Setting up rate limiting...${NC}"
ufw limit ssh

# Enable logging
echo -e "${YELLOW}📝 Enabling firewall logging...${NC}"
ufw logging on

# Enable UFW
echo -e "${YELLOW}🚀 Enabling UFW firewall...${NC}"
ufw --force enable

# Show status
echo -e "${GREEN}✅ Firewall setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Firewall Status:${NC}"
ufw status verbose

echo ""
echo -e "${YELLOW}📋 Allowed Services:${NC}"
echo "✅ SSH (22) - Rate limited"
echo "✅ HTTP (80)"
echo "✅ HTTPS (443)"
echo "✅ Flask Backend (5000)"
echo "✅ Vite Dev Server (5173)"
echo "✅ React Production (3000)"
echo "✅ Redis (6379) - Localhost only"
echo "✅ PostgreSQL (5432) - Localhost only"
echo "✅ Monitoring (8080, 9090)"

echo ""
echo -e "${RED}⚠️  SECURITY NOTES:${NC}"
echo "- SSH is rate-limited to prevent brute force attacks"
echo "- Database ports are restricted to localhost only"
echo "- All incoming traffic is denied by default"
echo "- Monitor logs: tail -f /var/log/ufw.log"
echo ""
echo -e "${GREEN}🔒 Your VPS is now secured with UFW firewall!${NC}"
