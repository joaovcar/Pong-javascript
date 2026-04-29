const menu = document.getElementById('menu');
const gameScreen = document.getElementById('game');
const btnAI = document.getElementById('btn-ai');
const btnPVP = document.getElementById('btn-pvp');
const btnBack = document.getElementById('btn-back');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;
const PADDLE_W = 12;
const PADDLE_H = 90;
const PADDLE_SPEED = 6;
const AI_SPEED = 4.5;
const BALL_SIZE = 12;
const WIN_SCORE = 7;

let mode = 'ai';
let running = false;
let animationId = null;

const keys = {};
const left = { x: 20, y: H / 2 - PADDLE_H / 2, score: 0 };
const right = { x: W - 20 - PADDLE_W, y: H / 2 - PADDLE_H / 2, score: 0 };
const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };

function resetBall(direction = 1) {
  ball.x = W / 2;
  ball.y = H / 2;
  const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
  const speed = 5;
  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
}

function resetGame() {
  left.y = H / 2 - PADDLE_H / 2;
  right.y = H / 2 - PADDLE_H / 2;
  left.score = 0;
  right.score = 0;
  resetBall(Math.random() < 0.5 ? 1 : -1);
}

function update() {
  if (keys['w'] || keys['W']) left.y -= PADDLE_SPEED;
  if (keys['s'] || keys['S']) left.y += PADDLE_SPEED;

  if (mode === 'pvp') {
    if (keys['ArrowUp']) right.y -= PADDLE_SPEED;
    if (keys['ArrowDown']) right.y += PADDLE_SPEED;
  } else {
    const target = ball.y - PADDLE_H / 2;
    const diff = target - right.y;
    if (Math.abs(diff) > AI_SPEED) {
      right.y += Math.sign(diff) * AI_SPEED;
    } else {
      right.y = target;
    }
  }

  left.y = Math.max(0, Math.min(H - PADDLE_H, left.y));
  right.y = Math.max(0, Math.min(H - PADDLE_H, right.y));

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y <= 0 || ball.y + BALL_SIZE >= H) {
    ball.vy *= -1;
    ball.y = Math.max(0, Math.min(H - BALL_SIZE, ball.y));
  }

  if (
    ball.x <= left.x + PADDLE_W &&
    ball.x + BALL_SIZE >= left.x &&
    ball.y + BALL_SIZE >= left.y &&
    ball.y <= left.y + PADDLE_H &&
    ball.vx < 0
  ) {
    ball.vx *= -1.05;
    const hit = (ball.y + BALL_SIZE / 2 - (left.y + PADDLE_H / 2)) / (PADDLE_H / 2);
    ball.vy += hit * 3;
    ball.x = left.x + PADDLE_W;
  }

  if (
    ball.x + BALL_SIZE >= right.x &&
    ball.x <= right.x + PADDLE_W &&
    ball.y + BALL_SIZE >= right.y &&
    ball.y <= right.y + PADDLE_H &&
    ball.vx > 0
  ) {
    ball.vx *= -1.05;
    const hit = (ball.y + BALL_SIZE / 2 - (right.y + PADDLE_H / 2)) / (PADDLE_H / 2);
    ball.vy += hit * 3;
    ball.x = right.x - BALL_SIZE;
  }

  if (ball.x < 0) {
    right.score++;
    if (right.score >= WIN_SCORE) return endGame(mode === 'ai' ? 'IA venceu!' : 'Jogador 2 venceu!');
    resetBall(1);
  } else if (ball.x > W) {
    left.score++;
    if (left.score >= WIN_SCORE) return endGame('Jogador 1 venceu!');
    resetBall(-1);
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#444';
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fff';
  ctx.fillRect(left.x, left.y, PADDLE_W, PADDLE_H);
  ctx.fillRect(right.x, right.y, PADDLE_W, PADDLE_H);
  ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);

  ctx.font = '48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(left.score, W / 2 - 60, 60);
  ctx.fillText(right.score, W / 2 + 60, 60);
}

function loop() {
  if (!running) return;
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

function endGame(message) {
  running = false;
  cancelAnimationFrame(animationId);
  draw();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, H / 2 - 50, W, 100);
  ctx.fillStyle = '#fff';
  ctx.font = '36px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(message, W / 2, H / 2 + 12);
}

function startGame(selectedMode) {
  mode = selectedMode;
  menu.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resetGame();
  running = true;
  loop();
}

function backToMenu() {
  running = false;
  cancelAnimationFrame(animationId);
  gameScreen.classList.add('hidden');
  menu.classList.remove('hidden');
}

btnAI.addEventListener('click', () => startGame('ai'));
btnPVP.addEventListener('click', () => startGame('pvp'));
btnBack.addEventListener('click', backToMenu);

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (['ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });
