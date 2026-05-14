/**
 * EduQuest Main Application
 * Handles screen navigation, user profile, and game flow
 */

const App = {
  // Current user state (synced with backend)
  user: null,
  currentSubject: null,
  currentTopic: null,
  currentGameId: null,
  gameState: {
    score: 0,
    lives: 3,
    started: false
  },
  // Screen history for back button handling
  screenHistory: [],
  isNavigating: false,

  /**
   * Initialize the application
   */
  async init() {
    // Initialize game loader
    GameLoader.init();

    // Try to restore session from localStorage
    await this.checkLoginStatus();

    // Load games from backend
    await GameRegistry.loadFromBackend();

    // Handle browser back button
    window.addEventListener('popstate', (e) => this.handleBrowserBack(e));

    // Initial navigation
    this.showScreen('welcome');
  },

  /**
   * Handle browser back button
   */
  handleBrowserBack(e) {
    if (this.isNavigating) return;

    // If we're in a game, exit the game first
    if (document.getElementById('screen-game').classList.contains('active')) {
      GameLoader.unloadGame();
      this.showScreen('hub', true);
      return;
    }

    // Go to previous screen in history
    if (this.screenHistory.length > 1) {
      this.screenHistory.pop(); // Remove current
      const prevScreen = this.screenHistory[this.screenHistory.length - 1];
      this.showScreen(prevScreen, true);
    } else {
      // If no history, go to welcome
      this.showScreen('welcome', true);
    }
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
        // Initialize history for logged in user
        this.screenHistory = ['welcome', 'home'];
      }
    } catch (e) {
      console.warn('Could not check session:', e);
      // Fall back to localStorage
      this.restoreSession();
      // Initialize history for local session
      if (this.user) {
        this.screenHistory = ['welcome', 'home'];
      }
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
    this.currentTopic = null;
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
      // Initialize screen history on successful login
      this.screenHistory = ['welcome', 'home'];
      // Go to home screen
      this.showScreen('home');
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
      // Initialize screen history
      this.screenHistory = ['welcome', 'home'];
      // Go to home screen
      this.showScreen('home');
    } else {
      errorDiv.textContent = result.error;
      errorDiv.style.display = 'block';
    }
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
        // Ensure user has id - if not, clear and redirect to login
        if (!this.user || !this.user.id) {
          console.warn('User session invalid, clearing...');
          localStorage.removeItem('eduquest_user');
          this.user = null;
        }
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
   * @param {string} screenId - The screen to show
   * @param {boolean} fromHistory - If true, don't add to history (browser back)
   */
  showScreen(screenId, fromHistory = false) {
    // Don't update history for certain screens during navigation
    if (!fromHistory && !this.isNavigating) {
      // Replace current history entry instead of pushing new one
      // This prevents back button from reloading the app
      if (this.screenHistory.length > 0) {
        this.screenHistory[this.screenHistory.length - 1] = screenId;
      } else {
        this.screenHistory.push(screenId);
      }
    }

    this.isNavigating = false;

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
    if (screenId === 'topics') {
      this.refreshTopics();
    }

    if (screenId === 'hub') {
      if (window.GameLoader) {
        GameLoader.unloadGame();
      }
      this.refreshHub();
    }

    // Refresh home screen data
    if (screenId === 'home' && this.user) {
      this.refreshHome();
    }

    // Update welcome text for subjects screen
    if (screenId === 'subjects' && this.user) {
      document.getElementById('welcome-text').textContent = `${this.user.name}, kon sa subject hai aapka favorite?`;
    }

    // If user is logged in, show home instead of welcome
    if (screenId === 'welcome' && this.user) {
      this.showScreen('home', fromHistory);
    }
  },

  /**
   * Refresh home screen with user data
   */
  async refreshHome() {
    if (!this.user) return;

    // Update user info
    document.getElementById('home-username').textContent = `${this.user.name}!`;
    document.getElementById('home-avatar').textContent = this.getAvatarEmoji(this.user.age);

    // Load progress for both subjects
    await this.loadHomeProgress();
  },

  /**
   * Load home screen progress data
   */
  async loadHomeProgress() {
    if (!this.user || !this.user.id) {
      // Use local progress if not logged in
      this.loadLocalProgress();
      return;
    }

    try {
      // Get progress for math
      const mathResponse = await fetch(`/api/user/${this.user.id}/progress/math`);
      const mathProgress = mathResponse.ok ? await mathResponse.json() : [];

      // Get progress for science
      const scienceResponse = await fetch(`/api/user/${this.user.id}/progress/science`);
      const scienceProgress = scienceResponse.ok ? await scienceResponse.json() : [];

      this.updateHomeStats(mathProgress, scienceProgress);
    } catch (e) {
      console.warn('Could not load progress from backend');
      this.loadLocalProgress();
    }
  },

  /**
   * Update home screen stats
   */
  updateHomeStats(mathProgress, scienceProgress) {
    // Calculate totals
    let totalScore = 0;
    let totalStars = 0;
    let gamesPlayed = 0;

    let mathCompleted = 0;
    let mathStars = 0;
    let scienceCompleted = 0;
    let scienceStars = 0;

    const allGames = [...mathProgress, ...scienceProgress];

    allGames.forEach(game => {
      if (game.progress) {
        totalScore += game.progress.score || 0;
        totalStars += game.progress.stars || 0;
        if (game.progress.completed) {
          gamesPlayed++;
        }
      }

      if (game.subject === 'math') {
        mathCompleted += game.progress?.completed ? 1 : 0;
        mathStars += game.progress?.stars || 0;
      } else {
        scienceCompleted += game.progress?.completed ? 1 : 0;
        scienceStars += game.progress?.stars || 0;
      }
    });

    // Update UI
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('total-stars').textContent = totalStars;
    document.getElementById('games-played').textContent = gamesPlayed;

    // Math progress
    const mathTotal = mathProgress.length || 3;
    const mathPercent = (mathCompleted / mathTotal) * 100;
    document.getElementById('math-progress-fill').style.width = `${mathPercent}%`;
    document.getElementById('math-progress-text').textContent = `${mathCompleted}/${mathTotal} Levels`;
    document.getElementById('math-stars').textContent = `⭐ ${mathStars}`;

    // Science progress
    const scienceTotal = scienceProgress.length || 3;
    const sciencePercent = (scienceCompleted / scienceTotal) * 100;
    document.getElementById('science-progress-fill').style.width = `${sciencePercent}%`;
    document.getElementById('science-progress-text').textContent = `${scienceCompleted}/${scienceTotal} Levels`;
    document.getElementById('science-stars').textContent = `⭐ ${scienceStars}`;
  },

  /**
   * Load progress from localStorage (fallback)
   */
  loadLocalProgress() {
    const progress = JSON.parse(localStorage.getItem('eduquest_progress') || '{}');

    let totalScore = 0;
    let totalStars = 0;
    let gamesPlayed = 0;
    let mathCompleted = 0;
    let scienceCompleted = 0;

    Object.values(progress).forEach(game => {
      totalScore += game.score || 0;
      totalStars += game.stars || 0;
      if (game.completed) gamesPlayed++;
      if (game.subject === 'math' && game.completed) mathCompleted++;
      if (game.subject === 'science' && game.completed) scienceCompleted++;
    });

    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('total-stars').textContent = totalStars;
    document.getElementById('games-played').textContent = gamesPlayed;

    document.getElementById('math-progress-fill').style.width = `${(mathCompleted/3)*100}%`;
    document.getElementById('math-progress-text').textContent = `${mathCompleted}/3 Levels`;

    document.getElementById('science-progress-fill').style.width = `${(scienceCompleted/3)*100}%`;
    document.getElementById('science-progress-text').textContent = `${scienceCompleted}/3 Levels`;
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

    this.showScreen('topics');
  },

  /**
   * Refresh the topics screen
   */
  refreshTopics() {
    if (!this.user) return;
    
    // Set title
    const title = document.getElementById('topics-title');
    title.textContent = this.currentSubject === 'math' ? 'Math Topics' : 'Science Topics';
    
    const games = GameRegistry.getGamesBySubject(this.currentSubject);
    
    // Get unique topics and their premium status
    const topicsMap = new Map();
    games.forEach(g => {
        if (!topicsMap.has(g.topic)) {
            topicsMap.set(g.topic, {
                topic: g.topic,
                is_premium: g.is_premium
            });
        }
    });
    const topics = Array.from(topicsMap.values());
    
    const grid = document.getElementById('topics-grid');
    grid.innerHTML = '';
    
    topics.forEach(t => {
        const card = document.createElement('div');
        const colorClass = this.currentSubject === 'math' ? 'math-card' : 'science-card';
        card.className = `subject-card ${colorClass}`;
        
        const isLocked = t.is_premium && !this.user.is_premium;
        
        card.innerHTML = `
          <div class="subject-icon">${isLocked ? '👑' : (this.currentSubject === 'math' ? '🔢' : '🔬')}</div>
          <h3>${t.topic}</h3>
          <p>${isLocked ? 'Premium Content' : 'Play now!'}</p>
        `;
        
        card.onclick = () => this.selectTopic(t.topic, isLocked);
        grid.appendChild(card);
    });
  },

  /**
   * Select a topic
   */
  selectTopic(topic, isLocked) {
      if (isLocked) {
          document.getElementById('premium-modal-overlay').classList.add('active');
          return;
      }
      this.currentTopic = topic;
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

    // Load games for current subject AND topic
    const subjectGames = GameRegistry.getGamesBySubject(this.currentSubject);
    const games = subjectGames.filter(g => g.topic === this.currentTopic);
    games.sort((a, b) => a.level - b.level);
    
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
      if (p.progress) {
        progressMap[p.game_id] = p.progress;
      }
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
    console.log('Saving progress - User:', this.user, 'Game:', game.game_id, 'Score:', finalScore);
    if (this.user && this.user.id) {
      console.log('User ID:', this.user.id);
      try {
        const response = await fetch('/api/progress', {
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
        const result = await response.json();
        console.log('Progress saved:', result);

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
