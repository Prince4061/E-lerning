from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eduquest.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ============== MODELS ==============

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
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
    description = db.Column(db.Text)
    instructions = db.Column(db.Text)
    pass_threshold = db.Column(db.Integer, default=70)
    min_age = db.Column(db.Integer, default=5)
    max_age = db.Column(db.Integer, default=15)
    html_file = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'game_id': self.game_id,
            'title': self.title,
            'subject': self.subject,
            'level': self.level,
            'concept': self.concept,
            'description': self.description,
            'instructions': self.instructions,
            'pass_threshold': self.pass_threshold,
            'min_age': self.min_age,
            'max_age': self.max_age,
            'html_file': self.html_file,
            'is_active': self.is_active
        }


# ============== ROUTES ==============

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'EduQuest API Running'})


# ============== USER ROUTES ==============

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

def init_db():
    with app.app_context():
        db.create_all()

        # Add some default games if none exist
        if GameMetadata.query.count() == 0:
            default_games = [
                {
                    'game_id': 'math-placevalue-1',
                    'title': 'Balloon Pop',
                    'subject': 'math',
                    'level': 1,
                    'concept': 'Place Values',
                    'description': 'Pop balloons to find the correct digit based on place value!',
                    'instructions': 'Pop the balloon with the digit that matches the requested place value.',
                    'pass_threshold': 70,
                    'min_age': 5,
                    'html_file': 'static/games/math/placevalue-level1.html'
                },
                {
                    'game_id': 'math-descending-2',
                    'title': 'Balloon Order',
                    'subject': 'math',
                    'level': 2,
                    'concept': 'Ascending/Descending',
                    'description': 'Pop balloons in ascending or descending order!',
                    'instructions': 'Pop the balloons in the correct order as shown.',
                    'pass_threshold': 70,
                    'min_age': 6,
                    'html_file': 'static/games/math/descending-level2.html'
                },
                {
                    'game_id': 'math-subtraction-2',
                    'title': 'Minus Monster',
                    'subject': 'math',
                    'level': 2,
                    'concept': 'Subtraction',
                    'description': 'Master subtraction with engaging gameplay!',
                    'instructions': 'Find the correct answer to complete the subtraction.',
                    'pass_threshold': 70,
                    'min_age': 6,
                    'html_file': 'games/math/subtraction-level2.html'
                },
                {
                    'game_id': 'science-animals-1',
                    'title': 'Animal Kingdom',
                    'subject': 'science',
                    'level': 1,
                    'concept': 'Animal Types',
                    'description': 'Learn about different animals and their homes!',
                    'instructions': 'Match animals to their correct category.',
                    'pass_threshold': 70,
                    'min_age': 5,
                    'html_file': 'games/science/animals-level1.html'
                }
            ]

            for game_data in default_games:
                game = GameMetadata(**game_data)
                db.session.add(game)

            db.session.commit()
            print("Default games added to database!")


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
