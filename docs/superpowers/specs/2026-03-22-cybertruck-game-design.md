# Spec: Cybertruck Dodge Game Integration

## 1. Overview
A high-impact, cyberpunk-styled minigame to be integrated at the bottom of the Akash Singh resume website. The game serves as a reward for users who explore the entire resume, providing an engaging, session-based interactive experience.

## 2. Technical Stack
- **Engine**: HTML5 Canvas (2D Context).
- **Animation**: `requestAnimationFrame` for the game loop, GSAP for UI transitions and reveal effects.
- **Storage**: `sessionStorage` for session-persistent high scores.
- **Input**: `TouchEvents` (Mobile) and `KeyboardEvents` (Desktop).

## 3. UI/UX Design
### 3.1 Trigger Mechanism
- Located below the `<footer />`.
- Initially hidden; revealed via GSAP `ScrollTrigger` when the user reaches the bottom of the page.
- Message: "THANKS FOR YOUR ATTENTION TO ME. HERE IS YOUR REWARD🎁!"
- Button: "INITIATE_GAME.EXE" (Cyberpunk styled button).

### 3.2 Game Environment
- **Perspective**: 2D top-down or slight 2.5D perspective.
- **Background**: Scrolling grid-line road with "scanline" overlay.
- **Player**: Stylized Cybertruck sprite (or vector-drawn path).
- **Obstacles**:
  - **Drones**: Aerial obstacles with blinking red lights.
  - **Code Blocks**: Ground-based "debris" styled like code snippets (e.g., `<div>`, `void()`).

### 3.3 Adaptive Controls
- **Desktop**: Left/Right arrows or A/D keys.
- **Mobile**: Horizontal touch-drag anywhere on the canvas.

## 4. Mechanics & Progression
### 4.1 Scoring
- +10 points per second survived.
- +50 points for "Close Calls" (grazing an obstacle without colliding).
- Current score and session high score displayed in a persistent HUD.

### 4.2 Level System (Rewards)
- **Level Up**: Every 500 points.
- **Reward**: A random "Data Fact" about Akash Singh (e.g., "Akash once automated a 4-hour task into 5 minutes!") flashes on screen.

### 4.3 Game Over & Reset
- **Collision**: Triggers a "SYSTEM_CRASH" glitch effect.
- **Reset**: A "REBOOT" button appears to restart the game immediately.

## 5. Performance & Accessibility
- **Performance**: Game loop is paused when the canvas is not in the viewport.
- **Accessibility**: Keyboard controls for desktop; high-contrast neon colors for visibility.
- **Optimization**: Minimal asset usage (vector-drawn assets preferred over large images).
