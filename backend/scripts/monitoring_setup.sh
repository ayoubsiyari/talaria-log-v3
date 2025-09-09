#!/bin/bash

# Monitoring Setup Script for Talaria VPS
# This script sets up monitoring for database and application health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📊 Setting up Monitoring for Talaria VPS${NC}"
echo "=============================================="

# Configuration
LOG_DIR="/var/log/talaria"
MONITOR_DIR="/opt/talaria/monitoring"
BACKUP_DIR="/var/backups/postgresql"

# Create directories
echo -e "${YELLOW}📁 Creating monitoring directories...${NC}"
sudo mkdir -p $LOG_DIR
sudo mkdir -p $MONITOR_DIR
sudo mkdir -p $BACKUP_DIR

# Create database monitoring script
echo -e "${YELLOW}🗄️ Creating database monitoring script...${NC}"
sudo tee $MONITOR_DIR/monitor_db.sh > /dev/null << 'EOF'
#!/bin/bash

# Database monitoring script
LOG_FILE="/var/log/talaria/db_monitor.log"
DB_NAME="talaria_prod"
DB_USER="talaria_user"
PASSWORD_FILE="/etc/postgresql/talaria_password.txt"

# Check if password file exists
if [ ! -f "$PASSWORD_FILE" ]; then
    echo "$(date): ERROR - Password file not found" >> $LOG_FILE
    exit 1
fi

# Test database connection
PGPASSWORD=$(cat $PASSWORD_FILE) psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "$(date): OK - Database connection successful" >> $LOG_FILE
else
    echo "$(date): ERROR - Database connection failed" >> $LOG_FILE
    # Send alert (you can customize this)
    echo "Database connection failed at $(date)" | mail -s "Talaria DB Alert" root
fi

# Check database size
DB_SIZE=$(PGPASSWORD=$(cat $PASSWORD_FILE) psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
echo "$(date): INFO - Database size: $DB_SIZE" >> $LOG_FILE

# Check active connections
ACTIVE_CONN=$(PGPASSWORD=$(cat $PASSWORD_FILE) psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
echo "$(date): INFO - Active connections: $ACTIVE_CONN" >> $LOG_FILE

# Check for long-running queries
LONG_QUERIES=$(PGPASSWORD=$(cat $PASSWORD_FILE) psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';" | xargs)
if [ "$LONG_QUERIES" -gt 0 ]; then
    echo "$(date): WARNING - $LONG_QUERIES long-running queries detected" >> $LOG_FILE
fi

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt 10485760 ]; then
    mv $LOG_FILE ${LOG_FILE}.old
    gzip ${LOG_FILE}.old
fi
EOF

sudo chmod +x $MONITOR_DIR/monitor_db.sh

# Create application monitoring script
echo -e "${YELLOW}🚀 Creating application monitoring script...${NC}"
sudo tee $MONITOR_DIR/monitor_app.sh > /dev/null << 'EOF'
#!/bin/bash

# Application monitoring script
LOG_FILE="/var/log/talaria/app_monitor.log"

# Check if Flask app is running
if pgrep -f "python.*run.py" > /dev/null; then
    echo "$(date): OK - Flask application is running" >> $LOG_FILE
else
    echo "$(date): ERROR - Flask application is not running" >> $LOG_FILE
    # Send alert
    echo "Flask application is down at $(date)" | mail -s "Talaria App Alert" root
fi

# Check if Redis is running
if systemctl is-active --quiet redis; then
    echo "$(date): OK - Redis is running" >> $LOG_FILE
else
    echo "$(date): ERROR - Redis is not running" >> $LOG_FILE
    echo "Redis is down at $(date)" | mail -s "Talaria Redis Alert" root
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$(date): WARNING - Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
    echo "High disk usage: ${DISK_USAGE}% at $(date)" | mail -s "Talaria Disk Alert" root
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEM_USAGE" -gt 80 ]; then
    echo "$(date): WARNING - Memory usage is ${MEM_USAGE}%" >> $LOG_FILE
fi

# Check load average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
LOAD_THRESHOLD=2.0
if (( $(echo "$LOAD_AVG > $LOAD_THRESHOLD" | bc -l) )); then
    echo "$(date): WARNING - High load average: $LOAD_AVG" >> $LOG_FILE
fi

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt 10485760 ]; then
    mv $LOG_FILE ${LOG_FILE}.old
    gzip ${LOG_FILE}.old
fi
EOF

sudo chmod +x $MONITOR_DIR/monitor_app.sh

# Create backup monitoring script
echo -e "${YELLOW}📦 Creating backup monitoring script...${NC}"
sudo tee $MONITOR_DIR/monitor_backup.sh > /dev/null << 'EOF'
#!/bin/bash

# Backup monitoring script
LOG_FILE="/var/log/talaria/backup_monitor.log"
BACKUP_DIR="/var/backups/postgresql"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "$(date): ERROR - Backup directory not found" >> $LOG_FILE
    exit 1
fi

# Check for recent backups (within last 24 hours)
RECENT_BACKUPS=$(find $BACKUP_DIR -name "talaria_backup_*.sql.gz" -mtime -1 | wc -l)

if [ "$RECENT_BACKUPS" -gt 0 ]; then
    echo "$(date): OK - $RECENT_BACKUPS recent backup(s) found" >> $LOG_FILE
else
    echo "$(date): ERROR - No recent backups found" >> $LOG_FILE
    echo "No recent backups found at $(date)" | mail -s "Talaria Backup Alert" root
fi

# Check backup file sizes
for backup in $BACKUP_DIR/talaria_backup_*.sql.gz; do
    if [ -f "$backup" ]; then
        SIZE=$(du -h "$backup" | cut -f1)
        echo "$(date): INFO - Backup $(basename $backup) size: $SIZE" >> $LOG_FILE
    fi
done

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "talaria_backup_*.sql.gz" -mtime +7 -delete
echo "$(date): INFO - Cleaned old backups" >> $LOG_FILE
EOF

sudo chmod +x $MONITOR_DIR/monitor_backup.sh

# Create log rotation configuration
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/talaria > /dev/null << EOF
/var/log/talaria/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF

# Setup cron jobs for monitoring
echo -e "${YELLOW}⏰ Setting up monitoring cron jobs...${NC}"

# Database monitoring every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * $MONITOR_DIR/monitor_db.sh") | crontab -

# Application monitoring every 2 minutes
(crontab -l 2>/dev/null; echo "*/2 * * * * $MONITOR_DIR/monitor_app.sh") | crontab -

# Backup monitoring daily at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * * $MONITOR_DIR/monitor_backup.sh") | crontab -

# Create monitoring dashboard script
echo -e "${YELLOW}📊 Creating monitoring dashboard...${NC}"
sudo tee $MONITOR_DIR/dashboard.sh > /dev/null << 'EOF'
#!/bin/bash

# Simple monitoring dashboard
echo "=========================================="
echo "           TALARIA VPS MONITORING"
echo "=========================================="
echo ""

# System info
echo "SYSTEM INFORMATION:"
echo "=================="
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# Disk usage
echo "DISK USAGE:"
echo "==========="
df -h / | tail -1 | awk '{print "Root: " $5 " used (" $3 "/" $2 ")"}'
echo ""

# Memory usage
echo "MEMORY USAGE:"
echo "============="
free -h | grep Mem | awk '{print "Memory: " $3 "/" $2 " (" int($3/$2*100) "%)"}'
echo ""

# Database status
echo "DATABASE STATUS:"
echo "==============="
if pgrep -f "postgres" > /dev/null; then
    echo "PostgreSQL: ✅ Running"
else
    echo "PostgreSQL: ❌ Not running"
fi

# Application status
echo ""
echo "APPLICATION STATUS:"
echo "=================="
if pgrep -f "python.*run.py" > /dev/null; then
    echo "Flask App: ✅ Running"
else
    echo "Flask App: ❌ Not running"
fi

if systemctl is-active --quiet redis; then
    echo "Redis: ✅ Running"
else
    echo "Redis: ❌ Not running"
fi

# Recent logs
echo ""
echo "RECENT LOGS (last 10 lines):"
echo "============================"
if [ -f "/var/log/talaria/db_monitor.log" ]; then
    echo "Database Monitor:"
    tail -5 /var/log/talaria/db_monitor.log
    echo ""
fi

if [ -f "/var/log/talaria/app_monitor.log" ]; then
    echo "Application Monitor:"
    tail -5 /var/log/talaria/app_monitor.log
fi

echo ""
echo "=========================================="
EOF

sudo chmod +x $MONITOR_DIR/dashboard.sh

# Create systemd service for monitoring
echo -e "${YELLOW}🔧 Creating monitoring service...${NC}"
sudo tee /etc/systemd/system/talaria-monitor.service > /dev/null << EOF
[Unit]
Description=Talaria Monitoring Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/bin/bash $MONITOR_DIR/monitor_app.sh
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target
EOF

# Enable and start monitoring service
sudo systemctl daemon-reload
sudo systemctl enable talaria-monitor
sudo systemctl start talaria-monitor

echo -e "${GREEN}✅ Monitoring setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Monitoring Features:${NC}"
echo "✅ Database connection monitoring (every 5 min)"
echo "✅ Application health monitoring (every 2 min)"
echo "✅ Backup monitoring (daily)"
echo "✅ Log rotation (daily, keep 30 days)"
echo "✅ System resource monitoring"
echo "✅ Alert notifications via email"
echo ""
echo -e "${YELLOW}📋 Monitoring Commands:${NC}"
echo "View dashboard: sudo $MONITOR_DIR/dashboard.sh"
echo "Check logs: tail -f /var/log/talaria/*.log"
echo "Check cron jobs: crontab -l"
echo "Check service: sudo systemctl status talaria-monitor"
echo ""
echo -e "${GREEN}🔍 Your VPS is now fully monitored!${NC}"
