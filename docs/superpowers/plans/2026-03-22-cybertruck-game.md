# Cybertruck Dodge Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate an interactive, cyberpunk-styled Canvas game at the bottom of the resume page.

**Architecture:** 
1. **HTML Extension**: Add a hidden `<section>` for the game below the footer.
2. **CSS Styling**: Define the neon-styled game container, HUD, and "SYSTEM_CRASH" overlay.
3. **Canvas Engine**: Implement a self-contained 2D game loop in `game.js`.
4. **Integration Logic**: Use GSAP `ScrollTrigger` to reveal the game and manage the start/reset state.

**Tech Stack:** HTML5 Canvas, Vanilla JS, GSAP.

---

### Task 1: HTML & CSS Foundation

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Initialize Git repository**
  ```bash
  git init
  git add .
  git commit -m "chore: initial commit of resume website"
  ```
- [ ] **Step 2: Add game section to `index.html`**
  Add the game trigger and container markup *outside* the `<main class="container">` but *after* the `<footer>` to allow for a wider game area.
- [ ] **Step 3: Add game styling to `style.css`**
  Define the terminal message, game container (hidden by default), HUD, and overlay styles. Use `max-width: 1200px` for the game container to distinguish it from the resume content.
- [ ] **Step 4: Commit**
  ```bash
  git add index.html style.css
  git commit -m "feat: add game structure and styles"
  ```

### Task 2: Core Game Engine (`game.js`)

**Files:**
- Create: `game.js`
- Modify: `index.html`

- [ ] **Step 1: Implement the Game Engine structure**
  Write the basic `Game` class with a `start()`, `update()`, and `draw()` loop using `requestAnimationFrame`. Use `ctx.beginPath()` for drawing entities (Cybertruck/Drones) to avoid external assets.
- [ ] **Step 2: Add Player (Cybertruck) and Obstacles (Drones/Code)**
  Implement simple class-based entities with movement and collision detection.
- [ ] **Step 3: Add Adaptive Controls**
  Implement Keyboard (Arrow/WASD) and Touch (Drag) listeners.
- [ ] **Step 4: Include game.js in index.html**
  Add `<script src="game.js"></script>` before the closing `</body>`.
- [ ] **Step 5: Commit**
  ```bash
  git add game.js index.html
  git commit -m "feat: implement core canvas game engine"
  ```

### Task 3: Scoring, Rewards & Persistence

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Implement Session-based High Score**
  Use `sessionStorage` to track and display the "BEST" score.
- [ ] **Step 2: Implement Reward/Fact system**
  Every 500 points, display a "Data Fact" about Akash Singh. Use these facts:
  - "Akash once automated a 4-hour task into 5 minutes!"
  - "Expertise in API integrations and technical troubleshooting."
  - "Currently advancing in Data Science at IIT Guwahati."
  - "7+ years of experience in Technical Solutions & SRE."
- [ ] **Step 3: Implement Game Over & Reboot**
  Connect the "SYSTEM_CRASH" overlay and "REBOOT.SYS" button to reset the game state.
- [ ] **Step 4: Commit**
  ```bash
  git add game.js
  git commit -m "feat: add scoring, session persistence, and reward system"
  ```

### Task 4: Final Integration & Polish

**Files:**
- Modify: `script.js`
- Modify: `style.css`

- [ ] **Step 1: Add GSAP ScrollTrigger for the game reveal**
  Ensure the game section reveals itself only when the user reaches the bottom.
- [ ] **Step 2: Performance Polish**
  Add logic to pause the game loop when the tab is inactive or the game is not in view.
- [ ] **Step 3: Final Verification**
  Test controls on mobile and desktop; verify the high score clears on tab close.
- [ ] **Step 4: Commit**
  ```bash
  git add script.js style.css
  git commit -m "chore: finalize game integration and performance polish"
  ```
