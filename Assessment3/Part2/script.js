// Constants
const CANVAS_WIDTH = 800, CANVAS_HEIGHT = 600;
const TOY_RADIUS = 30, TOY_STAGE2_DURATION = 5000, TOY_STAGE3_DURATION = 5000;
const frameDelay = 6; // Controls animation speed

// Sprite frame details
const totalCols = 8;
const totalRows = 6;
const frameWidth = 27;
const frameHeight = 33;
const frameCount = totalCols;
let frameX = 0, frameY = 0, frameTicker = 0;

// Canvas & context
let canvas, ctx;

// Game state
let gameActive = false, score = 0, timeLeft = 0, gameInterval, toys = [], lastToyTime = 0, toyInterval = 2000;

// Character (center-based position)
let character = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  width: frameWidth * 2,
  height: frameHeight * 2,
  speed: 5,
  direction: 'down',
  isMoving: false
};

// Keys pressed
const keys = {ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,w:false,a:false,s:false,d:false,' ':false};

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

let assetsLoaded = 0, assetsToLoad = 6;
function assetLoaded() {
  assetsLoaded++;
  document.getElementById('loading-progress').textContent = `${Math.floor((assetsLoaded/assetsToLoad)*100)}%`;
  if (assetsLoaded === assetsToLoad) {
    setTimeout(() => {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('game-content').classList.remove('hidden');
      initGame();
    }, 500);
  }
}
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

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  loadAssets();
  setupEventListeners();
});

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

function keyDown(e) {
  if (e.key in keys) {
    keys[e.key] = true;
    e.preventDefault();
    updateDirection(e.key);
  }
}
function keyUp(e) {
  if (e.key in keys) {
    keys[e.key] = false;
    e.preventDefault();
    character.isMoving = Object.keys(keys).some(k => keys[k]);
  }
}

function updateDirection(key) {
  character.isMoving = true;
  if(['ArrowRight','d'].includes(key)) character.direction = 'right';
  if(['ArrowLeft','a'].includes(key)) character.direction = 'left';
  if(['ArrowUp','w'].includes(key)) character.direction = 'up';
  if(['ArrowDown','s'].includes(key)) character.direction = 'down';
}

function initGame() {
  for (let s of Object.values(sounds)) s.volume = document.getElementById('volume').value;
  drawInitialScreen();
  document.getElementById('start-btn').disabled = false;
}
function startGame() {
  sounds.start.play();
  gameActive = true;
  score = 0;
  toys = [];
  timeLeft = parseInt(document.getElementById('game-time').value);
  document.getElementById('score').textContent = score;
  document.getElementById('start-btn').disabled = true;
  document.getElementById('restart-btn').disabled = false;
  document.querySelector('.instructions').classList.add('hidden');
  lastToyTime = Date.now();
  updateTimerDisplay();
  gameInterval = setInterval(gameLoop, 1000 / 60);
}
function restartGame() {
  clearInterval(gameInterval);
  gameActive = false;
  document.getElementById('game-over').classList.add('hidden');
  document.querySelector('.instructions').classList.remove('hidden');
  document.getElementById('start-btn').disabled = false;
  drawInitialScreen();
}
function endGame() {
  gameActive = false;
  clearInterval(gameInterval);
  sounds.end.play();
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-over').classList.remove('hidden');
  document.getElementById('start-btn').disabled = false;
}

function gameLoop() {
  update();
  render();
}
function update() {
  if ((timeLeft -= 1 / 60) <= 0) { endGame(); return; }
  if (Math.floor(timeLeft) !== Math.floor(timeLeft + 1 / 60)) updateTimerDisplay();

  const halfW = character.width / 2, halfH = character.height / 2;
  if (keys.ArrowUp || keys.w) character.y = Math.max(halfH, character.y - character.speed);
  if (keys.ArrowDown || keys.s) character.y = Math.min(CANVAS_HEIGHT - halfH, character.y + character.speed);
  if (keys.ArrowLeft || keys.a) character.x = Math.max(halfW, character.x - character.speed);
  if (keys.ArrowRight || keys.d) character.x = Math.min(CANVAS_WIDTH - halfW, character.x + character.speed);

  if (keys[' ']) { attemptCollection(); keys[' '] = false; }
  if (Date.now() - lastToyTime > toyInterval) { spawnToy(); lastToyTime = Date.now(); }
  updateToys();

  frameTicker = (frameTicker + 1) % frameDelay;
  if (frameTicker === 0) frameX = (frameX + 1) % frameCount;

  frameY = character.isMoving 
    ? { down: 3, left: 4, right: 5, up: 3 }[character.direction]
    : { down: 0, left: 1, right: 2, up: 0 }[character.direction];
}

function render() {
  ctx.drawImage(backgroundImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawToys();
  drawCharacter();
}

function drawInitialScreen() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(backgroundImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = 'white';
  ctx.font = '24px Comic Sans MS';
  ctx.fillText('Press START to begin!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}
function updateTimerDisplay() {
  let m = Math.floor(timeLeft / 60), s = Math.floor(timeLeft % 60);
  document.getElementById('time').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function drawCharacter() {
  if (!characterImg.complete) return;

  const drawX = Math.round(character.x - character.width / 2);
  const drawY = Math.round(character.y - character.height / 2);

  ctx.drawImage(
    characterImg,
    frameX * frameWidth,
    frameY * frameHeight,
    frameWidth,
    frameHeight,
    drawX,
    drawY,
    character.width,
    character.height
  );
}

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

function updateToys() {
  const now = Date.now();
  toys = toys.filter(toy => {
    if (toy.stage === 1) {
      toy.y += 2;
      if (toy.y >= toy.targetY) {
        toy.stage = 2;
        toy.stageStartTime = now;
      }
    } else if (toy.stage === 2 && now - toy.stageStartTime > TOY_STAGE2_DURATION) {
      toy.stage = 3;
      toy.stageStartTime = now;
      toy.initialRadius = toy.radius;
    } else if (toy.stage === 3) {
      let p = (now - toy.stageStartTime) / TOY_STAGE3_DURATION;
      if (p >= 1) return false;
      toy.radius = toy.initialRadius * (1 - p);
      toy.opacity = 1 - p;
    }
    return true;
  });
}

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

function attemptCollection() {
  let collected = false;
  const characterHitRadius = Math.min(character.width, character.height) * 0.3;

  for (let i = toys.length - 1; i >= 0; i--) {
    const toy = toys[i];
    const dx = character.x - toy.x;
    const dy = character.y - toy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < characterHitRadius + toy.radius) {
      score += toy.stage === 2 ? 2 : 1;
      document.getElementById('score').textContent = score;
      sounds.collect.play();
      toys.splice(i, 1);
      collected = true;
      break;
    }
  }
  if (!collected) sounds.fail.play();
}