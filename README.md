# EduQuest - Gamified E-Learning Platform

An interactive learning platform where kids learn Math and Science through engaging games.

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Flask (Python)
- **Database:** SQLite
- **Fonts:** Google Fonts (Nunito, Quicksand, Fredoka One)

## Project Structure

```
eduquest/
├── app.py                 # Flask backend with API routes
├── requirements.txt       # Python dependencies
├── SPEC.md               # Project specification
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── main.css      # Shared styles & CSS variables
    ├── js/
    │   ├── app.js        # Main application logic
    │   ├── game-registry.js  # Game registration system
    │   └── game-loader.js    # Dynamic game loader
    └── games/
        ├── math/
        │   └── addition-level1.html  # Addition game
        └── science/
            └── animals-level1.html  # Animals game
```

## How to Run

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py

# Open in browser
# http://localhost:5000
```

## Adding New Games (Scalable!)

### Step 1: Create your game HTML file

Create a new HTML file in the appropriate folder:
- Math games: `static/games/math/your-game.html`
- Science games: `static/games/science/your-game.html`

### Step 2: Register the game

Add game registration to `app.js` `registerDefaultGames()` function:

```javascript
// Example: Adding a subtraction game
GameRegistry.registerGame({
  game_id: 'math-subtraction-2',
  title: 'Minus Monster',
  subject: 'math',
  level: 2,
  concept: 'Subtraction',
  description: 'Master subtraction!',
  instructions: 'Solve subtraction problems...',
  pass_threshold: 70,
  min_age: 6,
  html_file: '/static/games/math/subtraction-level2.html'
});
```

### Step 3: Create game HTML with initialization function

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your Game</title>
  <link rel="stylesheet" href="../../css/main.css">
</head>
<body>
  <!-- Your game content here -->
  <div id="question">5 - 3 = ?</div>
  
  <script>
    // This function name must match: {game_id}_init
    function math_subtraction_2_init() {
      // Initialize your game
      generateQuestion();
    }
    
    function checkAnswer(selected) {
      if (selected === correctAnswer) {
        EduQuest.submitScore(10);
      } else {
        EduQuest.loseLife();
      }
    }
  </script>
</body>
</html>
```

### Step 4: Start the app

The game will automatically appear in the level hub!

## Game API

Games have access to these methods:

| Method | Description |
|--------|-------------|
| `EduQuest.submitScore(points)` | Add points to score |
| `EduQuest.loseLife()` | Remove a life |
| `EduQuest.endGame()` | End game and show results |
| `EduQuest.getConfig()` | Get game config |

Game initialization function pattern: `{game_id}_init`

## Screens

1. **Welcome** - Start screen with mascot
2. **Profile** - Enter name and age
3. **Subject Selection** - Choose Math or Science
4. **Level Hub** - View and select levels
5. **Game** - Play the actual game
6. **Results** - View score and unlock next level

## Progress System

- 70% score required to pass and unlock next level
- Stars awarded: 1 star (70-84%), 2 stars (85-94%), 3 stars (95%+)
- Progress saved to SQLite database

## Features

- Engaging animations (bounce, confetti, shake)
- Colorful, kid-friendly design
- Mobile responsive
- Real-time score and lives display
- Progress persistence across sessions
