from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models.strategy import Strategy, BacktestResult, BacktestParameter
from ..models.user import User
from marshmallow import Schema, fields, ValidationError
from datetime import datetime
import json

backtest_bp = Blueprint('backtest', __name__)

class StrategySchema(Schema):
    name = fields.Str(required=True, validate=lambda x: len(x) >= 1)
    description = fields.Str()
    strategy_type = fields.Str()
    symbols = fields.Str()
    timeframe = fields.Str()
    parameters = fields.List(fields.Dict())

class BacktestRequestSchema(Schema):
    strategy_id = fields.Int(required=True)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    initial_capital = fields.Float(required=True, validate=lambda x: x > 0)
    parameters = fields.List(fields.Dict())

@backtest_bp.route('/strategies', methods=['GET'])
@jwt_required()
def get_strategies():
    """Get all strategies for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        strategies = Strategy.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'strategies': [strategy.to_dict() for strategy in strategies]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get strategies'}), 500

@backtest_bp.route('/strategies', methods=['POST'])
@jwt_required()
def create_strategy():
    """Create a new strategy"""
    try:
        current_user_id = get_jwt_identity()
        schema = StrategySchema()
        data = schema.load(request.get_json())
        
        # Create strategy
        strategy = Strategy(
            user_id=current_user_id,
            name=data['name'],
            description=data.get('description'),
            strategy_type=data.get('strategy_type'),
            symbols=data.get('symbols'),
            timeframe=data.get('timeframe')
        )
        
        db.session.add(strategy)
        db.session.flush()  # Get the strategy ID
        
        # Add parameters if provided
        if data.get('parameters'):
            for param_data in data['parameters']:
                param = BacktestParameter(
                    strategy_id=strategy.id,
                    name=param_data['name'],
                    value=str(param_data['value']),
                    parameter_type=param_data.get('type', 'string'),
                    description=param_data.get('description')
                )
                db.session.add(param)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Strategy created successfully',
            'strategy': strategy.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create strategy'}), 500

@backtest_bp.route('/strategies/<int:strategy_id>', methods=['GET'])
@jwt_required()
def get_strategy(strategy_id):
    """Get a specific strategy"""
    try:
        current_user_id = get_jwt_identity()
        
        strategy = Strategy.query.filter_by(
            id=strategy_id, user_id=current_user_id
        ).first()
        
        if not strategy:
            return jsonify({'error': 'Strategy not found'}), 404
        
        return jsonify({
            'strategy': strategy.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get strategy'}), 500

@backtest_bp.route('/strategies/<int:strategy_id>', methods=['PUT'])
@jwt_required()
def update_strategy(strategy_id):
    """Update a strategy"""
    try:
        current_user_id = get_jwt_identity()
        
        strategy = Strategy.query.filter_by(
            id=strategy_id, user_id=current_user_id
        ).first()
        
        if not strategy:
            return jsonify({'error': 'Strategy not found'}), 404
        
        schema = StrategySchema()
        data = schema.load(request.get_json())
        
        # Update fields
        strategy.name = data['name']
        strategy.description = data.get('description')
        strategy.strategy_type = data.get('strategy_type')
        strategy.symbols = data.get('symbols')
        strategy.timeframe = data.get('timeframe')
        
        # Update parameters
        if data.get('parameters') is not None:
            # Delete existing parameters
            BacktestParameter.query.filter_by(strategy_id=strategy.id).delete()
            
            # Add new parameters
            for param_data in data['parameters']:
                param = BacktestParameter(
                    strategy_id=strategy.id,
                    name=param_data['name'],
                    value=str(param_data['value']),
                    parameter_type=param_data.get('type', 'string'),
                    description=param_data.get('description')
                )
                db.session.add(param)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Strategy updated successfully',
            'strategy': strategy.to_dict()
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update strategy'}), 500

@backtest_bp.route('/strategies/<int:strategy_id>', methods=['DELETE'])
@jwt_required()
def delete_strategy(strategy_id):
    """Delete a strategy"""
    try:
        current_user_id = get_jwt_identity()
        
        strategy = Strategy.query.filter_by(
            id=strategy_id, user_id=current_user_id
        ).first()
        
        if not strategy:
            return jsonify({'error': 'Strategy not found'}), 404
        
        db.session.delete(strategy)
        db.session.commit()
        
        return jsonify({
            'message': 'Strategy deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete strategy'}), 500

@backtest_bp.route('/run', methods=['POST'])
@jwt_required()
def run_backtest():
    """Run a backtest"""
    try:
        current_user_id = get_jwt_identity()
        schema = BacktestRequestSchema()
        data = schema.load(request.get_json())
        
        # Verify strategy belongs to user
        strategy = Strategy.query.filter_by(
            id=data['strategy_id'], user_id=current_user_id
        ).first()
        
        if not strategy:
            return jsonify({'error': 'Strategy not found'}), 404
        
        # Start backtest task
        task = celery.send_task(
            'app.tasks.backtest.run_backtest',
            args=[
                strategy.id,
                data['start_date'].isoformat(),
                data['end_date'].isoformat(),
                data['initial_capital'],
                data.get('parameters', [])
            ]
        )
        
        return jsonify({
            'message': 'Backtest started',
            'task_id': task.id
        }), 202
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to start backtest'}), 500

@backtest_bp.route('/results', methods=['GET'])
@jwt_required()
def get_results():
    """Get backtest results for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        strategy_id = request.args.get('strategy_id', type=int)
        
        # Build query
        query = BacktestResult.query.join(Strategy).filter(Strategy.user_id == current_user_id)
        
        if strategy_id:
            query = query.filter(BacktestResult.strategy_id == strategy_id)
        
        # Order by creation date (newest first)
        query = query.order_by(BacktestResult.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        results = [result.to_dict() for result in pagination.items]
        
        return jsonify({
            'results': results,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get results'}), 500

@backtest_bp.route('/results/<int:result_id>', methods=['GET'])
@jwt_required()
def get_result(result_id):
    """Get a specific backtest result"""
    try:
        current_user_id = get_jwt_identity()
        
        result = BacktestResult.query.join(Strategy).filter(
            BacktestResult.id == result_id,
            Strategy.user_id == current_user_id
        ).first()
        
        if not result:
            return jsonify({'error': 'Result not found'}), 404
        
        return jsonify({
            'result': result.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get result'}), 500

@backtest_bp.route('/task/<task_id>', methods=['GET'])
@jwt_required()
def get_task_status(task_id):
    """Get the status of a backtest task"""
    try:
        task = celery.AsyncResult(task_id)
        
        response = {
            'task_id': task_id,
            'status': task.status
        }
        
        if task.status == 'SUCCESS':
            response['result'] = task.result
        elif task.status == 'FAILURE':
            response['error'] = str(task.info)
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get task status'}), 500 