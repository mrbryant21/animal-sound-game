// Game configuration
const ANIMALS = [
  {
    name: "Dog",
    emoji: "🐶",
    sound: "sounds/dog-sound.mp3",
  },
  {
    name: "Cat",
    emoji: "🐱",
    sound: "sounds/cat-sound.mp3",
  },
  {
    name: "Cow",
    emoji: "🐮",
    sound: "https://assets.mixkit.co/active_storage/sfx/1760/1760-preview.mp3",
  },
  {
    name: "Lion",
    emoji: "🦁",
    sound: "https://assets.mixkit.co/active_storage/sfx/1730/1730-preview.mp3",
  },
  {
    name: "Horse",
    emoji: "🐴",
    sound: "https://assets.mixkit.co/active_storage/sfx/1754/1754-preview.mp3",
  },
  {
    name: "Cock/Hen",
    emoji: "🐓",
    sound: "https://assets.mixkit.co/active_storage/sfx/1759/1759-preview.mp3",
  },
  {
    name: "Elephant",
    emoji: "🐘",
    sound: "https://assets.mixkit.co/active_storage/sfx/1737/1737-preview.mp3",
  },
];

const DIFFICULTY_SETTINGS = {
  easy: 3,
  medium: 5,
  hard: 7,
};

// Game state
let currentDifficulty = "easy";
let score = 0;
let timeLeft = 60;
let currentRound = 1;
let currentAnimal = null;
let displayedAnimals = [];
let timerInterval = null;
let audioElement = new Audio();
let streak = 0;
let isPaused = false;

// Difficulty selection
document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll(".difficulty-btn")
      .forEach((b) => b.classList.remove("selected"));
    this.classList.add("selected");
    currentDifficulty = this.dataset.difficulty;
  });
});

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
}

function showStart() {
  showScreen("startScreen");
  stopTimer();
}

function showInstructions() {
  showScreen("instructionsScreen");
}

function startGame() {
  resetGame();
  showScreen("gameScreen");
  nextRound();
  startTimer();
}

function resetGame() {
  score = 0;
  timeLeft = 60;
  currentRound = 1;
  streak = 0;
  isPaused = false;
  updateDisplay();
  updatePauseButton();
  stopTimer();
}

function updateDisplay() {
  document.getElementById("score").textContent = score;
  document.getElementById("timer").textContent = timeLeft;
  document.getElementById("round").textContent = currentRound;

  if (streak > 0) {
    document.getElementById("streakDisplay").style.display = "block";
    document.getElementById("streak").textContent = streak;
  } else {
    document.getElementById("streakDisplay").style.display = "none";
  }
}

function startTimer() {
  // Prevent multiple timers
  stopTimer();

  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 0) {
        endGame();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
function togglePause() {
  isPaused = !isPaused;
  updatePauseButton();

  // Disable/enable animal cards
  const animalCards = document.querySelectorAll(".animal-card");
  animalCards.forEach((card) => {
    if (isPaused) {
      card.style.pointerEvents = "none";
      card.style.opacity = "0.5";
    } else {
      card.style.pointerEvents = "auto";
      card.style.opacity = "1";
    }
  });

  // Disable/enable sound button
  const soundBtn = document.getElementById("soundBtn");
  if (soundBtn) {
    soundBtn.disabled = isPaused;
    soundBtn.style.opacity = isPaused ? "0.5" : "1";
  }
}

function updatePauseButton() {
  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    if (isPaused) {
      pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
  }
}

function nextRound() {
  const numAnimals = DIFFICULTY_SETTINGS[currentDifficulty];

  // Select random animals
  const shuffled = [...ANIMALS].sort(() => Math.random() - 0.5);
  displayedAnimals = shuffled.slice(0, numAnimals);

  // Pick the correct animal
  currentAnimal =
    displayedAnimals[Math.floor(Math.random() * displayedAnimals.length)];

  // Display animals
  const grid = document.getElementById("animalsGrid");
  grid.innerHTML = "";

  displayedAnimals.forEach((animal) => {
    const card = document.createElement("div");
    card.className = "animal-card";
    card.innerHTML = `
          <span class="animal-emoji">${animal.emoji}</span>
          <div class="animal-name">${animal.name}</div>
        `;
    card.onclick = () => checkAnswer(animal);
    grid.appendChild(card);
  });

  // Auto-play sound
  setTimeout(() => playSound(), 500);
}

function playSound() {
  // Prevent sound when paused
  if (isPaused) return;

  if (currentAnimal) {
    audioElement.src = currentAnimal.sound;
    audioElement.play().catch((err) => console.log("Audio play failed:", err));

    const btn = document.getElementById("soundBtn");
    btn.classList.add("bounce");
    setTimeout(() => btn.classList.remove("bounce"), 500);
  }
}

function checkAnswer(selectedAnimal) {
  // Prevent interaction when paused
  if (isPaused) return;

  if (selectedAnimal.name === currentAnimal.name) {
    // Correct answer
    const points = 10 + streak * 2;
    score += points;
    streak++;
    showFeedback("🎉 Great Job! +" + points + " points", true);

    setTimeout(() => {
      currentRound++;
      updateDisplay();
      nextRound();
    }, 1000);
  } else {
    // Wrong answer
    streak = 0;
    showFeedback("😔 Oops! Try Again!", false);
    updateDisplay();

    // Shake the screen
    document.getElementById("gameScreen").classList.add("shake");
    setTimeout(() => {
      document.getElementById("gameScreen").classList.remove("shake");
    }, 500);
  }
}

function showFeedback(message, isCorrect) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.className = "feedback show " + (isCorrect ? "correct" : "incorrect");

  setTimeout(() => {
    feedback.classList.remove("show");
  }, 1000);
}

function endGame() {
  stopTimer();
  document.getElementById("finalScore").textContent = score;
  saveScore(score);
  displayLeaderboard();
  showScreen("gameOverScreen");
}

function saveScore(newScore) {
  let scores = JSON.parse(localStorage.getItem("animalGameScores") || "[]");
  scores.push({
    score: newScore,
    date: new Date().toLocaleDateString(),
    difficulty: currentDifficulty,
  });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 5); // Keep top 5
  localStorage.setItem("animalGameScores", JSON.stringify(scores));
}

function displayLeaderboard() {
  const scores = JSON.parse(localStorage.getItem("animalGameScores") || "[]");
  const list = document.getElementById("leaderboardList");

  if (scores.length === 0) {
    list.innerHTML =
      '<p style="text-align: center; color: #999;">No scores yet!</p>';
    return;
  }

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
  list.innerHTML = scores
    .map(
      (entry, index) => `
        <div class="leaderboard-entry">
          <span><span class="medal">${medals[index]}</span> ${entry.date} (${entry.difficulty})</span>
          <span>${entry.score} pts</span>
        </div>
      `,
    )
    .join("");
}

function restartGame() {
  startGame();
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  showStart();
});
