// === Constants ===
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TOY_RADIUS = 30;
const TOY_STAGE2_DURATION = 5000;
const TOY_STAGE3_DURATION = 5000;

// === Sprite Frame Info ===
const frameWidth = 21;
const frameHeight = 33;
const frameCount = 9;
let frameX = 0;
let frameY = 0;
let frameDelay = 5;
let frameTicker = 0;

let canvas, ctx;

// === Game State ===
let gameActive = false;
let score = 0;
let timeLeft = 0;
let gameInterval;
let toys = [];
let lastToyTime = 0;
let toyInterval = 2000;

// === Character ===
// character.x and y are now center-based
let character = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  width: frameWidth * 2,
  height: frameHeight * 2,
  speed: 5,
  direction: 'down',
  isMoving: false
};

// === Keys ===
const keys = {
  ArrowUp: false, ArrowDown: false,
  ArrowLeft: false, ArrowRight: false,
  w: false, a: false, s: false, d: false,
  ' ': false
};

// === Assets ===
let sounds = {};
let characterImg = new Image();
let backgroundImg = new Image();

const soundPaths = {
  start: 'assets/sounds/countdown.wav',
  collect: 'assets/sounds/point.wav',
  fail: 'assets/sounds/lose.flac',
  end: 'assets/sounds/gameover.wav'
};

const imagePaths = {
  character: 'assets/images/swimmer.png',
  background: 'assets/images/water.jpg'
};

let assetsToLoad = 6;
let assetsLoaded = 0;

function loadAssets() {
  characterImg.onload = assetLoaded;
  characterImg.src = imagePaths.character;

  backgroundImg.onload = assetLoaded;
  backgroundImg.src = imagePaths.background;

  for (let [key, path] of Object.entries(soundPaths)) {
    const audio = new Audio(path);
    audio.oncanplaythrough = assetLoaded;
    sounds[key] = audio;
  }
}

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

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  loadAssets();
  setupEventListeners();
});

function setupEventListeners() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('restart-btn').addEventListener('click', restartGame);
  document.getElementById('play-again').addEventListener('click', restartGame);

  document.getElementById('volume').addEventListener('input', (e) => {
    Object.values(sounds).forEach(sound => sound.volume = e.target.value);
  });
}

function handleKeyDown(e) {
  if (e.key in keys) {
    keys[e.key] = true;
    e.preventDefault();
    if (['ArrowRight', 'd'].includes(e.key)) character.direction = 'right';
    if (['ArrowLeft', 'a'].includes(e.key)) character.direction = 'left';
    if (['ArrowUp', 'w'].includes(e.key)) character.direction = 'up';
    if (['ArrowDown', 's'].includes(e.key)) character.direction = 'down';
    character.isMoving = true;
  }
}

function handleKeyUp(e) {
  if (e.key in keys) {
    keys[e.key] = false;
    e.preventDefault();
    character.isMoving = Object.keys(keys).some(k => keys[k]);
  }
}

function initGame() {
  Object.values(sounds).forEach(sound => sound.volume = document.getElementById('volume').value);
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
  timeLeft -= 1 / 60;
  if (timeLeft <= 0) {
    endGame();
    return;
  }

  if (Math.floor(timeLeft) !== Math.floor(timeLeft + 1 / 60)) updateTimerDisplay();

  // Move character - now using center-based bounds
  const halfW = character.width / 2;
  const halfH = character.height / 2;

  if (keys.ArrowUp || keys.w) character.y = Math.max(halfH, character.y - character.speed);
  if (keys.ArrowDown || keys.s) character.y = Math.min(CANVAS_HEIGHT - halfH, character.y + character.speed);
  if (keys.ArrowLeft || keys.a) character.x = Math.max(halfW, character.x - character.speed);
  if (keys.ArrowRight || keys.d) character.x = Math.min(CANVAS_WIDTH - halfW, character.x + character.speed);

  if (keys[' ']) {
    attemptCollection();
    keys[' '] = false;
  }

  if (Date.now() - lastToyTime > toyInterval) {
    spawnToy();
    lastToyTime = Date.now();
  }

  updateToys();

  if (character.isMoving) {
    frameTicker++;
    if (frameTicker >= frameDelay) {
      frameX = (frameX + 1) % frameCount;
      frameTicker = 0;
    }
  } else {
    frameX = 0;
  }

  if (character.direction === 'down') frameY = 0;
  else if (character.direction === 'left') frameY = 1;
  else if (character.direction === 'right') frameY = 2;
  else if (character.direction === 'up') frameY = 3;
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
  ctx.fillText('Press START to begin the game!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = Math.floor(timeLeft % 60);
  document.getElementById('time').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// === Character ===
function drawCharacter() {
  ctx.drawImage(
    characterImg,
    frameX * frameWidth,
    frameY * frameHeight,
    frameWidth, frameHeight,
    character.x - character.width / 2,
    character.y - character.height / 2,
    character.width,
    character.height
  );
}

// === Toys ===
function spawnToy() {
  const toy = {
    x: Math.random() * (CANVAS_WIDTH - 100) + 50,
    y: 0,
    targetY: Math.random() * (CANVAS_HEIGHT * 0.6) + 50,
    radius: TOY_RADIUS,
    color: getRandomBrightColor(),
    stage: 1,
    stageStartTime: Date.now(),
    collected: false
  };
  toys.push(toy);
}

function getRandomBrightColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
}

function updateToys() {
  const now = Date.now();
  for (let i = toys.length - 1; i >= 0; i--) {
    let toy = toys[i];
    switch (toy.stage) {
      case 1:
        toy.y += 2;
        if (toy.y >= toy.targetY) {
          toy.stage = 2;
          toy.stageStartTime = now;
        }
        break;
      case 2:
        if (now - toy.stageStartTime > TOY_STAGE2_DURATION) {
          toy.stage = 3;
          toy.stageStartTime = now;
          toy.initialRadius = toy.radius;
        }
        break;
      case 3:
        let progress = (now - toy.stageStartTime) / TOY_STAGE3_DURATION;
        if (progress >= 1) toy.stage = 4;
        else {
          toy.radius = toy.initialRadius * (1 - progress);
          toy.opacity = 1 - progress;
        }
        break;
      case 4:
        toys.splice(i, 1);
        break;
    }
  }
}

function drawToys() {
  for (let toy of toys) {
    if (toy.stage === 4) continue;
    ctx.save();
    if (toy.stage === 3) ctx.globalAlpha = toy.opacity || 1;

    const gradient = ctx.createRadialGradient(toy.x, toy.y, 0, toy.x, toy.y, toy.radius);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.7, toy.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(toy.x, toy.y, toy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// === Scoring ===
function attemptCollection() {
  let collected = false;
  for (let i = toys.length - 1; i >= 0; i--) {
    const toy = toys[i];
    if (toy.stage !== 2 && toy.stage !== 3) continue;

    const dx = character.x - toy.x;
    const dy = character.y - toy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const characterHitRadius = Math.max(character.width, character.height) * 0.4;
    if (distance < characterHitRadius + toy.radius) {
      score += toy.stage === 2 ? 2 : 1;
      document.getElementById('score').textContent = score;
      sounds.collect.play();
      toys.splice(i, 1);
      collected = true;
      break;
    }
  }

  if (!collected) {
    sounds.fail.play();
  }
}
