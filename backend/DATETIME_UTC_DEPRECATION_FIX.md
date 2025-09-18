# Datetime UTC Deprecation Fix & Configurable Thresholds

## 🚨 **Issues Fixed**

1. **Deprecated `datetime.utcnow()`**: Replaced with `datetime.now(timezone.utc)`
2. **Hardcoded Thresholds**: Made thresholds configurable via environment variables

## ✅ **Changes Applied**

### **1. Updated Import Statement**:
```python
# Before
from datetime import datetime, timedelta

# After
from datetime import datetime, timedelta, timezone
```

### **2. Replaced All `datetime.utcnow()` Calls**:
```python
# Before (DEPRECATED)
datetime.utcnow()

# After (CURRENT)
datetime.now(timezone.utc)
```

**Locations Updated**:
- Line 32: `self.monitoring_metrics['last_reset']`
- Line 141: `current_time = datetime.utcnow()`
- Line 212: `current_hour = datetime.utcnow().hour`
- Line 228: `'timestamp': datetime.utcnow().isoformat()`
- Line 309: `'last_updated': datetime.utcnow().isoformat()`

### **3. Made Thresholds Configurable**:
```python
# Before (HARDCODED)
def __init__(self):
    self.alert_thresholds = {
        'high_volume': 100,  # payments per minute
        'high_value': 10000,  # single payment amount
        'failure_rate': 0.1,  # 10% failure rate
        'response_time': 5.0  # seconds
    }

# After (CONFIGURABLE)
def __init__(self):
    # Load configurable thresholds from environment variables
    import os
    self.alert_thresholds = {
        'high_volume': int(os.getenv('PAYMENT_MONITORING_HIGH_VOLUME', '100')),  # payments per minute
        'high_value': float(os.getenv('PAYMENT_MONITORING_HIGH_VALUE', '10000')),  # single payment amount
        'failure_rate': float(os.getenv('PAYMENT_MONITORING_FAILURE_RATE', '0.1')),  # 10% failure rate
        'response_time': float(os.getenv('PAYMENT_MONITORING_RESPONSE_TIME', '5.0'))  # seconds
    }
```

## 🔧 **Environment Variables**

### **New Configuration Options**:
```bash
# Payment Monitoring Thresholds
PAYMENT_MONITORING_HIGH_VOLUME=100        # payments per minute
PAYMENT_MONITORING_HIGH_VALUE=10000       # single payment amount
PAYMENT_MONITORING_FAILURE_RATE=0.1       # 10% failure rate
PAYMENT_MONITORING_RESPONSE_TIME=5.0      # seconds
```

### **Default Values**:
- **High Volume**: 100 payments per minute
- **High Value**: $10,000 single payment amount
- **Failure Rate**: 10% failure rate threshold
- **Response Time**: 5.0 seconds response time threshold

## 🛡️ **Benefits**

### **1. Future-Proof Code**:
- **No Deprecation Warnings**: Uses current datetime API
- **Timezone Aware**: Proper UTC timezone handling
- **Python 3.12+ Compatible**: Follows current best practices

### **2. Configurable Monitoring**:
- **Environment-Specific**: Different thresholds for dev/staging/prod
- **Runtime Configuration**: No code changes needed for threshold adjustments
- **Backward Compatible**: Defaults maintain existing behavior

### **3. Operational Flexibility**:
- **Easy Tuning**: Adjust thresholds without code deployment
- **Environment Isolation**: Different settings per environment
- **Monitoring Customization**: Tailor alerts to specific needs

## 📊 **Usage Examples**

### **Development Environment**:
```bash
# More lenient thresholds for development
export PAYMENT_MONITORING_HIGH_VOLUME=200
export PAYMENT_MONITORING_HIGH_VALUE=50000
export PAYMENT_MONITORING_FAILURE_RATE=0.2
export PAYMENT_MONITORING_RESPONSE_TIME=10.0
```

### **Production Environment**:
```bash
# Stricter thresholds for production
export PAYMENT_MONITORING_HIGH_VOLUME=50
export PAYMENT_MONITORING_HIGH_VALUE=5000
export PAYMENT_MONITORING_FAILURE_RATE=0.05
export PAYMENT_MONITORING_RESPONSE_TIME=3.0
```

### **High-Volume Environment**:
```bash
# Adjusted for high-volume processing
export PAYMENT_MONITORING_HIGH_VOLUME=500
export PAYMENT_MONITORING_HIGH_VALUE=25000
export PAYMENT_MONITORING_FAILURE_RATE=0.15
export PAYMENT_MONITORING_RESPONSE_TIME=8.0
```

## 🏆 **Result**

The payment monitoring service now:
- **Uses Current API**: No deprecated `datetime.utcnow()` calls
- **Timezone Aware**: Proper UTC timezone handling
- **Configurable**: Environment-based threshold configuration
- **Flexible**: Easy to adjust monitoring parameters
- **Future-Proof**: Compatible with current and future Python versions

This ensures the service is modern, configurable, and ready for production deployment across different environments.
