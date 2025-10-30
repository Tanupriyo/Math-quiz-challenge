// Audio for feedback
const soundCorrect = new Audio('data:audio/wav;base64,UklGRjwAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAD//w==');
const soundWrong = new Audio('data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw==');
const soundTimeUp = new Audio('data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAD///8=');

let questions = [], currentQuestion = {}, playerScore = 0, questionNumber = 0, totalQuestions = 10;
let timerInterval, timerStartTime = 0, avatarEmoji = "", playerName = "", selectedMode = "", selectedDifficulty = "";
let answersTime = [], answerReviewVisible = false, practiceMode = false, spellingMode = false;
let confettiActive = false;

// Helper to get elements
const $ = id => document.getElementById(id);
const avatars = document.querySelectorAll(".avatar");
const timerBar = document.querySelector('.timer-fill');

// Initialize avatar selection
avatars.forEach(av => {
  av.addEventListener('click', () => {
    avatars.forEach(a => a.classList.remove("selected"));
    av.classList.add("selected");
    avatarEmoji = av.textContent;
  });
});

// Sound toggle state
let soundOn = true;
function playSound(sound) {
  if (soundOn) sound.play().catch(e => console.log("Audio play failed:", e));
}

// Sound toggle button
const soundToggleBtn = document.createElement("button");
soundToggleBtn.textContent = "🔊";
soundToggleBtn.style.marginBottom = "12px";
soundToggleBtn.style.fontSize = "1.2rem";
$("setup").insertBefore(soundToggleBtn, $("startBtn"));
soundToggleBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggleBtn.textContent = soundOn ? "🔊" : "🔇";
});

// Answer Review toggle button
const answerReviewToggleBtn = document.createElement("button");
answerReviewToggleBtn.textContent = "👁️ Show Answers";
answerReviewToggleBtn.style.display = "none";
answerReviewToggleBtn.style.margin = "10px 0";
$("resultArea").insertBefore(answerReviewToggleBtn, $("answerList"));
answerReviewToggleBtn.addEventListener('click', () => {
  answerReviewVisible = !answerReviewVisible;
  answerReviewToggleBtn.textContent = answerReviewVisible ? "👁️ Hide Answers" : "👁️ Show Answers";
  updateAnswerList();
});

// Performance summary container
const performanceSummary = document.createElement("div");
performanceSummary.id = "performanceSummary";
performanceSummary.style.textAlign = "left";
performanceSummary.style.margin = "15px 0";
performanceSummary.style.fontWeight = "bold";
performanceSummary.style.fontSize = "1.1rem";
performanceSummary.style.display = "none";
$("resultArea").insertBefore(performanceSummary, $("printBtn"));

// Animated avatar reaction
function animateAvatarReaction(correct) {
  const avatarDiv = $("avatarDisplay");
  if (!avatarDiv) return;
  avatarDiv.style.transition = "transform 0.3s ease";
  avatarDiv.style.display = "inline-block";

  if (correct) {
    avatarDiv.textContent = `${avatarEmoji} 🎉 ${playerName}`;
    avatarDiv.style.transform = "rotate(10deg)";
    setTimeout(() => {
      avatarDiv.style.transform = "rotate(-10deg)";
      setTimeout(() => {
        avatarDiv.style.transform = "rotate(0deg)";
        avatarDiv.textContent = `${avatarEmoji} ${playerName}`;
      }, 150);
    }, 150);
  } else {
    avatarDiv.textContent = `${avatarEmoji} 😢 ${playerName}`;
    avatarDiv.style.transform = "translateX(10px)";
    setTimeout(() => {
      avatarDiv.style.transform = "translateX(-10px)";
      setTimeout(() => {
        avatarDiv.style.transform = "translateX(0)";
        avatarDiv.textContent = `${avatarEmoji} ${playerName}`;
      }, 150);
    }, 150);
  }
}

// Spelling math helper (convert number to words for 1-20)
const numberWords = ["zero","one","two","three","four","five","six","seven","eight","nine","ten",
"eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty"];

function numberToWords(num) {
  if(num >= 0 && num <= 20) return numberWords[num];
  return num.toString();
}

// Generate spelling question text
function generateSpellingQuestion(n1, n2, op) {
  const w1 = numberToWords(n1);
  const w2 = numberToWords(n2);
  const opWord = op === "+" ? "plus" : op === "-" ? "minus" : "times";
  return `What is ${w1} ${opWord} ${w2}?`;
}

// Generate spelling mode question
function generateSpellingQuestionObj(max) {
  let n1 = rand(1, max), n2 = rand(1, max);
  let op = ["+", "-", "×"][rand(0, 2)];
  if (op === "-" && n1 < n2) [n1, n2] = [n2, n1];
  if (op === "×" && n2 > 10) n2 = rand(1, 10); // Keep multiplication simpler for spelling

  const q = generateSpellingQuestion(n1, n2, op);
  const ans = op === "+" ? n1 + n2 : op === "-" ? n1 - n2 : n1 * n2;
  return { q, ans };
}

function startGame() {
  playerScore = 0; questionNumber = 0; questions = []; answersTime = [];
  playerName = $("playerName").value.trim();
  selectedMode = $("mode").value;
  selectedDifficulty = $("difficulty").value;
  practiceMode = selectedMode === "practice";
  spellingMode = selectedMode === "spelling";

  const max = selectedDifficulty === "medium" ? 20 : selectedDifficulty === "hard" ? 50 : 10;
  totalQuestions = practiceMode ? 9999 : selectedMode === "boss" ? 5 : 10;

  for (let i = 0; i < totalQuestions; i++) {
    if (spellingMode) {
      questions.push(generateSpellingQuestionObj(max));
    } else if (Math.random() < 0.3) {
      questions.push(generateWordProblem(max, selectedMode));
    } else {
      questions.push(generateNormalQuestion(max, selectedMode));
    }
  }

  $("feedback").textContent = "";
  $("hintArea").textContent = "";
  answerReviewVisible = false;
  answerReviewToggleBtn.style.display = "none";
  performanceSummary.style.display = "none";
  $("answerList").innerHTML = "";
  showQuestion();
}

function generateNormalQuestion(max, mode) {
  let n1 = rand(1, max), n2 = rand(1, max);
  let op = ["+", "-", "×"][rand(0, 2)];
  if (mode === "multiplication") op = "×";
  if (op === "-" && n1 < n2) [n1, n2] = [n2, n1];

  const ans = op === "+" ? n1 + n2 : op === "-" ? n1 - n2 : n1 * n2;
  return { q: `${n1} ${op} ${n2}`, ans, op };
}

function generateWordProblem(max, mode) {
  let n1 = rand(1, max), n2 = rand(1, max);
  if (mode === "boss") {
    n1 = rand(Math.floor(max / 2), max);
    n2 = rand(Math.floor(max / 2), max);
  }

  const types = ["addition", "subtraction", "multiplication"];
  let type = mode === "multiplication" ? "multiplication" : types[rand(0, 2)];
  let q = "", ans = 0;

  if (type === "addition") {
    q = `Tanu has ${n1} apples. His father gave him ${n2} more. How many apples does Tanu have now?`;
    ans = n1 + n2;
  } else if (type === "subtraction") {
    if (n1 < n2) [n1, n2] = [n2, n1];
    q = `Tanu had ${n1} candies. He gave away ${n2}. How many candies are left?`;
    ans = n1 - n2;
  } else {
    q = `If Tanu has ${n1} boxes and each box has ${n2} pencils, how many pencils does he have in total?`;
    ans = n1 * n2;
  }

  return { q, ans, op: type === "addition" ? "+" : type === "subtraction" ? "-" : "×" };
}

function showQuestion() {
  if (questionNumber >= totalQuestions) return endGame();

  currentQuestion = questions[questionNumber];
  $("questionArea").textContent = `Q${questionNumber + 1}: ${currentQuestion.q}`;
  $("answerInput").value = "";
  $("feedback").textContent = "";
  $("hintArea").textContent = "";
  $("answerInput").focus();

  // Show hint button only if not practice mode or spelling mode
  $("hintBtn").style.display = practiceMode || spellingMode ? "none" : "inline-block";

  // Start timer if not practice or spelling mode
  if (!practiceMode && !spellingMode) {
    let time = 10;
    if (selectedDifficulty === "medium") time = 15;
    else if (selectedDifficulty === "hard") time = 20;

    if (currentQuestion.q.includes("Tanu")) time = 30; // word problems get 30s

    startTimer(time);
  } else {
    clearInterval(timerInterval);
    timerBar.style.width = "100%";
    timerBar.style.backgroundColor = "#4caf50";
  }

  timerStartTime = Date.now();
}

function startTimer(seconds) {
  clearInterval(timerInterval);
  let timeLeft = seconds;
  updateTimerBar(timeLeft, seconds);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerBar(timeLeft, seconds);

    if (timeLeft <= 3) {
      timerBar.style.backgroundColor = "red";
    } else {
      timerBar.style.backgroundColor = "#4caf50";
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      $("feedback").textContent = `⏰ Time's up! Correct: ${currentQuestion.ans}`;
      playSound(soundTimeUp);
      questions[questionNumber].user = null;
      answersTime.push(seconds);
      questionNumber++;
      setTimeout(showQuestion, 1500);
    }
  }, 1000);
}

function updateTimerBar(timeLeft, totalTime) {
  const percentage = (timeLeft / totalTime) * 100;
  timerBar.style.width = `${percentage}%`;
}

function submitAnswer() {
  if (practiceMode) {
    // Practice mode - no timer, infinite questions, no score
    const val = parseInt($("answerInput").value);
    if (isNaN(val)) {
      $("feedback").textContent = "Enter a number!";
      $("answerInput").focus();
      return;
    }
    if (val === currentQuestion.ans) {
      $("feedback").textContent = "✅ Correct!";
      playSound(soundCorrect);
      animateAvatarReaction(true);
    } else {
      $("feedback").textContent = `❌ Wrong! Correct: ${currentQuestion.ans}`;
      playSound(soundWrong);
      animateAvatarReaction(false);
    }
    questionNumber++;
    setTimeout(showQuestion, 1500);
    return;
  }

  clearInterval(timerInterval);
  const userValRaw = $("answerInput").value.trim();

  // In spelling mode, answer can be number or words
  let val;
  if (spellingMode) {
    if (!userValRaw) {
      $("feedback").textContent = "Enter your answer!";
      $("answerInput").focus();
      return;
    }
    if (/^\d+$/.test(userValRaw)) {
      val = parseInt(userValRaw);
    } else {
      // Try to convert spelled number words back to number
      val = numberWords.indexOf(userValRaw.toLowerCase());
      if (val === -1) val = NaN;
    }
  } else {
    val = parseInt(userValRaw);
  }

  if (isNaN(val)) {
    $("feedback").textContent = "Enter a valid number!";
    $("answerInput").focus();
    return;
  }

  if (val === currentQuestion.ans) {
    $("feedback").textContent = "✅ Correct!";
    playerScore++;
    playSound(soundCorrect);
    animateAvatarReaction(true);
  } else {
    $("feedback").textContent = `❌ Wrong! Correct: ${currentQuestion.ans}`;
    playSound(soundWrong);
    animateAvatarReaction(false);
  }
  questions[questionNumber].user = val;
  answersTime.push((Date.now() - timerStartTime) / 1000);
  questionNumber++;

  setTimeout(showQuestion, 1500);
}

function endGame() {
  clearInterval(timerInterval);
  $("gameArea").classList.add("hidden");
  $("resultArea").classList.remove("hidden");
  $("finalScore").textContent = `${playerName}, you scored ${playerScore} / ${totalQuestions}`;

  updateAnswerList();
  answerReviewToggleBtn.style.display = "inline-block";
  performanceSummary.style.display = "block";
  updatePerformanceSummary();

  // Trigger confetti if score > 80%
  if ((playerScore / totalQuestions) > 0.8) {
    triggerConfetti();
  }
  // Show badges
  showAchievementBadges();
}

function updateAnswerList() {
  $("answerList").innerHTML = questions.map((q, i) => {
    const userAns = q.user === null || q.user === undefined ? "No answer" : q.user;
    const correct = userAns == q.ans;
    if (answerReviewVisible || correct) {
      return `<li>Q${i + 1}: ${q.q} = Your answer: ${userAns} ${correct ? "✅" : `❌ (Correct: ${q.ans})`}</li>`;
    } else {
      return `<li>Q${i + 1}: ${q.q}</li>`;
    }
  }).join("");
}

function updatePerformanceSummary() {
  const totalAnswered = questions.filter(q => q.user !== null && q.user !== undefined).length;
  const accuracy = totalQuestions ? (playerScore / totalQuestions) * 100 : 0;
  const avgTime = answersTime.length > 0 ? (answersTime.reduce((a,b) => a+b,0)/answersTime.length).toFixed(2) : "N/A";

  // Find hardest question type by average correctness
  let typeStats = {};
  questions.forEach(q => {
    const type = q.op || "word";
    if (!typeStats[type]) typeStats[type] = { correct:0, total:0 };
    if (q.user === q.ans) typeStats[type].correct++;
    typeStats[type].total++;
  });

  let hardestType = "N/A";
  let hardestPercent = 100;
  for (const type in typeStats) {
    let percent = 100 - ((typeStats[type].correct / typeStats[type].total)*100);
    if (percent > hardestPercent) continue;
    hardestPercent = percent;
    hardestType = type === "+" ? "Addition" : type === "-" ? "Subtraction" : type === "×" ? "Multiplication" : "Word Problem";
  }

  performanceSummary.innerHTML = `
    <p>Accuracy: ${accuracy.toFixed(1)}%</p>
    <p>Average Time per Question: ${avgTime} seconds</p>
    <p>Hardest Question Type: ${hardestType}</p>
  `;
}

function showAchievementBadges() {
  // Clear previous badges
  let existingBadges = document.querySelectorAll(".badge");
  existingBadges.forEach(b => b.remove());

  const container = document.createElement("div");
  container.style.margin = "10px 0";
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.gap = "15px";

  // 100% accuracy badge 🎯
  if (playerScore === totalQuestions) {
    const badge = createBadge("🎯", "100% Accuracy");
    container.appendChild(badge);
  }

  // All answered before time ⏱️
  const allAnsweredBeforeTime = answersTime.length === totalQuestions && answersTime.every(t => t < 15);
  if (allAnsweredBeforeTime) {
    const badge = createBadge("⏱️", "All answered before time");
    container.appendChild(badge);
  }

  // Completed Boss Mode 💪
  if (selectedMode === "boss" && playerScore >= totalQuestions) {
    const badge = createBadge("💪", "Completed Boss Mode");
    container.appendChild(badge);
  }

  if (container.childElementCount > 0) {
    $("resultArea").insertBefore(container, $("finalScore").nextSibling);
  }
}

function createBadge(emoji, text) {
  const div = document.createElement("div");
  div.classList.add("badge");
  div.title = text;
  div.style.fontSize = "2rem";
  div.style.border = "2px solid orange";
  div.style.borderRadius = "50%";
  div.style.width = "50px";
  div.style.height = "50px";
  div.style.display = "flex";
  div.style.justifyContent = "center";
  div.style.alignItems = "center";
  div.style.color = "orange";
  div.style.userSelect = "none";
  div.textContent = emoji;
  return div;
}

// Confetti effect
async function triggerConfetti() {
  if (confettiActive) return;
  confettiActive = true;
  const duration = 4000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function frame() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      confettiActive = false;
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));

    requestAnimationFrame(frame);
  }
  frame();
}

function downloadCertificate() {
  $("resultArea").classList.add("hidden");
  $("certificate").style.display = "block";
  document.querySelector('.game-container').classList.add('certificate-visible');
  $("certName").textContent = playerName;
  $("certScore").textContent = `${playerScore} out of ${totalQuestions}`;
  $("certId").textContent = `${new Date().toISOString().slice(0,10)}-${Math.floor(Math.random() * 10000)}`;

  // Use html2canvas to export as image
  setTimeout(() => {
    html2canvas($("certificate")).then(canvas => {
      const link = document.createElement("a");
      link.download = `${playerName}_MathQuiz_Certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }, 300);
}

// Random int helper
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Bubble generation - bubbles float up in background
function createBubble() {
  const b = document.createElement("div");
  b.classList.add("bubble");
  const size = Math.random() * 30 + 20 + "px";
  b.style.width = size;
  b.style.height = size;
  b.style.left = Math.random() * (window.innerWidth - 40) + "px";
  b.style.background = `hsl(${Math.random() * 360}, 70%, 80%)`;
  b.style.animationDuration = 5 + Math.random() * 5 + "s";
  document.getElementById("bubble-container").appendChild(b);
  setTimeout(() => b.remove(), 10000);
}

// Generate bubbles every 500ms
setInterval(createBubble, 500);

// Event listeners
$("startBtn").addEventListener('click', () => {
  if (!$("playerName").value.trim()) return alert("Enter your name.");
  if (!avatarEmoji) return alert("Choose an avatar.");
  playerName = $("playerName").value.trim();

  if (playerName.toLowerCase() === "oiia cat") {
    $("setup").classList.add("hidden");
    $("youtubePlayer").style.display = "block";
    $("youtubePlayer").innerHTML = `<iframe width="100%" height="150" src="https://www.youtube.com/embed/IxX_QHay02M?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    return;
  }

  $("setup").classList.add("hidden");
  $("gameArea").classList.remove("hidden");
  $("avatarDisplay").textContent = `${avatarEmoji} ${playerName}`;
  $("certificate").style.display = "none";
  $("youtubePlayer").style.display = "none";

  startGame();
});

$("submitBtn").addEventListener('click', submitAnswer);
$("printBtn").addEventListener('click', downloadCertificate);
$("playAgainBtn").addEventListener('click', () => {
  document.querySelector('.game-container').classList.remove('certificate-visible');
  location.reload();
});

$("hintBtn").addEventListener('click', () => {
  const hintArea = $("hintArea");
  if (!currentQuestion) return;
  let hint = "";

  if (currentQuestion.op === "+") hint = "Remember: addition means putting together!";
  else if (currentQuestion.op === "-") hint = "Remember: subtraction is taking away!";
  else if (currentQuestion.op === "×") hint = "Multiplication means repeated addition!";
  else hint = "Think carefully and use your math skills!";

  if (currentQuestion.op === "-") {
    // Visual clue with apples for subtraction if possible
    const parts = currentQuestion.q.match(/(\d+)/g);
    if (parts && parts.length >= 2) {
      const left = Math.min(parseInt(parts[0]), 10);
      const right = Math.min(parseInt(parts[1]), 10);
      hint += ` Example: ${"🍎".repeat(left)} ➖ ${"🍎".repeat(right)}`;
    }
  }
  hintArea.textContent = hint;
});
