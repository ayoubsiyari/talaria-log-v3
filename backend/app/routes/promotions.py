from flask import Blueprint, request, jsonify
from ..models import Promotion
from .. import db
from ..middleware.rbac_middleware import require_permission
from datetime import datetime, timedelta
from sqlalchemy import func
import random

# Define a new Blueprint for promotions
promotions_bp = Blueprint('promotions_bp', __name__)

@promotions_bp.route('', methods=['POST'])
# @require_permission('promotions.management.create')  # Temporarily disabled for testing
def create_promotion():
    """Create a new promotion."""
    data = request.get_json()
    if not data or not data.get('name') or not data.get('code') or not data.get('type') or not data.get('value'):
        return jsonify({'error': 'Missing required promotion data'}), 400

    # Check if code already exists
    existing_promotion = Promotion.query.filter_by(code=data['code']).first()
    if existing_promotion:
        return jsonify({'error': 'Promotion code already exists'}), 400

    # Parse dates
    start_date = None
    end_date = None
    if data.get('startDate'):
        try:
            start_date = datetime.strptime(data['startDate'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid start date format. Use YYYY-MM-DD'}), 400
    
    if data.get('endDate'):
        try:
            end_date = datetime.strptime(data['endDate'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid end date format. Use YYYY-MM-DD'}), 400

    # Create new promotion
    new_promotion = Promotion(
        name=data['name'],
        description=data.get('description', ''),
        code=data['code'],
        type=data['type'],
        value=data['value'],
        start_date=start_date,
        end_date=end_date,
        status=data.get('status', 'active'),
        usage_limit=data.get('usageLimit')
    )
    
    # Update status based on dates
    new_promotion.update_status()
    
    # Create Stripe coupon if Stripe is available
    try:
        import stripe
        from config.payment_config import get_stripe_config
        
        stripe_config = get_stripe_config()
        if stripe_config and stripe_config.get('secret_key'):
            stripe.api_key = stripe_config['secret_key']
            
            # Create Stripe coupon
            coupon_data = {
                'duration': 'once',
                'amount_off': int(float(data['value']) * 100) if data['type'] == 'fixed' else None,
                'percent_off': float(data['value']) if data['type'] == 'percentage' else None,
                'name': data['name'],
                'id': data['code']
            }
            
            if data.get('usageLimit'):
                coupon_data['max_redemptions'] = data['usageLimit']
            
            if end_date:
                coupon_data['redeem_by'] = int(end_date.timestamp())
            
            stripe.Coupon.create(**coupon_data)
            
    except Exception as e:
        print(f"Warning: Could not create Stripe coupon: {e}")
    
    try:
        db.session.add(new_promotion)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Promotion created successfully',
            'promotion': new_promotion.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create promotion: {str(e)}'}), 500

@promotions_bp.route('', methods=['GET'])
def get_promotions():
    """Get all promotions."""
    try:
        promotions = Promotion.query.all()
        return jsonify([promotion.to_dict() for promotion in promotions]), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch promotions: {str(e)}'}), 500

@promotions_bp.route('/analytics', methods=['GET'])
def get_promotions_analytics():
    """Get promotions analytics data."""
    try:
        # Get date range from query parameters
        range_param = request.args.get('range', '30d')
        
        # Calculate date range
        end_date = datetime.utcnow()
        if range_param == '7d':
            start_date = end_date - timedelta(days=7)
        elif range_param == '30d':
            start_date = end_date - timedelta(days=30)
        elif range_param == '90d':
            start_date = end_date - timedelta(days=90)
        elif range_param == '1y':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get all promotions
        promotions = Promotion.query.filter(
            Promotion.created_at >= start_date
        ).all()
        
        # Calculate analytics
        total_campaigns = len(promotions)
        active_campaigns = len([p for p in promotions if p.status == 'active'])
        total_revenue = sum(float(p.revenue) for p in promotions)
        total_conversions = sum(p.conversions for p in promotions)
        
        # Calculate conversion rate
        total_usage = sum(p.usage_count for p in promotions)
        conversion_rate = (total_conversions / total_usage * 100) if total_usage > 0 else 0
        
        # Calculate click through rate (mock data for now)
        click_through_rate = 8.5  # Mock value
        
        # Get campaigns data
        campaigns = []
        for promotion in promotions:
            campaigns.append({
                'name': promotion.name,
                'revenue': float(promotion.revenue),
                'conversions': promotion.conversions,
                'clicks': promotion.usage_count + random.randint(50, 200)  # Mock clicks
            })
        
        # Generate monthly data (mock data for now)
        monthly_data = []
        current_date = start_date
        while current_date <= end_date:
            monthly_data.append({
                'month': current_date.strftime('%b'),
                'revenue': random.randint(5000, 15000),
                'conversions': random.randint(80, 200)
            })
            current_date += timedelta(days=30)
        
        analytics_data = {
            'total_campaigns': total_campaigns,
            'active_campaigns': active_campaigns,
            'total_revenue': total_revenue,
            'conversion_rate': round(conversion_rate, 1),
            'click_through_rate': click_through_rate,
            'campaigns': campaigns,
            'monthly_data': monthly_data
        }
        
        return jsonify(analytics_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch promotions analytics: {str(e)}'}), 500

@promotions_bp.route('/<int:promotion_id>', methods=['GET'])
def get_promotion(promotion_id):
    """Get a specific promotion by ID."""
    try:
        promotion = Promotion.query.get_or_404(promotion_id)
        return jsonify(promotion.to_dict()), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch promotion: {str(e)}'}), 500

@promotions_bp.route('/<int:promotion_id>', methods=['PUT'])
def update_promotion(promotion_id):
    """Update a promotion."""
    try:
        promotion = Promotion.query.get_or_404(promotion_id)
        data = request.get_json()
        
        if data.get('name'):
            promotion.name = data['name']
        if data.get('description'):
            promotion.description = data['description']
        if data.get('type'):
            promotion.type = data['type']
        if data.get('value'):
            promotion.value = data['value']
        if data.get('status'):
            promotion.status = data['status']
        if data.get('usageLimit'):
            promotion.usage_limit = data['usageLimit']
        
        # Parse dates
        if data.get('startDate'):
            try:
                promotion.start_date = datetime.strptime(data['startDate'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid start date format. Use YYYY-MM-DD'}), 400
        
        if data.get('endDate'):
            try:
                promotion.end_date = datetime.strptime(data['endDate'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid end date format. Use YYYY-MM-DD'}), 400
        
        # Update status based on dates
        promotion.update_status()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Promotion updated successfully',
            'promotion': promotion.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update promotion: {str(e)}'}), 500

@promotions_bp.route('/<int:promotion_id>', methods=['DELETE'])
def delete_promotion(promotion_id):
    """Delete a promotion."""
    try:
        promotion = Promotion.query.get_or_404(promotion_id)
        db.session.delete(promotion)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Promotion deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete promotion: {str(e)}'}), 500
