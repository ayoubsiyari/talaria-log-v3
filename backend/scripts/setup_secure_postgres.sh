#!/bin/bash

# Secure PostgreSQL Setup Script for VPS
# This script sets up PostgreSQL with security best practices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Setting up Secure PostgreSQL for Talaria Admin Dashboard${NC}"
echo "=================================================="

# Configuration
DB_NAME="talaria_prod"
DB_USER="talaria_user"
DB_PASSWORD=$(openssl rand -base64 32)
BACKUP_DIR="/var/backups/postgresql"
LOG_DIR="/var/log/postgresql"

# Create secure password file
PASSWORD_FILE="/etc/postgresql/talaria_password.txt"

echo -e "${YELLOW}📝 Configuration:${NC}"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Password File: $PASSWORD_FILE"
echo "Backup Directory: $BACKUP_DIR"
echo "Log Directory: $LOG_DIR"

# Update system
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
echo -e "${YELLOW}📦 Installing PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib postgresql-client

# Start and enable PostgreSQL
echo -e "${YELLOW}🚀 Starting PostgreSQL service...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create backup and log directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $LOG_DIR
sudo chown postgres:postgres $BACKUP_DIR
sudo chown postgres:postgres $LOG_DIR
sudo chmod 700 $BACKUP_DIR
sudo chmod 700 $LOG_DIR

# Store password securely
echo -e "${YELLOW}🔐 Storing database password...${NC}"
sudo mkdir -p /etc/postgresql
echo "$DB_PASSWORD" | sudo tee $PASSWORD_FILE > /dev/null
sudo chown postgres:postgres $PASSWORD_FILE
sudo chmod 600 $PASSWORD_FILE

# Create database and user
echo -e "${YELLOW}🗄️ Creating database and user...${NC}"
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create user with secure password
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Create extensions
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set connection limit
ALTER USER $DB_USER CONNECTION LIMIT 10;

-- Exit
\q
EOF

# Configure PostgreSQL for security
echo -e "${YELLOW}🔒 Configuring PostgreSQL security...${NC}"

# Backup original config
sudo cp /etc/postgresql/*/main/postgresql.conf /etc/postgresql/*/main/postgresql.conf.backup
sudo cp /etc/postgresql/*/main/pg_hba.conf /etc/postgresql/*/main/pg_hba.conf.backup

# Security configuration
sudo tee -a /etc/postgresql/*/main/postgresql.conf > /dev/null << EOF

# Security Settings
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
ssl_prefer_server_ciphers = on
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'

# Connection Settings
max_connections = 100
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '$LOG_DIR'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200

# WAL Settings
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
EOF

# Configure client authentication
sudo tee /etc/postgresql/*/main/pg_hba.conf > /dev/null << EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   $DB_NAME        $DB_USER                               md5
host    $DB_NAME        $DB_USER        127.0.0.1/32            md5
host    $DB_NAME        $DB_USER        ::1/128                 md5
host    all             all             0.0.0.0/0               reject
EOF

# Restart PostgreSQL
echo -e "${YELLOW}🔄 Restarting PostgreSQL...${NC}"
sudo systemctl restart postgresql

# Test connection
echo -e "${YELLOW}🧪 Testing database connection...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT version();"

# Create backup script
echo -e "${YELLOW}📦 Creating backup script...${NC}"
sudo tee /usr/local/bin/backup_talaria_db.sh > /dev/null << EOF
#!/bin/bash
# Backup script for Talaria database
BACKUP_FILE="$BACKUP_DIR/talaria_backup_\$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=\$(cat $PASSWORD_FILE) pg_dump -h localhost -U $DB_USER -d $DB_NAME > \$BACKUP_FILE
gzip \$BACKUP_FILE
echo "Backup created: \$BACKUP_FILE.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "talaria_backup_*.sql.gz" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup_talaria_db.sh

# Setup daily backup cron job
echo -e "${YELLOW}⏰ Setting up daily backup...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup_talaria_db.sh") | crontab -

# Create environment file template
echo -e "${YELLOW}📄 Creating environment file template...${NC}"
cat > /tmp/talaria_env_template.txt << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Security Keys (CHANGE THESE!)
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key-change-this

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# CORS Origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Environment
FLASK_ENV=production
EOF

echo -e "${GREEN}✅ PostgreSQL setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Copy the environment template:"
echo "   sudo cp /tmp/talaria_env_template.txt /path/to/your/project/backend/.env"
echo ""
echo "2. Update the .env file with your actual values"
echo ""
echo "3. Test the connection:"
echo "   PGPASSWORD=\$(cat $PASSWORD_FILE) psql -h localhost -U $DB_USER -d $DB_NAME"
echo ""
echo -e "${RED}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo "- Change default secret keys in .env file"
echo "- Configure firewall to restrict database access"
echo "- Regularly update PostgreSQL and system packages"
echo "- Monitor logs in $LOG_DIR"
echo "- Backups are stored in $BACKUP_DIR"
echo ""
echo -e "${GREEN}🔐 Database password stored in: $PASSWORD_FILE${NC}"
echo -e "${GREEN}📊 Database connection string: postgresql://$DB_USER:****@localhost:5432/$DB_NAME${NC}"
