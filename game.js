const menu = document.getElementById('menu');
const gameScreen = document.getElementById('game');
const btnAI = document.getElementById('btn-ai');
const btnPVP = document.getElementById('btn-pvp');
const btnBack = document.getElementById('btn-back');
const difficultySelect = document.getElementById('difficulty');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;
const PADDLE_W = 12;
const PADDLE_H = 90;
const PADDLE_SPEED = 6;
const BALL_SIZE = 12;
const SET_SCORE = 5;
const SETS_TO_WIN = 2;

const difficulties = {
  easy: { speed: 2.7, reaction: 0.06, error: 55 },
  medium: { speed: 3.7, reaction: 0.09, error: 28 },
  hard: { speed: 4.8, reaction: 0.14, error: 10 }
};

let mode = 'ai';
let difficulty = 'medium';
let running = false;
let animationId = null;
let message = '';
let messageTimer = 0;
let aiTarget = H / 2;

const keys = {};
const left = { x: 20, y: H / 2 - PADDLE_H / 2, score: 0, sets: 0 };
const right = { x: W - 20 - PADDLE_W, y: H / 2 - PADDLE_H / 2, score: 0, sets: 0 };
const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };

function resetBall(direction = 1) {
  ball.x = W / 2;
  ball.y = H / 2;
  const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
  const speed = 5;
  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
}

function resetRound(direction = Math.random() < 0.5 ? 1 : -1) {
  left.y = H / 2 - PADDLE_H / 2;
  right.y = H / 2 - PADDLE_H / 2;
  aiTarget = H / 2;
  resetBall(direction);
}

function resetSet(direction = Math.random() < 0.5 ? 1 : -1) {
  left.score = 0;
  right.score = 0;
  resetRound(direction);
}

function resetGame() {
  left.score = 0;
  right.score = 0;
  left.sets = 0;
  right.sets = 0;
  message = '';
  messageTimer = 0;
  resetRound();
}

function movePlayers() {
  if (keys['w'] || keys['W']) left.y -= PADDLE_SPEED;
  if (keys['s'] || keys['S']) left.y += PADDLE_SPEED;

  if (mode === 'pvp') {
    if (keys['ArrowUp']) right.y -= PADDLE_SPEED;
    if (keys['ArrowDown']) right.y += PADDLE_SPEED;
  } else {
    const settings = difficulties[difficulty];
    const predictedY = ball.y + BALL_SIZE / 2;
    const error = (Math.random() * 2 - 1) * settings.error;
    aiTarget += (predictedY + error - aiTarget) * settings.reaction;
    const target = aiTarget - PADDLE_H / 2;
    const diff = target - right.y;

    if (Math.abs(diff) > settings.speed) {
      right.y += Math.sign(diff) * settings.speed;
    } else {
      right.y = target;
    }
  }

  left.y = Math.max(0, Math.min(H - PADDLE_H, left.y));
  right.y = Math.max(0, Math.min(H - PADDLE_H, right.y));
}

function moveBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y <= 0 || ball.y + BALL_SIZE >= H) {
    ball.vy *= -1;
    ball.y = Math.max(0, Math.min(H - BALL_SIZE, ball.y));
  }
}

function collidePaddle(paddle, side) {
  const touching = ball.x <= paddle.x + PADDLE_W &&
    ball.x + BALL_SIZE >= paddle.x &&
    ball.y + BALL_SIZE >= paddle.y &&
    ball.y <= paddle.y + PADDLE_H;

  if (!touching) return;

  if (side === 'left' && ball.vx < 0) {
    ball.vx *= -1.05;
    const hit = (ball.y + BALL_SIZE / 2 - (paddle.y + PADDLE_H / 2)) / (PADDLE_H / 2);
    ball.vy += hit * 3;
    ball.x = paddle.x + PADDLE_W;
  }

  if (side === 'right' && ball.vx > 0) {
    ball.vx *= -1.05;
    const hit = (ball.y + BALL_SIZE / 2 - (paddle.y + PADDLE_H / 2)) / (PADDLE_H / 2);
    ball.vy += hit * 3;
    ball.x = paddle.x - BALL_SIZE;
  }
}

function scorePoint(player) {
  if (player === 'left') {
    left.score++;
    if (left.score >= SET_SCORE) return finishSet('left');
    resetRound(-1);
  } else {
    right.score++;
    if (right.score >= SET_SCORE) return finishSet('right');
    resetRound(1);
  }
}

function finishSet(winner) {
  if (winner === 'left') {
    left.sets++;
    message = 'Jogador 1 venceu o set';
  } else {
    right.sets++;
    message = mode === 'ai' ? 'IA venceu o set' : 'Jogador 2 venceu o set';
  }

  if (left.sets >= SETS_TO_WIN) return endGame('Jogador 1 venceu');
  if (right.sets >= SETS_TO_WIN) return endGame(mode === 'ai' ? 'IA venceu' : 'Jogador 2 venceu');

  messageTimer = 90;
  resetSet(winner === 'left' ? -1 : 1);
}

function update() {
  if (messageTimer > 0) messageTimer--;
  movePlayers();
  moveBall();
  collidePaddle(left, 'left');
  collidePaddle(right, 'right');

  if (ball.x < 0) scorePoint('right');
  if (ball.x > W) scorePoint('left');
}

function drawCenteredText(text, y, size = 28) {
  ctx.fillStyle = '#fff';
  ctx.font = `${size}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
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
  ctx.fillText(left.score, W / 2 - 70, 70);
  ctx.fillText(right.score, W / 2 + 70, 70);

  ctx.font = '18px Courier New';
  ctx.fillText(`Sets: ${left.sets}`, W / 2 - 130, 28);
  ctx.fillText(`Sets: ${right.sets}`, W / 2 + 130, 28);

  ctx.font = '14px Courier New';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Set até 5 pontos | Melhor de 3', W / 2, H - 20);

  if (mode === 'ai') {
    ctx.textAlign = 'right';
    ctx.fillText(`IA: ${difficultyLabel()}`, W - 18, H - 20);
  }

  const advantage = getAdvantageText();
  if (advantage) drawCenteredText(advantage, 112, 18);

  if (messageTimer > 0 && message) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, H / 2 - 42, W, 84);
    drawCenteredText(message, H / 2 + 10, 30);
  }
}

function getAdvantageText() {
  if (left.sets === right.sets) return 'Sets empatados';
  if (left.sets > right.sets) return 'Vantagem: Jogador 1';
  return mode === 'ai' ? 'Vantagem: IA' : 'Vantagem: Jogador 2';
}

function difficultyLabel() {
  if (difficulty === 'easy') return 'Fácil';
  if (difficulty === 'hard') return 'Difícil';
  return 'Médio';
}

function loop() {
  if (!running) return;
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

function endGame(finalMessage) {
  running = false;
  cancelAnimationFrame(animationId);
  draw();
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, H / 2 - 70, W, 140);
  drawCenteredText(finalMessage, H / 2 - 8, 36);
  drawCenteredText(`${left.sets} x ${right.sets} em sets`, H / 2 + 34, 22);
}

function startGame(selectedMode) {
  mode = selectedMode;
  difficulty = difficultySelect ? difficultySelect.value : 'medium';
  menu.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resetGame();
  running = true;
  cancelAnimationFrame(animationId);
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

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});