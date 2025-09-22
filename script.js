let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let quizStartTime;
let timerInterval;
let timeLimit = 30 * 60; // 30 minutes in seconds

// Initialize cloud manager when available
let cloudManager = null;
document.addEventListener('DOMContentLoaded', function() {
  if (window.CloudDataManager) {
    cloudManager = new CloudDataManager();
    console.log('🌐 Cloud manager initialized');
  }
  addSampleData();
});

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

function testSubmit() {
  console.log('=== TEST SUBMIT ===');
  console.log('Questions:', questions);
  console.log('User Answers:', userAnswers);
  console.log('Submit button exists:', !!document.getElementById('submit-btn'));
  console.log('Result container exists:', !!document.getElementById('result'));
  
  // Add a test answer if none exist
  if (Object.keys(userAnswers).length === 0 && questions.length > 0) {
    userAnswers[questions[0].id] = questions[0].type === 'multiple-choice' ? 'A' : 'test';
    console.log('Added test answer:', userAnswers);
  }
  
  // Try to submit
  submitQuiz();
}

function submitQuiz() {
  console.log('Submit quiz called');
  console.log('User answers:', userAnswers);
  console.log('Questions loaded:', questions.length);
  
  if (Object.keys(userAnswers).length === 0) {
    alert('Anda belum menjawab satupun soal!');
    return;
  }
  
  const confirmed = confirm(`Anda telah menjawab ${Object.keys(userAnswers).length} dari ${questions.length} soal.\n\nApakah Anda yakin ingin mengumpulkan jawaban?`);
  if (!confirmed) return;
  
  console.log('Proceeding to calculate results...');
  calculateAndShowResults();
}

function autoSubmitQuiz() {
  alert('Waktu habis! Jawaban akan dikumpulkan otomatis.');
  calculateAndShowResults();
}

function calculateAndShowResults() {
  console.log('Calculate and show results called');
  clearInterval(timerInterval);
  
  let score = 0;
  let correctAnswers = 0;
  let detailedResults = [];
  
  // Get current user info safely with fallback
  let currentUser = null;
  let studentName = 'Anonymous';
  
  try {
    if (typeof getCurrentUser === 'function') {
      currentUser = getCurrentUser();
      console.log('Current user:', currentUser);
    }
  } catch (error) {
    console.warn('Auth function not available:', error);
  }
  
  if (currentUser) {
    studentName = currentUser.fullName;
  } else {
    // If no user logged in, prompt for name
    studentName = prompt("Masukkan Nama Siswa:") || "Siswa";
  }
  
  console.log('Student name:', studentName);
  
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
  
  // Store results with all necessary data - Get current user info safely
  let loggedInUser = null;
  try {
    if (typeof getCurrentUser === 'function') {
      loggedInUser = getCurrentUser();
    }
  } catch (error) {
    console.warn('Auth function not available for saving:', error);
  }
  
  const username = loggedInUser ? loggedInUser.fullName : studentName;
  
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
  const userRole = loggedInUser ? loggedInUser.role : 'guest';
  
  let scores = JSON.parse(localStorage.getItem("scores")) || [];
  const resultData = { 
    username: username,
    userRole: userRole,
    userId: loggedInUser ? loggedInUser.username : 'anonymous_' + Date.now(),
    score: finalScore, 
    correctAnswers: correctAnswers, 
    totalQuestions: questions.length,
    timeElapsed: timeString,
    date: new Date().toLocaleString('id-ID'),
    detailedResults: detailedResults,
    grade: grade.split(' ')[0], // Just the letter grade
    serverSource: window.location.hostname || 'localhost'
  };
  
  scores.push(resultData);
  console.log('Final score:', finalScore);
  console.log('Grade:', grade);
  console.log('Saving to localStorage...');
  
  localStorage.setItem("scores", JSON.stringify(scores));
  
  // Save to cloud if available
  if (cloudManager) {
    cloudManager.saveResultToCloud(resultData).then(result => {
      console.log('☁️ Cloud save result:', result);
      if (result.success) {
        showCloudSyncStatus('success', 'Data berhasil disimpan ke cloud');
      } else {
        showCloudSyncStatus('warning', 'Data disimpan lokal, akan sync otomatis');
      }
    }).catch(error => {
      console.error('Cloud save error:', error);
      showCloudSyncStatus('error', 'Gagal sync ke cloud, data tersimpan lokal');
    });
  } else {
    console.log('Cloud manager not available, data saved locally only');
    showCloudSyncStatus('warning', 'Offline mode - data tersimpan lokal');
  }
  
  // Debug log to check if data is saved
  console.log('Quiz results saved:', scores[scores.length - 1]);
  
  // Hide quiz container and show result
  try {
    const quizContainer = document.getElementById("quiz-container");
    const submitBtn = document.getElementById("submit-btn");
    const progressContainer = document.getElementById("progress-container");
    const resultContainer = document.getElementById("result");
    
    if (quizContainer) quizContainer.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'none';
    
    if (resultContainer) {
      resultContainer.style.display = 'block';
      console.log('Results displayed successfully');
    } else {
      console.error('Result container not found!');
    }
  } catch (error) {
    console.error('Error hiding/showing elements:', error);
  }
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

// Add sample data on page load for testing - moved to DOMContentLoaded above

// Cloud sync status display
function showCloudSyncStatus(type, message) {
  const statusEl = document.getElementById('cloud-sync-status');
  if (!statusEl) {
    // Create status element if doesn't exist
    const status = document.createElement('div');
    status.id = 'cloud-sync-status';
    status.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 15px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      max-width: 300px;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(status);
  }
  
  const status = document.getElementById('cloud-sync-status');
  
  // Set colors based on type
  const colors = {
    success: '#28a745',
    warning: '#ffc107', 
    error: '#dc3545'
  };
  
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  status.style.backgroundColor = colors[type] || '#6c757d';
  status.innerHTML = `${icons[type] || 'ℹ️'} ${message}`;
  
  // Show animation
  setTimeout(() => {
    status.style.opacity = '1';
    status.style.transform = 'translateX(0)';
  }, 100);
  
  // Hide after 5 seconds
  setTimeout(() => {
    status.style.opacity = '0';
    status.style.transform = 'translateX(100%)';
  }, 5000);
}
