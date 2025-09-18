#!/usr/bin/env python3
"""
Diagnose VPS environment differences
"""

import subprocess
import sys

def run_ssh_command(command):
    """Run SSH command and return output"""
    try:
        result = subprocess.run(
            f'ssh root@178.16.131.52 "{command}"',
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Timeout"
    except Exception as e:
        return -1, "", str(e)

def main():
    """Main diagnostic function"""
    print("🔍 Diagnosing VPS environment...")
    
    # Check if application is running
    print("\n1. Checking if application is running...")
    code, stdout, stderr = run_ssh_command("ps aux | grep run_production.py")
    if code == 0:
        print(f"✅ Application status: {stdout}")
    else:
        print(f"❌ Error checking application: {stderr}")
    
    # Check Python version
    print("\n2. Checking Python version...")
    code, stdout, stderr = run_ssh_command("python3 --version")
    if code == 0:
        print(f"✅ Python version: {stdout}")
    else:
        print(f"❌ Error checking Python: {stderr}")
    
    # Check if payments.py exists
    print("\n3. Checking payments.py file...")
    code, stdout, stderr = run_ssh_command("ls -la /var/www/talaria-admin/backend/app/routes/payments.py")
    if code == 0:
        print(f"✅ Payments file: {stdout}")
    else:
        print(f"❌ Error checking file: {stderr}")
    
    # Check file size
    print("\n4. Checking file size...")
    code, stdout, stderr = run_ssh_command("wc -l /var/www/talaria-admin/backend/app/routes/payments.py")
    if code == 0:
        print(f"✅ File lines: {stdout}")
    else:
        print(f"❌ Error checking file size: {stderr}")
    
    # Check if we can import the module
    print("\n5. Testing module import...")
    code, stdout, stderr = run_ssh_command("cd /var/www/talaria-admin/backend && source venv/bin/activate && python3 -c 'from app.routes.payments import payments_bp'")
    if code == 0:
        print(f"✅ Module import successful: {stdout}")
    else:
        print(f"❌ Module import failed: {stderr}")
    
    # Check recent logs
    print("\n6. Checking recent logs...")
    code, stdout, stderr = run_ssh_command("tail -10 /var/log/talaria/backend.log")
    if code == 0:
        print(f"✅ Recent logs: {stdout}")
    else:
        print(f"❌ Error checking logs: {stderr}")
    
    # Check if port 5000 is in use
    print("\n7. Checking port 5000...")
    code, stdout, stderr = run_ssh_command("netstat -tlnp | grep :5000")
    if code == 0:
        print(f"✅ Port 5000 status: {stdout}")
    else:
        print(f"❌ Port 5000 not in use: {stderr}")

if __name__ == "__main__":
    main()

