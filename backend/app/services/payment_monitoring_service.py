"""
Payment Monitoring Service
Implements real-time payment monitoring and alerting like enterprise platforms
"""

import time
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class PaymentMonitoringService:
    """Real-time payment monitoring and alerting service"""
    
    def __init__(self):
        # Load configurable thresholds from environment variables
        import os
        self.alert_thresholds = {
            'high_volume': int(os.getenv('PAYMENT_MONITORING_HIGH_VOLUME', '100')),  # payments per minute
            'high_value': float(os.getenv('PAYMENT_MONITORING_HIGH_VALUE', '10000')),  # single payment amount
            'failure_rate': float(os.getenv('PAYMENT_MONITORING_FAILURE_RATE', '0.1')),  # 10% failure rate
            'response_time': float(os.getenv('PAYMENT_MONITORING_RESPONSE_TIME', '5.0'))  # seconds
        }
        self.monitoring_metrics = {
            'total_payments': 0,
            'successful_payments': 0,
            'failed_payments': 0,
            'total_volume': 0.0,
            'average_response_time': 0.0,
            'last_reset': datetime.now(timezone.utc)
        }
        
        # Separate volume tracking for high volume detection
        self.volume_tracking = {
            'count': 0,
            'last_reset': datetime.now(timezone.utc)
        }
        
    def monitor_payment_attempt(self, payment_data: Dict[str, Any], 
                              start_time: float) -> Dict[str, Any]:
        """Monitor individual payment attempt"""
        try:
            end_time = time.time()
            response_time = end_time - start_time
            
            # Update metrics
            self._update_metrics(payment_data, response_time)
            
            # Check for anomalies
            anomalies = self._detect_anomalies(payment_data, response_time)
            
            # Generate alerts if needed
            if anomalies:
                self._generate_alerts(anomalies, payment_data)
            
            return {
                'response_time': response_time,
                'anomalies': anomalies,
                'metrics': self._get_current_metrics()
            }
            
        except Exception as e:
            logger.error(f"Payment monitoring failed: {str(e)}")
            return {'error': str(e)}
    
    def _update_metrics(self, payment_data: Dict[str, Any], response_time: float) -> None:
        """Update monitoring metrics"""
        try:
            self.monitoring_metrics['total_payments'] += 1
            
            # Update volume tracking for high volume detection
            self.volume_tracking['count'] += 1
            
            # Update success/failure counts
            if payment_data.get('status') == 'success':
                self.monitoring_metrics['successful_payments'] += 1
            else:
                self.monitoring_metrics['failed_payments'] += 1
            
            # Update volume
            amount = payment_data.get('amount', 0)
            if isinstance(amount, (int, float)):
                self.monitoring_metrics['total_volume'] += amount
            
            # Update average response time
            current_avg = self.monitoring_metrics['average_response_time']
            total_payments = self.monitoring_metrics['total_payments']
            
            self.monitoring_metrics['average_response_time'] = (
                (current_avg * (total_payments - 1) + response_time) / total_payments
            )
            
        except Exception as e:
            logger.error(f"Metrics update failed: {str(e)}")
    
    def _detect_anomalies(self, payment_data: Dict[str, Any], response_time: float) -> List[Dict[str, Any]]:
        """Detect payment anomalies"""
        anomalies = []
        
        try:
            # Check for high volume
            if self._is_high_volume():
                anomalies.append({
                    'type': 'high_volume',
                    'severity': 'warning',
                    'message': f"High payment volume detected: {self.monitoring_metrics['total_payments']} payments"
                })
            
            # Check for high value payments
            amount = payment_data.get('amount', 0)
            if amount > self.alert_thresholds['high_value']:
                anomalies.append({
                    'type': 'high_value',
                    'severity': 'info',
                    'message': f"High value payment detected: ${amount}"
                })
            
            # Check failure rate
            failure_rate = self._calculate_failure_rate()
            if failure_rate > self.alert_thresholds['failure_rate']:
                anomalies.append({
                    'type': 'high_failure_rate',
                    'severity': 'critical',
                    'message': f"High failure rate detected: {failure_rate:.2%}"
                })
            
            # Check response time
            if response_time > self.alert_thresholds['response_time']:
                anomalies.append({
                    'type': 'slow_response',
                    'severity': 'warning',
                    'message': f"Slow response time detected: {response_time:.2f}s"
                })
            
            # Check for suspicious patterns
            suspicious_patterns = self._detect_suspicious_patterns(payment_data)
            anomalies.extend(suspicious_patterns)
            
        except Exception as e:
            logger.error(f"Anomaly detection failed: {str(e)}")
        
        return anomalies
    
    def _is_high_volume(self) -> bool:
        """Check if payment volume is high"""
        try:
            # Check payments per minute
            current_time = datetime.now(timezone.utc)
            time_diff = (current_time - self.volume_tracking['last_reset']).total_seconds()
            
            if time_diff >= 60:  # Reset every minute
                self.volume_tracking['count'] = 0
                self.volume_tracking['last_reset'] = current_time
                return False
            
            self.volume_tracking['count'] += 1
            payments_per_minute = self.volume_tracking['count'] / max(time_diff / 60, 1)
            return payments_per_minute > self.alert_thresholds['high_volume']
            
        except Exception as e:
            logger.error(f"High volume check failed: {str(e)}")
            return False
    
    def _calculate_failure_rate(self) -> float:
        """Calculate current failure rate"""
        try:
            total = self.monitoring_metrics['total_payments']
            if total == 0:
                return 0.0
            
            failed = self.monitoring_metrics['failed_payments']
            return failed / total
            
        except Exception as e:
            logger.error(f"Failure rate calculation failed: {str(e)}")
            return 0.0
    
    def _detect_suspicious_patterns(self, payment_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect suspicious payment patterns"""
        anomalies = []
        
        try:
            # Check for rapid successive payments
            if self._is_rapid_successive_payments():
                anomalies.append({
                    'type': 'rapid_payments',
                    'severity': 'warning',
                    'message': 'Rapid successive payments detected'
                })
            
            # Check for unusual payment times
            if self._is_unusual_payment_time():
                anomalies.append({
                    'type': 'unusual_time',
                    'severity': 'info',
                    'message': 'Payment at unusual time detected'
                })
            
            # Check for geographic anomalies
            if self._is_geographic_anomaly(payment_data):
                anomalies.append({
                    'type': 'geographic_anomaly',
                    'severity': 'warning',
                    'message': 'Geographic anomaly detected'
                })
            
        except Exception as e:
            logger.error(f"Suspicious pattern detection failed: {str(e)}")
        
        return anomalies
    
    def _is_rapid_successive_payments(self) -> bool:
        """Check for rapid successive payments"""
        # This would check against recent payment history
        # For now, return False as placeholder
        return False
    
    def _is_unusual_payment_time(self) -> bool:
        """Check for unusual payment times"""
        current_hour = datetime.now(timezone.utc).hour
        # Unusual if between 2 AM and 5 AM
        return 2 <= current_hour <= 5
    
    def _is_geographic_anomaly(self, payment_data: Dict[str, Any]) -> bool:
        """Check for geographic anomalies"""
        # This would check against user's usual location
        # For now, return False as placeholder
        return False
    
    def _generate_alerts(self, anomalies: List[Dict[str, Any]], payment_data: Dict[str, Any]) -> None:
        """Generate alerts for anomalies"""
        try:
            for anomaly in anomalies:
                alert = {
                    'alert_id': f"monitor_{int(time.time())}_{anomaly['type']}",
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'anomaly': anomaly,
                    'payment_data': self._sanitize_payment_data(payment_data),
                    'metrics': self._get_current_metrics()
                }
                
                # Send alert based on severity
                if anomaly['severity'] == 'critical':
                    self._send_critical_alert(alert)
                elif anomaly['severity'] == 'warning':
                    self._send_warning_alert(alert)
                else:
                    self._send_info_alert(alert)
                
                logger.warning(f"Payment monitoring alert: {alert}")
                
        except Exception as e:
            logger.error(f"Alert generation failed: {str(e)}")
    
    def _sanitize_payment_data(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize payment data for alerts"""
        sanitized = {}
        sensitive_fields = ['card_number', 'cvv', 'ssn', 'password']
        
        for key, value in payment_data.items():
            if any(sensitive in key.lower() for sensitive in sensitive_fields):
                sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _send_critical_alert(self, alert: Dict[str, Any]) -> None:
        """Send critical alert"""
        # This would send to critical alerting system (PagerDuty, etc.)
        logger.critical(f"CRITICAL PAYMENT ALERT: {alert}")
    
    def _send_warning_alert(self, alert: Dict[str, Any]) -> None:
        """Send warning alert"""
        # This would send to monitoring system (Slack, email, etc.)
        logger.warning(f"PAYMENT WARNING: {alert}")
    
    def _send_info_alert(self, alert: Dict[str, Any]) -> None:
        """Send info alert"""
        # This would send to logging system
        logger.info(f"PAYMENT INFO: {alert}")
    
    def _get_current_metrics(self) -> Dict[str, Any]:
        """Get current monitoring metrics"""
        return {
            'total_payments': self.monitoring_metrics['total_payments'],
            'successful_payments': self.monitoring_metrics['successful_payments'],
            'failed_payments': self.monitoring_metrics['failed_payments'],
            'success_rate': self._calculate_success_rate(),
            'failure_rate': self._calculate_failure_rate(),
            'total_volume': self.monitoring_metrics['total_volume'],
            'average_response_time': self.monitoring_metrics['average_response_time'],
            'last_reset': self.monitoring_metrics['last_reset'].isoformat()
        }
    
    def _calculate_success_rate(self) -> float:
        """Calculate success rate"""
        try:
            total = self.monitoring_metrics['total_payments']
            if total == 0:
                return 0.0
            
            successful = self.monitoring_metrics['successful_payments']
            return successful / total
            
        except Exception as e:
            logger.error(f"Success rate calculation failed: {str(e)}")
            return 0.0
    
    def get_monitoring_dashboard_data(self) -> Dict[str, Any]:
        """Get data for monitoring dashboard"""
        try:
            return {
                'metrics': self._get_current_metrics(),
                'thresholds': self.alert_thresholds,
                'status': self._get_system_status(),
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Dashboard data generation failed: {str(e)}")
            return {'error': str(e)}
    
    def _get_system_status(self) -> str:
        """Get overall system status"""
        try:
            failure_rate = self._calculate_failure_rate()
            avg_response_time = self.monitoring_metrics['average_response_time']
            
            if failure_rate > 0.2 or avg_response_time > 10:
                return 'critical'
            elif failure_rate > 0.1 or avg_response_time > 5:
                return 'warning'
            else:
                return 'healthy'
                
        except Exception as e:
            logger.error(f"System status check failed: {str(e)}")
            return 'unknown'

# Create singleton instance
payment_monitoring_service = PaymentMonitoringService()

