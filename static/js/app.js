/**
 * EduQuest Main Application
 * Handles screen navigation, user profile, and game flow
 */

const App = {
  // Current user state (synced with backend)
  user: null,
  currentSubject: null,
  currentGameId: null,
  gameState: {
    score: 0,
    lives: 3,
    started: false
  },

  /**
   * Initialize the application
   */
  async init() {
    // Initialize game loader
    GameLoader.init();

    // Try to restore session from localStorage
    await this.checkLoginStatus();

    // Register default games
    this.registerDefaultGames();

    // Load games from backend
    await GameRegistry.loadFromBackend();
  },

  /**
   * Check login status from backend
   */
  async checkLoginStatus() {
    try {
      const response = await fetch('/api/check-session');
      const data = await response.json();
      if (data.logged_in && data.user) {
        this.user = data.user;
        localStorage.setItem('eduquest_user', JSON.stringify(this.user));
      }
    } catch (e) {
      console.warn('Could not check session:', e);
      // Fall back to localStorage
      this.restoreSession();
    }
  },

  /**
   * User signup
   */
  async signup(name, age, mobile, password) {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, mobile, password })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error };
      }

      // Login successful - save user
      this.user = data.user;
      localStorage.setItem('eduquest_user', JSON.stringify(this.user));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  /**
   * User login
   */
  async login(mobile, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error };
      }

      // Login successful - save user
      this.user = data.user;
      localStorage.setItem('eduquest_user', JSON.stringify(this.user));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  /**
   * User logout
   */
  async logout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Could not logout from backend');
    }

    localStorage.removeItem('eduquest_user');
    localStorage.removeItem('eduquest_subject');
    this.user = null;
    this.currentSubject = null;
    this.showScreen('welcome');
  },

  /**
   * Handle signup form submission
   */
  async handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const age = parseInt(document.getElementById('signup-age').value);
    const mobile = document.getElementById('signup-mobile').value.trim();
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');

    // Validation
    if (!name) {
      errorDiv.textContent = 'Please enter your name';
      errorDiv.style.display = 'block';
      return;
    }

    if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      errorDiv.textContent = 'Please enter a valid 10-digit mobile number';
      errorDiv.style.display = 'block';
      return;
    }

    if (!password || password.length < 4) {
      errorDiv.textContent = 'Password must be at least 4 characters';
      errorDiv.style.display = 'block';
      return;
    }

    errorDiv.style.display = 'none';

    // Call signup API
    const result = await this.signup(name, age, mobile, password);

    if (result.success) {
      // Go to subjects screen
      this.showScreen('subjects');
    } else {
      errorDiv.textContent = result.error;
      errorDiv.style.display = 'block';
    }
  },

  /**
   * Handle login form submission
   */
  async handleLogin() {
    const mobile = document.getElementById('login-mobile').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    // Validation
    if (!mobile) {
      errorDiv.textContent = 'Please enter your mobile number';
      errorDiv.style.display = 'block';
      return;
    }

    if (!password) {
      errorDiv.textContent = 'Please enter your password';
      errorDiv.style.display = 'block';
      return;
    }

    errorDiv.style.display = 'none';

    // Call login API
    const result = await this.login(mobile, password);

    if (result.success) {
      // Go to subjects screen
      this.showScreen('subjects');
    } else {
      errorDiv.textContent = result.error;
      errorDiv.style.display = 'block';
    }
  },

  /**
   * Register default/sample games
   */
  registerDefaultGames() {
    // Math - Level 1: Place Values (Balloon Pop)
    GameRegistry.registerGame({
      game_id: 'math-placevalue-1',
      title: 'Balloon Pop',
      subject: 'math',
      level: 1,
      concept: 'Place Values',
      description: 'Pop balloons to find the correct digit based on place value!',
      instructions: 'Pop the balloon with the digit that matches the requested place value (Ones, Tens, or Hundreds). You have 3 lives. Get 70% or more to pass!',
      pass_threshold: 70,
      min_age: 5,
      html_file: '/static/games/math/placevalue-level1.html'
    });

    // Math - Level 1: Addition
    GameRegistry.registerGame({
      game_id: 'math-addition-1',
      title: 'Number Ninja',
      subject: 'math',
      level: 1,
      concept: 'Basic Addition',
      description: 'Learn to add numbers with fun challenges!',
      instructions: 'Solve the addition problems by clicking the correct answer. You have 3 lives. Get 70% or more to pass!',
      pass_threshold: 70,
      min_age: 5,
      html_file: '/static/games/math/addition-level1.html'
    });

    // Math - Level 2: Ascending/Descending
    GameRegistry.registerGame({
      game_id: 'math-descending-2',
      title: 'Balloon Order',
      subject: 'math',
      level: 2,
      concept: 'Ascending/Descending',
      description: 'Pop balloons in the correct order - ascending or descending!',
      instructions: 'Pop the balloons in ASCENDING or DESCENDING order as shown. You have 3 lives.',
      pass_threshold: 70,
      min_age: 6,
      html_file: '/static/games/math/descending-level2.html'
    });

    // Math - Level 3: Multiplication
    GameRegistry.registerGame({
      game_id: 'math-multiplication-3',
      title: 'Times Table Trek',
      subject: 'math',
      level: 3,
      concept: 'Multiplication',
      description: 'Learn times tables with exciting challenges!',
      instructions: 'Multiply numbers to earn points. Pass with 70% or higher!',
      pass_threshold: 70,
      min_age: 7,
      html_file: '/static/games/math/multiplication-level3.html'
    });

    // Science - Level 1: Animals
    GameRegistry.registerGame({
      game_id: 'science-animals-1',
      title: 'Animal Kingdom',
      subject: 'science',
      level: 1,
      concept: 'Animal Types',
      description: 'Learn about different animals and their homes!',
      instructions: 'Match animals to their correct category. 70% required to pass!',
      pass_threshold: 70,
      min_age: 5,
      html_file: '/static/games/science/animals-level1.html'
    });

    // Science - Level 2: Plants
    GameRegistry.registerGame({
      game_id: 'science-plants-2',
      title: 'Plant Power',
      subject: 'science',
      level: 2,
      concept: 'Plant Life',
      description: 'Discover how plants grow and what they need!',
      instructions: 'Answer questions about plants to complete the level.',
      pass_threshold: 70,
      min_age: 6,
      html_file: '/static/games/science/plants-level2.html'
    });

    // Science - Level 3: Human Body
    GameRegistry.registerGame({
      game_id: 'science-body-3',
      title: 'Body Builders',
      subject: 'science',
      level: 3,
      concept: 'Human Body',
      description: 'Learn about organs and body systems!',
      instructions: 'Match organs to their functions to win!',
      pass_threshold: 70,
      min_age: 7,
      html_file: '/static/games/science/body-level3.html'
    });
  },

  /**
   * Restore session from localStorage
   */
  restoreSession() {
    const savedUser = localStorage.getItem('eduquest_user');
    const savedSubject = localStorage.getItem('eduquest_subject');

    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('eduquest_user');
      }
    }

    if (savedSubject) {
      this.currentSubject = savedSubject;
    }
  },

  /**
   * Show a specific screen
   */
  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target screen
    const screen = document.getElementById(`screen-${screenId}`);
    if (screen) {
      screen.classList.add('active');
    }

    // Handle screen-specific logic
    if (screenId === 'hub') {
      this.refreshHub();
    }

    // Update welcome text for subjects screen
    if (screenId === 'subjects' && this.user) {
      document.getElementById('welcome-text').textContent = `${this.user.name}, kon sa subject hai aapka favorite?`;
    }

    // If user is logged in, show subjects instead of welcome
    if (screenId === 'welcome' && this.user) {
      this.showScreen('subjects');
    }
  },

  /**
   * Save user profile
   */
  async saveProfile() {
    const name = document.getElementById('player-name').value.trim();
    const age = parseInt(document.getElementById('player-age').value);

    if (!name) {
      this.showModal('Please enter your name!', () => {});
      return;
    }

    // Save locally first
    this.user = { name, age };
    localStorage.setItem('eduquest_user', JSON.stringify(this.user));

    // Also save to backend
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age })
      });
      if (response.ok) {
        const userData = await response.json();
        this.user.id = userData.id;
        localStorage.setItem('eduquest_user', JSON.stringify(this.user));
      }
    } catch (e) {
      console.warn('Could not save user to backend:', e);
    }

    // Update welcome text
    document.getElementById('welcome-text').textContent = `${name}, kon sa subject hai aapka favorite?`;

    this.showScreen('subjects');
  },

  /**
   * Select subject and go to hub
   */
  selectSubject(subject) {
    this.currentSubject = subject;
    localStorage.setItem('eduquest_subject', subject);

    // Update UI
    const badge = document.getElementById('subject-badge');
    badge.textContent = subject === 'math' ? 'Math Magic' : 'Science Squad';
    badge.style.color = subject === 'math' ? 'var(--math-color)' : 'var(--science-color)';

    this.showScreen('hub');
  },

  /**
   * Refresh the level hub
   */
  refreshHub() {
    if (!this.user) return;

    // Update user info
    document.getElementById('display-name').textContent = this.user.name;
    document.getElementById('user-avatar').textContent = this.getAvatarEmoji(this.user.age);

    // Load games for current subject
    const games = GameRegistry.getGamesBySubject(this.currentSubject);
    const levelsGrid = document.getElementById('levels-grid');
    levelsGrid.innerHTML = '';

    // Get user progress from backend
    this.loadUserProgress(games);
  },

  /**
   * Load user progress and render levels
   */
  async loadUserProgress(games) {
    let progress = [];

    if (this.user && this.user.id) {
      try {
        const response = await fetch(`/api/user/${this.user.id}/progress/${this.currentSubject}`);
        if (response.ok) {
          progress = await response.json();
        }
      } catch (e) {
        console.warn('Could not load progress from backend');
      }
    }

    // Create progress map
    const progressMap = {};
    progress.forEach(p => {
      progressMap[p.game_id] = p;
    });

    // Render level cards
    const levelsGrid = document.getElementById('levels-grid');
    games.forEach((game, index) => {
      const gameProgress = progressMap[game.game_id];
      const isUnlocked = index === 0 || (progressMap[games[index - 1].game_id]?.completed);
      const isCompleted = gameProgress?.completed;
      const stars = gameProgress?.stars || 0;

      const card = this.createLevelCard(game, index + 1, isUnlocked, isCompleted, stars);
      levelsGrid.appendChild(card);
    });

    // Update progress bar
    const completedCount = games.filter(g => progressMap[g.game_id]?.completed).length;
    const progressPercent = (completedCount / games.length) * 100;
    document.getElementById('progress-fill').style.width = `${progressPercent}%`;
    document.getElementById('progress-text').textContent = `${completedCount}/${games.length} Complete`;
  },

  /**
   * Create a level card element
   */
  createLevelCard(game, levelNum, isUnlocked, isCompleted, stars) {
    const card = document.createElement('div');
    card.className = `level-card ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`;
    card.dataset.gameId = game.game_id;

    if (isUnlocked) {
      card.onclick = () => this.launchGame(game.game_id);
    }

    card.innerHTML = `
      ${!isUnlocked ? '<span class="lock-overlay">🔒</span>' : ''}
      <span class="level-number">${levelNum}</span>
      <div class="level-title">${game.title}</div>
      <div class="level-concept">${game.concept}</div>
      <div class="level-stars">${this.renderStars(stars)}</div>
      ${isUnlocked && !isCompleted ? '<div class="current-indicator"></div>' : ''}
    `;

    return card;
  },

  /**
   * Render stars HTML
   */
  renderStars(count) {
    let stars = '';
    for (let i = 0; i < 3; i++) {
      stars += `<span style="${i < count ? '' : 'opacity: 0.3'}">⭐</span>`;
    }
    return stars;
  },

  /**
   * Get avatar emoji based on age
   */
  getAvatarEmoji(age) {
    if (age < 7) return '🧒';
    if (age < 10) return '👦';
    if (age < 13) return '🧑';
    return '🧑‍🎓';
  },

  /**
   * Launch a game
   */
  async launchGame(gameId) {
    this.currentGameId = gameId;
    this.resetGameState();

    // Load game
    const loaded = await GameLoader.loadGame(gameId);
    if (loaded) {
      this.showScreen('game');
    }
  },

  /**
   * Reset game state
   */
  resetGameState() {
    this.gameState = {
      score: 0,
      lives: 3,
      started: false
    };
    document.getElementById('game-score').textContent = '0';
    document.getElementById('game-lives').textContent = '3';
  },

  /**
   * Start the game (hide instructions)
   */
  startGame() {
    GameLoader.startGame();
    this.gameState.started = true;
  },

  /**
   * Add points to score
   */
  addScore(points) {
    this.gameState.score += points;
    GameLoader.updateScore(points);
  },

  /**
   * Lose a life
   */
  loseLife() {
    this.gameState.lives--;
    GameLoader.updateLives(this.gameState.lives);
  },

  /**
   * End the game and show results
   */
  async endGame(finalScore) {
    const game = GameLoader.getCurrentGame();
    if (!game) return;

    // Calculate percentage
    const maxScore = 100; // Assuming max score is 100 per game
    const percentage = Math.round((finalScore / maxScore) * 100);
    const passed = percentage >= game.pass_threshold;

    // Calculate stars
    let stars = 0;
    if (passed) {
      stars = 1;
      if (percentage >= 85) stars = 2;
      if (percentage >= 95) stars = 3;
    }

    // Save progress to backend
    if (this.user && this.user.id) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: this.user.id,
            game_id: game.game_id,
            score: finalScore,
            stars: stars,
            completed: passed
          })
        });

        // Unlock next level if passed
        if (passed) {
          await fetch('/api/progress/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: this.user.id,
              game_id: game.game_id
            })
          });
        }
      } catch (e) {
        console.warn('Could not save progress:', e);
      }
    }

    // Show results
    this.showResults(passed, percentage, stars, game);
  },

  /**
   * Show results screen
   */
  showResults(passed, percentage, stars, game) {
    this.showScreen('results');

    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');

    if (passed) {
      resultIcon.textContent = '🎉';
      resultTitle.textContent = 'Congratulations!';
      resultMessage.textContent = 'You passed! Ready for the next challenge?';

      // Show confetti
      this.showConfetti();
    } else {
      resultIcon.textContent = '💪';
      resultTitle.textContent = 'Good Try!';
      resultMessage.textContent = 'Keep practicing, you can do it!';
    }

    document.getElementById('final-score').textContent = percentage + '%';
    document.getElementById('pass-target').textContent = game.pass_threshold + '%';
    document.getElementById('your-score').textContent = percentage + '%';

    const passStatus = document.getElementById('pass-status');
    passStatus.textContent = passed ? 'Passed!' : 'Try Again';
    passStatus.className = `status-badge ${passed ? 'passed' : 'failed'}`;

    // Update stars display
    const starsDisplay = document.getElementById('stars-display');
    starsDisplay.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.className = 'star' + (i < stars ? ' earned' : '');
      star.textContent = '⭐';
      star.style.opacity = i < stars ? '1' : '0.3';
      starsDisplay.appendChild(star);
    }

    // Show/hide next level button
    const nextBtn = document.getElementById('next-level-btn');
    const nextGame = GameRegistry.getNextGame(game.game_id);
    nextBtn.style.display = passed && nextGame ? 'inline-flex' : 'none';
  },

  /**
   * Retry the current game
   */
  retryGame() {
    this.launchGame(this.currentGameId);
  },

  /**
   * Go to next level
   */
  nextLevel() {
    const game = GameLoader.getCurrentGame();
    const nextGame = GameRegistry.getNextGame(game.game_id);
    if (nextGame) {
      this.launchGame(nextGame.game_id);
    }
  },

  /**
   * Confirm game exit
   */
  confirmExit() {
    this.showModal('Are you sure you want to exit? Your progress will be lost!', () => {
      GameLoader.unloadGame();
      this.showScreen('hub');
    });
  },

  /**
   * Confirm profile reset
   */
  confirmReset() {
    this.showModal('Reset your profile? This will clear all your progress!', () => {
      localStorage.removeItem('eduquest_user');
      localStorage.removeItem('eduquest_subject');
      this.user = null;
      this.currentSubject = null;
      this.showScreen('welcome');
    });
  },

  /**
   * Show modal dialog
   */
  showModal(message, onConfirm) {
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal-overlay').classList.add('active');

    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.onclick = () => {
      this.closeModal();
      onConfirm();
    };
  },

  /**
   * Close modal
   */
  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  /**
   * Show confetti animation
   */
  showConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#6C63FF', '#FF6B6B', '#4ECB71', '#FFB830', '#0984E3'];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(confetti);
    }

    // Cleanup after animation
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Make globally available
window.App = App;

// ============================================
// EXAMPLE GAME INTEGRATION
// Games should call these methods:
// ============================================

/**
 * Example: How a game should work
 *
 * In your game HTML file (e.g., addition-level1.html):
 *
 * <script>
 * function math_addition_1_init() {
 *   // Initialize your game
 *   generateQuestion();
 * }
 *
 * function checkAnswer(answer) {
 *   if (answer === correctAnswer) {
 *     App.addScore(10);
 *     showCorrectAnimation();
 *   } else {
 *     App.loseLife();
 *     showWrongAnimation();
 *   }
 *   setTimeout(generateQuestion, 500);
 * }
 *
 * function generateQuestion() {
 *   // Generate math question
 *   // Update DOM with question and choices
 * }
 * </script>
 *
 * OR use the EduQuest API directly:
 *
 * EduQuest.submitAnswer(isCorrect) - Submit answer
 * EduQuest.updateScore(points)     - Add points
 * EduQuest.loseLife()              - Remove a life
 * EduQuest.endGame()               - End and show results
 */

// Global API for games
window.EduQuest = {
  gameEnded: false,
  finalScore: 0,

  submitScore: (points) => App.addScore(points),
  loseLife: () => App.loseLife(),

  endGame: () => {
    // Use the game's calculated score if available
    const score = EduQuest.finalScore || App.gameState.score;
    App.endGame(score);
  },

  getConfig: () => ({
    lives: 3,
    passThreshold: 70
  })
};
