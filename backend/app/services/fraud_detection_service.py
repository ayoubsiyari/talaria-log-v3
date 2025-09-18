"""
Advanced Fraud Detection Service
Implements ML-based fraud detection and risk scoring like major payment processors
"""

import time
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from flask import current_app, request
import logging

logger = logging.getLogger(__name__)

class FraudDetectionService:
    """Advanced fraud detection service with ML-based risk scoring"""
    
    def __init__(self):
        self.risk_thresholds = {
            'low': 0.3,
            'medium': 0.6,
            'high': 0.8,
            'critical': 0.95
        }
        self.suspicious_patterns = {
            'email_domains': ['tempmail.com', '10minutemail.com', 'guerrillamail.com'],
            'card_bins': ['4000000000000002'],  # Test cards
            'ip_ranges': []  # Removed private IPs - can cause false positives
        }
        self.environment = self._get_environment()
        self.velocity_limits = {
            'same_email': 5,  # 5 payments per hour
            'same_ip': 10,    # 10 payments per hour
            'same_card': 3    # 3 payments per hour
        }
    
    def _get_environment(self):
        """Get current environment for fraud detection configuration"""
        try:
            from flask import current_app
            return current_app.config.get('ENVIRONMENT', 'development')
        except RuntimeError:
            # Flask context not available
            return 'development'
    
    def _get_client_ip(self) -> str:
        """Extract real client IP address, checking proxy headers first"""
        try:
            from flask import request
            
            # Check X-Forwarded-For header (most common)
            forwarded_for = request.headers.get('X-Forwarded-For', '')
            if forwarded_for:
                # X-Forwarded-For can contain multiple IPs, take the first one
                client_ip = forwarded_for.split(',')[0].strip()
                if self._is_valid_ip(client_ip):
                    return client_ip
            
            # Check X-Real-IP header (alternative)
            real_ip = request.headers.get('X-Real-IP', '')
            if real_ip and self._is_valid_ip(real_ip):
                return real_ip
            
            # Check X-Forwarded header (less common)
            forwarded = request.headers.get('X-Forwarded', '')
            if forwarded:
                # Parse for IP in format like "for=192.168.1.1"
                for part in forwarded.split(';'):
                    if part.strip().startswith('for='):
                        client_ip = part.split('=')[1].strip()
                        if self._is_valid_ip(client_ip):
                            return client_ip
            
            # Fall back to direct connection IP
            return request.remote_addr or 'unknown'
            
        except Exception as e:
            logger.warning(f"Error extracting client IP: {str(e)}")
            return 'unknown'
    
    def _is_valid_ip(self, ip_address: str) -> bool:
        """Validate IP address format"""
        if not ip_address or ip_address == 'unknown':
            return False
        
        # Basic IP validation (IPv4)
        parts = ip_address.split('.')
        if len(parts) != 4:
            return False
        
        try:
            for part in parts:
                num = int(part)
                if not 0 <= num <= 255:
                    return False
            return True
        except ValueError:
            return False
        
    def analyze_payment_risk(self, payment_data: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze payment for fraud risk using multiple factors"""
        try:
            risk_factors = []
            risk_score = 0.0
            
            # Email analysis
            email_risk = self._analyze_email_risk(payment_data.get('customer_email', ''))
            risk_factors.extend(email_risk['factors'])
            risk_score += email_risk['score'] * 0.2
            
            # IP analysis - get real client IP, checking proxy headers first
            ip_address = self._get_client_ip()
            ip_risk = self._analyze_ip_risk(ip_address)
            risk_factors.extend(ip_risk['factors'])
            risk_score += ip_risk['score'] * 0.25
            
            # Card analysis
            card_risk = self._analyze_card_risk(payment_data.get('card_data', {}))
            risk_factors.extend(card_risk['factors'])
            risk_score += card_risk['score'] * 0.3
            
            # Velocity analysis
            velocity_risk = self._analyze_velocity_risk(payment_data, user_data)
            risk_factors.extend(velocity_risk['factors'])
            risk_score += velocity_risk['score'] * 0.15
            
            # Behavioral analysis
            behavior_risk = self._analyze_behavioral_patterns(payment_data, user_data)
            risk_factors.extend(behavior_risk['factors'])
            risk_score += behavior_risk['score'] * 0.1
            
            # Determine risk level
            risk_level = self._determine_risk_level(risk_score)
            
            # Generate recommendation
            recommendation = self._generate_recommendation(risk_level, risk_factors)
            
            # Persist fraud alert if risk is significant
            if risk_level in ['medium', 'high', 'critical']:
                self._persist_fraud_alert(
                    alert_type='general_fraud',
                    severity=risk_level,
                    risk_score=min(risk_score, 1.0),
                    title=f"Payment Fraud Alert - {risk_level.upper()} Risk",
                    description=f"Payment flagged with {risk_level} risk level. Score: {min(risk_score, 1.0):.2f}",
                    risk_factors=risk_factors,
                    payment_data=payment_data,
                    user_data=user_data
                )
            
            return {
                'risk_score': min(risk_score, 1.0),
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'recommendation': recommendation,
                'requires_manual_review': risk_level in ['high', 'critical'],
                'should_block': risk_level == 'critical',
                'analysis_timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Fraud analysis failed: {str(e)}")
            return {
                'risk_score': 0.5,
                'risk_level': 'medium',
                'risk_factors': ['Analysis failed'],
                'recommendation': 'Manual review required',
                'requires_manual_review': True,
                'should_block': False,
                'analysis_timestamp': datetime.utcnow().isoformat()
            }
    
    def _analyze_email_risk(self, email: str) -> Dict[str, Any]:
        """Analyze email for fraud indicators"""
        factors = []
        score = 0.0
        
        if not email:
            factors.append('No email provided')
            score += 0.3
            return {'factors': factors, 'score': score}
        
        # Check for disposable email domains
        domain = email.split('@')[-1].lower()
        if domain in self.suspicious_patterns['email_domains']:
            factors.append('Disposable email domain detected')
            score += 0.4
        
        # Check for suspicious patterns
        if any(pattern in email.lower() for pattern in ['test', 'fake', 'dummy']):
            factors.append('Suspicious email pattern')
            score += 0.3
        
        # Check email age (if available)
        # This would require integration with email verification service
        
        return {'factors': factors, 'score': min(score, 1.0)}
    
    def _analyze_ip_risk(self, ip_address: str) -> Dict[str, Any]:
        """Analyze IP address for fraud indicators"""
        factors = []
        score = 0.0
        
        if not ip_address:
            factors.append('No IP address')
            score += 0.2
            return {'factors': factors, 'score': score}
        
        # Check for suspicious IP ranges (environment-aware)
        if self._is_suspicious_ip(ip_address):
            factors.append('Suspicious IP address')
            score += 0.3
        
        # Check for VPN/Proxy indicators
        if self._is_vpn_or_proxy(ip_address):
            factors.append('VPN/Proxy detected')
            score += 0.4
            
            # Persist VPN/Proxy alert
            self._persist_fraud_alert(
                alert_type='vpn_proxy',
                severity='high',
                risk_score=0.4,
                title="VPN/Proxy Detection",
                description=f"IP address {ip_address} identified as VPN or proxy",
                risk_factors=['VPN/Proxy detected'],
                payment_data={},
                user_data={}
            )
        
        # Check geolocation (if available)
        # This would require integration with IP geolocation service
        
        return {'factors': factors, 'score': min(score, 1.0)}
    
    def _analyze_card_risk(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze card data for fraud indicators"""
        factors = []
        score = 0.0
        
        if not card_data:
            factors.append('No card data provided')
            score += 0.5
            return {'factors': factors, 'score': score}
        
        card_number = card_data.get('card_number', '')
        
        # Check for test card numbers
        if card_number in self.suspicious_patterns['card_bins']:
            factors.append('Test card number detected')
            score += 0.6
        
        # Check BIN (Bank Identification Number)
        if len(card_number) >= 6:
            bin_number = card_number[:6]
            if self._is_high_risk_bin(bin_number):
                factors.append('High-risk BIN detected')
                score += 0.3
                
                # Persist high-risk BIN alert
                self._persist_fraud_alert(
                    alert_type='high_risk_bin',
                    severity='high',
                    risk_score=0.3,
                    title="High-Risk BIN Detection",
                    description=f"Card BIN {bin_number} identified as high-risk",
                    risk_factors=['High-risk BIN detected'],
                    payment_data={'card_data': card_data},
                    user_data={}
                )
        
        # Check card validation
        if not self._validate_card_number(card_number):
            factors.append('Invalid card number')
            score += 0.4
        
        return {'factors': factors, 'score': min(score, 1.0)}
    
    def _analyze_velocity_risk(self, payment_data: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze payment velocity for fraud indicators"""
        factors = []
        score = 0.0
        
        email = payment_data.get('customer_email', '')
        ip_address = self._get_client_ip()
        
        # Check email velocity
        if self._check_velocity_limit('email', email, self.velocity_limits['same_email']):
            factors.append('High email velocity detected')
            score += 0.4
            
            # Persist velocity alert
            self._persist_fraud_alert(
                alert_type='velocity_limit',
                severity='high',
                risk_score=0.4,
                title="High Email Velocity Detected",
                description=f"Email {email} exceeded velocity limit of {self.velocity_limits['same_email']} per hour",
                risk_factors=['High email velocity detected'],
                payment_data=payment_data,
                user_data=user_data
            )
        
        # Check IP velocity
        if self._check_velocity_limit('ip', ip_address, self.velocity_limits['same_ip']):
            factors.append('High IP velocity detected')
            score += 0.5
            
            # Persist IP velocity alert
            self._persist_fraud_alert(
                alert_type='velocity_limit',
                severity='high',
                risk_score=0.5,
                title="High IP Velocity Detected",
                description=f"IP {ip_address} exceeded velocity limit of {self.velocity_limits['same_ip']} per hour",
                risk_factors=['High IP velocity detected'],
                payment_data=payment_data,
                user_data=user_data
            )
        
        # Check card velocity
        card_number = payment_data.get('card_data', {}).get('card_number', '')
        if card_number and self._check_velocity_limit('card', card_number, self.velocity_limits['same_card']):
            factors.append('High card velocity detected')
            score += 0.6
            
            # Persist card velocity alert
            self._persist_fraud_alert(
                alert_type='velocity_limit',
                severity='critical',
                risk_score=0.6,
                title="High Card Velocity Detected",
                description=f"Card ending in {card_number[-4:]} exceeded velocity limit of {self.velocity_limits['same_card']} per hour",
                risk_factors=['High card velocity detected'],
                payment_data=payment_data,
                user_data=user_data
            )
        
        return {'factors': factors, 'score': min(score, 1.0)}
    
    def _analyze_behavioral_patterns(self, payment_data: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze behavioral patterns for fraud indicators"""
        factors = []
        score = 0.0
        
        # Check for unusual payment amounts
        amount = payment_data.get('amount', 0)
        if amount > 10000:  # High amount
            factors.append('Unusually high payment amount')
            score += 0.3
        
        # Check for round numbers (potential test payments)
        if amount > 0 and amount % 100 == 0:
            factors.append('Round number payment amount')
            score += 0.1
        
        # Check for rapid form submission
        if self._is_rapid_submission():
            factors.append('Rapid form submission detected')
            score += 0.2
            
            # Persist rapid submission alert
            self._persist_fraud_alert(
                alert_type='rapid_submission',
                severity='medium',
                risk_score=0.2,
                title="Rapid Form Submission Detected",
                description="Form submitted too rapidly, possible automated attack",
                risk_factors=['Rapid form submission detected'],
                payment_data=payment_data,
                user_data=user_data
            )
        
        return {'factors': factors, 'score': min(score, 1.0)}
    
    def _is_suspicious_ip(self, ip_address: str) -> bool:
        """Check if IP address is suspicious based on environment"""
        # In development, be more lenient with private IPs
        if self.environment == 'development':
            # Only flag obviously suspicious IPs in development
            suspicious_indicators = [
                '0.0.0.0',  # Invalid IP
                '127.0.0.1'  # Localhost (might be suspicious in some contexts)
            ]
            return ip_address in suspicious_indicators
        
        # In production, use more sophisticated IP analysis
        # Private IPs are not inherently suspicious in production
        # Focus on known malicious IP ranges, VPNs, proxies, etc.
        return False
    
    def _is_vpn_or_proxy(self, ip_address: str) -> bool:
        """Check if IP is VPN or proxy using multiple detection methods"""
        if not ip_address or ip_address == 'unknown':
            return False
        
        try:
            # Method 1: Check against known VPN/Proxy IP ranges
            if self._check_known_vpn_ranges(ip_address):
                return True
            
            # Method 2: Check for common VPN/Proxy patterns
            if self._check_vpn_patterns(ip_address):
                return True
            
            # Method 3: Check against database of known VPN/Proxy IPs
            if self._check_vpn_database(ip_address):
                return True
            
            # Method 4: Check for suspicious port patterns (if available)
            if self._check_suspicious_ports(ip_address):
                return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Error checking VPN/Proxy for IP {ip_address}: {str(e)}")
            return False
    
    def _check_known_vpn_ranges(self, ip_address: str) -> bool:
        """Check against known VPN/Proxy IP ranges"""
        # Known VPN/Proxy service IP ranges (simplified list)
        vpn_ranges = [
            '10.0.0.0/8',      # Private range (some VPNs)
            '172.16.0.0/12',   # Private range (some VPNs)
            '192.168.0.0/16',  # Private range (some VPNs)
            # Add more known VPN ranges as needed
        ]
        
        # Check if IP falls within known VPN ranges
        for range_str in vpn_ranges:
            if self._ip_in_range(ip_address, range_str):
                return True
        
        return False
    
    def _check_vpn_patterns(self, ip_address: str) -> bool:
        """Check for common VPN/Proxy patterns"""
        # Check for common VPN/Proxy indicators
        suspicious_patterns = [
            # Common VPN service patterns
            'vpn', 'proxy', 'tor', 'anonymizer',
            # Common datacenter patterns
            'datacenter', 'cloud', 'hosting'
        ]
        
        # This would typically involve reverse DNS lookup
        # For now, return False as we don't have DNS resolution
        return False
    
    def _check_vpn_database(self, ip_address: str) -> bool:
        """Check against database of known VPN/Proxy IPs"""
        try:
            # This would query a database of known VPN/Proxy IPs
            # For now, implement a simple in-memory check
            known_vpn_ips = {
                # Add known VPN/Proxy IPs here
                # This would typically be loaded from a database
            }
            
            return ip_address in known_vpn_ips
            
        except Exception as e:
            logger.warning(f"Error checking VPN database for IP {ip_address}: {str(e)}")
            return False
    
    def _check_suspicious_ports(self, ip_address: str) -> bool:
        """Check for suspicious port patterns"""
        # This would check if the IP is using suspicious ports
        # For now, return False as we don't have port information
        return False
    
    def _ip_in_range(self, ip_address: str, ip_range: str) -> bool:
        """Check if IP address is in the given range"""
        try:
            import ipaddress
            
            # Parse the IP address and range
            ip = ipaddress.ip_address(ip_address)
            network = ipaddress.ip_network(ip_range, strict=False)
            
            return ip in network
            
        except Exception as e:
            logger.warning(f"Error checking IP range {ip_address} in {ip_range}: {str(e)}")
            return False
    
    def _is_high_risk_bin(self, bin_number: str) -> bool:
        """Check if BIN is high risk using multiple detection methods"""
        if not bin_number or len(bin_number) < 6:
            return False
        
        try:
            # Method 1: Check against known high-risk BINs
            if self._check_known_high_risk_bins(bin_number):
                return True
            
            # Method 2: Check for suspicious BIN patterns
            if self._check_suspicious_bin_patterns(bin_number):
                return True
            
            # Method 3: Check against database of high-risk BINs
            if self._check_high_risk_bin_database(bin_number):
                return True
            
            # Method 4: Check for prepaid/gift card patterns
            if self._check_prepaid_card_patterns(bin_number):
                return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Error checking high-risk BIN {bin_number}: {str(e)}")
            return False
    
    def _check_known_high_risk_bins(self, bin_number: str) -> bool:
        """Check against known high-risk BINs"""
        # Known high-risk BINs (simplified list)
        high_risk_bins = {
            # Prepaid card BINs (often used for fraud)
            '400000', '400001', '400002',  # Test cards
            '424242', '555555', '666666',  # Common test BINs
            '411111', '4000000000000002',  # Stripe test cards
            
            # Known fraudulent BINs (examples)
            '123456', '000000', '999999',  # Obviously fake
            
            # Add more known high-risk BINs as needed
        }
        
        return bin_number in high_risk_bins
    
    def _check_suspicious_bin_patterns(self, bin_number: str) -> bool:
        """Check for suspicious BIN patterns"""
        # Check for obviously fake patterns
        suspicious_patterns = [
            # All same digits
            bin_number == bin_number[0] * len(bin_number),
            # Sequential patterns
            bin_number in ['123456', '234567', '345678', '456789'],
            # Reverse sequential
            bin_number in ['654321', '765432', '876543', '987654'],
            # All zeros
            bin_number == '0' * len(bin_number),
            # All nines
            bin_number == '9' * len(bin_number),
        ]
        
        return any(suspicious_patterns)
    
    def _check_high_risk_bin_database(self, bin_number: str) -> bool:
        """Check against database of high-risk BINs"""
        try:
            # This would query a database of high-risk BINs
            # For now, implement a simple in-memory check
            high_risk_bin_database = {
                # This would typically be loaded from a database
                # containing BINs known to be associated with fraud
            }
            
            return bin_number in high_risk_bin_database
            
        except Exception as e:
            logger.warning(f"Error checking high-risk BIN database for {bin_number}: {str(e)}")
            return False
    
    def _check_prepaid_card_patterns(self, bin_number: str) -> bool:
        """Check for prepaid/gift card patterns"""
        # Prepaid cards are often used for fraud
        # This is a simplified check - in reality, you'd use a BIN database
        prepaid_indicators = [
            # Common prepaid card BIN patterns
            bin_number.startswith('400000'),  # Test cards
            bin_number.startswith('424242'),  # Stripe test
            bin_number.startswith('555555'),  # Common test
        ]
        
        return any(prepaid_indicators)
    
    def _validate_card_number(self, card_number: str) -> bool:
        """Validate card number using Luhn algorithm"""
        if not card_number or len(card_number) < 13:
            return False
        
        # Remove spaces and dashes
        card_number = card_number.replace(' ', '').replace('-', '')
        
        # Luhn algorithm
        def luhn_checksum(card_num):
            def digits_of(n):
                return [int(d) for d in str(n)]
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d*2))
            return checksum % 10
        
        return luhn_checksum(card_number) == 0
    
    def _check_velocity_limit(self, limit_type: str, identifier: str, limit: int) -> bool:
        """Check if velocity limit is exceeded using in-memory cache"""
        if not identifier or limit <= 0:
            return False
        
        try:
            # Get current timestamp
            current_time = time.time()
            
            # Create cache key
            cache_key = f"{limit_type}:{identifier}"
            
            # Initialize cache if not exists
            if not hasattr(self, '_velocity_cache'):
                self._velocity_cache = {}
            
            # Clean old entries (older than 1 hour)
            self._clean_velocity_cache(current_time)
            
            # Get existing entries for this identifier
            if cache_key not in self._velocity_cache:
                self._velocity_cache[cache_key] = []
            
            # Add current timestamp
            self._velocity_cache[cache_key].append(current_time)
            
            # Count entries within the time window (1 hour)
            time_window = 3600  # 1 hour in seconds
            recent_entries = [
                timestamp for timestamp in self._velocity_cache[cache_key]
                if current_time - timestamp <= time_window
            ]
            
            # Update cache with only recent entries
            self._velocity_cache[cache_key] = recent_entries
            
            # Check if limit is exceeded
            return len(recent_entries) > limit
            
        except Exception as e:
            logger.warning(f"Error checking velocity limit for {limit_type}:{identifier}: {str(e)}")
            return False
    
    def _clean_velocity_cache(self, current_time: float):
        """Clean old entries from velocity cache"""
        try:
            if not hasattr(self, '_velocity_cache'):
                return
            
            time_window = 3600  # 1 hour in seconds
            cutoff_time = current_time - time_window
            
            # Remove old entries
            for cache_key in list(self._velocity_cache.keys()):
                self._velocity_cache[cache_key] = [
                    timestamp for timestamp in self._velocity_cache[cache_key]
                    if timestamp > cutoff_time
                ]
                
                # Remove empty entries
                if not self._velocity_cache[cache_key]:
                    del self._velocity_cache[cache_key]
                    
        except Exception as e:
            logger.warning(f"Error cleaning velocity cache: {str(e)}")
    
    def _get_velocity_count(self, limit_type: str, identifier: str) -> int:
        """Get current velocity count for an identifier"""
        try:
            if not hasattr(self, '_velocity_cache'):
                return 0
            
            cache_key = f"{limit_type}:{identifier}"
            if cache_key not in self._velocity_cache:
                return 0
            
            current_time = time.time()
            time_window = 3600  # 1 hour in seconds
            
            recent_entries = [
                timestamp for timestamp in self._velocity_cache[cache_key]
                if current_time - timestamp <= time_window
            ]
            
            return len(recent_entries)
            
        except Exception as e:
            logger.warning(f"Error getting velocity count for {limit_type}:{identifier}: {str(e)}")
            return 0
    
    def _is_rapid_submission(self) -> bool:
        """Check if form was submitted too rapidly using session tracking"""
        try:
            from flask import request, session
            
            # Get current timestamp
            current_time = time.time()
            
            # Initialize session tracking if not exists
            if 'submission_times' not in session:
                session['submission_times'] = []
            
            # Get existing submission times
            submission_times = session.get('submission_times', [])
            
            # Clean old entries (older than 5 minutes)
            time_window = 300  # 5 minutes in seconds
            cutoff_time = current_time - time_window
            recent_submissions = [
                timestamp for timestamp in submission_times
                if timestamp > cutoff_time
            ]
            
            # Add current submission
            recent_submissions.append(current_time)
            
            # Update session with recent submissions
            session['submission_times'] = recent_submissions
            
            # Check for rapid submission patterns
            if len(recent_submissions) >= 3:  # 3 submissions in 5 minutes
                return True
            
            # Check for very rapid submissions (within 10 seconds)
            if len(recent_submissions) >= 2:
                time_diff = recent_submissions[-1] - recent_submissions[-2]
                if time_diff < 10:  # Less than 10 seconds
                    return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Error checking rapid submission: {str(e)}")
            return False
    
    def _check_submission_velocity(self, time_window: int = 300) -> int:
        """Check submission velocity within a time window"""
        try:
            from flask import session
            
            current_time = time.time()
            cutoff_time = current_time - time_window
            
            submission_times = session.get('submission_times', [])
            recent_submissions = [
                timestamp for timestamp in submission_times
                if timestamp > cutoff_time
            ]
            
            return len(recent_submissions)
            
        except Exception as e:
            logger.warning(f"Error checking submission velocity: {str(e)}")
            return 0
    
    def _reset_submission_tracking(self):
        """Reset submission tracking for testing or manual reset"""
        try:
            from flask import session
            
            if 'submission_times' in session:
                del session['submission_times']
                
        except Exception as e:
            logger.warning(f"Error resetting submission tracking: {str(e)}")
    
    def _get_submission_stats(self) -> dict:
        """Get submission statistics for monitoring"""
        try:
            from flask import session
            
            current_time = time.time()
            submission_times = session.get('submission_times', [])
            
            if not submission_times:
                return {
                    'total_submissions': 0,
                    'recent_submissions_5min': 0,
                    'recent_submissions_1min': 0,
                    'last_submission': None,
                    'time_since_last': None
                }
            
            # Calculate statistics
            recent_5min = len([
                t for t in submission_times
                if current_time - t <= 300  # 5 minutes
            ])
            
            recent_1min = len([
                t for t in submission_times
                if current_time - t <= 60  # 1 minute
            ])
            
            last_submission = max(submission_times) if submission_times else None
            time_since_last = current_time - last_submission if last_submission else None
            
            return {
                'total_submissions': len(submission_times),
                'recent_submissions_5min': recent_5min,
                'recent_submissions_1min': recent_1min,
                'last_submission': last_submission,
                'time_since_last': time_since_last
            }
            
        except Exception as e:
            logger.warning(f"Error getting submission stats: {str(e)}")
            return {}
    
    def _persist_fraud_alert(self, alert_type: str, severity: str, risk_score: float, 
                           title: str, description: str, risk_factors: List[str] = None, 
                           payment_data: Dict[str, Any] = None, user_data: Dict[str, Any] = None) -> Optional[Any]:
        """Persist fraud alert to database"""
        try:
            from ..models.fraud_alert import FraudAlert, AlertType, AlertSeverity
            
            # Map string values to enums
            alert_type_enum = getattr(AlertType, alert_type.upper(), AlertType.GENERAL_FRAUD)
            severity_enum = getattr(AlertSeverity, severity.upper(), AlertSeverity.MEDIUM)
            
            # Extract relevant data
            ip_address = self._get_client_ip() if hasattr(self, '_get_client_ip') else 'unknown'
            session_id = request.cookies.get('session') if request else None
            
            # Extract payment information
            amount = None
            currency = 'USD'
            card_last_four = None
            card_bin = None
            card_brand = None
            customer_email = None
            
            if payment_data:
                amount = payment_data.get('amount')
                currency = payment_data.get('currency', 'USD')
                card_data = payment_data.get('card_data', {})
                card_number = card_data.get('card_number', '')
                if card_number and len(card_number) >= 4:
                    card_last_four = card_number[-4:]
                if card_number and len(card_number) >= 6:
                    card_bin = card_number[:6]
                card_brand = card_data.get('brand', '')
                customer_email = payment_data.get('customer_email')
            
            # Extract user information
            user_id = None
            if user_data:
                user_id = user_data.get('user_id')
                if not customer_email and user_data.get('email'):
                    customer_email = user_data.get('email')
            
            # Create alert details
            details = {
                'risk_factors': risk_factors or [],
                'ip_address': ip_address,
                'session_id': session_id,
                'user_agent': request.headers.get('User-Agent') if request else None,
                'referer': request.headers.get('Referer') if request else None,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Create the alert
            alert = FraudAlert.create_alert(
                alert_type=alert_type_enum,
                severity=severity_enum,
                risk_score=risk_score,
                title=title,
                description=description,
                risk_factors=risk_factors or [],
                user_id=user_id,
                session_id=session_id,
                ip_address=ip_address,
                amount=amount,
                currency=currency,
                card_last_four=card_last_four,
                card_bin=card_bin,
                card_brand=card_brand,
                customer_email=customer_email,
                details=details
            )
            
            logger.info(f"Fraud alert persisted: {alert.alert_id} - {alert_type} - {severity}")
            
            # Update fraud patterns
            self._update_fraud_patterns(alert_type, ip_address, risk_score, details)
            
            # Send notifications if configured
            self._send_alert_notifications(alert)
            
            return alert
            
        except Exception as e:
            logger.error(f"Error persisting fraud alert: {str(e)}")
            return None
    
    def _update_fraud_patterns(self, alert_type: str, pattern_key: str, risk_score: float, details: Dict[str, Any]):
        """Update fraud patterns for recurring analysis"""
        try:
            from ..models.fraud_alert import FraudPattern, AlertSeverity
            
            # Find existing pattern or create new one
            pattern = FraudPattern.query.filter_by(
                pattern_type=alert_type,
                pattern_key=pattern_key,
                is_active=True
            ).first()
            
            if pattern:
                # Update existing pattern
                pattern.update_pattern(risk_score)
            else:
                # Create new pattern
                pattern = FraudPattern(
                    pattern_type=alert_type,
                    pattern_key=pattern_key,
                    risk_score=risk_score,
                    details=details
                )
                
                # Set initial risk level
                if risk_score >= 0.9:
                    pattern.risk_level = AlertSeverity.CRITICAL
                elif risk_score >= 0.7:
                    pattern.risk_level = AlertSeverity.HIGH
                elif risk_score >= 0.5:
                    pattern.risk_level = AlertSeverity.MEDIUM
                else:
                    pattern.risk_level = AlertSeverity.LOW
                
                from .. import db
                db.session.add(pattern)
                db.session.commit()
                
                logger.info(f"New fraud pattern created: {alert_type} - {pattern_key}")
            
        except Exception as e:
            logger.warning(f"Error updating fraud patterns: {str(e)}")
    
    def _send_alert_notifications(self, alert):
        """Send alert notifications to monitoring systems"""
        try:
            # Only send notifications for high and critical alerts
            if alert.severity.value in ['high', 'critical']:
                # Send to monitoring system (e.g., Slack, email, webhook)
                self._send_slack_notification(alert)
                self._send_email_notification(alert)
                self._send_webhook_notification(alert)
                
                # Mark notification as sent
                alert.mark_notification_sent()
                
        except Exception as e:
            logger.warning(f"Error sending alert notifications: {str(e)}")
    
    def _send_slack_notification(self, alert):
        """Send Slack notification for critical alerts"""
        try:
            # This would integrate with Slack API
            # For now, just log the notification
            logger.warning(f"SLACK ALERT: {alert.alert_id} - {alert.title} - Risk: {alert.risk_score}")
            
        except Exception as e:
            logger.warning(f"Error sending Slack notification: {str(e)}")
    
    def _send_email_notification(self, alert):
        """Send email notification for critical alerts"""
        try:
            # This would integrate with email service
            # For now, just log the notification
            logger.warning(f"EMAIL ALERT: {alert.alert_id} - {alert.title} - Risk: {alert.risk_score}")
            
        except Exception as e:
            logger.warning(f"Error sending email notification: {str(e)}")
    
    def _send_webhook_notification(self, alert):
        """Send webhook notification for critical alerts"""
        try:
            # This would send to external monitoring systems
            # For now, just log the notification
            logger.warning(f"WEBHOOK ALERT: {alert.alert_id} - {alert.title} - Risk: {alert.risk_score}")
            
        except Exception as e:
            logger.warning(f"Error sending webhook notification: {str(e)}")
    
    def get_fraud_alerts(self, limit: int = 100, offset: int = 0, 
                        severity: str = None, status: str = None, 
                        alert_type: str = None) -> List[Dict[str, Any]]:
        """Get fraud alerts with filtering"""
        try:
            from ..models.fraud_alert import FraudAlert, AlertSeverity, AlertStatus, AlertType
            
            query = FraudAlert.query
            
            # Apply filters
            if severity:
                severity_enum = getattr(AlertSeverity, severity.upper(), None)
                if severity_enum:
                    query = query.filter(FraudAlert.severity == severity_enum)
            
            if status:
                status_enum = getattr(AlertStatus, status.upper(), None)
                if status_enum:
                    query = query.filter(FraudAlert.status == status_enum)
            
            if alert_type:
                type_enum = getattr(AlertType, alert_type.upper(), None)
                if type_enum:
                    query = query.filter(FraudAlert.alert_type == type_enum)
            
            # Order by creation date (newest first)
            query = query.order_by(FraudAlert.created_at.desc())
            
            # Apply pagination
            alerts = query.offset(offset).limit(limit).all()
            
            return [alert.to_dict() for alert in alerts]
            
        except Exception as e:
            logger.error(f"Error getting fraud alerts: {str(e)}")
            return []
    
    def get_fraud_patterns(self, limit: int = 100, offset: int = 0, 
                          pattern_type: str = None, risk_level: str = None) -> List[Dict[str, Any]]:
        """Get fraud patterns with filtering"""
        try:
            from ..models.fraud_alert import FraudPattern, AlertSeverity
            
            query = FraudPattern.query.filter(FraudPattern.is_active == True)
            
            # Apply filters
            if pattern_type:
                query = query.filter(FraudPattern.pattern_type == pattern_type)
            
            if risk_level:
                risk_enum = getattr(AlertSeverity, risk_level.upper(), None)
                if risk_enum:
                    query = query.filter(FraudPattern.risk_level == risk_enum)
            
            # Order by last seen (most recent first)
            query = query.order_by(FraudPattern.last_seen.desc())
            
            # Apply pagination
            patterns = query.offset(offset).limit(limit).all()
            
            return [pattern.to_dict() for pattern in patterns]
            
        except Exception as e:
            logger.error(f"Error getting fraud patterns: {str(e)}")
            return []
    
    def _determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level based on score"""
        if risk_score >= self.risk_thresholds['critical']:
            return 'critical'
        elif risk_score >= self.risk_thresholds['high']:
            return 'high'
        elif risk_score >= self.risk_thresholds['medium']:
            return 'medium'
        else:
            return 'low'
    
    def _generate_recommendation(self, risk_level: str, risk_factors: List[str]) -> str:
        """Generate recommendation based on risk level"""
        if risk_level == 'critical':
            return 'BLOCK: Critical risk detected - immediate blocking required'
        elif risk_level == 'high':
            return 'REVIEW: High risk detected - manual review required'
        elif risk_level == 'medium':
            return 'MONITOR: Medium risk detected - additional verification recommended'
        else:
            return 'APPROVE: Low risk - payment can proceed'
    
    def create_fraud_alert(self, payment_id: str, risk_analysis: Dict[str, Any]) -> None:
        """Create fraud alert for high-risk transactions"""
        try:
            alert = {
                'alert_id': f"fraud_{int(time.time())}",
                'payment_id': payment_id,
                'risk_score': risk_analysis['risk_score'],
                'risk_level': risk_analysis['risk_level'],
                'risk_factors': risk_analysis['risk_factors'],
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active',
                'requires_action': risk_analysis['requires_manual_review']
            }
            
            # Store alert in database or send to monitoring system
            logger.warning(f"Fraud alert created: {alert}")
            
        except Exception as e:
            logger.error(f"Failed to create fraud alert: {str(e)}")

# Create singleton instance
fraud_detection_service = FraudDetectionService()

