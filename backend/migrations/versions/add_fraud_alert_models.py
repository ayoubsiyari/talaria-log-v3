"""Add fraud alert models

Revision ID: add_fraud_alert_models
Revises: update_promotion_model
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_fraud_alert_models'
down_revision = 'update_promotion_model'
branch_labels = None
depends_on = None


def upgrade():
    # Create fraud_alerts table
    op.create_table('fraud_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('alert_id', sa.String(length=100), nullable=False),
        sa.Column('alert_type', sa.Enum('VELOCITY_LIMIT', 'HIGH_RISK_BIN', 'VPN_PROXY', 'RAPID_SUBMISSION', 'SUSPICIOUS_IP', 'CARD_VALIDATION', 'EMAIL_VALIDATION', 'GENERAL_FRAUD', name='alerttype'), nullable=False),
        sa.Column('severity', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='alertseverity'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE', 'CONFIRMED_FRAUD', name='alertstatus'), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_factors', sa.JSON(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.String(length=255), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('payment_id', sa.Integer(), nullable=True),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('card_last_four', sa.String(length=4), nullable=True),
        sa.Column('card_bin', sa.String(length=6), nullable=True),
        sa.Column('card_brand', sa.String(length=50), nullable=True),
        sa.Column('customer_email', sa.String(length=255), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_by', sa.Integer(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('notification_sent', sa.Boolean(), nullable=True),
        sa.Column('notification_sent_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id'], ),
        sa.ForeignKeyConstraint(['resolved_by'], ['admin_users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['admin_users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('alert_id')
    )
    
    # Create indexes for fraud_alerts
    op.create_index('ix_fraud_alerts_alert_id', 'fraud_alerts', ['alert_id'], unique=False)
    op.create_index('ix_fraud_alerts_alert_type', 'fraud_alerts', ['alert_type'], unique=False)
    op.create_index('ix_fraud_alerts_created_at', 'fraud_alerts', ['created_at'], unique=False)
    op.create_index('ix_fraud_alerts_customer_email', 'fraud_alerts', ['customer_email'], unique=False)
    op.create_index('ix_fraud_alerts_ip_address', 'fraud_alerts', ['ip_address'], unique=False)
    op.create_index('ix_fraud_alerts_severity', 'fraud_alerts', ['severity'], unique=False)
    op.create_index('ix_fraud_alerts_session_id', 'fraud_alerts', ['session_id'], unique=False)
    op.create_index('ix_fraud_alerts_status', 'fraud_alerts', ['status'], unique=False)
    
    # Create fraud_patterns table
    op.create_table('fraud_patterns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pattern_type', sa.String(length=100), nullable=False),
        sa.Column('pattern_key', sa.String(length=255), nullable=False),
        sa.Column('occurrence_count', sa.Integer(), nullable=False),
        sa.Column('first_seen', sa.DateTime(), nullable=False),
        sa.Column('last_seen', sa.DateTime(), nullable=False),
        sa.Column('risk_level', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='alertseverity'), nullable=False),
        sa.Column('total_risk_score', sa.Float(), nullable=False),
        sa.Column('average_risk_score', sa.Float(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_whitelisted', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for fraud_patterns
    op.create_index('ix_fraud_patterns_is_active', 'fraud_patterns', ['is_active'], unique=False)
    op.create_index('ix_fraud_patterns_is_whitelisted', 'fraud_patterns', ['is_whitelisted'], unique=False)
    op.create_index('ix_fraud_patterns_pattern_key', 'fraud_patterns', ['pattern_key'], unique=False)
    op.create_index('ix_fraud_patterns_pattern_type', 'fraud_patterns', ['pattern_type'], unique=False)


def downgrade():
    # Drop fraud_patterns table
    op.drop_index('ix_fraud_patterns_pattern_type', table_name='fraud_patterns')
    op.drop_index('ix_fraud_patterns_pattern_key', table_name='fraud_patterns')
    op.drop_index('ix_fraud_patterns_is_whitelisted', table_name='fraud_patterns')
    op.drop_index('ix_fraud_patterns_is_active', table_name='fraud_patterns')
    op.drop_table('fraud_patterns')
    
    # Drop fraud_alerts table
    op.drop_index('ix_fraud_alerts_status', table_name='fraud_alerts')
    op.drop_index('ix_fraud_alerts_session_id', table_name='fraud_alerts')
    op.drop_index('ix_fraud_alerts_severity', table_name='fraud_alerts')
    op.drop_index('ix_fraud_alerts_ip_address', table_name='fraud_alerts')
    op.drop_index('ix_fraud_alerts_customer_email', table_name='fraud_alerts')
    op.drop_index('ix_fraud_alerts_created_at', table_name='fraud_alerts')
    op.drop_index('ix_fraud_alerts_alert_type', table_name='fraud_alerts')
    op.drop_index('ix_fraud_alerts_alert_id', table_name='fraud_alerts')
    op.drop_table('fraud_alerts')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS alertstatus')
    op.execute('DROP TYPE IF EXISTS alertseverity')
    op.execute('DROP TYPE IF EXISTS alerttype')
