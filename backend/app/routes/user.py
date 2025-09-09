from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models.user import User
from ..models.portfolio import Portfolio, Position
from marshmallow import Schema, fields, ValidationError
from datetime import datetime

user_bp = Blueprint('user', __name__)

class PortfolioSchema(Schema):
    name = fields.Str(required=True, validate=lambda x: len(x) >= 1)
    description = fields.Str()
    initial_capital = fields.Float(required=True, validate=lambda x: x > 0)

class PositionSchema(Schema):
    symbol = fields.Str(required=True)
    quantity = fields.Float(required=True, validate=lambda x: x > 0)
    entry_price = fields.Float(required=True, validate=lambda x: x > 0)
    position_type = fields.Str(required=True, validate=lambda x: x in ['long', 'short'])
    stop_loss = fields.Float()
    take_profit = fields.Float()
    notes = fields.Str()

@user_bp.route('/portfolios', methods=['GET'])
@jwt_required()
def get_portfolios():
    """Get all portfolios for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        portfolios = Portfolio.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'portfolios': [portfolio.to_dict() for portfolio in portfolios]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get portfolios'}), 500

@user_bp.route('/portfolios', methods=['POST'])
@jwt_required()
def create_portfolio():
    """Create a new portfolio"""
    try:
        current_user_id = get_jwt_identity()
        schema = PortfolioSchema()
        data = schema.load(request.get_json())
        
        portfolio = Portfolio(
            user_id=current_user_id,
            name=data['name'],
            description=data.get('description'),
            initial_capital=data['initial_capital'],
            current_capital=data['initial_capital']
        )
        
        db.session.add(portfolio)
        db.session.commit()
        
        return jsonify({
            'message': 'Portfolio created successfully',
            'portfolio': portfolio.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create portfolio'}), 500

@user_bp.route('/portfolios/<int:portfolio_id>', methods=['GET'])
@jwt_required()
def get_portfolio(portfolio_id):
    """Get a specific portfolio"""
    try:
        current_user_id = get_jwt_identity()
        
        portfolio = Portfolio.query.filter_by(
            id=portfolio_id, user_id=current_user_id
        ).first()
        
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        return jsonify({
            'portfolio': portfolio.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get portfolio'}), 500

@user_bp.route('/portfolios/<int:portfolio_id>', methods=['PUT'])
@jwt_required()
def update_portfolio(portfolio_id):
    """Update a portfolio"""
    try:
        current_user_id = get_jwt_identity()
        
        portfolio = Portfolio.query.filter_by(
            id=portfolio_id, user_id=current_user_id
        ).first()
        
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        schema = PortfolioSchema()
        data = schema.load(request.get_json())
        
        portfolio.name = data['name']
        portfolio.description = data.get('description')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Portfolio updated successfully',
            'portfolio': portfolio.to_dict()
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update portfolio'}), 500

@user_bp.route('/portfolios/<int:portfolio_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio(portfolio_id):
    """Delete a portfolio"""
    try:
        current_user_id = get_jwt_identity()
        
        portfolio = Portfolio.query.filter_by(
            id=portfolio_id, user_id=current_user_id
        ).first()
        
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        db.session.delete(portfolio)
        db.session.commit()
        
        return jsonify({
            'message': 'Portfolio deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete portfolio'}), 500

@user_bp.route('/portfolios/<int:portfolio_id>/positions', methods=['POST'])
@jwt_required()
def add_position(portfolio_id):
    """Add a position to a portfolio"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify portfolio belongs to user
        portfolio = Portfolio.query.filter_by(
            id=portfolio_id, user_id=current_user_id
        ).first()
        
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        schema = PositionSchema()
        data = schema.load(request.get_json())
        
        position = Position(
            portfolio_id=portfolio_id,
            symbol=data['symbol'],
            quantity=data['quantity'],
            entry_price=data['entry_price'],
            position_type=data['position_type'],
            stop_loss=data.get('stop_loss'),
            take_profit=data.get('take_profit'),
            notes=data.get('notes'),
            entry_date=datetime.utcnow()
        )
        
        db.session.add(position)
        db.session.commit()
        
        return jsonify({
            'message': 'Position added successfully',
            'position': position.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add position'}), 500

@user_bp.route('/positions/<int:position_id>', methods=['PUT'])
@jwt_required()
def update_position(position_id):
    """Update a position"""
    try:
        current_user_id = get_jwt_identity()
        
        position = Position.query.join(Portfolio).filter(
            Position.id == position_id,
            Portfolio.user_id == current_user_id
        ).first()
        
        if not position:
            return jsonify({'error': 'Position not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'current_price' in data:
            position.current_price = data['current_price']
        if 'stop_loss' in data:
            position.stop_loss = data['stop_loss']
        if 'take_profit' in data:
            position.take_profit = data['take_profit']
        if 'notes' in data:
            position.notes = data['notes']
        if 'status' in data and data['status'] in ['open', 'closed']:
            position.status = data['status']
            if data['status'] == 'closed':
                position.exit_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Position updated successfully',
            'position': position.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update position'}), 500

@user_bp.route('/positions/<int:position_id>', methods=['DELETE'])
@jwt_required()
def delete_position(position_id):
    """Delete a position"""
    try:
        current_user_id = get_jwt_identity()
        
        position = Position.query.join(Portfolio).filter(
            Position.id == position_id,
            Portfolio.user_id == current_user_id
        ).first()
        
        if not position:
            return jsonify({'error': 'Position not found'}), 404
        
        db.session.delete(position)
        db.session.commit()
        
        return jsonify({
            'message': 'Position deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete position'}), 500

@user_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get dashboard data for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get user's portfolios
        portfolios = Portfolio.query.filter_by(user_id=current_user_id).all()
        
        # Calculate total portfolio value and P&L
        total_value = 0
        total_pnl = 0
        
        for portfolio in portfolios:
            portfolio_pnl = 0
            for position in portfolio.positions:
                if position.current_price:
                    portfolio_pnl += position.unrealized_pnl
            total_value += portfolio.current_capital + portfolio_pnl
            total_pnl += portfolio_pnl
        
        # Get recent journal entries
        from ..models.journal import JournalEntry
        recent_entries = JournalEntry.query.filter_by(user_id=current_user_id)\
            .order_by(JournalEntry.created_at.desc())\
            .limit(5).all()
        
        # Get recent backtest results
        from ..models.backtest import BacktestResult
        recent_results = BacktestResult.query.join(Strategy).filter(
            Strategy.user_id == current_user_id
        ).order_by(BacktestResult.created_at.desc()).limit(5).all()
        
        return jsonify({
            'portfolios': [portfolio.to_dict() for portfolio in portfolios],
            'total_value': total_value,
            'total_pnl': total_pnl,
            'recent_entries': [entry.to_dict() for entry in recent_entries],
            'recent_results': [result.to_dict() for result in recent_results]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard data'}), 500 