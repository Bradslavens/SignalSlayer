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

// Signal data
const correctSignals = [
  'Clear', 'Approach', 'Stop', 'Advance', 'Restricting',
  'Diverging Clear', 'Diverging Approach', 'Diverging Restricting',
  'Limited Clear', 'Medium Approach'
];
const incorrectSignals = [
  'Yield', 'Caution', 'Go', 'Slow', 'Fast', 'Wait', 'Proceed', 'Block',
  'Hold', 'Pass', 'Alert', 'Warning', 'Danger', 'Safe', 'Track Out',
  'No Entry', 'Reverse', 'Forward', 'Left', 'Right'
];

// Game state
let signalRows = [];
let playerTrack = 1; // 0=left, 1=center, 2=right
let gameOver = false;
let score = 0;

function randomSignalRow() {
  // Pick 1 correct and 2 incorrect signals, shuffle, and assign to tracks
  const correct = correctSignals[Math.floor(Math.random() * correctSignals.length)];
  let incorrects = [];
  while (incorrects.length < 2) {
    let s = incorrectSignals[Math.floor(Math.random() * incorrectSignals.length)];
    if (s !== correct && !incorrects.includes(s)) incorrects.push(s);
  }
  let signals = [correct, ...incorrects];
  // Shuffle
  for (let i = signals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [signals[i], signals[j]] = [signals[j], signals[i]];
  }
  // Mark which is correct
  return {
    signals: signals.map((name, idx) => ({
      name,
      correct: name === correct,
      track: idx
    })),
    y: -SIGNAL_HEIGHT
  };
}

function resetGame() {
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
  ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '24px sans-serif';
  ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 30);
}

function update() {
  if (gameOver) return;
  // Move signal rows down
  signalRows.forEach(row => row.y += SIGNAL_SPEED);
  // Remove rows that are off screen
  if (signalRows.length && signalRows[0].y > canvas.height) {
    signalRows.shift();
  }
  // Add new row if needed
  if (signalRows.length === 0 || signalRows[signalRows.length - 1].y > SIGNAL_HEIGHT * 2) {
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
          // Clear this row
          row.y = canvas.height + 1; // Mark for removal
          score++;
        } else {
          gameOver = true;
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
  if (gameOver && e.code === 'Space') {
    resetGame();
    return;
  }
  if (e.code === 'ArrowLeft' && playerTrack > 0) {
    playerTrack--;
  } else if (e.code === 'ArrowRight' && playerTrack < TRACKS - 1) {
    playerTrack++;
  }
});

resetGame();
gameLoop();
