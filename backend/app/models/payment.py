"""
Payment and Order Models
Handles orders, payments, and promotion applications
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .. import db

class Order(db.Model):
    """Order model to track customer orders"""
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)
    order_number = Column(String(50), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey('admin_users.id'), nullable=True)  # Optional for guest orders
    customer_email = Column(String(255), nullable=False)
    customer_name = Column(String(255), nullable=False)
    
    # Order details
    subtotal = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    
    # Promotion details
    promotion_code = Column(String(50), nullable=True)
    promotion_id = Column(Integer, ForeignKey('promotions.id'), nullable=True)
    discount_percentage = Column(Float, nullable=True)
    discount_fixed = Column(Float, nullable=True)
    
    # Order status
    status = Column(String(50), default='pending')  # pending, paid, cancelled, refunded
    payment_status = Column(String(50), default='pending')  # pending, paid, failed
    
    # Payment details
    payment_provider = Column(String(50), default='stripe')  # stripe, paypal, etc.
    payment_intent_id = Column(String(255), nullable=True)
    payment_method_id = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    
    # Additional data
    order_metadata = Column(JSON, nullable=True)  # Store additional order data
    
    # Relationships
    user = relationship('AdminUser', backref='orders')
    promotion = relationship('Promotion', backref='orders')
    items = relationship('OrderItem', backref='order', cascade='all, delete-orphan')
    payments = relationship('Payment', backref='order', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Order {self.order_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_email': self.customer_email,
            'customer_name': self.customer_name,
            'subtotal': self.subtotal,
            'tax_amount': self.tax_amount,
            'discount_amount': self.discount_amount,
            'total_amount': self.total_amount,
            'promotion_code': self.promotion_code,
            'status': self.status,
            'payment_status': self.payment_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'items': [item.to_dict() for item in self.items],
            'promotion': self.promotion.to_dict() if self.promotion else None
        }
    
    def calculate_totals(self):
        """Calculate order totals including tax and discounts"""
        # Calculate subtotal from items
        self.subtotal = sum(item.total_price for item in self.items)
        
        # Initialize discount amount
        self.discount_amount = 0.0
        
        # Apply promotion discount
        if self.promotion or self.discount_percentage or self.discount_fixed:
            if self.discount_percentage:
                self.discount_amount = self.subtotal * (self.discount_percentage / 100)
            elif self.discount_fixed:
                self.discount_amount = min(self.discount_fixed, self.subtotal)
            elif self.promotion:
                if self.promotion.type == 'percentage':
                    self.discount_amount = self.subtotal * (float(self.promotion.value) / 100)
                    self.discount_percentage = float(self.promotion.value)
                elif self.promotion.type == 'fixed':
                    self.discount_amount = min(float(self.promotion.value), self.subtotal)
                    self.discount_fixed = float(self.promotion.value)
        
        # Calculate tax (on subtotal after discount)
        discount_amount = self.discount_amount or 0.0
        taxable_amount = self.subtotal - discount_amount
        self.tax_amount = taxable_amount * 0.08  # 8% tax rate
        
        # Calculate total
        self.total_amount = self.subtotal - discount_amount + self.tax_amount
        
        return self.total_amount

class OrderItem(db.Model):
    """Order item model to track individual items in orders"""
    __tablename__ = 'order_items'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    
    # Item details
    product_name = Column(String(255), nullable=False)
    product_id = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    # Pricing
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    total_price = Column(Float, nullable=False)
    
    # Metadata
    item_metadata = Column(JSON, nullable=True)  # Store additional item data
    
    def __repr__(self):
        return f'<OrderItem {self.product_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product_name,
            'product_id': self.product_id,
            'description': self.description,
            'unit_price': self.unit_price,
            'quantity': self.quantity,
            'total_price': self.total_price,
            'metadata': self.item_metadata
        }

class Payment(db.Model):
    """Payment model to track payment transactions"""
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    
    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='usd')
    payment_method = Column(String(50), nullable=False)  # card, bank_transfer, etc.
    
    # Provider details
    provider = Column(String(50), default='stripe')  # stripe, paypal, etc.
    provider_payment_id = Column(String(255), nullable=False)
    provider_transaction_id = Column(String(255), nullable=True)
    
    # Status
    status = Column(String(50), default='pending')  # pending, succeeded, failed, cancelled
    failure_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Metadata
    payment_metadata = Column(JSON, nullable=True)  # Store provider-specific data
    
    def __repr__(self):
        return f'<Payment {self.provider_payment_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'provider': self.provider,
            'provider_payment_id': self.provider_payment_id,
            'status': self.status,
            'failure_reason': self.failure_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }
