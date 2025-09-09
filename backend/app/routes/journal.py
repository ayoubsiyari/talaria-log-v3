from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models.journal import JournalEntry, JournalTag
from ..models.user import User
from marshmallow import Schema, fields, ValidationError
from datetime import datetime

journal_bp = Blueprint('journal', __name__)

class JournalEntrySchema(Schema):
    title = fields.Str(required=True, validate=lambda x: len(x) >= 1)
    content = fields.Str(required=True)
    mood = fields.Str()
    market_outlook = fields.Str()
    trade_type = fields.Str()
    symbols = fields.Str()
    entry_date = fields.Date(required=True)
    tag_ids = fields.List(fields.Int())

class JournalTagSchema(Schema):
    name = fields.Str(required=True, validate=lambda x: len(x) >= 1)
    color = fields.Str()

@journal_bp.route('/entries', methods=['GET'])
@jwt_required()
def get_entries():
    """Get all journal entries for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        tag_id = request.args.get('tag_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query
        query = JournalEntry.query.filter_by(user_id=current_user_id)
        
        if search:
            query = query.filter(
                (JournalEntry.title.ilike(f'%{search}%')) |
                (JournalEntry.content.ilike(f'%{search}%'))
            )
        
        if tag_id:
            query = query.join(JournalEntry.tags).filter(JournalTag.id == tag_id)
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(JournalEntry.entry_date >= start_date)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(JournalEntry.entry_date <= end_date)
            except ValueError:
                pass
        
        # Order by entry date (newest first)
        query = query.order_by(JournalEntry.entry_date.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        entries = [entry.to_dict() for entry in pagination.items]
        
        return jsonify({
            'entries': entries,
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
        return jsonify({'error': 'Failed to get entries'}), 500

@journal_bp.route('/entries', methods=['POST'])
@jwt_required()
def create_entry():
    """Create a new journal entry"""
    try:
        current_user_id = get_jwt_identity()
        schema = JournalEntrySchema()
        data = schema.load(request.get_json())
        
        # Create entry
        entry = JournalEntry(
            user_id=current_user_id,
            title=data['title'],
            content=data['content'],
            mood=data.get('mood'),
            market_outlook=data.get('market_outlook'),
            trade_type=data.get('trade_type'),
            symbols=data.get('symbols'),
            entry_date=data['entry_date']
        )
        
        # Add tags if provided
        if data.get('tag_ids'):
            tags = JournalTag.query.filter(
                JournalTag.id.in_(data['tag_ids']),
                JournalTag.user_id == current_user_id
            ).all()
            entry.tags = tags
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Entry created successfully',
            'entry': entry.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create entry'}), 500

@journal_bp.route('/entries/<int:entry_id>', methods=['GET'])
@jwt_required()
def get_entry(entry_id):
    """Get a specific journal entry"""
    try:
        current_user_id = get_jwt_identity()
        
        entry = JournalEntry.query.filter_by(
            id=entry_id, user_id=current_user_id
        ).first()
        
        if not entry:
            return jsonify({'error': 'Entry not found'}), 404
        
        return jsonify({
            'entry': entry.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get entry'}), 500

@journal_bp.route('/entries/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_entry(entry_id):
    """Update a journal entry"""
    try:
        current_user_id = get_jwt_identity()
        
        entry = JournalEntry.query.filter_by(
            id=entry_id, user_id=current_user_id
        ).first()
        
        if not entry:
            return jsonify({'error': 'Entry not found'}), 404
        
        schema = JournalEntrySchema()
        data = schema.load(request.get_json())
        
        # Update fields
        entry.title = data['title']
        entry.content = data['content']
        entry.mood = data.get('mood')
        entry.market_outlook = data.get('market_outlook')
        entry.trade_type = data.get('trade_type')
        entry.symbols = data.get('symbols')
        entry.entry_date = data['entry_date']
        
        # Update tags
        if data.get('tag_ids') is not None:
            tags = JournalTag.query.filter(
                JournalTag.id.in_(data['tag_ids']),
                JournalTag.user_id == current_user_id
            ).all()
            entry.tags = tags
        
        db.session.commit()
        
        return jsonify({
            'message': 'Entry updated successfully',
            'entry': entry.to_dict()
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update entry'}), 500

@journal_bp.route('/entries/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry(entry_id):
    """Delete a journal entry"""
    try:
        current_user_id = get_jwt_identity()
        
        entry = JournalEntry.query.filter_by(
            id=entry_id, user_id=current_user_id
        ).first()
        
        if not entry:
            return jsonify({'error': 'Entry not found'}), 404
        
        db.session.delete(entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Entry deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete entry'}), 500

@journal_bp.route('/tags', methods=['GET'])
@jwt_required()
def get_tags():
    """Get all tags for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        tags = JournalTag.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'tags': [tag.to_dict() for tag in tags]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get tags'}), 500

@journal_bp.route('/tags', methods=['POST'])
@jwt_required()
def create_tag():
    """Create a new tag"""
    try:
        current_user_id = get_jwt_identity()
        schema = JournalTagSchema()
        data = schema.load(request.get_json())
        
        # Check if tag name already exists for user
        existing_tag = JournalTag.query.filter_by(
            user_id=current_user_id, name=data['name']
        ).first()
        
        if existing_tag:
            return jsonify({'error': 'Tag name already exists'}), 400
        
        tag = JournalTag(
            user_id=current_user_id,
            name=data['name'],
            color=data.get('color', '#007bff')
        )
        
        db.session.add(tag)
        db.session.commit()
        
        return jsonify({
            'message': 'Tag created successfully',
            'tag': tag.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create tag'}), 500

@journal_bp.route('/tags/<int:tag_id>', methods=['DELETE'])
@jwt_required()
def delete_tag(tag_id):
    """Delete a tag"""
    try:
        current_user_id = get_jwt_identity()
        
        tag = JournalTag.query.filter_by(
            id=tag_id, user_id=current_user_id
        ).first()
        
        if not tag:
            return jsonify({'error': 'Tag not found'}), 404
        
        db.session.delete(tag)
        db.session.commit()
        
        return jsonify({
            'message': 'Tag deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete tag'}), 500 