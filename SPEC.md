# EduQuest - Gamified E-Learning Platform

## Concept & Vision

एक engaging gamified learning platform जहां बच्चे Math और Science concepts games खेलकर सीखते हैं। Colorful, playful design जो young learners को attract करे - animated characters, vibrant colors, और instant feedback loops जो learning को fun बनाएं। Progress-based level system जहां हर level नया concept और नया game लाता है।

**Personality:** Energetic, encouraging, celebratory - हर achievement पर rewards और animations।

## Design Language

### Aesthetic Direction
Playful educational - soft rounded shapes, cartoon-style elements, bright but not overwhelming colors। Bounce animations, confetti celebrations, और friendly mascot.

### Color Palette
```
--primary:       #6C63FF    (Purple - main brand)
--secondary:     #FF6B6B    (Coral - accents, wrong answers)
--success:       #4ECB71    (Green - correct, progress)
--warning:       #FFB830    (Amber - warnings, medium score)
--bg-light:      #F8F9FF    (Off-white background)
--bg-card:       #FFFFFF    (Card backgrounds)
--text-primary:  #2D3436    (Dark text)
--text-muted:    #636E72    (Secondary text)
--math-color:    #00B894    (Teal - Math subject)
--science-color: #0984E3    (Blue - Science subject)
```

### Typography
- Headings: `Nunito` (Google Font) - rounded, friendly
- Body: `Quicksand` - clean, readable for kids
- Numbers/Scores: `Fredoka One` - bold, fun

### Spatial System
- Base unit: 8px
- Border radius: 16px (cards), 24px (buttons), 50% (avatars)
- Card shadows: `0 8px 32px rgba(108, 99, 255, 0.15)`

### Motion Philosophy
- **Celebrations:** Confetti burst on level complete (2s)
- **Feedback:** Scale bounce on correct (1.2x, 200ms), shake on wrong
- **Transitions:** Slide-up entrances (300ms ease-out)
- **Loading:** Pulsing glow effect
- **Micro-interactions:** Button hover lift (translateY -2px)

## Layout & Structure

### Flow
```
Welcome Screen → Profile Setup (name/age) → Subject Selection → Level Hub → Game Play → Results → Next Level/Replay
```

### Screens

1. **Welcome Screen**
   - Animated logo with bounce
   - "Start Learning" CTA button
   - Mascot character waving

2. **Profile Setup**
   - Name input (large, friendly)
   - Age selector (5-15 range, visual slider)
   - "Let's Go!" button

3. **Subject Selection**
   - Two large cards: Math (calculator icon) vs Science (flask icon)
   - Hover reveals preview of what they'll learn
   - Selected card glows with subject color

4. **Level Hub**
   - Header: User avatar, current subject badge
   - Progress bar showing overall completion
   - Grid of level cards (locked/unlocked states)
   - Each level shows: concept name, star rating, lock/unlock icon
   - "Continue" button for last unlocked level

5. **Game Screen**
   - Game-specific layout (loaded from game file)
   - Persistent: Score display, timer (optional), life/health indicator
   - Pause button, exit button
   - Instructions overlay on start

6. **Results Screen**
   - Score with star rating (1-3 stars)
   - "Pass" badge if score >= pass threshold
   - Unlock animation for next level
   - Options: Retry, Next Level, Back to Hub

### Responsive Strategy
- Mobile-first design
- Game area scales proportionally (min 320px)
- Touch-optimized controls for tablet use

## Features & Interactions

### Core Features

1. **User Profile System**
   - Store name, age in localStorage
   - Persist progress across sessions
   - Age-appropriate difficulty scaling hint (for future)

2. **Subject Selection**
   - Math: Numbers, Operations, Geometry, Algebra basics
   - Science: Animals, Plants, Human Body, Earth & Space
   - Selection stored in profile

3. **Level System**
   - 3 levels per subject (expandable)
   - Each level: 1 concept, 1 game
   - Pass threshold: 70% score to unlock next
   - Star rating: 1-2 stars (<90%), 3 stars (90%+)
   - Progress persisted in localStorage

4. **Game Module System (Scalable Architecture)**
   - `gameRegistry.js` - Central registry of all games
   - Each game is a self-contained HTML file
   - Shared API: `EduQuest.loadGame(gameId)`, `EduQuest.submitScore(score)`
   - Common CSS variables and components
   - Games register themselves on load

5. **Scoring & Rewards**
   - Real-time score updates
   - Bonus points for speed (optional per game)
   - Celebration animations on milestones

### Interaction Details

- **Correct Answer:** Green flash, +points animation, happy sound cue
- **Wrong Answer:** Red shake, life lost (if applicable), encouraging message
- **Level Complete (Pass):** Confetti, stars awarded, unlock animation
- **Level Complete (Fail):** Gentle "try again" message, highlight weak areas
- **Game Exit:** Confirmation modal, progress saved

### Edge Cases
- **Score exactly 70%:** Passes (>= threshold)
- **All levels complete:** "Congratulations" screen with total stars
- **localStorage cleared:** Reset to welcome screen gracefully
- **Age outside range:** Show validation message

## Component Inventory

### Button
- **Default:** Rounded, shadow, primary color
- **Hover:** Lift up 2px, shadow increase
- **Active:** Press down effect
- **Disabled:** Grayed out, no shadow
- **Loading:** Spinner inside, disabled state

### Level Card
- **Locked:** Grayscale, lock icon overlay, "?" badge
- **Unlocked:** Full color, concept name visible
- **Completed:** Shows star rating, checkmark
- **Current:** Pulsing border glow
- **Hover (unlocked):** Scale 1.05, shadow increase

### Progress Bar
- Segmented for levels, smooth fill animation
- Color matches subject
- Shows "X/Y Levels Complete" text

### Input Field
- Large touch target (min 48px height)
- Floating label animation
- Focus: Primary color border glow
- Error: Red border, shake animation

### Modal
- Backdrop blur, centered card
- Slide-up entrance
- Close button top-right
- Action buttons bottom

### Score Display
- Large Fredoka One font
- Animated number counter
- Glow effect on update

## Technical Approach

### Architecture (Scalable)
```
/
├── index.html              (Main hub - loads games)
├── game-loader.js          (Central game loading system)
├── game-registry.js        (Game metadata & registration)
├── styles/
│   └── main.css            (Shared styles, CSS variables)
├── components/
│   ├── header.js           (Reusable header)
│   ├── level-card.js       (Level card component)
│   └── modal.js            (Modal system)
├── screens/
│   ├── welcome.html        (Welcome screen)
│   ├── profile.html        (Profile setup)
│   ├── subjects.html       (Subject selection)
│   ├── hub.html            (Level hub)
│   └── results.html         (Results screen)
└── games/
    ├── math/
    │   ├── level1-addition.html
    │   ├── level1-addition.js
    │   ├── level2-subtraction.html
    │   └── ...
    └── science/
        ├── level1-animals.html
        ├── level1-animals.js
        └── ...
```

### Game Registry Pattern
```javascript
// Each game file will call this to register:
EduQuest.registerGame({
  id: 'math-addition-1',
  title: 'Number Ninja',
  subject: 'math',
  level: 1,
  concept: 'Basic Addition',
  minAge: 5,
  html: 'games/math/level1-addition.html',
  js: 'games/math/level1-addition.js',
  passThreshold: 70
});
```

### Game API (Shared Interface)
```javascript
// Available to all games:
EduQuest.startGame(gameId)           // Initialize game
EduQuest.updateScore(points)         // Add points
EduQuest.loseLife()                  // Remove a life
EduQuest.endGame(finalScore)         // Submit and show results
EduQuest.getConfig()                 // Get difficulty, lives, etc.
```

### Data Persistence
```javascript
// localStorage schema:
{
  profile: { name, age, subject },
  progress: {
    math: { unlockedLevel: 1, scores: {}, stars: {} },
    science: { unlockedLevel: 0, scores: {}, stars: {} }
  }
}
```

### Key Implementation Notes
1. Games are iframes or dynamically injected HTML
2. Shared CSS via `<link>` in game files
3. Game files call `parent.EduQuest.submitScore()` to communicate
4. Modular structure allows adding games without modifying core
5. Version-compatible through API versioning if needed
