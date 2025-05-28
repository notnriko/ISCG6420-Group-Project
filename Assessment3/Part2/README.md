# 🕹️ SafeSwimmer Game – Part 2 Script
**Assessment 2 – ISCG6420**  
**Student: Don Lorenzo**  
**Project Title: Parakai Springs Interactive Game**

---

## 🎬 Scripted Walkthrough (Part 2 Only)

> 🧑‍💻 This section explains how the game works and guides the marker through playing and testing Part 2.

---

### 🟢 Step 1: Launch the Game

- Navigate to `Assessment3/Part2/index.html`
- Double-click to open it in a web browser *(preferably Chrome)*

---

### 🕹️ Step 2: Understand the Layout

- On the left:  
  - Select game duration (1 or 2 minutes)  
  - Adjust volume  
  - Choose difficulty (Easy / Normal / Hard)  
  - Click **Start Game** to begin  
  - **Restart** becomes clickable after starting  
- Center:  
  - Game canvas shows the swimmer and toys  
- Right:  
  - "How to Play" instructions are always visible

---

### 🎮 Step 3: Controls

- Move the swimmer using:
  - Arrow Keys OR **W A S D**
- Press **SPACEBAR** to collect toys

---

### 🧠 Step 4: Game Mechanics

- Toys fall into the water in 4 stages:
  1. Drop from top
  2. Float for 5 seconds
  3. Slowly sink (shrinks & fades)
  4. Disappear and respawn

---

### 🏆 Step 5: Scoring & Feedback

- ✅ **+2** points = toy collected while floating  
- ✅ **+1** point = toy collected while sinking  
- ❌ **-1** point = missed collection (pressing SPACEBAR too early or off-target)  
- Score **cannot go below 0**

💬 Visual feedback appears above the swimmer:
- Green `+2` or `+1` when successful
- Red `-1` when missed

---

### 🔁 Step 6: End & Replay

- Once time runs out, the **Game Over screen** appears with final score
- Click **Play Again** to restart with new settings if desired

---

### 📄 Files Used in Game

- `index.html` – main game interface
- `script.js` – all logic for toy movement, character control, scoring
- `styles.css` – modern responsive layout & design
- `assets/` – contains:
  - `images/` → `swimmer.png`, `water.jpg`
  - `sounds/` → 4 sound effects (start, collect, fail, end)
  - `documents/` → `part2_wireframe.pdf`, `part2_storyboard.pdf`

---

🎉 That concludes the SafeSwimmer Game walkthrough.