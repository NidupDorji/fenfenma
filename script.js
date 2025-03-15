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
  color: "white",
  frame: 0
};

// Pipes & Coins
let pipes = [];
let coins = [];
const pipeWidth = 50;
const pipeGap = 120;
let frame = 0;
let pipeCount = 0;
let score = 0;
let bestScore = 0;
let totalCoins = 0;
let gameOver = false;

// Belt system
const belts = [
  { name: "White Belt", score: 0, color: "white" },
  { name: "Yellow Belt", score: 10, color: "yellow" },
  { name: "Green Belt", score: 20, color: "green" },
  { name: "Blue Belt", score: 30, color: "blue" },
  { name: "Red Belt", score: 40, color: "red" },
  { name: "Black Belt", score: 50, color: "black" }
];


  let playerBelt = belts[0]; // Start with White Belt
  let lastAwardedBelt = belts[0];
//Reviving 
let isReviving = false;
let reviveTimer = 0;


// Sounds
const flapSound = new Audio("flap.mp3");
const hitSound = new Audio("hit.mp3");
const coinSound = new Audio("coin.mp3");
const beltUpSound = new Audio("belt-up.mp3"); // Sound for belt upgrade

//Reset scores on page load
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

    pipeCount++; 

    let coinY = pipeY + Math.random() * (pipeGap - 20) + 10;
    let isBigCoin = pipeCount % 10 === 0;
    coins.push({
      x: canvas.width + 10,
      y: coinY,
      width: isBigCoin ? 20 : 10,
      height: isBigCoin ? 20 : 10,
      value: isBigCoin ? 10 : 1
    });
  }

  // Handle revive timer
  if (isReviving) {
    reviveTimer -= 1 / 60; // Decrement by one frame
    if (reviveTimer <= 0) {
      isReviving = false; // End the grace period after 3 seconds
    }
  }

  // Move pipes & check collision only if not reviving
  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= 3;

    // Skip collision detection during the 3-second grace period
    if (!isReviving) {
      if (
        bird.x < pipes[i].x + pipeWidth &&
        bird.x + bird.width > pipes[i].x &&
        (bird.y < pipes[i].y || bird.y + bird.height > pipes[i].y + pipeGap)
      ) {
        endGame();
      }
    }

    if (pipes[i].x + pipeWidth < 0) {
      pipes.splice(i, 1);
      score++;
      checkBeltUpgrade();
    }
  }

  // Move coins & check collection
  for (let i = coins.length - 1; i >= 0; i--) {
    coins[i].x -= 3;

    if (
      bird.x < coins[i].x + coins[i].width &&
      bird.x + bird.width > coins[i].x &&
      bird.y < coins[i].y + coins[i].height &&
      bird.y + bird.height > coins[i].y
    ) {
      totalCoins += coins[i].value;
      coinSound.play();
      coins.splice(i, 1);
    }

    if (coins[i] && coins[i].x + coins[i].width < 0) {
      coins.splice(i, 1);
    }
  }

  bird.frame = (bird.frame + 1) % 3;
  frame++;
}


function checkBeltUpgrade() {
  for (let i = belts.length - 1; i >= 0; i--) {
    if (score >= belts[i].score && belts[i].score > lastAwardedBelt.score) {
      lastAwardedBelt = belts[i];
      playerBelt = belts[i];
      localStorage.setItem("playerBeltIndex", i); // Save belt progress
      beltUpSound.play();
      animateBeltUpgrade();
      break;
    }
  }
}

function animateBeltUpgrade() {
  bird.color = playerBelt.color; // Change bird color to match new belt

  let opacity = 1;
  let interval = setInterval(() => {
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;

    ctx.font = "30px Arial";
    ctx.fillText(`Congratulations! ${lastAwardedBelt.name} Unlocked!`, 50, canvas.height / 2);
    opacity -= 0.02;
    if (opacity <= 0) clearInterval(interval);
  }, 50);
}

function draw() {
  ctx.fillStyle = "lightgray";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = bird.color;
  ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

  ctx.fillStyle = "brown";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.y);
    ctx.fillRect(pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height - pipe.y - pipeGap);
  });

  coins.forEach(coin => {
    ctx.fillStyle = coin.value === 10 ? "gold" : "yellow";
    ctx.beginPath();
    ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Best Score: ${bestScore}`, 20, 60);
  ctx.fillText(`Coins: ${totalCoins}`, 20, 90);

  ctx.fillText("Belt:", canvas.width - 110, 30);
  ctx.fillStyle = bird.color;
  ctx.fillRect(canvas.width - 50, 15, 20, 20);
  ctx.strokeStyle = "black";
  ctx.strokeRect(canvas.width - 50, 15, 20, 20);



///////////
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "24px Arial";
    ctx.fillText("You crashed! shiwa!", canvas.width / 4, canvas.height / 2);

    ctx.fillStyle = "green";
    ctx.fillRect(canvas.width / 4, canvas.height / 2 + 30, canvas.width / 2, 40); // Moved up by 30px
    ctx.fillStyle = "white";
    ctx.fillText("Try Again", canvas.width / 3, canvas.height / 2 + 60); // Moved up by 30px
    // Revive Button (if player has enough coins)
    if (totalCoins >= 10) {
      ctx.fillStyle = "blue";
      ctx.fillRect(canvas.width / 4, canvas.height / 2 + 80, canvas.width / 2, 40);
      ctx.fillStyle = "white";
      ctx.fillText("Revive (-10 Coins)", canvas.width / 4 + 10, canvas.height / 2 + 110);
    }
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

canvas.addEventListener("click", function (event) {
  if (gameOver) {
    let buttonX = canvas.width / 4;
    let buttonWidth = canvas.width / 2;
    let buttonHeight = 40;

    // "Try Again" Button
    let tryAgainY = canvas.height / 2 + 30;
    if (event.offsetX >= buttonX && event.offsetX <= buttonX + buttonWidth &&
        event.offsetY >= tryAgainY && event.offsetY <= tryAgainY + buttonHeight) {
      resetGame();
    }

    // "Revive" Button (if player has enough coins)
    let reviveY = canvas.height / 2 + 80;
    if (totalCoins >= 10 &&
        event.offsetX >= buttonX && event.offsetX <= buttonX + buttonWidth &&
        event.offsetY >= reviveY && event.offsetY <= reviveY + buttonHeight) {
      reviveGame();
    }
  }
});

function reviveGame() {
  totalCoins -= 10; // Deduct 10 coins
  gameOver = false;
  bird.velocity = 0; // Reset velocity
  bird.y = canvas.height / 2; // Reset bird's position to the middle of the canvas
  isReviving = true; // Set the reviving flag to true
  reviveTimer = 1; // Start the 3-second grace period
}

function resetGame() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  coins = [];
  frame = 0;
  score = 0;
  pipeCount = 0;
  gameOver = false;
  lastAwardedBelt = belts[0];
  playerBelt = belts[0];
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
