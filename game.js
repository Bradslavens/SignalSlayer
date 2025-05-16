// Signal Slayer Game - Plain JavaScript + Canvas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TRACKS = 3;
const TRACK_WIDTH = canvas.width / TRACKS;
const SIGNAL_HEIGHT = 60;
const SIGNAL_WIDTH = TRACK_WIDTH - 20;
const SIGNAL_SPEED = 2;
const TRAIN_WIDTH = 50;
const TRAIN_HEIGHT = 50;
const TRAIN_Y = canvas.height - 100;

// Import signal arrays from separate files
import { correctSignals } from './correctSignals.js';
import { incorrectSignals } from './incorrectSignals.js';

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
  if (!selectedLine) return { signals: [], y: -SIGNAL_HEIGHT };
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
    y: -SIGNAL_HEIGHT
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
  for (let i = 1; i < TRACKS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TRACK_WIDTH, 0);
    ctx.lineTo(i * TRACK_WIDTH, canvas.height);
    ctx.stroke();
  }
}

function drawSignalRow(row) {
  row.signals.forEach((signal, i) => {
    const x = signal.track * TRACK_WIDTH + 10;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, row.y, SIGNAL_WIDTH, SIGNAL_HEIGHT);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(x, row.y, SIGNAL_WIDTH, SIGNAL_HEIGHT);
    ctx.fillStyle = '#222';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(signal.name, x + SIGNAL_WIDTH / 2, row.y + SIGNAL_HEIGHT / 2 + 6);
  });
}

function drawTrain() {
  const x = playerTrack * TRACK_WIDTH + (TRACK_WIDTH - TRAIN_WIDTH) / 2;
  ctx.fillStyle = 'red';
  ctx.fillRect(x, TRAIN_Y, TRAIN_WIDTH, TRAIN_HEIGHT);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, TRAIN_Y, TRAIN_WIDTH, TRAIN_HEIGHT);
  // Simple train face
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 10, TRAIN_Y + 10, 30, 20);
}

function drawScore() {
  ctx.fillStyle = '#222';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 10, 30);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = '24px sans-serif';
  ctx.fillText('Tap to Restart', canvas.width / 2, canvas.height / 2 + 10);
}

function update() {
  if (!selectedLine) return;
  if (gameOver) return;
  // Move signal rows down
  signalRows.forEach(row => row.y += SIGNAL_SPEED);
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
      row.y + SIGNAL_HEIGHT >= TRAIN_Y &&
      row.y < TRAIN_Y + TRAIN_HEIGHT
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
    ctx.fillStyle = '#222';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select a Rail Line to Start', canvas.width / 2, canvas.height / 2);
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
  } else if (e.code === 'ArrowRight' && playerTrack < TRACKS - 1) {
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
    } else if (dx > 0 && playerTrack < TRACKS - 1) {
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

// Add on-screen arrow buttons for mobile controls
function createMobileControls() {
  const controls = document.createElement('div');
  controls.id = 'mobile-controls';
  controls.style.position = 'absolute';
  controls.style.bottom = '40px';
  controls.style.left = '50%';
  controls.style.transform = 'translateX(-50%)';
  controls.style.display = 'flex';
  controls.style.gap = '40px';
  controls.style.zIndex = 20;

  const leftBtn = document.createElement('button');
  leftBtn.innerHTML = '◀️';
  leftBtn.style.fontSize = '40px';
  leftBtn.style.width = '70px';
  leftBtn.style.height = '70px';
  leftBtn.style.borderRadius = '50%';
  leftBtn.style.border = '2px solid #888';
  leftBtn.style.background = '#fff';
  leftBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  leftBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (playerTrack > 0 && !gameOver) playerTrack--;
  });
  leftBtn.addEventListener('mousedown', e => {
    e.preventDefault();
    if (playerTrack > 0 && !gameOver) playerTrack--;
  });

  const rightBtn = document.createElement('button');
  rightBtn.innerHTML = '▶️';
  rightBtn.style.fontSize = '40px';
  rightBtn.style.width = '70px';
  rightBtn.style.height = '70px';
  rightBtn.style.borderRadius = '50%';
  rightBtn.style.border = '2px solid #888';
  rightBtn.style.background = '#fff';
  rightBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  rightBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (playerTrack < TRACKS - 1 && !gameOver) playerTrack++;
  });
  rightBtn.addEventListener('mousedown', e => {
    e.preventDefault();
    if (playerTrack < TRACKS - 1 && !gameOver) playerTrack++;
  });

  controls.appendChild(leftBtn);
  controls.appendChild(rightBtn);
  document.body.appendChild(controls);
}

// Only show mobile controls if on a touch device
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  createMobileControls();
}

// Responsive canvas for mobile
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  let width = window.innerWidth;
  let height = window.innerHeight;
  // Maintain aspect ratio (3:4)
  if (width / height > 0.75) {
    width = height * 0.75;
  } else {
    height = width / 0.75;
  }
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

showLineSelector();
resetGame();
gameLoop();
