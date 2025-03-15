const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size dynamically
canvas.width = Math.min(window.innerWidth - 20, 400);
canvas.height = Math.min(window.innerHeight - 20, 500);

// Bird properties
let bird = {
  x: 50,
  y: canvas.height / 2,
  width: 34,
  height: 24,
  gravity: 0.5,
  velocity: 0,
  jump: -8,
  sprite: new Image(),
  frame: 0 // Used for wing animation
};
bird.sprite.src = "bird.png"; // Ensure you have a bird sprite

// Pipes & Coins
let pipes = [];
let coins = [];
const pipeWidth = 50;
const pipeGap = 120;
let frame = 0;
let pipeCount = 0; // Track number of pipes for big coin
let score = 0;
let bestScore = 0;
let totalCoins = 0;
let gameOver = false;

// Sounds
const flapSound = new Audio("flap.mp3");
const hitSound = new Audio("hit.mp3");
const coinSound = new Audio("coin.mp3");

// Reset scores on page load
window.onload = function () {
  localStorage.setItem("totalCoins", 0);
  localStorage.setItem("bestScore", 0);
};

// Function to make the bird jump
function jump() {
  if (!gameOver) {
    bird.velocity = bird.jump;
    flapSound.play();
  }
}

// Event listeners
document.addEventListener("keydown", jump);
document.addEventListener("mousedown", jump);
document.addEventListener("touchstart", jump);

function update() {
  if (gameOver) return;

  // Apply gravity
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  // Prevent bird from flying off screen
  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    endGame();
  }

  // Generate pipes & coins
  if (frame % 75 === 0) {
    let pipeY = Math.random() * (canvas.height - pipeGap - 50) + 20;
    pipes.push({ x: canvas.width, y: pipeY });

    pipeCount++; // Increment first, so we start counting correctly

    // Coin placement (random in gap)
    let coinY = pipeY + Math.random() * (pipeGap - 20) + 10;
    let isBigCoin = pipeCount % 10 === 0; // Now 10, 20, 30... have big coins
    coins.push({
      x: canvas.width + 10,
      y: coinY,
      width: isBigCoin ? 20 : 10, // Big coin is larger
      height: isBigCoin ? 20 : 10,
      value: isBigCoin ? 10 : 1
    });
  }


  // Move pipes & check collision
  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= 3;

    // Collision detection
    if (
      bird.x < pipes[i].x + pipeWidth &&
      bird.x + bird.width > pipes[i].x &&
      (bird.y < pipes[i].y || bird.y + bird.height > pipes[i].y + pipeGap)
    ) {
      endGame();
    }

    // Remove off-screen pipes
    if (pipes[i].x + pipeWidth < 0) {
      pipes.splice(i, 1);
      score++;
    }
  }

  // Move coins & check collection
  for (let i = coins.length - 1; i >= 0; i--) {
    coins[i].x -= 3;

    // Check if bird collects coin
    if (
      bird.x < coins[i].x + coins[i].width &&
      bird.x + bird.width > coins[i].x &&
      bird.y < coins[i].y + coins[i].height &&
      bird.y + bird.height > coins[i].y
    ) {
      totalCoins += coins[i].value;
      coinSound.play(); // Play coin sound
      coins.splice(i, 1); // Remove coin
    }

    // Remove off-screen coins
    if (coins[i] && coins[i].x + coins[i].width < 0) {
      coins.splice(i, 1);
    }
  }

  bird.frame = (bird.frame + 1) % 3; // Bird animation
  frame++;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw bird
  ctx.drawImage(bird.sprite, bird.frame * 34, 0, 34, 24, bird.x, bird.y, bird.width, bird.height);

  // Draw pipes
  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.y);
    ctx.fillRect(pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height - pipe.y - pipeGap);
  });

  // Draw coins
  coins.forEach(coin => {
    ctx.fillStyle = coin.value === 10 ? "gold" : "yellow"; // Big coins are gold
    ctx.beginPath();
    ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Display score & coins
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Best Score: ${bestScore}`, 20, 60);
  ctx.fillText(`Coins: ${totalCoins}`, 20, 90);

  // Game over message
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "24px Arial";
    ctx.fillText("Game Over! shiwa!", canvas.width / 4, canvas.height / 2);

    // Draw Try Again button
    ctx.fillStyle = "blue";
    ctx.fillRect(canvas.width / 4, canvas.height / 2 + 60, canvas.width / 2, 40);
    ctx.fillStyle = "white";
    ctx.fillText("Try Again", canvas.width / 3, canvas.height / 2 + 90);
  }
}

function endGame() {
  gameOver = true;
  hitSound.play();

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore);
  }
}

// Restart only on Try Again button click
canvas.addEventListener("click", function (event) {
  if (gameOver) {
    let buttonX = canvas.width / 4;
    let buttonY = canvas.height / 2 + 60;
    let buttonWidth = canvas.width / 2;
    let buttonHeight = 40;

    if (
      event.offsetX >= buttonX &&
      event.offsetX <= buttonX + buttonWidth &&
      event.offsetY >= buttonY &&
      event.offsetY <= buttonY + buttonHeight
    ) {
      resetGame();
    }
  }
});

function resetGame() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  coins = [];
  frame = 0;
  score = 0;
  pipeCount = 0;
  gameOver = false;

  // Reset all stored values
  localStorage.setItem("totalCoins", 0);
  localStorage.setItem("bestScore", 0);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
