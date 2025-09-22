let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let quizStartTime;
let timerInterval;
let timeLimit = 30 * 60; // 30 minutes in seconds

// Load questions and initialize quiz
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data;
    renderQuiz();
    startTimer();
  })
  .catch(error => {
    console.error('Error loading questions:', error);
    document.getElementById("quiz-container").innerHTML = '<p style="color: red;">Error loading questions. Please refresh the page.</p>';
  });

function startTimer() {
  quizStartTime = Date.now();
  const timerElement = document.getElementById('timer');
  
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
    const remaining = Math.max(0, timeLimit - elapsed);
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    timerElement.textContent = `⏰ Waktu: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (remaining === 0) {
      clearInterval(timerInterval);
      autoSubmitQuiz();
    }
  }, 1000);
}

function renderQuiz() {
  const container = document.getElementById("quiz-container");
  const progressContainer = document.getElementById("progress-container");
  
  // Create progress bar
  progressContainer.innerHTML = `
    <div class="progress-container">
      <div class="progress-bar" style="width: 0%"></div>
    </div>
    <div style="text-align: center;">
      <p style="display: inline-block;">Pertanyaan 0 dari ${questions.length}</p>
    </div>
  `;
  
  // Render all questions
  let html = '';
  questions.forEach((q, i) => {
    html += `<div class="question" data-question-id="${q.id}">
      <p><strong>Soal ${i+1}.</strong> ${q.question}</p>`;
    
    if (q.type === "multiple-choice") {
      q.options.forEach(opt => {
        html += `<label>
          <input type="radio" name="q${q.id}" value="${opt}" onchange="updateProgress()">
          <span>${opt}</span>
        </label>`;
      });
    } else if (q.type === "short-answer") {
      html += `<input type="text" id="q${q.id}" placeholder="Ketik jawaban Anda di sini..." onchange="updateProgress()" oninput="updateProgress()">`;
    }
    html += `</div>`;
  });
  
  container.innerHTML = html;
  updateProgress();
}

function updateProgress() {
  let answeredCount = 0;
  
  questions.forEach(q => {
    let hasAnswer = false;
    
    if (q.type === "multiple-choice") {
      const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
      if (selected) {
        userAnswers[q.id] = selected.value;
        hasAnswer = true;
      }
    } else if (q.type === "short-answer") {
      const input = document.getElementById(`q${q.id}`);
      if (input && input.value.trim()) {
        userAnswers[q.id] = input.value.trim();
        hasAnswer = true;
      }
    }
    
    if (hasAnswer) answeredCount++;
  });
  
  // Update progress bar
  const progressBar = document.querySelector('.progress-bar');
  const progressText = document.querySelector('#progress-container p');
  const percentage = (answeredCount / questions.length) * 100;
  
  if (progressBar) {
    progressBar.style.width = percentage + '%';
  }
  
  if (progressText) {
    progressText.textContent = `Pertanyaan dijawab: ${answeredCount} dari ${questions.length}`;
  }
  
  // Enable/disable submit button based on completion
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    if (answeredCount === questions.length) {
      submitBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      submitBtn.innerHTML = '✅ Kumpulkan Jawaban (Semua terisi)';
    } else {
      submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      submitBtn.innerHTML = `📝 Kumpulkan Jawaban (${answeredCount}/${questions.length})`;
    }
  }
}

function submitQuiz() {
  if (Object.keys(userAnswers).length === 0) {
    alert('Anda belum menjawab satupun soal!');
    return;
  }
  
  const confirmed = confirm(`Anda telah menjawab ${Object.keys(userAnswers).length} dari ${questions.length} soal.\n\nApakah Anda yakin ingin mengumpulkan jawaban?`);
  if (!confirmed) return;
  
  calculateAndShowResults();
}

function autoSubmitQuiz() {
  alert('Waktu habis! Jawaban akan dikumpulkan otomatis.');
  calculateAndShowResults();
}

function calculateAndShowResults() {
  clearInterval(timerInterval);
  
  let score = 0;
  let correctAnswers = 0;
  let detailedResults = [];
  
  // Get current user info instead of prompting
  const currentUser = getCurrentUser();
  let studentName = 'Anonymous';
  
  if (currentUser) {
    studentName = currentUser.fullName;
  } else {
    // If no user logged in, prompt for name
    studentName = prompt("Masukkan Nama Siswa:") || "Siswa";
  }
  
  questions.forEach((q, index) => {
    const userAnswer = userAnswers[q.id];
    let isCorrect = false;
    
    if (userAnswer) {
      if (q.type === "multiple-choice") {
        isCorrect = userAnswer === q.answer;
      } else if (q.type === "short-answer") {
        // More flexible checking for short answers
        const userLower = userAnswer.toLowerCase().trim();
        const correctLower = q.answer.toLowerCase().trim();
        isCorrect = userLower.includes(correctLower) || correctLower.includes(userLower);
      }
    }
    
    if (isCorrect) {
      correctAnswers++;
      score += 100 / questions.length; // Score out of 100
    }
    
    detailedResults.push({
      questionNumber: index + 1,
      question: q.question,
      userAnswer: userAnswer || "Tidak dijawab",
      correctAnswer: q.answer,
      isCorrect: isCorrect
    });
  });
  
  // Calculate time taken
  const timeElapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Show results
  const resultElement = document.getElementById("result");
  const finalScore = Math.round(score);
  let grade = '';
  
  if (finalScore >= 90) grade = 'A (Excellent!)';
  else if (finalScore >= 80) grade = 'B (Good!)';
  else if (finalScore >= 70) grade = 'C (Fair)';
  else if (finalScore >= 60) grade = 'D (Poor)';
  else grade = 'E (Fail)';
  
  resultElement.innerHTML = `
    <h2>🎉 Hasil Quiz - ${username}</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
      <div style="background: white; padding: 15px; border-radius: 10px; text-align: center; border: 2px solid #e2e8f0;">
        <h3 style="color: #667eea; margin: 0; font-size: 1rem;">Nilai</h3>
        <p style="font-size: 2.5rem; font-weight: bold; margin: 10px 0; color: #1a202c;">${finalScore}</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 10px; text-align: center; border: 2px solid #e2e8f0;">
        <h3 style="color: #667eea; margin: 0; font-size: 1rem;">Grade</h3>
        <p style="font-size: 1.8rem; font-weight: bold; margin: 10px 0; color: #1a202c;">${grade}</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 10px; text-align: center; border: 2px solid #e2e8f0;">
        <h3 style="color: #667eea; margin: 0; font-size: 1rem;">Benar</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 10px 0; color: #1a202c;">${correctAnswers}/${questions.length}</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 10px; text-align: center; border: 2px solid #e2e8f0;">
        <h3 style="color: #667eea; margin: 0; font-size: 1rem;">Waktu</h3>
        <p style="font-size: 1.8rem; font-weight: bold; margin: 10px 0; color: #1a202c;">${timeString}</p>
      </div>
    </div>
    <button onclick="showDetailedResults()" style="background: #17a2b8; margin: 10px 5px;">📊 Lihat Detail Jawaban</button>
    <button onclick="resetQuiz()" style="background: #28a745; margin: 10px 5px;">🔄 Ulangi Quiz</button>
  `;
  
  // Store results with all necessary data - Get current user info
  const loggedInUser = getCurrentUser();
  const username = loggedInUser ? loggedInUser.fullName : studentName;
  const userRole = loggedInUser ? loggedInUser.role : 'guest';
  
  let scores = JSON.parse(localStorage.getItem("scores")) || [];
  scores.push({ 
    username: username,
    userRole: userRole,
    userId: loggedInUser ? loggedInUser.username : 'anonymous_' + Date.now(),
    score: finalScore, 
    correctAnswers: correctAnswers, 
    totalQuestions: questions.length,
    timeElapsed: timeString,
    date: new Date().toLocaleString('id-ID'),
    detailedResults: detailedResults,
    grade: grade.split(' ')[0] // Just the letter grade
  });
  localStorage.setItem("scores", JSON.stringify(scores));
  
  // Debug log to check if data is saved
  console.log('Quiz results saved:', scores[scores.length - 1]);
  
  // Hide quiz container and show result
  document.getElementById("quiz-container").style.display = 'none';
  document.getElementById("submit-btn").style.display = 'none';
  document.getElementById("progress-container").style.display = 'none';
}

function showDetailedResults() {
  const scores = JSON.parse(localStorage.getItem("scores")) || [];
  const lastResult = scores[scores.length - 1];
  
  if (!lastResult || !lastResult.detailedResults) {
    alert('Detail hasil tidak tersedia.');
    return;
  }
  
  let detailHTML = '<div style="background: white; padding: 20px; border-radius: 15px; margin: 20px 0; max-height: 400px; overflow-y: auto;">';
  detailHTML += '<h3 style="color: #667eea; margin-bottom: 20px;">📋 Detail Jawaban</h3>';
  
  lastResult.detailedResults.forEach(result => {
    const statusIcon = result.isCorrect ? '✅' : '❌';
    const statusColor = result.isCorrect ? '#28a745' : '#dc3545';
    
    detailHTML += `
      <div style="border: 1px solid #e9ecef; border-radius: 10px; padding: 15px; margin: 10px 0; border-left: 4px solid ${statusColor};">
        <p style="margin: 0; font-weight: bold;">${statusIcon} Soal ${result.questionNumber}</p>
        <p style="margin: 5px 0; color: #666;">${result.question}</p>
        <p style="margin: 5px 0;"><strong>Jawaban Anda:</strong> ${result.userAnswer}</p>
        <p style="margin: 5px 0;"><strong>Jawaban Benar:</strong> ${result.correctAnswer}</p>
      </div>
    `;
  });
  
  detailHTML += '</div>';
  
  const resultElement = document.getElementById("result");
  resultElement.innerHTML += detailHTML;
}

function resetQuiz() {
  if (confirm('Apakah Anda yakin ingin mengulang quiz?')) {
    location.reload();
  }
}

// Function to add sample data for testing
function addSampleData() {
  const sampleResults = [
    {
      username: "Andi Pratama",
      userRole: "siswa",
      userId: "andi123", 
      score: 85,
      correctAnswers: 26,
      totalQuestions: 30,
      timeElapsed: "25:30",
      date: new Date().toLocaleString('id-ID'),
      grade: "B",
      detailedResults: []
    },
    {
      username: "Sari Indah",
      userRole: "siswa",
      userId: "sari456",
      score: 92,
      correctAnswers: 28,
      totalQuestions: 30,
      timeElapsed: "22:15",
      date: new Date().toLocaleString('id-ID'),
      grade: "A",
      detailedResults: []
    },
    {
      username: "Budi Santoso",
      userRole: "siswa",
      userId: "budi789",
      score: 78,
      correctAnswers: 23,
      totalQuestions: 30,
      timeElapsed: "28:45",
      date: new Date().toLocaleString('id-ID'),
      grade: "C",
      detailedResults: []
    }
  ];
  
  let scores = JSON.parse(localStorage.getItem("scores")) || [];
  
  // Only add sample data if no student data exists
  const hasStudentData = scores.some(s => s.userRole === 'siswa');
  if (!hasStudentData) {
    scores = scores.concat(sampleResults);
    localStorage.setItem("scores", JSON.stringify(scores));
    console.log('Sample student data added:', sampleResults);
  }
}

// Add sample data on page load for testing
document.addEventListener('DOMContentLoaded', function() {
  addSampleData();
});
