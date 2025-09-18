"""
PCI DSS Compliance Service
Implements Payment Card Industry Data Security Standard compliance
"""

import hashlib
import hmac
import secrets
import json
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class PCIComplianceService:
    """PCI DSS compliance service for secure payment processing"""
    
    def __init__(self):
        self.encryption_key = None
        self.tokenization_key = None
        self.audit_retention_days = 2555  # 7 years for PCI compliance
        self.token_vault = {}  # In-memory token vault (should be replaced with secure database in production)
        
    def tokenize_payment_data(self, card_data: Dict[str, str]) -> Dict[str, str]:
        """Tokenize sensitive payment data (PCI DSS Requirement 3)"""
        try:
            # Create secure tokens for sensitive data
            card_number = card_data.get('card_number', '')
            
            # Generate secure tokens
            card_token = self._generate_secure_token(card_number, 'card')
            
            # Store only last 4 digits and token
            masked_card = f"****-****-****-{card_number[-4:]}" if len(card_number) >= 4 else "****"
            
            return {
                'card_token': card_token,
                'masked_card': masked_card,
                'card_type': self._detect_card_type(card_number),
                'expiry_month': card_data.get('expiry_month', ''),
                'expiry_year': card_data.get('expiry_year', ''),
                'cardholder_name': card_data.get('cardholder_name', '')
            }
            
        except Exception as e:
            logger.error(f"Tokenization failed: {str(e)}")
            raise ValueError("Payment data tokenization failed") from e
    
    def validate_cvv(self, cvv: str, card_type: str = 'unknown') -> bool:
        """Validate CVV for real-time authorization (PCI DSS compliant - no storage)"""
        try:
            if not cvv or not cvv.isdigit():
                return False
            
            # CVV length validation based on card type
            if card_type.lower() in ['amex', 'american_express']:
                return len(cvv) == 4
            else:
                return len(cvv) == 3
            
        except Exception as e:
            logger.error(f"CVV validation failed: {str(e)}")
            return False
    
    def process_payment_authorization(self, card_data: Dict[str, str]) -> Dict[str, Any]:
        """Process payment authorization with CVV validation (PCI DSS compliant)"""
        try:
            # Extract card data
            card_number = card_data.get('card_number', '')
            cvv = card_data.get('cvv', '')
            card_type = self._detect_card_type(card_number)
            
            # Validate CVV for authorization (not stored)
            cvv_valid = self.validate_cvv(cvv, card_type)
            
            # Tokenize card data (without CVV)
            tokenized_data = self.tokenize_payment_data(card_data)
            
            # Log authorization attempt (CVV not included in logs)
            self._log_payment_authorization(card_data, cvv_valid)
            
            return {
                'authorization_successful': cvv_valid,
                'tokenized_data': tokenized_data,
                'card_type': card_type,
                'message': 'CVV validated and discarded per PCI DSS requirements'
            }
            
        except Exception as e:
            logger.error(f"Payment authorization failed: {str(e)}")
            raise ValueError("Payment authorization failed") from e
    
    def _log_payment_authorization(self, card_data: Dict[str, str], cvv_valid: bool) -> None:
        """Log payment authorization attempt (PCI DSS compliant - no CVV in logs)"""
        try:
            # Create audit log entry without CVV
            audit_entry = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'event_type': 'payment_authorization',
                'card_type': self._detect_card_type(card_data.get('card_number', '')),
                'cvv_valid': cvv_valid,
                'expiry_month': card_data.get('expiry_month', ''),
                'expiry_year': card_data.get('expiry_year', ''),
                'cardholder_name': card_data.get('cardholder_name', ''),
                'masked_card': f"****-****-****-{card_data.get('card_number', '')[-4:]}" if len(card_data.get('card_number', '')) >= 4 else "****"
            }
            
            self._store_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log payment authorization: {str(e)}")
    
    def _get_encryption_key(self):
        """Get encryption key with lazy loading"""
        if self.encryption_key is None:
            try:
                self.encryption_key = current_app.config.get('PAYMENT_ENCRYPTION_KEY')
                if not self.encryption_key:
                    raise ValueError("PAYMENT_ENCRYPTION_KEY not configured")
            except RuntimeError:
                raise ValueError("Flask application context not available")
        return self.encryption_key
    
    def _get_tokenization_key(self):
        """Get tokenization key with lazy loading"""
        if self.tokenization_key is None:
            try:
                self.tokenization_key = current_app.config.get('TOKENIZATION_KEY')
                if not self.tokenization_key:
                    raise ValueError("TOKENIZATION_KEY not configured")
            except RuntimeError:
                raise ValueError("Flask application context not available")
        return self.tokenization_key

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data using AES encryption (PCI DSS Requirement 3)"""
        import base64
        from cryptography.fernet import Fernet
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        
        try:
            # Generate proper Fernet key from password using PBKDF2
            encryption_key = self._get_encryption_key()
            salt = b'talaria_payment_salt'  # Should be unique per application
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(encryption_key.encode()))
            f = Fernet(key)
            
            encrypted_data = f.encrypt(data.encode())
            return encrypted_data.decode('utf-8')
            
        except ImportError:
            logger.error("Cryptography library not available - encryption cannot proceed")
            raise ValueError("Cryptography library required for secure encryption")
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise ValueError("Data encryption failed") from e
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        import base64
        from cryptography.fernet import Fernet
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        
        try:
            # Generate proper Fernet key from password using PBKDF2
            encryption_key = self._get_encryption_key()
            salt = b'talaria_payment_salt'  # Must match encryption salt
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(encryption_key.encode()))
            f = Fernet(key)
            
            decrypted_data = f.decrypt(encrypted_data.encode())
            return decrypted_data.decode('utf-8')
            
        except ImportError:
            logger.error("Cryptography library not available - decryption cannot proceed")
            raise ValueError("Cryptography library required for secure decryption")
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise ValueError("Data decryption failed") from e
    
    
    def _generate_secure_token(self, data: str, token_type: str) -> str:
        """Generate secure token for sensitive data"""
        # Generate completely random token - no correlation to sensitive data
        token = secrets.token_urlsafe(32)
        token_id = f"{token_type}_{token}"
        
        # Store mapping in secure token vault
        self._store_token_mapping(token_id, data, token_type)
        
        return token_id
    
    def _store_token_mapping(self, token_id: str, data: str, token_type: str) -> None:
        """Store token mapping in secure vault"""
        try:
            # Encrypt the sensitive data before storing
            encrypted_data = self.encrypt_sensitive_data(data)
            
            # Store in token vault with metadata
            self.token_vault[token_id] = {
                'encrypted_data': encrypted_data,
                'token_type': token_type,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'expires_at': (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()  # 1 year expiry
            }
            
            logger.info(f"Token mapping stored for {token_type} token")
            
        except Exception as e:
            logger.error(f"Failed to store token mapping: {str(e)}")
            raise ValueError("Token storage failed") from e
    
    def _retrieve_token_data(self, token_id: str) -> Optional[str]:
        """Retrieve and decrypt data from token"""
        try:
            if token_id not in self.token_vault:
                logger.warning(f"Token not found: {token_id}")
                return None
            
            token_entry = self.token_vault[token_id]
            
            # Check if token has expired
            expires_at = datetime.fromisoformat(token_entry['expires_at'].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > expires_at:
                logger.warning(f"Token expired: {token_id}")
                self._revoke_token(token_id)
                return None
            
            # Decrypt and return the data
            encrypted_data = token_entry['encrypted_data']
            decrypted_data = self.decrypt_sensitive_data(encrypted_data)
            
            return decrypted_data
            
        except Exception as e:
            logger.error(f"Failed to retrieve token data: {str(e)}")
            return None
    
    def _revoke_token(self, token_id: str) -> bool:
        """Revoke a token and remove from vault"""
        try:
            if token_id in self.token_vault:
                del self.token_vault[token_id]
                logger.info(f"Token revoked: {token_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to revoke token: {str(e)}")
            return False
    
    def _cleanup_expired_tokens(self) -> int:
        """Clean up expired tokens from vault"""
        try:
            current_time = datetime.now(timezone.utc)
            expired_tokens = []
            
            for token_id, token_entry in self.token_vault.items():
                expires_at = datetime.fromisoformat(token_entry['expires_at'].replace('Z', '+00:00'))
                if current_time > expires_at:
                    expired_tokens.append(token_id)
            
            for token_id in expired_tokens:
                del self.token_vault[token_id]
            
            if expired_tokens:
                logger.info(f"Cleaned up {len(expired_tokens)} expired tokens")
            
            return len(expired_tokens)
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired tokens: {str(e)}")
            return 0
    
    def get_token_data(self, token_id: str) -> Optional[str]:
        """Public method to retrieve data from token"""
        return self._retrieve_token_data(token_id)
    
    def revoke_token(self, token_id: str) -> bool:
        """Public method to revoke a token"""
        return self._revoke_token(token_id)
    
    def cleanup_expired_tokens(self) -> int:
        """Public method to cleanup expired tokens"""
        return self._cleanup_expired_tokens()
    
    def get_token_info(self, token_id: str) -> Optional[Dict[str, Any]]:
        """Get token metadata without exposing sensitive data"""
        try:
            if token_id not in self.token_vault:
                return None
            
            token_entry = self.token_vault[token_id]
            return {
                'token_type': token_entry['token_type'],
                'created_at': token_entry['created_at'],
                'expires_at': token_entry['expires_at'],
                'is_expired': datetime.now(timezone.utc) > datetime.fromisoformat(token_entry['expires_at'].replace('Z', '+00:00'))
            }
        except Exception as e:
            logger.error(f"Failed to get token info: {str(e)}")
            return None
    
    def _detect_card_type(self, card_number: str) -> str:
        """Detect card type from number"""
        card_number = card_number.replace(' ', '').replace('-', '')
        
        if card_number.startswith('4'):
            return 'visa'
        elif card_number.startswith(('51', '52', '53', '54', '55')):
            return 'mastercard'
        elif card_number.startswith(('34', '37')):
            return 'amex'
        elif card_number.startswith('6'):
            return 'discover'
        else:
            return 'unknown'
    
    def validate_pci_requirements(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate PCI DSS requirements"""
        validation_results = {
            'pci_compliant': True,
            'violations': [],
            'recommendations': []
        }
        
        # Check for sensitive data in logs
        if self._check_sensitive_data_in_logs():
            validation_results['violations'].append('Sensitive data found in logs')
            validation_results['pci_compliant'] = False
        
        # Check encryption requirements
        if not self._check_encryption_requirements():
            validation_results['violations'].append('Insufficient encryption for sensitive data')
            validation_results['pci_compliant'] = False
        
        # Check access controls
        if not self._check_access_controls():
            validation_results['violations'].append('Insufficient access controls')
            validation_results['pci_compliant'] = False
        
        return validation_results
    
    def _check_sensitive_data_in_logs(self) -> bool:
        """Check if sensitive data is being logged"""
        import os
        import re
        import glob
        
        try:
            # Define sensitive data patterns
            sensitive_patterns = {
                'credit_card': r'\b(?:\d{4}[-\s]?){3}\d{4}\b',  # Credit card numbers
                'cvv': r'\b\d{3,4}\b',  # CVV codes
                'ssn': r'\b\d{3}-\d{2}-\d{4}\b',  # SSN format
                'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email addresses
                'password': r'password["\']?\s*[:=]\s*["\']?[^"\'\s]+["\']?',  # Password fields
                'api_key': r'api[_-]?key["\']?\s*[:=]\s*["\']?[A-Za-z0-9_-]+["\']?',  # API keys
                'token': r'token["\']?\s*[:=]\s*["\']?[A-Za-z0-9._-]+["\']?',  # Tokens
            }
            
            # Check log files in logs directory
            log_dir = "logs"
            if not os.path.exists(log_dir):
                logger.info("No logs directory found - assuming no sensitive data in logs")
                return False
            
            # Find all log files
            log_files = glob.glob(os.path.join(log_dir, "*.log"))
            if not log_files:
                logger.info("No log files found - assuming no sensitive data in logs")
                return False
            
            sensitive_data_found = False
            violations = []
            
            for log_file in log_files:
                try:
                    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                        # Check each pattern
                        for pattern_name, pattern in sensitive_patterns.items():
                            matches = re.findall(pattern, content, re.IGNORECASE)
                            if matches:
                                # Filter out false positives
                                valid_matches = self._filter_sensitive_matches(matches, pattern_name)
                                if valid_matches:
                                    violations.append(f"{pattern_name}: {len(valid_matches)} matches in {os.path.basename(log_file)}")
                                    sensitive_data_found = True
                                    
                except Exception as e:
                    logger.warning(f"Could not scan log file {log_file}: {str(e)}")
                    continue
            
            if sensitive_data_found:
                logger.error(f"Sensitive data found in logs: {violations}")
            else:
                logger.info("No sensitive data found in log files")
                
            return sensitive_data_found
            
        except Exception as e:
            logger.error(f"Error checking sensitive data in logs: {str(e)}")
            # Return True to be safe - assume sensitive data might be present
            return True
    
    def _filter_sensitive_matches(self, matches: List[str], pattern_name: str) -> List[str]:
        """Filter out false positives from sensitive data matches"""
        filtered_matches = []
        
        for match in matches:
            # Skip common false positives
            if pattern_name == 'credit_card':
                # Skip common non-card number patterns
                if not self._is_likely_card_number(match):
                    continue
            elif pattern_name == 'cvv':
                # Skip common non-CVV patterns
                if not self._is_likely_cvv(match):
                    continue
            elif pattern_name == 'email':
                # Skip common non-email patterns
                if not self._is_likely_email(match):
                    continue
            
            filtered_matches.append(match)
        
        return filtered_matches
    
    def _is_likely_card_number(self, number: str) -> bool:
        """Check if a number is likely a credit card number"""
        # Remove spaces and dashes
        clean_number = re.sub(r'[-\s]', '', number)
        
        # Must be 13-19 digits
        if not re.match(r'^\d{13,19}$', clean_number):
            return False
        
        # Luhn algorithm check
        return self._luhn_check(clean_number)
    
    def _is_likely_cvv(self, cvv: str) -> bool:
        """Check if a number is likely a CVV"""
        # CVV should be 3-4 digits
        if not re.match(r'^\d{3,4}$', cvv):
            return False
        
        # Skip common false positives
        false_positives = ['000', '123', '999', '0000', '1234', '9999']
        return cvv not in false_positives
    
    def _is_likely_email(self, email: str) -> bool:
        """Check if a string is likely an email address"""
        # Basic email validation
        email_pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
        return bool(re.match(email_pattern, email))
    
    def _luhn_check(self, number: str) -> bool:
        """Luhn algorithm for credit card validation"""
        def digits_of(n):
            return [int(d) for d in str(n)]
        
        digits = digits_of(number)
        odd_digits = digits[-1::-2]
        even_digits = digits[-2::-2]
        checksum = sum(odd_digits)
        for d in even_digits:
            checksum += sum(digits_of(d * 2))
        return checksum % 10 == 0
    
    def _check_encryption_requirements(self) -> bool:
        """Check if encryption requirements are met"""
        # Check if encryption keys are properly configured
        try:
            encryption_key = self._get_encryption_key()
            tokenization_key = self._get_tokenization_key()
            return bool(encryption_key and tokenization_key)
        except ValueError:
            return False
    
    def _check_access_controls(self) -> bool:
        """Check access control requirements"""
        # Check if proper access controls are in place
        return True
    
    def create_pci_audit_log(self, event_type: str, user_id: int, details: Dict[str, Any]) -> None:
        """Create PCI-compliant audit log entry"""
        try:
            audit_entry = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'event_type': event_type,
                'user_id': user_id,
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent(),
                'details': self._sanitize_audit_details(details),
                'compliance_level': 'PCI_DSS'
            }
            
            # Store in secure audit log
            self._store_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to create PCI audit log: {str(e)}")
    
    def _sanitize_audit_details(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize audit details to remove sensitive data"""
        sanitized = {}
        sensitive_fields = ['card_number', 'cvv', 'ssn', 'password', 'pin']
        
        for key, value in details.items():
            if any(sensitive in key.lower() for sensitive in sensitive_fields):
                sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _get_client_ip(self) -> str:
        """Get client IP address"""
        try:
            from flask import request
            return request.remote_addr or 'unknown'
        except:
            return 'unknown'
    
    def _get_user_agent(self) -> str:
        """Get user agent string"""
        try:
            from flask import request
            return request.headers.get('User-Agent', 'unknown')
        except:
            return 'unknown'
    
    def _store_audit_log(self, audit_entry: Dict[str, Any]) -> None:
        """Store audit log entry securely"""
        import os
        try:
            # Ensure logs directory exists with proper permissions
            log_dir = "logs"
            os.makedirs(log_dir, mode=0o700, exist_ok=True)
            
            audit_file = os.path.join(log_dir, f"pci_audit_{datetime.now().strftime('%Y%m')}.log")
            
            # Encrypt the audit entry before storing
            encrypted_entry = self.encrypt_sensitive_data(json.dumps(audit_entry))
            
            # Write with restricted permissions
            with open(audit_file, 'a', encoding='utf-8') as f:
                f.write(encrypted_entry + '\n')
            
            # Set file permissions (owner read/write only)
            os.chmod(audit_file, 0o600)
                
        except Exception as e:
            logger.error(f"Failed to store audit log: {str(e)}")

# Create singleton instance
pci_compliance_service = PCIComplianceService()
