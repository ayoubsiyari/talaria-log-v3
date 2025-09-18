"""
Webhook Security Service
Implements enterprise-grade webhook security like Stripe, PayPal, etc.
"""

import hmac
import hashlib
import time
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from flask import request, current_app
import logging

# Try to import Redis, but don't fail if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# Try to import Stripe SDK, but don't fail if not available
try:
    import stripe
    STRIPE_SDK_AVAILABLE = True
except ImportError:
    STRIPE_SDK_AVAILABLE = False

logger = logging.getLogger(__name__)

class WebhookSecurityService:
    """Enterprise-grade webhook security service"""
    
    def __init__(self):
        self.webhook_secrets = None
        self.max_retry_attempts = 5
        self.retry_delays = [1, 5, 15, 60, 300]  # seconds
        self.idempotency_window = 300  # 5 minutes
        self._webhook_cache = {}  # In-memory cache for webhook idempotency (fallback)
        self.redis_client = None
        self.redis_enabled = False
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis client for webhook persistence"""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available, using in-memory cache only")
            return
        
        try:
            # Check if we have app context
            try:
                redis_url = current_app.config.get('REDIS_URL', 'redis://localhost:6379/0')
            except RuntimeError:
                # No app context, use default
                redis_url = 'redis://localhost:6379/0'
                logger.debug("No app context available, using default Redis URL")
            
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            
            # Test connection with timeout
            self.redis_client.ping()
            self.redis_enabled = True
            logger.info("Redis webhook persistence enabled")
            
        except Exception as e:
            logger.warning(f"Redis initialization failed, using in-memory cache: {e}")
            self.redis_enabled = False
            self.redis_client = None
    
    def _get_webhook_secrets(self):
        """Get webhook secrets with lazy loading, supporting multiple Stripe secrets for rotation"""
        if self.webhook_secrets is None:
            try:
                # Get primary Stripe webhook secret
                stripe_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
                
                # Get additional Stripe webhook secrets for rotation (comma-separated)
                stripe_secrets_extra = current_app.config.get('STRIPE_WEBHOOK_SECRETS_EXTRA', '')
                stripe_secrets_list = [stripe_secret] if stripe_secret else []
                
                # Add extra secrets if configured
                if stripe_secrets_extra:
                    extra_secrets = [s.strip() for s in stripe_secrets_extra.split(',') if s.strip()]
                    stripe_secrets_list.extend(extra_secrets)
                
                paypal_secret = current_app.config.get('PAYPAL_WEBHOOK_SECRET')
                default_secret = current_app.config.get('WEBHOOK_SECRET')
                
                if not stripe_secrets_list or not paypal_secret or not default_secret:
                    logger.error("Webhook secrets not properly configured")
                    raise ValueError("Webhook secrets must be configured")
                
                self.webhook_secrets = {
                    'stripe': stripe_secrets_list,  # Now a list of secrets
                    'paypal': paypal_secret,
                    'default': default_secret
                }
            except RuntimeError:
                logger.error("Flask app context not available for webhook secrets")
                raise RuntimeError("Unable to load webhook secrets - Flask app context not available")
        return self.webhook_secrets
        
    def verify_webhook_signature(self, payload: bytes, signature: str, provider: str = 'stripe') -> bool:
        """Verify webhook signature using provider-specific methods"""
        try:
            if provider == 'stripe':
                return self._verify_stripe_signature(payload, signature)
            elif provider == 'paypal':
                return self._verify_paypal_signature(payload, signature)
            else:
                return self._verify_generic_signature(payload, signature)
                
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            return False
    
    def _verify_stripe_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Stripe webhook signature according to Stripe docs with support for multiple secrets"""
        try:
            # Try Stripe SDK first if available
            if STRIPE_SDK_AVAILABLE:
                if self._verify_stripe_signature_sdk(payload, signature):
                    return True
                logger.info("Stripe SDK verification failed, falling back to custom implementation")
            
            # Fallback to custom implementation
            return self._verify_stripe_signature_custom(payload, signature)
            
        except Exception as e:
            logger.error(f"Stripe signature verification error: {str(e)}")
            return False
    
    def _verify_stripe_signature_sdk(self, payload: bytes, signature: str) -> bool:
        """Verify Stripe webhook signature using Stripe SDK"""
        try:
            webhook_secrets = self._get_webhook_secrets()
            stripe_secrets = webhook_secrets.get('stripe')
            if not stripe_secrets:
                logger.error("Stripe webhook secrets not configured")
                return False
            
            # Ensure stripe_secrets is a list
            if isinstance(stripe_secrets, str):
                stripe_secrets = [stripe_secrets]
            
            # Try each webhook secret with Stripe SDK
            for webhook_secret in stripe_secrets:
                if not webhook_secret:
                    continue
                
                try:
                    # Use Stripe SDK to construct and verify the event
                    event = stripe.Webhook.construct_event(
                        payload, signature, webhook_secret
                    )
                    logger.info("Stripe webhook signature verified successfully using SDK")
                    return True
                except stripe.error.SignatureVerificationError:
                    # Try next secret
                    continue
                except Exception as e:
                    logger.warning(f"Stripe SDK verification error with secret: {str(e)}")
                    continue
            
            logger.warning("Stripe SDK verification failed for all configured secrets")
            return False
            
        except Exception as e:
            logger.error(f"Stripe SDK signature verification error: {str(e)}")
            return False
    
    def _verify_stripe_signature_custom(self, payload: bytes, signature: str) -> bool:
        """Verify Stripe webhook signature using custom implementation with support for multiple secrets"""
        try:
            webhook_secrets = self._get_webhook_secrets()
            stripe_secrets = webhook_secrets.get('stripe')
            if not stripe_secrets:
                logger.error("Stripe webhook secrets not configured")
                return False
            
            # Ensure stripe_secrets is a list
            if isinstance(stripe_secrets, str):
                stripe_secrets = [stripe_secrets]
            
            # Parse Stripe-Signature header robustly
            sig_header = signature.strip()
            timestamp = None
            v1_signatures = []
            
            # Split on ',' and strip each piece
            for item in sig_header.split(','):
                item = item.strip()
                if item.startswith('t='):
                    timestamp = item[2:].strip()
                elif item.startswith('v1='):
                    v1_signatures.append(item[3:].strip())
            
            if not timestamp or not v1_signatures:
                logger.warning("Invalid Stripe signature format")
                return False
            
            # Check timestamp tolerance (<=300s)
            try:
                current_timestamp = int(time.time())
                webhook_timestamp = int(timestamp)
                
                if abs(current_timestamp - webhook_timestamp) > 300:  # 5 minutes tolerance
                    logger.warning("Webhook timestamp too old")
                    return False
            except ValueError:
                logger.warning("Invalid timestamp format")
                return False
            
            # Use raw bytes for HMAC computation: timestamp.encode() + b'.' + payload
            signed_payload = timestamp.encode() + b'.' + payload
            
            # Iterate over all configured webhook secrets (supporting rotation)
            for webhook_secret in stripe_secrets:
                if not webhook_secret:
                    continue
                    
                # Compute expected HMAC for this secret
                expected_signature = hmac.new(
                    webhook_secret.encode(),
                    signed_payload,
                    hashlib.sha256
                ).hexdigest()
                
                # Accept if any v1 signature matches this expected signature
                for v1_signature in v1_signatures:
                    if hmac.compare_digest(v1_signature, expected_signature):
                        logger.info("Stripe webhook signature verified successfully using custom implementation")
                        return True
            
            logger.warning("No matching v1 signature found for any configured webhook secret")
            return False
            
        except Exception as e:
            logger.error(f"Stripe custom signature verification error: {str(e)}")
            return False
    
    def _verify_paypal_signature(self, payload: bytes, signature: str) -> bool:
        """Verify PayPal webhook signature"""
        try:
            webhook_secrets = self._get_webhook_secrets()
            webhook_secret = webhook_secrets.get('paypal')
            if not webhook_secret:
                logger.error("PayPal webhook secret not configured")
                return False
            
            # PayPal uses HMAC-SHA256
            expected_signature = hmac.new(
                webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"PayPal signature verification error: {str(e)}")
            return False
    
    def _verify_generic_signature(self, payload: bytes, signature: str) -> bool:
        """Verify generic webhook signature"""
        try:
            webhook_secrets = self._get_webhook_secrets()
            webhook_secret = webhook_secrets.get('default')
            if not webhook_secret:
                logger.error("Default webhook secret not configured")
                return False
            
            expected_signature = hmac.new(
                webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Generic signature verification error: {str(e)}")
            return False
    
    def process_webhook_with_retry(self, webhook_data: Dict[str, Any], 
                                 webhook_id: str, max_retries: int = None,
                                 provider: str = 'default') -> Dict[str, Any]:
        """Process webhook with retry logic and idempotency"""
        start_time = time.time()
        verification_status = False
        
        try:
            if max_retries is None:
                max_retries = self.max_retry_attempts
            
            # Check idempotency
            if self._is_duplicate_webhook(webhook_id):
                logger.info(f"Duplicate webhook detected: {webhook_id}")
                result = {'status': 'duplicate', 'message': 'Webhook already processed'}
                
                # Create audit log for duplicate
                self.create_webhook_audit_log(
                    webhook_data, verification_status, result, provider,
                    int((time.time() - start_time) * 1000)
                )
                return result
            
            # Process webhook with retry logic
            for attempt in range(max_retries):
                try:
                    result = self._process_webhook(webhook_data)
                    verification_status = True  # Mark as verified if processing succeeded
                    
                    # Mark as processed
                    self._mark_webhook_processed(webhook_id, result,
                                               provider=provider,
                                               event_type=webhook_data.get('type'))
                    
                    final_result = {
                        'status': 'success',
                        'attempt': attempt + 1,
                        'result': result
                    }
                    
                    # Create audit log for successful processing
                    self.create_webhook_audit_log(
                        webhook_data, verification_status, final_result, provider,
                        int((time.time() - start_time) * 1000)
                    )
                    
                    return final_result
                    
                except Exception as e:
                    logger.warning(f"Webhook processing attempt {attempt + 1} failed: {str(e)}")
                    
                    if attempt < max_retries - 1:
                        # Wait before retry
                        delay = self.retry_delays[min(attempt, len(self.retry_delays) - 1)]
                        time.sleep(delay)
                    else:
                        # Final attempt failed
                        self._mark_webhook_failed(webhook_id, str(e),
                                                provider=provider,
                                                event_type=webhook_data.get('type'),
                                                retry_count=attempt + 1,
                                                webhook_data=webhook_data)
                        raise
            
        except Exception as e:
            logger.error(f"Webhook processing failed after {max_retries} attempts: {str(e)}")
            final_result = {
                'status': 'failed',
                'error': str(e),
                'attempts': max_retries
            }
            
            # Create audit log for failed processing
            self.create_webhook_audit_log(
                webhook_data, verification_status, final_result, provider,
                int((time.time() - start_time) * 1000)
            )
            
            return final_result
    
    def _is_duplicate_webhook(self, webhook_id: str) -> bool:
        """Check if webhook is duplicate using Redis, database, or in-memory cache"""
        try:
            if not webhook_id:
                return False
            
            # 1. Check Redis first (fastest)
            if self.redis_enabled:
                try:
                    redis_key = f"webhook:{webhook_id}"
                    if self.redis_client.exists(redis_key):
                        logger.info(f"Duplicate webhook found in Redis: {webhook_id}")
                        return True
                except Exception as e:
                    logger.warning(f"Redis check failed, falling back to database: {e}")
            
            # 2. Check database
            try:
                from app.models.webhook_processing import WebhookProcessingRecord
                record = WebhookProcessingRecord.find_by_webhook_id(webhook_id)
                if record and record.status in ['completed', 'processing']:
                    logger.info(f"Duplicate webhook found in database: {webhook_id}")
                    return True
            except Exception as e:
                logger.warning(f"Database check failed, falling back to in-memory cache: {e}")
            
            # 3. Check in-memory cache (fallback)
            current_time = time.time()
            self._clean_webhook_cache(current_time)
            
            if webhook_id in self._webhook_cache:
                webhook_data = self._webhook_cache[webhook_id]
                if current_time - webhook_data['processed_at'] <= self.idempotency_window:
                    logger.info(f"Duplicate webhook found in memory cache: {webhook_id}")
                    return True
                else:
                    del self._webhook_cache[webhook_id]
            
            return False
            
        except Exception as e:
            logger.error(f"Duplicate check failed: {str(e)}")
            return False
    
    def _mark_webhook_processed(self, webhook_id: str, result: Dict[str, Any], 
                               provider: str = 'default', event_type: str = None) -> None:
        """Mark webhook as processed using Redis, database, and in-memory cache"""
        if not webhook_id:
            return
        
        current_time = time.time()
        expires_at = current_time + self.idempotency_window
        
        # Build processed_webhook dict
        processed_webhook = {
            'webhook_id': webhook_id,
            'processed_at': current_time,
            'result': result,
            'provider': provider,
            'event_type': event_type,
            'expires_at': expires_at
        }
        
        redis_success = False
        db_success = False
        
        # 1. Store in Redis (fastest, with TTL)
        if self.redis_enabled:
            try:
                redis_key = f"processed:webhook:{webhook_id}"
                self.redis_client.setex(
                    redis_key, 
                    self.idempotency_window, 
                    json.dumps(processed_webhook)
                )
                redis_success = True
                logger.debug(f"Marked webhook as processed in Redis: {webhook_id}")
            except Exception as e:
                logger.error(f"Redis storage failed for webhook {webhook_id}: {e}")
                # Don't raise here, continue with database persistence
        
        # 2. Store in database (persistent) with transaction handling
        try:
            from app.models.webhook_processing import WebhookProcessingRecord
            from app import db
            from sqlalchemy.exc import IntegrityError
            
            # Use transaction for atomicity
            with db.session.begin():
                # Check if record already exists
                record = WebhookProcessingRecord.find_by_webhook_id(webhook_id)
                if record:
                    record.mark_completed(result, auto_commit=False)
                else:
                    # Create new record
                    record = WebhookProcessingRecord.create_record(
                        webhook_id=webhook_id,
                        provider=provider,
                        event_type=event_type,
                        idempotency_window=self.idempotency_window,
                        auto_commit=False
                    )
                    record.mark_completed(result, auto_commit=False)
            
            db_success = True
            logger.debug(f"Marked webhook as processed in database: {webhook_id}")
            
        except IntegrityError as e:
            # Handle unique constraint violation (idempotency)
            logger.warning(f"Webhook {webhook_id} already processed (idempotency): {e}")
            db_success = True  # This is actually success for idempotency
        except Exception as e:
            logger.error(f"Database storage failed for webhook {webhook_id}: {e}")
            # Surface database errors as exceptions to be handled by caller
            raise Exception(f"Failed to persist webhook {webhook_id} to database: {str(e)}")
        
        # 3. Store in in-memory cache (fallback)
        self._webhook_cache[webhook_id] = processed_webhook
        
        # Log overall success/failure
        if redis_success or db_success:
            logger.debug(f"Marked webhook as processed: {webhook_id} (Redis: {redis_success}, DB: {db_success})")
        else:
            logger.error(f"Failed to persist webhook {webhook_id} to any storage backend")
            raise Exception(f"Failed to persist webhook {webhook_id} - all storage backends failed")
    
    def _clean_webhook_cache(self, current_time: float) -> None:
        """Clean expired entries from webhook cache"""
        try:
            expired_keys = []
            for webhook_id, webhook_data in self._webhook_cache.items():
                if current_time > webhook_data['expires_at']:
                    expired_keys.append(webhook_id)
            
            # Remove expired entries
            for webhook_id in expired_keys:
                del self._webhook_cache[webhook_id]
                
            if expired_keys:
                logger.debug(f"Cleaned {len(expired_keys)} expired webhook entries from cache")
                
        except Exception as e:
            logger.error(f"Failed to clean webhook cache: {str(e)}")
    
    def cleanup_expired_webhooks(self) -> Dict[str, int]:
        """Clean up expired webhook records from all storage layers"""
        cleanup_stats = {
            'redis_cleaned': 0,
            'database_cleaned': 0,
            'memory_cleaned': 0
        }
        
        try:
            current_time = time.time()
            
            # Clean Redis
            if self.redis_enabled:
                try:
                    # Redis TTL handles expiration automatically, but we can check for any stale keys
                    redis_keys = self.redis_client.keys("webhook:*")
                    for key in redis_keys:
                        ttl = self.redis_client.ttl(key)
                        if ttl == -1:  # No TTL set, remove it
                            self.redis_client.delete(key)
                            cleanup_stats['redis_cleaned'] += 1
                except Exception as e:
                    logger.warning(f"Redis cleanup failed: {e}")
            
            # Clean database
            try:
                from app.models.webhook_processing import WebhookProcessingRecord
                cleanup_stats['database_cleaned'] = WebhookProcessingRecord.cleanup_expired()
            except Exception as e:
                logger.warning(f"Database cleanup failed: {e}")
            
            # Clean in-memory cache
            self._clean_webhook_cache(current_time)
            cleanup_stats['memory_cleaned'] = len(self._webhook_cache)
            
            logger.info(f"Webhook cleanup completed: {cleanup_stats}")
            return cleanup_stats
            
        except Exception as e:
            logger.error(f"Webhook cleanup failed: {str(e)}")
            return {'error': str(e)}
    
    def get_webhook_cache_stats(self) -> Dict[str, Any]:
        """Get webhook cache statistics for monitoring"""
        try:
            current_time = time.time()
            self._clean_webhook_cache(current_time)
            
            stats = {
                'memory_cache': {
                    'total_entries': len(self._webhook_cache),
                    'idempotency_window': self.idempotency_window,
                    'cache_size_mb': sum(len(str(entry)) for entry in self._webhook_cache.values()) / (1024 * 1024)
                },
                'redis_enabled': self.redis_enabled,
                'database_enabled': True
            }
            
            # Add Redis stats if available
            if self.redis_enabled:
                try:
                    redis_keys = self.redis_client.keys("webhook:*")
                    stats['redis_cache'] = {
                        'total_entries': len(redis_keys),
                        'keys_sample': redis_keys[:5]  # Sample of keys
                    }
                except Exception as e:
                    stats['redis_cache'] = {'error': str(e)}
            
            # Add database stats
            try:
                from app.models.webhook_processing import WebhookProcessingRecord
                stats['database'] = WebhookProcessingRecord.get_stats()
            except Exception as e:
                stats['database'] = {'error': str(e)}
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get webhook cache stats: {str(e)}")
            return {'error': str(e)}
    
    def _mark_webhook_failed(self, webhook_id: str, error: str, 
                            provider: str = 'default', event_type: str = None,
                            retry_count: int = 0, webhook_data: Dict[str, Any] = None) -> None:
        """Mark webhook as failed with comprehensive persistence"""
        try:
            if not webhook_id:
                return
            
            current_time = time.time()
            failed_webhook_data = {
                'webhook_id': webhook_id,
                'failed_at': current_time,
                'error': error,
                'provider': provider,
                'event_type': event_type,
                'retry_count': retry_count,
                'webhook_data': webhook_data,
                'expires_at': current_time + (self.idempotency_window * 2)  # Keep failed webhooks longer
            }
            
            # 1. Store in Redis dead letter queue
            if self.redis_enabled:
                try:
                    dead_letter_key = f"webhook_failed:{webhook_id}"
                    self.redis_client.setex(
                        dead_letter_key,
                        self.idempotency_window * 2,  # Keep failed webhooks longer
                        json.dumps(failed_webhook_data)
                    )
                    logger.debug(f"Marked webhook as failed in Redis dead letter queue: {webhook_id}")
                except Exception as e:
                    logger.warning(f"Redis dead letter queue storage failed: {e}")
            
            # 2. Store in database
            try:
                from app.models.webhook_processing import WebhookProcessingRecord
                from app import db
                
                # Check if record already exists
                record = WebhookProcessingRecord.find_by_webhook_id(webhook_id)
                if record:
                    record.mark_failed(error, {'retry_count': retry_count, 'webhook_data': webhook_data})
                else:
                    # Create new failed record
                    record = WebhookProcessingRecord.create_record(
                        webhook_id=webhook_id,
                        provider=provider,
                        event_type=event_type,
                        idempotency_window=self.idempotency_window * 2
                    )
                    record.mark_failed(error, {'retry_count': retry_count, 'webhook_data': webhook_data})
                
                logger.debug(f"Marked webhook as failed in database: {webhook_id}")
            except Exception as e:
                logger.warning(f"Database failed webhook storage failed: {e}")
            
            # 3. Store in in-memory failed webhooks cache
            if not hasattr(self, '_failed_webhook_cache'):
                self._failed_webhook_cache = {}
            
            self._failed_webhook_cache[webhook_id] = failed_webhook_data
            
            logger.error(f"Webhook marked as failed: {webhook_id} - {error}")
            
        except Exception as e:
            logger.error(f"Failed to mark webhook as failed: {str(e)}")
    
    def get_failed_webhooks(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get failed webhooks from dead letter queue"""
        failed_webhooks = []
        
        try:
            # 1. Get from Redis dead letter queue
            if self.redis_enabled:
                try:
                    redis_keys = self.redis_client.keys("webhook_failed:*")
                    for key in redis_keys[:limit]:
                        webhook_data = self.redis_client.get(key)
                        if webhook_data:
                            failed_webhooks.append(json.loads(webhook_data))
                except Exception as e:
                    logger.warning(f"Failed to get failed webhooks from Redis: {e}")
            
            # 2. Get from database if Redis is empty or unavailable
            if not failed_webhooks:
                try:
                    from app.models.webhook_processing import WebhookProcessingRecord
                    records = WebhookProcessingRecord.query.filter_by(status='failed').limit(limit).all()
                    failed_webhooks = [record.to_dict() for record in records]
                except Exception as e:
                    logger.warning(f"Failed to get failed webhooks from database: {e}")
            
            # 3. Get from in-memory cache as fallback
            if not failed_webhooks and hasattr(self, '_failed_webhook_cache'):
                failed_webhooks = list(self._failed_webhook_cache.values())[:limit]
            
            return failed_webhooks
            
        except Exception as e:
            logger.error(f"Failed to get failed webhooks: {str(e)}")
            return []
    
    def retry_failed_webhook(self, webhook_id: str) -> Dict[str, Any]:
        """Retry a failed webhook"""
        try:
            # Get failed webhook data
            failed_webhook = None
            
            # Check Redis first
            if self.redis_enabled:
                try:
                    dead_letter_key = f"webhook_failed:{webhook_id}"
                    webhook_data = self.redis_client.get(dead_letter_key)
                    if webhook_data:
                        failed_webhook = json.loads(webhook_data)
                except Exception as e:
                    logger.warning(f"Failed to get failed webhook from Redis: {e}")
            
            # Check database if not found in Redis
            if not failed_webhook:
                try:
                    from app.models.webhook_processing import WebhookProcessingRecord
                    record = WebhookProcessingRecord.find_by_webhook_id(webhook_id)
                    if record and record.status == 'failed':
                        failed_webhook = {
                            'webhook_id': webhook_id,
                            'provider': record.provider,
                            'event_type': record.event_type,
                            'webhook_data': record.processing_result.get('webhook_data') if record.processing_result else None,
                            'retry_count': record.retry_count
                        }
                except Exception as e:
                    logger.warning(f"Failed to get failed webhook from database: {e}")
            
            if not failed_webhook:
                return {'status': 'error', 'message': 'Failed webhook not found'}
            
            # Check if retry limit exceeded
            max_retries = failed_webhook.get('retry_count', 0)
            if max_retries >= self.max_retry_attempts:
                return {'status': 'error', 'message': 'Retry limit exceeded'}
            
            # Retry the webhook
            webhook_data = failed_webhook.get('webhook_data', {})
            provider = failed_webhook.get('provider', 'default')
            event_type = failed_webhook.get('event_type')
            
            # Process with retry
            result = self.process_webhook_with_retry(
                webhook_data, 
                webhook_id, 
                max_retries=self.max_retry_attempts - max_retries
            )
            
            # Remove from dead letter queue if successful
            if result.get('status') == 'success':
                self._remove_from_dead_letter_queue(webhook_id)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to retry webhook {webhook_id}: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _remove_from_dead_letter_queue(self, webhook_id: str) -> None:
        """Remove webhook from dead letter queue"""
        try:
            # Remove from Redis
            if self.redis_enabled:
                try:
                    dead_letter_key = f"webhook_failed:{webhook_id}"
                    self.redis_client.delete(dead_letter_key)
                except Exception as e:
                    logger.warning(f"Failed to remove from Redis dead letter queue: {e}")
            
            # Remove from in-memory cache
            if hasattr(self, '_failed_webhook_cache') and webhook_id in self._failed_webhook_cache:
                del self._failed_webhook_cache[webhook_id]
            
            logger.debug(f"Removed webhook from dead letter queue: {webhook_id}")
            
        except Exception as e:
            logger.error(f"Failed to remove from dead letter queue: {str(e)}")
    
    def cleanup_failed_webhooks(self, older_than_hours: int = 24) -> Dict[str, int]:
        """Clean up old failed webhooks from all storage layers"""
        cleanup_stats = {
            'redis_cleaned': 0,
            'database_cleaned': 0,
            'memory_cleaned': 0
        }
        
        try:
            cutoff_time = time.time() - (older_than_hours * 3600)
            
            # Clean Redis dead letter queue
            if self.redis_enabled:
                try:
                    redis_keys = self.redis_client.keys("webhook_failed:*")
                    for key in redis_keys:
                        webhook_data = self.redis_client.get(key)
                        if webhook_data:
                            data = json.loads(webhook_data)
                            if data.get('failed_at', 0) < cutoff_time:
                                self.redis_client.delete(key)
                                cleanup_stats['redis_cleaned'] += 1
                except Exception as e:
                    logger.warning(f"Redis failed webhook cleanup failed: {e}")
            
            # Clean database
            try:
                from app.models.webhook_processing import WebhookProcessingRecord
                from app import db
                from datetime import datetime, timedelta
                
                cutoff_datetime = datetime.utcnow() - timedelta(hours=older_than_hours)
                old_failed_records = WebhookProcessingRecord.query.filter(
                    WebhookProcessingRecord.status == 'failed',
                    WebhookProcessingRecord.processed_at < cutoff_datetime
                ).all()
                
                for record in old_failed_records:
                    db.session.delete(record)
                
                db.session.commit()
                cleanup_stats['database_cleaned'] = len(old_failed_records)
            except Exception as e:
                logger.warning(f"Database failed webhook cleanup failed: {e}")
            
            # Clean in-memory cache
            if hasattr(self, '_failed_webhook_cache'):
                expired_keys = []
                for webhook_id, data in self._failed_webhook_cache.items():
                    if data.get('failed_at', 0) < cutoff_time:
                        expired_keys.append(webhook_id)
                
                for key in expired_keys:
                    del self._failed_webhook_cache[key]
                
                cleanup_stats['memory_cleaned'] = len(expired_keys)
            
            logger.info(f"Failed webhook cleanup completed: {cleanup_stats}")
            return cleanup_stats
            
        except Exception as e:
            logger.error(f"Failed webhook cleanup failed: {str(e)}")
            return {'error': str(e)}
    
    def _process_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process webhook data"""
        try:
            event_type = webhook_data.get('type', 'unknown')
            
            # Route to appropriate handler
            if event_type.startswith('payment_intent.'):
                return self._handle_payment_intent_event(webhook_data)
            elif event_type.startswith('charge.'):
                return self._handle_charge_event(webhook_data)
            elif event_type.startswith('customer.'):
                return self._handle_customer_event(webhook_data)
            else:
                logger.warning(f"Unknown webhook event type: {event_type}")
                return {'status': 'ignored', 'reason': 'Unknown event type'}
                
        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}")
            raise
    
    def _handle_payment_intent_event(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle payment intent events"""
        try:
            event_type = webhook_data.get('type')
            payment_intent = webhook_data.get('data', {}).get('object', {})
            
            if event_type == 'payment_intent.succeeded':
                # Process successful payment
                return self._process_payment_success(payment_intent)
            elif event_type == 'payment_intent.payment_failed':
                # Process failed payment
                return self._process_payment_failure(payment_intent)
            else:
                return {'status': 'ignored', 'reason': f'Unhandled event: {event_type}'}
                
        except Exception as e:
            logger.error(f"Payment intent event handling failed: {str(e)}")
            raise
    
    def _handle_charge_event(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle charge events"""
        try:
            event_type = webhook_data.get('type')
            charge = webhook_data.get('data', {}).get('object', {})
            
            if event_type == 'charge.dispute.created':
                # Handle chargeback
                return self._process_chargeback(charge)
            else:
                return {'status': 'ignored', 'reason': f'Unhandled event: {event_type}'}
                
        except Exception as e:
            logger.error(f"Charge event handling failed: {str(e)}")
            raise
    
    def _handle_customer_event(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle customer events"""
        try:
            event_type = webhook_data.get('type')
            customer = webhook_data.get('data', {}).get('object', {})
            
            # Handle customer-related events
            return {'status': 'processed', 'event_type': event_type}
            
        except Exception as e:
            logger.error(f"Customer event handling failed: {str(e)}")
            raise
    
    def _process_payment_success(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process successful payment"""
        try:
            # This would integrate with your payment processing logic
            return {
                'status': 'success',
                'payment_intent_id': payment_intent.get('id'),
                'amount': payment_intent.get('amount'),
                'currency': payment_intent.get('currency')
            }
        except Exception as e:
            logger.error(f"Payment success processing failed: {str(e)}")
            raise
    
    def _process_payment_failure(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process failed payment"""
        try:
            # This would integrate with your payment processing logic
            return {
                'status': 'failed',
                'payment_intent_id': payment_intent.get('id'),
                'error': payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
            }
        except Exception as e:
            logger.error(f"Payment failure processing failed: {str(e)}")
            raise
    
    def _process_chargeback(self, charge: Dict[str, Any]) -> Dict[str, Any]:
        """Process chargeback"""
        try:
            # This would integrate with your chargeback handling logic
            return {
                'status': 'chargeback',
                'charge_id': charge.get('id'),
                'dispute_id': charge.get('dispute', {}).get('id'),
                'amount': charge.get('amount')
            }
        except Exception as e:
            logger.error(f"Chargeback processing failed: {str(e)}")
            raise
    
    def create_webhook_audit_log(self, webhook_data: Dict[str, Any], 
                                verification_status: bool, processing_result: Dict[str, Any],
                                provider: str = 'default', processing_duration_ms: int = None) -> None:
        """Create webhook audit log with safe request context handling"""
        try:
            # Safely get request context data
            ip_address = None
            user_agent = None
            headers = {}
            signature_header = None
            
            try:
                from flask import has_request_context
                if has_request_context():
                    ip_address = request.remote_addr
                    user_agent = request.headers.get('User-Agent', '')
                    signature_header = request.headers.get('X-Request-Signature', '')
                    
                    # Filter sensitive headers
                    sensitive_headers = {'authorization', 'x-api-key', 'cookie', 'x-stripe-signature', 'x-paypal-signature'}
                    headers = {k: v for k, v in dict(request.headers).items() 
                              if k.lower() not in sensitive_headers}
            except Exception as e:
                logger.warning(f"Could not get request context: {e}")
            
            # Determine processing status
            processing_status = 'success'
            error_message = None
            
            if processing_result.get('status') == 'failed':
                processing_status = 'failed'
                error_message = processing_result.get('error')
            elif processing_result.get('status') == 'duplicate':
                processing_status = 'duplicate'
            
            # Store audit log in database
            try:
                from app.models.webhook_audit_log import WebhookAuditLog
                
                audit_log = WebhookAuditLog.create_audit_log(
                    webhook_id=webhook_data.get('id'),
                    provider=provider,
                    event_type=webhook_data.get('type'),
                    ip_address=ip_address,
                    user_agent=user_agent,
                    request_headers=headers,
                    request_payload=json.dumps(webhook_data) if webhook_data else None,
                    verification_status=verification_status,
                    signature_valid=verification_status,
                    signature_header=signature_header,
                    processing_status=processing_status,
                    processing_result=processing_result,
                    error_message=error_message,
                    processing_duration_ms=processing_duration_ms,
                    metadata={
                        'webhook_source': 'webhook_security_service',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                )
                
                logger.debug(f"Webhook audit log created with ID: {audit_log.id}")
                
            except Exception as e:
                logger.error(f"Failed to store audit log in database: {e}")
                # Fallback to alternative persistence methods
                try:
                    # Try to persist using direct database session
                    from app import db
                    from app.models.webhook_audit_log import WebhookAuditLog
                    
                    audit_log = WebhookAuditLog(
                        webhook_id=webhook_data.get('id'),
                        provider=provider,
                        event_type=webhook_data.get('type'),
                        ip_address=ip_address,
                        user_agent=user_agent,
                        request_headers=headers,
                        request_payload=json.dumps(webhook_data) if webhook_data else None,
                        verification_status=verification_status,
                        signature_valid=verification_status,
                        signature_header=signature_header,
                        processing_status=processing_status,
                        processing_result=processing_result,
                        error_message=error_message,
                        processing_duration_ms=processing_duration_ms,
                        metadata={
                            'webhook_source': 'webhook_security_service',
                            'timestamp': datetime.utcnow().isoformat(),
                            'fallback_persistence': True
                        }
                    )
                    
                    db.session.add(audit_log)
                    db.session.commit()
                    logger.info(f"Webhook audit log persisted via fallback method with ID: {audit_log.id}")
                    
                except Exception as fallback_error:
                    logger.error(f"Fallback persistence also failed: {fallback_error}")
                    # Last resort: create audit_entry for logging only
                    audit_entry = {
                        'timestamp': datetime.utcnow().isoformat(),
                        'webhook_id': webhook_data.get('id'),
                        'event_type': webhook_data.get('type'),
                        'verification_status': verification_status,
                        'processing_result': processing_result,
                        'ip_address': ip_address,
                        'user_agent': user_agent,
                        'headers': headers
                    }
                    logger.info(f"Webhook audit log (fallback logging only): {audit_entry}")
            
        except Exception as e:
            logger.error(f"Failed to create webhook audit log: {str(e)}")
    
    def get_audit_statistics(self, hours: int = 24) -> Dict[str, Any]:
        """Get webhook audit statistics"""
        try:
            from app.models.webhook_audit_log import WebhookAuditLog
            return WebhookAuditLog.get_audit_stats(hours)
        except Exception as e:
            logger.error(f"Failed to get audit statistics: {str(e)}")
            return {'error': str(e)}
    
    def cleanup_audit_logs(self, older_than_days: int = 30) -> int:
        """Clean up old audit logs"""
        try:
            from app.models.webhook_audit_log import WebhookAuditLog
            return WebhookAuditLog.cleanup_old_logs(older_than_days)
        except Exception as e:
            logger.error(f"Failed to cleanup audit logs: {str(e)}")
            return 0

# Create singleton instance
webhook_security_service = WebhookSecurityService()
