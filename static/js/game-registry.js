/**
 * EduQuest Game Registry
 * Games register themselves here via EduQuest.registerGame()
 * The hub page loads all registered games dynamically
 */

const GameRegistry = {
  // In-memory storage for registered games
  games: [],

  // API endpoint for backend
  apiBase: '/api',

  /**
   * Register a new game
   * Called by each game file during initialization
   */
  registerGame(gameData) {
    // Validate required fields
    const required = ['game_id', 'title', 'subject', 'level', 'concept', 'html_file'];
    for (const field of required) {
      if (!gameData[field]) {
        console.error(`Game registration error: Missing field "${field}"`);
        return false;
      }
    }

    // Check if game already exists, update if so
    const existingIndex = this.games.findIndex(g => g.game_id === gameData.game_id);
    if (existingIndex >= 0) {
      this.games[existingIndex] = { ...this.games[existingIndex], ...gameData };
      console.log(`Game updated: ${gameData.game_id}`);
    } else {
      this.games.push(gameData);
      console.log(`Game registered: ${gameData.game_id}`);
    }

    // Sync with backend
    this.syncWithBackend(gameData);

    return true;
  },

  /**
   * Sync game data with Flask backend
   */
  async syncWithBackend(gameData) {
    try {
      await fetch(`${this.apiBase}/games/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
    } catch (error) {
      console.warn('Could not sync with backend:', error);
    }
  },

  /**
   * Get all games
   */
  getAllGames() {
    return this.games;
  },

  /**
   * Get games by subject
   */
  getGamesBySubject(subject) {
    return this.games.filter(g => g.subject === subject).sort((a, b) => a.level - b.level);
  },

  /**
   * Get a specific game by ID
   */
  getGame(gameId) {
    return this.games.find(g => g.game_id === gameId);
  },

  /**
   * Load games from backend (for when JS registry is empty)
   */
  async loadFromBackend() {
    try {
      const response = await fetch(`${this.apiBase}/games`);
      if (response.ok) {
        const games = await response.json();
        // Merge with local games (backend takes precedence for data)
        games.forEach(backendGame => {
          const existing = this.games.find(g => g.game_id === backendGame.game_id);
          if (existing) {
            Object.assign(existing, backendGame);
          } else {
            this.games.push(backendGame);
          }
        });
        console.log(`Loaded ${games.length} games from backend`);
      }
    } catch (error) {
      console.warn('Could not load from backend:', error);
    }
  },

  /**
   * Get next game in sequence
   */
  getNextGame(currentGameId) {
    const current = this.getGame(currentGameId);
    if (!current) return null;

    return this.games.find(g =>
      g.subject === current.subject && g.level === current.level + 1
    );
  },

  /**
   * Check if a game is unlocked for a user
   */
  isGameUnlocked(game, userProgress) {
    if (game.level === 1) return true;

    // Find the previous level game
    const prevGame = this.getAllGames().find(g =>
      g.subject === game.subject && g.level === game.level - 1
    );

    if (!prevGame) return true;

    // Check if previous game is completed
    const progress = userProgress.find(p => p.game_id === prevGame.game_id);
    return progress && progress.completed;
  }
};

// Make globally available
window.GameRegistry = GameRegistry;
