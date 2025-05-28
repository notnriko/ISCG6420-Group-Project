// Constants
const CANVAS_WIDTH = 800, CANVAS_HEIGHT = 600;
const TOY_RADIUS = 30, TOY_STAGE2_DURATION = 5000, TOY_STAGE3_DURATION = 5000;
const frameDelay = 6;

// Sprite sheet frame config
const totalCols = 8, totalRows = 6;
const frameWidth = 27, frameHeight = 33;
const frameCount = totalCols;

let frameX = 0, frameY = 0, frameTicker = 0;
let directionName = 'south';
let lastDirectionName = 'south';
let animationFrame = 0;

// Canvas & context
let canvas, ctx;

// Game state
let gameActive = false, score = 0, timeLeft = 0, gameInterval;
let toys = [], lastToyTime = 0;
let toyInterval = 2000, toyDropSpeed = 2;

// Character
let character = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  width: frameWidth * 2,
  height: frameHeight * 2,
  speed: 5,
  direction: 'south',
  isMoving: false
};

// Key states
const keys = {ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,w:false,a:false,s:false,d:false,' ':false};

// Sprite direction mapping
const directionToSwimFrame = {
  north: 7,
  northwest: 0,
  west: 1,
  southwest: 2,
  south: 3,
  southeast: 4,
  east: 5,
  northeast: 6
};

// Assets
let sounds = {}, characterImg = new Image(), backgroundImg = new Image();
const soundPaths = {
  start: './assets/sounds/countdown.wav',
  collect: './assets/sounds/point.wav',
  fail: './assets/sounds/lose.flac',
  end: './assets/sounds/gameover.wav'
};
const imagePaths = {
  character: './assets/images/swimmer.png',
  background: './assets/images/water.jpg'
};

// Asset loading
let assetsLoaded = 0, assetsToLoad = 6;
function assetLoaded() {
  assetsLoaded++;
  document.getElementById('loading-progress').textContent = `${Math.floor((assetsLoaded / assetsToLoad) * 100)}%`;
  if (assetsLoaded === assetsToLoad) {
    setTimeout(() => {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('game-content').classList.remove('hidden');
      initGame();
    }, 500);
  }
}

// Asset loading
function loadAssets() {
  characterImg.onload = assetLoaded;
  characterImg.src = imagePaths.character;
  backgroundImg.onload = assetLoaded;
  backgroundImg.src = imagePaths.background;
  for (let [k, p] of Object.entries(soundPaths)) {
    sounds[k] = new Audio(p);
    sounds[k].oncanplaythrough = assetLoaded;
  }
}

// Initialisation and event listeners
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  loadAssets();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.addEventListener('keydown', keyDown);
  document.addEventListener('keyup', keyUp);
  document.getElementById('start-btn').onclick = startGame;
  document.getElementById('restart-btn').onclick = restartGame;
  document.getElementById('play-again').onclick = restartGame;
  document.getElementById('volume').oninput = e => {
    for (let s of Object.values(sounds)) s.volume = e.target.value;
  };
}

// Key event handlers
function keyDown(e) {
  if (e.key in keys) {
    keys[e.key] = true;
    e.preventDefault();
    character.isMoving = true;
  }
}

function keyUp(e) {
  if (e.key in keys) {
    keys[e.key] = false;
    e.preventDefault();
    character.isMoving = Object.keys(keys).some(k => keys[k]);
  }
}

// Game functions
function initGame() {
  for (let s of Object.values(sounds)) s.volume = document.getElementById('volume').value;
  drawInitialScreen();
  document.getElementById('start-btn').disabled = false;
}

// Start game
function startGame() {
  sounds.start.play();
  gameActive = true;
  score = 0;
  toys = [];
  timeLeft = parseInt(document.getElementById('game-time').value);
  document.getElementById('score').textContent = score;
  document.getElementById('start-btn').disabled = true;
  document.getElementById('restart-btn').disabled = false;

  // Reset character position
  character.x = CANVAS_WIDTH / 2;
  character.y = CANVAS_HEIGHT / 2;
  character.direction = 'south';
  frameX = 0;
  animationFrame = 0;

  // Set difficulty
  const difficulty = document.getElementById('difficulty')?.value || 'normal';
  if (difficulty === 'easy') {
    toyDropSpeed = 1.5;
    toyInterval = 2500;
  } else if (difficulty === 'normal') {
    toyDropSpeed = 2;
    toyInterval = 2000;
  } else if (difficulty === 'hard') {
    toyDropSpeed = 2.5;
    toyInterval = 1500;
  }

  lastToyTime = Date.now();
  updateTimerDisplay();
  gameInterval = setInterval(gameLoop, 1000 / 60);
}

// Restart game
function restartGame() {
  clearInterval(gameInterval);
  gameActive = false;
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('start-btn').disabled = false;
  drawInitialScreen();
}

// End game
function endGame() {
  gameActive = false;
  clearInterval(gameInterval);
  sounds.end.play();
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-over').classList.remove('hidden');
  document.getElementById('start-btn').disabled = false;
}

// Game loop
function gameLoop() {
  update();
  render();
}

// Game update
function update() {
  if ((timeLeft -= 1 / 60) <= 0) return endGame();
  if (Math.floor(timeLeft) !== Math.floor(timeLeft + 1 / 60)) updateTimerDisplay();

  const halfW = character.width / 2, halfH = character.height / 2;
  let dx = 0, dy = 0;
  if (keys.ArrowUp || keys.w) dy -= 1;
  if (keys.ArrowDown || keys.s) dy += 1;
  if (keys.ArrowLeft || keys.a) dx -= 1;
  if (keys.ArrowRight || keys.d) dx += 1;

  if (dy < 0) character.y = Math.max(halfH, character.y - character.speed);
  if (dy > 0) character.y = Math.min(CANVAS_HEIGHT - halfH, character.y + character.speed);
  if (dx < 0) character.x = Math.max(halfW, character.x - character.speed);
  if (dx > 0) character.x = Math.min(CANVAS_WIDTH - halfW, character.x + character.speed);

  // Determine direction
  if (dx !== 0 || dy !== 0) {
    if (dx === -1 && dy === -1) directionName = 'northwest';
    else if (dx === -1 && dy === 0) directionName = 'west';
    else if (dx === -1 && dy === 1) directionName = 'southwest';
    else if (dx === 0 && dy === 1) directionName = 'south';
    else if (dx === 1 && dy === 1) directionName = 'southeast';
    else if (dx === 1 && dy === 0) directionName = 'east';
    else if (dx === 1 && dy === -1) directionName = 'northeast';
    else if (dx === 0 && dy === -1) directionName = 'north';
    lastDirectionName = directionName;
  }

  // Frame animation
  if (dx !== 0 || dy !== 0) {
    // Moving: animate frameY through swim frames (3–6)
    if (++frameTicker >= frameDelay) {
      frameTicker = 0;
      frameY = 3 + ((frameY - 3 + 1) % 4);  // Cycle 3 → 6
    }
    frameX = directionToSwimFrame[directionName];
    character.isMoving = true;
  } else {
    // Idle: freeze on last direction
    frameY = 1;
    frameX = directionToSwimFrame[lastDirectionName];
    character.isMoving = false;
  }

  if (keys[' ']) {
    attemptCollection();
    keys[' '] = false;
  }

  if (Date.now() - lastToyTime > toyInterval) {
    spawnToy();
    lastToyTime = Date.now();
  }

  updateToys();
}

// Game render
function render() {
  ctx.drawImage(backgroundImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawToys();
  drawCharacter();
}

// Initial screen
function drawInitialScreen() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(backgroundImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = 'white';
  ctx.font = '24px Comic Sans MS';
  ctx.textAlign = 'center';
  ctx.fillText('Press START to begin!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

// Timer display
function updateTimerDisplay() {
  let m = Math.floor(timeLeft / 60), s = Math.floor(timeLeft % 60);
  document.getElementById('time').textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// Draw character on canvas at current position
function drawCharacter() {
  if (!characterImg.complete) return;
  const drawX = Math.round(character.x - character.width / 2);
  const drawY = Math.round(character.y - character.height / 2);
  ctx.drawImage(characterImg, frameX * frameWidth, frameY * frameHeight, frameWidth, frameHeight, drawX, drawY, character.width, character.height);
}

// Draw toys on canvas
function spawnToy() {
  toys.push({
    x: Math.random() * (CANVAS_WIDTH - 100) + 50,
    y: 0,
    targetY: Math.random() * (CANVAS_HEIGHT * 0.6) + 50,
    radius: TOY_RADIUS,
    color: `hsl(${Math.floor(Math.random() * 360)},100%,50%)`,
    stage: 1,
    stageStartTime: Date.now(),
    collected: false
  });
}

// Update toys on canvas
function updateToys() {
  const now = Date.now();
  toys = toys.filter(toy => {
    if (toy.stage === 1) {
      toy.y += toyDropSpeed;
      if (toy.y >= toy.targetY) {
        toy.stage = 2;
        toy.stageStartTime = now;
      }
    } else if (toy.stage === 2 && now - toy.stageStartTime > TOY_STAGE2_DURATION) {
      toy.stage = 3;
      toy.stageStartTime = now;
      toy.initialRadius = toy.radius;
    } else if (toy.stage === 3) {
      const p = (now - toy.stageStartTime) / TOY_STAGE3_DURATION;
      if (p >= 1) return false;
      toy.radius = toy.initialRadius * (1 - p);
      toy.opacity = 1 - p;
    }
    return true;
  });
}

// Draw toys on canvas
function drawToys() {
  for (let t of toys) {
    ctx.save();
    if (t.stage === 3) ctx.globalAlpha = t.opacity || 1;
    const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.radius);
    g.addColorStop(0, 'white');
    g.addColorStop(0.7, t.color);
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Attempt to collect a toy
function attemptCollection() {
  let collected = false;
  const characterHitRadius = Math.max(character.width, character.height) * 0.45;

  for (let i = toys.length - 1; i >= 0; i--) {
    const toy = toys[i];

    if (toy.stage !== 2 && toy.stage !== 3) continue;

    const dx = character.x - toy.x;
    const dy = character.y - toy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < characterHitRadius + toy.radius) {
      const gain = toy.stage === 2 ? 2 : 1;
      score += gain;
      document.getElementById('score').textContent = score;
      sounds.collect.play();
      toys.splice(i, 1);
      collected = true;

      // Show +1 / +2 feedback in green
      const feedback = document.getElementById('score-feedback');
      feedback.textContent = `+${gain}`;
      feedback.classList.remove('hidden', 'red');
      feedback.classList.add('green');
      positionFeedback(feedback, character.x, character.y);
      break;
    }
  }

  if (!collected) {
    score = Math.max(0, score - 1);
    document.getElementById('score').textContent = score;
    sounds.fail.play();

    // Show -1 feedback in red
    const feedback = document.getElementById('miss-feedback');
    feedback.textContent = `-1`;
    feedback.classList.remove('hidden', 'green');
    feedback.classList.add('red');
    positionFeedback(feedback, character.x, character.y);
  }
}

// Position feedback element on canvas
function positionFeedback(element, charX, charY) {
  const offsetLeft = canvas.offsetLeft;
  const offsetTop = canvas.offsetTop;

  element.style.left = `${offsetLeft + charX - 10}px`;
  element.style.top = `${offsetTop + charY - 30}px`;

  element.classList.remove('hidden');
  element.classList.add('show');

  setTimeout(() => {
    element.classList.remove('show');
    element.classList.add('hidden');
  }, 500);
}