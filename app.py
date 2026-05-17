from flask import Flask, render_template, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'eduquest-secret-key-2024')
# Use Supabase Database URL from .env if present, else fallback to local SQLite
db_url = os.environ.get('DATABASE_URL', 'sqlite:///eduquest_new.db')
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
if "postgresql+pg8000://" in db_url:
    db_url = db_url.replace("postgresql+pg8000://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ============== MODELS ==============

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    mobile = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_premium = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.now())

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'mobile': self.mobile,
            'is_premium': self.is_premium,
            'created_at': self.created_at.isoformat()
        }


class GameProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    game_id = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, default=0)
    stars = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    attempts = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'score': self.score,
            'stars': self.stars,
            'completed': self.completed,
            'attempts': self.attempts
        }


class GameMetadata(db.Model):
    """ Stores game metadata - games register themselves via API """
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.String(100), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    level = db.Column(db.Integer, nullable=False)
    concept = db.Column(db.String(200), nullable=False)
    topic = db.Column(db.String(100), default="General")
    description = db.Column(db.Text)
    instructions = db.Column(db.Text)
    pass_threshold = db.Column(db.Integer, default=70)
    min_age = db.Column(db.Integer, default=5)
    max_age = db.Column(db.Integer, default=15)
    html_file = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    is_premium = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'game_id': self.game_id,
            'title': self.title,
            'subject': self.subject,
            'level': self.level,
            'concept': self.concept,
            'topic': self.topic,
            'description': self.description,
            'instructions': self.instructions,
            'pass_threshold': self.pass_threshold,
            'min_age': self.min_age,
            'max_age': self.max_age,
            'html_file': self.html_file,
            'is_active': self.is_active,
            'is_premium': self.is_premium
        }


# ============== ROUTES ==============

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/admin')
def admin_page():
    return render_template('admin.html')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'EduQuest API Running'})


# ============== ADMIN ROUTES ==============

ADMIN_PIN = os.environ.get('ADMIN_PIN', 'admin123')  # Simple PIN for admin access

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login with PIN"""
    data = request.json
    if data.get('pin') == ADMIN_PIN:
        return jsonify({'success': True, 'message': 'Admin logged in'})
    return jsonify({'error': 'Invalid PIN'}), 401


@app.route('/api/admin/users')
def get_all_users():
    """Get all users with their progress"""
    users = User.query.all()
    users_data = []
    for user in users:
        # Get total stats
        total_score = db.session.query(db.func.sum(GameProgress.score)).filter(
            GameProgress.user_id == user.id
        ).scalar() or 0

        total_stars = db.session.query(db.func.sum(GameProgress.stars)).filter(
            GameProgress.user_id == user.id
        ).scalar() or 0

        completed_games = GameProgress.query.filter_by(
            user_id=user.id, completed=True
        ).count()

        users_data.append({
            'id': user.id,
            'name': user.name,
            'age': user.age,
            'mobile': user.mobile,
            'is_premium': user.is_premium,
            'total_score': total_score,
            'total_stars': total_stars,
            'completed_games': completed_games,
            'created_at': user.created_at.isoformat()
        })

    return jsonify(users_data)


@app.route('/api/admin/user/<int:user_id>/premium', methods=['POST'])
def toggle_user_premium(user_id):
    """Toggle premium status for a user"""
    data = request.json
    user = User.query.get_or_404(user_id)
    user.is_premium = data.get('is_premium', False)
    db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict()})


# ============== USER ROUTES ==============

@app.route('/api/signup', methods=['POST'])
def signup():
    """User signup - no verification required"""
    data = request.json

    # Check if mobile already exists
    existing_user = User.query.filter_by(mobile=data['mobile']).first()
    if existing_user:
        return jsonify({'error': 'Mobile number already registered'}), 400

    # Validate required fields
    if not data.get('name') or not data.get('mobile') or not data.get('password'):
        return jsonify({'error': 'Name, mobile and password are required'}), 400

    if data.get('age') is None:
        return jsonify({'error': 'Age is required'}), 400

    # Create new user
    user = User(name=data['name'], age=data['age'], mobile=data['mobile'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'Signup successful',
        'user': user.to_dict()
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    """User login"""
    data = request.json

    user = User.query.filter_by(mobile=data['mobile']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid mobile number or password'}), 401

    # Store user ID in session
    session['user_id'] = user.id

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    })


@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'})


@app.route('/api/check-session', methods=['GET'])
def check_session():
    """Check if user is logged in"""
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({'logged_in': True, 'user': user.to_dict()})
    return jsonify({'logged_in': False})


@app.route('/api/user', methods=['POST'])
def create_user():
    data = request.json
    user = User(name=data['name'], age=data['age'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@app.route('/api/user/<int:user_id>')
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@app.route('/api/user/<int:user_id>/progress')
def get_user_progress(user_id):
    """ Get all progress for a user """
    progress = GameProgress.query.filter_by(user_id=user_id).all()
    return jsonify([p.to_dict() for p in progress])


@app.route('/api/user/<int:user_id>/progress/<subject>')
def get_user_subject_progress(user_id, subject):
    """ Get progress filtered by subject """
    games = GameMetadata.query.filter_by(subject=subject, is_active=True).all()
    progress = GameProgress.query.filter_by(user_id=user_id).all()

    progress_dict = {p.game_id: p.to_dict() for p in progress}

    result = []
    for game in games:
        game_data = game.to_dict()
        if game.game_id in progress_dict:
            game_data['progress'] = progress_dict[game.game_id]
        result.append(game_data)

    return jsonify(result)


# ============== GAME ROUTES ==============

@app.route('/api/games')
def get_games():
    """ Get all active games """
    games = GameMetadata.query.filter_by(is_active=True).all()
    return jsonify([g.to_dict() for g in games])


@app.route('/api/games/<subject>')
def get_games_by_subject(subject):
    """ Get games by subject """
    games = GameMetadata.query.filter_by(subject=subject, is_active=True).order_by(GameMetadata.level).all()
    return jsonify([g.to_dict() for g in games])


@app.route('/api/games/register', methods=['POST'])
def register_game():
    """
    Register a new game dynamically
    Called by game-registry.js when app loads
    """
    data = request.json

    existing = GameMetadata.query.filter_by(game_id=data['game_id']).first()
    if existing:
        # Update existing
        for key, value in data.items():
            setattr(existing, key, value)
    else:
        # Create new
        game = GameMetadata(**data)
        db.session.add(game)

    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Game registered'}), 201


# ============== PROGRESS ROUTES ==============

@app.route('/api/progress', methods=['POST'])
def save_progress():
    """ Save game progress """
    data = request.json

    progress = GameProgress.query.filter_by(
        user_id=data['user_id'],
        game_id=data['game_id']
    ).first()

    if progress:
        progress.score = data.get('score', progress.score)
        progress.attempts += 1
        if data.get('completed'):
            progress.completed = True
            if data.get('stars', 0) > progress.stars:
                progress.stars = data['stars']
    else:
        progress = GameProgress(
            user_id=data['user_id'],
            game_id=data['game_id'],
            score=data.get('score', 0),
            stars=data.get('stars', 0),
            completed=data.get('completed', False)
        )
        db.session.add(progress)

    db.session.commit()
    return jsonify(progress.to_dict())


@app.route('/api/progress/<int:user_id>/<game_id>')
def get_game_progress(user_id, game_id):
    """ Get specific game progress """
    progress = GameProgress.query.filter_by(
        user_id=user_id,
        game_id=game_id
    ).first()

    if progress:
        return jsonify(progress.to_dict())
    return jsonify({'game_id': game_id, 'score': 0, 'stars': 0, 'completed': False})


# ============== LEADERBOARD ROUTES ==============

@app.route('/api/leaderboard')
def get_leaderboard():
    """ Get global leaderboard - all users sorted by total score """
    # Get all users with their total scores
    users = User.query.all()

    leaderboard_data = []
    for user in users:
        # Calculate total score from all games
        total_score = db.session.query(db.func.sum(GameProgress.score)).filter(
            GameProgress.user_id == user.id
        ).scalar() or 0

        # Calculate total stars
        total_stars = db.session.query(db.func.sum(GameProgress.stars)).filter(
            GameProgress.user_id == user.id
        ).scalar() or 0

        # Count completed games
        completed_games = GameProgress.query.filter_by(
            user_id=user.id, completed=True
        ).count()

        leaderboard_data.append({
            'rank': 0,  # Will be set after sorting
            'user_id': user.id,
            'name': user.name,
            'total_score': total_score,
            'total_stars': total_stars,
            'completed_games': completed_games
        })

    # Sort by total score descending
    leaderboard_data.sort(key=lambda x: x['total_score'], reverse=True)

    # Assign ranks
    for i, entry in enumerate(leaderboard_data):
        entry['rank'] = i + 1

    return jsonify(leaderboard_data)


@app.route('/api/leaderboard/<subject>')
def get_subject_leaderboard(subject):
    """ Get leaderboard filtered by subject """
    users = User.query.all()

    leaderboard_data = []
    for user in users:
        # Get games for this subject
        subject_games = GameMetadata.query.filter_by(subject=subject).all()
        game_ids = [g.game_id for g in subject_games]

        # Calculate total score for this subject
        total_score = db.session.query(db.func.sum(GameProgress.score)).filter(
            GameProgress.user_id == user.id,
            GameProgress.game_id.in_(game_ids)
        ).scalar() or 0

        total_stars = db.session.query(db.func.sum(GameProgress.stars)).filter(
            GameProgress.user_id == user.id,
            GameProgress.game_id.in_(game_ids)
        ).scalar() or 0

        completed_games = GameProgress.query.filter(
            GameProgress.user_id == user.id,
            GameProgress.game_id.in_(game_ids),
            GameProgress.completed == True
        ).count()

        leaderboard_data.append({
            'rank': 0,
            'user_id': user.id,
            'name': user.name,
            'total_score': total_score,
            'total_stars': total_stars,
            'completed_games': completed_games
        })

    leaderboard_data.sort(key=lambda x: x['total_score'], reverse=True)

    for i, entry in enumerate(leaderboard_data):
        entry['rank'] = i + 1

    return jsonify(leaderboard_data)


@app.route('/api/progress/unlock', methods=['POST'])
def unlock_next_level():
    """
    Unlock next level when current is passed
    Called after a game is completed with passing score
    """
    data = request.json
    user_id = data['user_id']
    current_game_id = data['game_id']

    # Get current game to find next
    current_game = GameMetadata.query.filter_by(game_id=current_game_id).first()
    if not current_game:
        return jsonify({'error': 'Game not found'}), 404

    # Find next game in same subject
    next_game = GameMetadata.query.filter(
        GameMetadata.subject == current_game.subject,
        GameMetadata.level == current_game.level + 1,
        GameMetadata.is_active == True
    ).first()

    if next_game:
        # Initialize progress for next game (unlocked state)
        existing = GameProgress.query.filter_by(
            user_id=user_id,
            game_id=next_game.game_id
        ).first()

        if not existing:
            progress = GameProgress(
                user_id=user_id,
                game_id=next_game.game_id,
                score=0,
                stars=0,
                completed=False
            )
            db.session.add(progress)
            db.session.commit()

        return jsonify({'unlocked': True, 'next_game': next_game.to_dict()})

    return jsonify({'unlocked': False, 'message': 'All levels complete!'})


# ============== INITIALIZE DB ==============

def scan_and_register_games(app):
    """Scan the static/games directory for HTML files and register games based on embedded JSON metadata."""
    print("Scanning for games...")
    games_dir = os.path.join(app.root_path, 'static', 'games')
    found_game_ids = set()
    
    for root, _, files in os.walk(games_dir):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                
                # Calculate relative path for html_file property
                rel_path = os.path.relpath(file_path, app.root_path)
                # Replace backslashes with forward slashes for URLs
                rel_path = rel_path.replace('\\', '/')
                # Add leading slash
                if not rel_path.startswith('/'):
                    rel_path = '/' + rel_path
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Extract JSON metadata
                    match = re.search(r'<script\s+id="game-metadata"\s+type="application/json">([\s\S]*?)</script>', content)
                    if match:
                        try:
                            metadata_str = match.group(1).strip()
                            metadata = json.loads(metadata_str)
                            
                            # Add/override html_file path
                            metadata['html_file'] = rel_path
                            
                            # Register in database
                            existing = GameMetadata.query.filter_by(game_id=metadata['game_id']).first()
                            if existing:
                                for key, value in metadata.items():
                                    setattr(existing, key, value)
                                existing.is_active = True
                            else:
                                game = GameMetadata(**metadata)
                                db.session.add(game)
                                
                            found_game_ids.add(metadata['game_id'])
                            print(f"Registered game: {metadata['game_id']} from {rel_path}")
                        except json.JSONDecodeError as e:
                            print(f"Error parsing JSON in {file_path}: {e}")
                        except Exception as e:
                            print(f"Error registering game from {file_path}: {e}")

    # Deactivate games that are no longer in the filesystem
    all_games = GameMetadata.query.all()
    for game in all_games:
        if game.game_id not in found_game_ids:
            game.is_active = False
            print(f"Deactivated game: {game.game_id} (file not found)")
            
    db.session.commit()
    print(f"Total active games: {len(found_game_ids)}")


def init_db():
    with app.app_context():
        try:
            print("Ensuring database tables exist...")
            db.create_all()
            scan_and_register_games(app)
        except Exception as e:
            print(f"Database initialization failed: {e}")

# Initialize database and register games on startup (required for Gunicorn/Render)
init_db()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
