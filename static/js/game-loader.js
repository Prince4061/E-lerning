/**
 * EduQuest Game Loader
 * Handles loading games into the game area using iframes
 * Provides communication between game iframes and main app
 */

const GameLoader = {
  currentGame: null,
  gameArea: null,
  instructionsOverlay: null,
  gameIframe: null,

  /**
   * Initialize the loader
   */
  init() {
    this.gameArea = document.getElementById('game-area');
    this.instructionsOverlay = document.getElementById('game-instructions');
  },

  /**
   * Load a game into the game area using iframe
   */
  async loadGame(gameId) {
    const game = GameRegistry.getGame(gameId);
    if (!game) {
      console.error(`Game not found: ${gameId}`);
      return false;
    }

    this.currentGame = game;

    // Update header info
    document.getElementById('current-game-title').textContent = game.title;
    document.getElementById('current-game-level').textContent = `Level ${game.level}`;

    // Update instructions
    document.getElementById('game-instruction-title').textContent = game.title;
    document.getElementById('game-instruction-text').textContent = game.instructions || 'Complete the challenges to pass this level!';

    // Clear existing content
    this.gameArea.innerHTML = '';

    // Create iframe for game
    this.gameIframe = document.createElement('iframe');
    this.gameIframe.id = 'game-iframe';
    this.gameIframe.src = game.html_file;
    this.gameIframe.style.cssText = 'width: 100%; height: 100%; min-height: 600px; border: none; border-radius: 16px; display: block;';

    this.gameArea.appendChild(this.gameIframe);

    // Setup communication with iframe
    this.setupIframeCommunication();

    // Show instructions overlay
    this.showInstructions();

    // Reset game state
    App.resetGameState();

    return true;
  },

  /**
   * Setup postMessage communication with iframe game
   */
  setupIframeCommunication() {
    window.addEventListener('message', (event) => {
      // Verify origin for security
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'gameScore':
            this.updateScore(event.data.value);
            break;
          case 'gameOver':
            App.endGame(event.data.score || 0);
            break;
          case 'gameReady':
            // Game loaded successfully
            console.log('Game ready:', this.currentGame?.title);
            break;
        }
      }
    });
  },

  updateScore(points) {
    const scoreEl = document.getElementById('game-score');
    const currentScore = parseInt(scoreEl.textContent) || 0;
    scoreEl.textContent = currentScore + points;

    scoreEl.parentElement.classList.add('score-bump');
    setTimeout(() => {
      scoreEl.parentElement.classList.remove('score-bump');
    }, 200);
  },

  /**
   * Update lives display
   */
  updateLives(lives) {
    const livesEl = document.getElementById('game-lives');
    if (livesEl) {
      livesEl.textContent = lives;
      livesEl.parentElement.classList.add('score-bump');
      setTimeout(() => {
        livesEl.parentElement.classList.remove('score-bump');
      }, 200);
    }
  },

  /**
   * Show instructions overlay
   */
  showInstructions() {
    if (this.instructionsOverlay) {
      this.instructionsOverlay.classList.remove('hidden');
    }
  },

  /**
   * Hide instructions and start game
   */
  startGame() {
    if (this.instructionsOverlay) {
      this.instructionsOverlay.classList.add('hidden');
    }

    // Notify iframe to start
    if (this.gameIframe && this.gameIframe.contentWindow) {
      this.gameIframe.contentWindow.postMessage({ type: 'startGame' }, '*');
    }
  },

  /**
   * Get current game state
   */
  getCurrentGame() {
    return this.currentGame;
  },

  /**
   * End the current game
   */
  endGame() {
    const finalScore = parseInt(document.getElementById('game-score').textContent) || 0;
    App.endGame(finalScore);
  },

  /**
   * Cleanup when unloading game
   */
  unloadGame() {
    if (this.gameIframe) {
      this.gameIframe.remove();
      this.gameIframe = null;
    }
    this.currentGame = null;
  }
};

// Make globally available
window.GameLoader = GameLoader;
