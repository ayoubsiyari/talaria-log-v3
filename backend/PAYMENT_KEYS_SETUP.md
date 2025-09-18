# Payment Security Keys Setup Guide

## 🔑 **Your Generated Keys**

```bash
PAYMENT_ENCRYPTION_KEY=29RR8Gpkv5PfWD99wj-qVM0B86lTEyC6SrivV4iBygY
TOKENIZATION_KEY=YE--fhZkqPDsvPIBV4qTPJyShAkCJGXSw7p6GJ5S4Zg
```

## 📝 **Configuration Methods**

### **Method 1: Environment Variables (Recommended)**

#### **For Development:**
Create a `.env` file in your backend directory:
```bash
# backend/.env
PAYMENT_ENCRYPTION_KEY=29RR8Gpkv5PfWD99wj-qVM0B86lTEyC6SrivV4iBygY
TOKENIZATION_KEY=YE--fhZkqPDsvPIBV4qTPJyShAkCJGXSw7p6GJ5S4Zg
SECRET_KEY=your_secret_key_here
```

#### **For Production:**
Set environment variables on your server:
```bash
export PAYMENT_ENCRYPTION_KEY=29RR8Gpkv5PfWD99wj-qVM0B86lTEyC6SrivV4iBygY
export TOKENIZATION_KEY=YE--fhZkqPDsvPIBV4qTPJyShAkCJGXSw7p6GJ5S4Zg
```

### **Method 2: Docker Environment**
If using Docker, add to your `docker-compose.yml`:
```yaml
environment:
  - PAYMENT_ENCRYPTION_KEY=29RR8Gpkv5PfWD99wj-qVM0B86lTEyC6SrivV4iBygY
  - TOKENIZATION_KEY=YE--fhZkqPDsvPIBV4qTPJyShAkCJGXSw7p6GJ5S4Zg
```

### **Method 3: System Environment**
Add to your system environment variables:
```bash
# Windows (PowerShell)
$env:PAYMENT_ENCRYPTION_KEY="29RR8Gpkv5PfWD99wj-qVM0B86lTEyC6SrivV4iBygY"
$env:TOKENIZATION_KEY="YE--fhZkqPDsvPIBV4qTPJyShAkCJGXSw7p6GJ5S4Zg"

# Linux/Mac
export PAYMENT_ENCRYPTION_KEY="29RR8Gpkv5PfWD99wj-qVM0B86lTEyC6SrivV4iBygY"
export TOKENIZATION_KEY="YE--fhZkqPDsvPIBV4qTPJyShAkCJGXSw7p6GJ5S4Zg"
```

## 🔒 **Security Best Practices**

### **1. Key Management:**
- **Never commit keys to version control**
- **Use different keys for each environment** (dev, staging, production)
- **Rotate keys regularly** (every 90 days recommended)
- **Store keys securely** (use secret management services in production)

### **2. Environment Separation:**
```bash
# Development keys (different from production)
PAYMENT_ENCRYPTION_KEY=dev_encryption_key_here
TOKENIZATION_KEY=dev_tokenization_key_here

# Production keys (different from development)
PAYMENT_ENCRYPTION_KEY=prod_encryption_key_here
TOKENIZATION_KEY=prod_tokenization_key_here
```

### **3. Key Generation:**
To generate new keys, use:
```bash
python -c "import secrets; print('PAYMENT_ENCRYPTION_KEY=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('TOKENIZATION_KEY=' + secrets.token_urlsafe(32))"
```

## ✅ **Verification**

### **Test Configuration:**
```python
# Test if keys are properly configured
from app.services.pci_compliance_service import PCIComplianceService

try:
    service = PCIComplianceService()
    # This will raise ValueError if keys are not configured
    encryption_key = service._get_encryption_key()
    tokenization_key = service._get_tokenization_key()
    print("✅ Keys configured successfully!")
except ValueError as e:
    print(f"❌ Configuration error: {e}")
```

### **Check Encryption Requirements:**
```python
# Check if encryption requirements are met
service = PCIComplianceService()
if service._check_encryption_requirements():
    print("✅ Encryption requirements met!")
else:
    print("❌ Encryption requirements not met!")
```

## 🚨 **Important Notes**

1. **Never use the same keys across environments**
2. **Keep keys secure and never share them**
3. **Use a secret management service in production** (AWS Secrets Manager, Azure Key Vault, etc.)
4. **Monitor key usage and rotate regularly**
5. **Test key configuration before deployment**

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"PAYMENT_ENCRYPTION_KEY not configured"**
   - Check if environment variable is set
   - Verify the variable name spelling
   - Ensure the application can access the environment

2. **"Flask application context not available"**
   - Make sure you're running within a Flask application context
   - Check if the service is being initialized properly

3. **Keys not working**
   - Verify the keys are exactly as generated (no extra spaces)
   - Check if the keys are being loaded from the correct environment
   - Ensure the application is using the correct configuration class

## 📋 **Next Steps**

1. Set the environment variables using one of the methods above
2. Test the configuration using the verification code
3. Deploy to your target environment
4. Monitor the application logs for any configuration errors
5. Set up key rotation schedule for production

Your payment system is now properly secured with strong encryption keys! 🎉
