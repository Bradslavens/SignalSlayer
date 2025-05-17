// Signal Slayer Game - Plain JavaScript + Canvas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
window.TRACKS = 3;
window.TRACK_WIDTH = canvas.width / window.TRACKS;
window.SIGNAL_HEIGHT = Math.max(50, Math.floor(canvas.height / 10));
window.SIGNAL_WIDTH = window.TRACK_WIDTH - 20;
window.SIGNAL_SPEED = 2;
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  window.SIGNAL_SPEED /= 2;
}
window.TRAIN_WIDTH = Math.max(12, Math.floor(window.TRACK_WIDTH * 0.09));
window.TRAIN_HEIGHT = window.TRAIN_WIDTH;
window.TRAIN_Y = canvas.height - window.TRAIN_HEIGHT - 30;

// Import signal arrays from separate files
import { correctSignals } from './correctSignals.js';
import { incorrectSignals } from './incorrectSignals.js';

// Device detection
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Game state
let selectedLine = null;
let signalRows = [];
let playerTrack = 1; // 0=left, 1=center, 2=right
let gameOver = false;
let score = 0;
let currentCorrectIndex = 0;
let currentLineSignals = [];

function showLineSelector() {
  let selector = document.createElement('select');
  selector.id = 'lineSelector';
  selector.style.position = 'absolute';
  selector.style.top = '20px';
  selector.style.left = '50%';
  selector.style.transform = 'translateX(-50%)';
  selector.style.fontSize = '24px';
  selector.style.zIndex = 10;
  let defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.text = 'Select Rail Line...';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  selector.appendChild(defaultOption);
  Object.keys(correctSignals).forEach(line => {
    let opt = document.createElement('option');
    opt.value = line;
    opt.text = line;
    selector.appendChild(opt);
  });
  document.body.appendChild(selector);
  selector.addEventListener('change', e => {
    selectedLine = selector.value;
    currentLineSignals = correctSignals[selectedLine];
    currentCorrectIndex = 0;
    resetGame();
    selector.style.display = 'none';
  });
}

function randomSignalRow() {
  if (!selectedLine) return { signals: [], y: -window.SIGNAL_HEIGHT };
  // The correct signal is always the current one in order for the selected line
  const correct = currentLineSignals[currentCorrectIndex];
  // Use only incorrect signals for the selected line
  const lineIncorrects = incorrectSignals[selectedLine] || [];
  // Pick 2 random incorrect signals (not the correct one)
  let incorrects = [];
  while (incorrects.length < 2 && lineIncorrects.length > 0) {
    let s = lineIncorrects[Math.floor(Math.random() * lineIncorrects.length)];
    if (s !== correct && !incorrects.includes(s)) incorrects.push(s);
  }
  // Shuffle tracks and place correct signal in a random track
  let tracks = [0, 1, 2];
  const correctTrack = tracks.splice(Math.floor(Math.random() * tracks.length), 1)[0];
  let signals = [];
  for (let i = 0, incIdx = 0; i < 3; i++) {
    if (i === correctTrack) {
      signals.push({ name: correct, correct: true, track: i });
    } else {
      signals.push({ name: incorrects[incIdx++], correct: false, track: i });
    }
  }
  return {
    signals,
    y: -window.SIGNAL_HEIGHT
  };
}

function resetGame() {
  if (!selectedLine) return;
  currentCorrectIndex = 0;
  signalRows = [randomSignalRow()];
  playerTrack = 1;
  gameOver = false;
  score = 0;
}

function drawTracks() {
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 4;
  for (let i = 1; i < window.TRACKS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * window.TRACK_WIDTH, 0);
    ctx.lineTo(i * window.TRACK_WIDTH, canvas.height);
    ctx.stroke();
  }
}

function drawSignalRow(row) {
  row.signals.forEach((signal, i) => {
    const x = signal.track * window.TRACK_WIDTH + 10;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, row.y, window.SIGNAL_WIDTH, window.SIGNAL_HEIGHT);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(x, row.y, window.SIGNAL_WIDTH, window.SIGNAL_HEIGHT);
    ctx.fillStyle = '#222';
    ctx.font = Math.max(16, Math.floor(window.SIGNAL_HEIGHT * 0.35)) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(signal.name, x + window.SIGNAL_WIDTH / 2, row.y + window.SIGNAL_HEIGHT / 2 + 6);
  });
}

function drawTrain() {
  const x = playerTrack * window.TRACK_WIDTH + (window.TRACK_WIDTH - window.TRAIN_WIDTH) / 2;
  ctx.fillStyle = 'red';
  ctx.fillRect(x, window.TRAIN_Y, window.TRAIN_WIDTH, window.TRAIN_HEIGHT);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, window.TRAIN_Y, window.TRAIN_WIDTH, window.TRAIN_HEIGHT);
  // Simple train face
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + window.TRAIN_WIDTH * 0.2, window.TRAIN_Y + window.TRAIN_HEIGHT * 0.2, window.TRAIN_WIDTH * 0.6, window.TRAIN_HEIGHT * 0.4);
}

function drawScore() {
  ctx.fillStyle = '#222';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 10, 30);
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  // Responsive font size for 'Game Over!': 7% of canvas height, min 28px, max 56px
  const gameOverFont = Math.max(28, Math.min(56, Math.floor(canvas.height * 0.07)));
  ctx.font = gameOverFont + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const centerX = canvas.width / (window.devicePixelRatio || 1) / 2;
  const centerY = canvas.height / (window.devicePixelRatio || 1) / 2;
  ctx.fillText('Game Over!', centerX, centerY - gameOverFont);
  // Responsive font size for 'Tap to Restart': 4% of canvas height, min 18px, max 36px
  const restartFont = Math.max(18, Math.min(36, Math.floor(canvas.height * 0.04)));
  ctx.font = restartFont + 'px sans-serif';
  ctx.fillText('Tap to Restart', centerX, centerY + restartFont);
  ctx.restore();
}

function update() {
  if (!selectedLine) return;
  if (gameOver) return;
  // Move signal rows down
  signalRows.forEach(row => row.y += window.SIGNAL_SPEED);
  // Remove rows that are off screen
  if (signalRows.length && signalRows[0].y > canvas.height) {
    signalRows.shift();
  }
  // Add new row if needed
  if (signalRows.length === 0 && currentCorrectIndex < currentLineSignals.length) {
    signalRows.push(randomSignalRow());
  }
  // Collision detection
  signalRows.forEach(row => {
    if (
      row.y + window.SIGNAL_HEIGHT >= window.TRAIN_Y &&
      row.y < window.TRAIN_Y + window.TRAIN_HEIGHT
    ) {
      const signal = row.signals[playerTrack];
      if (signal) {
        if (signal.correct) {
          // Clear this row and advance to next correct signal
          row.y = canvas.height + 1; // Mark for removal
          score++;
          currentCorrectIndex++;
          if (currentCorrectIndex < currentLineSignals.length) {
            signalRows.push(randomSignalRow());
          } else {
            gameOver = true; // End game when all signals are used
          }
        } else {
          gameOver = true;
          currentCorrectIndex = 0; // Reset to first correct signal
        }
      }
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Background
  ctx.fillStyle = '#b3e0ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawTracks();
  if (!selectedLine) {
    ctx.save();
    ctx.fillStyle = '#222';
    // Responsive font size: 6% of canvas height, min 24px, max 48px
    const fontSize = Math.max(24, Math.min(48, Math.floor(canvas.height * 0.06)));
    ctx.font = fontSize + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Use the visible (CSS) canvas size for centering
    const rect = canvas.getBoundingClientRect();
    const centerX = canvas.width / (window.devicePixelRatio || 1) / 2;
    const centerY = canvas.height / (window.devicePixelRatio || 1) / 2;
    ctx.fillText('Select a Rail Line to Start', centerX, centerY);
    ctx.restore();
    return;
  }
  signalRows.forEach(drawSignalRow);
  drawTrain();
  drawScore();
  if (gameOver) drawGameOver();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener('keydown', e => {
  if (gameOver && (e.code === 'Enter' || e.code === 'NumpadEnter')) {
    resetGame();
    return;
  }
  if (e.code === 'ArrowLeft' && playerTrack > 0) {
    playerTrack--;
  } else if (e.code === 'ArrowRight' && playerTrack < window.TRACKS - 1) {
    playerTrack++;
  }
});

// Touch controls for mobile
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchend', handleTouchEnd, false);
canvas.addEventListener('mousedown', handleMouseDown, false);
let touchStartX = null;

function handleTouchStart(e) {
  if (gameOver) {
    resetGame();
    return;
  }
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
  }
}

function handleTouchEnd(e) {
  if (touchStartX === null || gameOver) return;
  const touchEndX = e.changedTouches[0].clientX;
  const dx = touchEndX - touchStartX;
  if (Math.abs(dx) > 30) {
    if (dx < 0 && playerTrack > 0) {
      playerTrack--;
    } else if (dx > 0 && playerTrack < window.TRACKS - 1) {
      playerTrack++;
    }
  }
  touchStartX = null;
}

function handleMouseDown(e) {
  if (gameOver) {
    resetGame();
    return;
  }
}

// --- Responsive Layout Logic ---
function createMobileControls() {
  const controls = document.createElement('div');
  controls.id = 'mobile-controls';
  controls.style.position = 'absolute';
  controls.style.left = '0';
  controls.style.bottom = '0';
  controls.style.width = '100%';
  controls.style.display = 'flex';
  controls.style.justifyContent = 'space-between';
  controls.style.alignItems = 'flex-end';
  controls.style.pointerEvents = 'none';
  controls.style.zIndex = 20;
  controls.style.height = '90px';
  controls.style.background = 'transparent';

  const leftBtn = document.createElement('button');
  leftBtn.innerHTML = '◀️';
  leftBtn.style.fontSize = '40px';
  leftBtn.style.width = '70px';
  leftBtn.style.height = '70px';
  leftBtn.style.borderRadius = '50%';
  leftBtn.style.border = '2px solid #888';
  leftBtn.style.background = '#fff';
  leftBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  leftBtn.style.marginLeft = '10px';
  leftBtn.style.marginBottom = '10px';
  leftBtn.style.pointerEvents = 'auto';
  leftBtn.style.position = 'relative';
  leftBtn.style.left = '0';

  const rightBtn = document.createElement('button');
  rightBtn.innerHTML = '▶️';
  rightBtn.style.fontSize = '40px';
  rightBtn.style.width = '70px';
  rightBtn.style.height = '70px';
  rightBtn.style.borderRadius = '50%';
  rightBtn.style.border = '2px solid #888';
  rightBtn.style.background = '#fff';
  rightBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  rightBtn.style.marginRight = '10px';
  rightBtn.style.marginBottom = '10px';
  rightBtn.style.pointerEvents = 'auto';
  rightBtn.style.position = 'relative';
  rightBtn.style.right = '0';

  controls.appendChild(leftBtn);
  controls.appendChild(rightBtn);
  document.body.appendChild(controls);
}

function createDesktopControls() {
  // For desktop, no on-screen controls needed, but you could add WASD or other UI if desired
}

function setupControls() {
  // Remove any existing controls
  const oldMobile = document.getElementById('mobile-controls');
  if (oldMobile) oldMobile.remove();
  // ...add more cleanup if you add desktop controls...
  if (isMobile) {
    createMobileControls();
  } else {
    createDesktopControls();
  }
}

// Responsive canvas for mobile
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  let width = window.innerWidth;
  let height = window.innerHeight;
  if (isMobile) {
    // Portrait: 9:16 aspect ratio, fill screen from top, leave space at bottom for controls
    if (width > height) [width, height] = [height, width];
    let targetHeight = height;
    let targetWidth = width;
    if (height / width > 16 / 9) {
      targetHeight = width * 16 / 9;
    } else {
      targetWidth = height * 9 / 16;
    }
    const controlsHeight = 90;
    targetHeight = Math.max(targetHeight - controlsHeight, 320);
    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;
    canvas.style.width = targetWidth + 'px';
    canvas.style.height = targetHeight + 'px';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
  } else {
    // Desktop: Landscape 16:9, fill as much as possible
    if (height > width) [width, height] = [height, width];
    let targetWidth = width;
    let targetHeight = height;
    if (width / height > 16 / 9) {
      targetWidth = height * 16 / 9;
    } else {
      targetHeight = width * 9 / 16;
    }
    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;
    canvas.style.width = targetWidth + 'px';
    canvas.style.height = targetHeight + 'px';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '50%';
    canvas.style.transform = 'translateX(-50%)';
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  // Update game constants for new canvas size
  window.TRACKS = 3;
  window.TRACK_WIDTH = canvas.width / window.TRACKS / dpr;
  window.SIGNAL_HEIGHT = Math.max(40, Math.floor(canvas.height / 10 / dpr));
  window.SIGNAL_WIDTH = window.TRACK_WIDTH - 20;
  window.TRAIN_WIDTH = Math.max(12, Math.floor(window.TRACK_WIDTH * 0.09));
  window.TRAIN_HEIGHT = window.TRAIN_WIDTH;
  window.TRAIN_Y = canvas.height / dpr - window.TRAIN_HEIGHT - 30;
  setupControls();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Enforce portrait mode on mobile devices only
if (isMobile) {
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
  const style = document.createElement('style');
  style.innerHTML = `
  @media screen and (orientation:landscape) {
    body::before {
      content: 'Please rotate your device to portrait mode.';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #222;
      color: #fff;
      font-size: 2em;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      text-align: center;
    }
    #gameCanvas, #mobile-controls {
      display: none !important;
    }
  }`;
  document.head.appendChild(style);
}

showLineSelector();
resetGame();
gameLoop();
