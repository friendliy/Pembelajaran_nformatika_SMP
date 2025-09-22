let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let quizStartTime;
let timerInterval;
let timeLimit = 30 * 60; // 30 minutes in seconds

// Initialize cloud manager when available
let cloudManager = null;

// Ensure all functions are properly defined and accessible globally
window.loadSampleQuestions = loadSampleQuestions;
window.loadQuestions = loadQuestions;
window.debugQuizSystem = debugQuizSystem;
window.submitQuiz = submitQuiz;
window.testSubmit = testSubmit;
window.updateProgress = updateProgress;
window.showDetailedResults = showDetailedResults;
window.resetQuiz = resetQuiz;
window.clearAllAnswers = clearAllAnswers;
window.addTestAnswers = addTestAnswers;

// Initialize immediately when script loads
(function() {
  console.log('Script.js initializing...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeQuiz);
  } else {
    // DOM already loaded
    setTimeout(initializeQuiz, 100);
  }
})();

function initializeQuiz() {
  console.log('Initializing quiz system...');
  
  if (window.CloudDataManager) {
    cloudManager = new CloudDataManager();
    console.log('🌐 Cloud manager initialized');
  }
  
  addSampleData();
  
  // Auto-load sample questions after a delay if container exists
  setTimeout(function() {
    console.log('Checking if auto-load needed...');
    const container = document.getElementById("quiz-container");
    if (container && questions.length === 0) {
      console.log('Auto-loading sample questions...');
      loadSampleQuestions();
    }
  }, 1500);
}

// Load questions function

async function loadQuestions() {
  console.log('=== Loading questions from JSON file ===');
  
  const container = document.getElementById("quiz-container");
  if (!container) {
    console.error('Quiz container not found! Retrying...');
    setTimeout(loadQuestions, 1000);
    return;
  }
  
  // Show loading state
  container.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 3rem; margin-bottom: 20px;">⏳</div>
      <p style="font-size: 1.2rem; color: #667eea;">Memuat soal dari file JSON...</p>
    </div>
  `;
  
  try {
    console.log('Attempting to fetch questions.json...');
    const response = await fetch("questions.json");
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully loaded from questions.json:', data.length, 'questions');
    
    if (!data || data.length === 0) {
      throw new Error('File JSON kosong atau tidak berisi soal');
    }
    
    questions = data;
    setTimeout(() => {
      renderQuiz();
      startTimer();
      console.log('✅ Quiz from JSON rendered successfully!');
    }, 500);
    
  } catch (fetchError) {
    console.warn('❌ Fetch failed:', fetchError.message);
    
    // Show fallback options
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 2rem; margin-bottom: 20px;">⚠️</div>
        <p style="color: #dc3545; font-size: 1.1rem; margin-bottom: 10px;">Tidak dapat memuat file questions.json</p>
        <p style="color: #666; margin-bottom: 20px;">Error: ${fetchError.message}</p>
        <div>
          <button onclick="loadQuestions()" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
            🔄 Coba Lagi
          </button>
          <button onclick="loadSampleQuestions()" style="background: #17a2b8; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
            📝 Gunakan Soal Demo
          </button>
        </div>
        <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
          <p>💡 Tips: Pastikan file questions.json ada dan dapat diakses</p>
        </div>
      </div>
    `;
  }
}

function loadSampleQuestions() {
  console.log('=== Loading sample questions ===');
  
  const container = document.getElementById("quiz-container");
  if (!container) {
    console.error('Quiz container not found! Retrying in 1 second...');
    setTimeout(loadSampleQuestions, 1000);
    return;
  }
  
  // Show loading state
  container.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 3rem; margin-bottom: 20px;">📝</div>
      <p style="font-size: 1.2rem; color: #667eea;">Memuat soal demo...</p>
    </div>
  `;
  
  try {
    questions = getSampleQuestions();
    console.log('Sample questions loaded:', questions.length, 'questions');
    
    if (questions.length > 0) {
      setTimeout(() => {
        renderQuiz();
        startTimer();
        console.log('✅ Quiz rendered and timer started!');
      }, 500);
    } else {
      throw new Error('No sample questions available');
    }
  } catch (error) {
    console.error('❌ Error loading sample questions:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: red; font-size: 1.2rem; margin-bottom: 15px;">❌ Error: ${error.message}</p>
        <button onclick="loadSampleQuestions()" style="background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
          🔄 Coba Lagi
        </button>
        <button onclick="location.reload()" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
          🔄 Refresh Halaman
        </button>
      </div>
    `;
  }
}

function getSampleQuestions() {
  console.log('Getting sample questions...');
  const sampleQuestions = [
    {
      "id": 1,
      "type": "multiple-choice",
      "question": "Apa kepanjangan dari CPU?",
      "options": ["Central Processing Unit", "Control Program Utility", "Computer Primary Unit", "Central Program Unit"],
      "answer": "Central Processing Unit"
    },
    {
      "id": 2,
      "type": "multiple-choice",
      "question": "Perangkat lunak sistem operasi yang dikembangkan oleh Microsoft adalah?",
      "options": ["Linux", "Windows", "macOS", "Android"],
      "answer": "Windows"
    },
    {
      "id": 3,
      "type": "multiple-choice",
      "question": "Bahasa pemrograman yang dikembangkan oleh Google untuk aplikasi Android adalah?",
      "options": ["Java", "Python", "Kotlin", "JavaScript"],
      "answer": "Kotlin"
    },
    {
      "id": 4,
      "type": "short-answer",
      "question": "Sebutkan nama browser web yang dikembangkan oleh Google!",
      "answer": "Chrome"
    },
    {
      "id": 5,
      "type": "multiple-choice",
      "question": "Protokol yang digunakan untuk transfer file di internet adalah?",
      "options": ["HTTP", "FTP", "SMTP", "POP3"],
      "answer": "FTP"
    }
  ];
  
  console.log('Sample questions created:', sampleQuestions.length);
  return sampleQuestions;
}

// Debug function to check system status
function debugQuizSystem() {
  console.log('=== QUIZ SYSTEM DEBUG ===');
  console.log('Questions loaded:', questions.length);
  console.log('User answers:', Object.keys(userAnswers).length);
  console.log('Quiz container exists:', !!document.getElementById("quiz-container"));
  console.log('Progress container exists:', !!document.getElementById("progress-container"));
  console.log('Timer element exists:', !!document.getElementById("timer"));
  console.log('Submit button exists:', !!document.getElementById("submit-btn"));
  console.log('Result container exists:', !!document.getElementById("result"));
  console.log('Document ready state:', document.readyState);
  console.log('Current questions:', questions);
  console.log('Current answers:', userAnswers);
  console.log('Timer running:', !!timerInterval);
  
  // Show alert with summary
  alert(`📊 Quiz System Status:
  
✅ Questions: ${questions.length} loaded
✅ Answers: ${Object.keys(userAnswers).length} provided
✅ Timer: ${timerInterval ? 'Running' : 'Stopped'}
✅ Submit button: ${document.getElementById("submit-btn") ? 'Available' : 'Missing'}

Check console for detailed info.`);
  
  return 'Debug info logged to console';
}

// Function to clear all answers
function clearAllAnswers() {
  if (confirm('🗑️ Apakah Anda yakin ingin menghapus semua jawaban?\n\nTindakan ini tidak dapat dibatalkan.')) {
    console.log('Clearing all answers...');
    
    // Clear userAnswers object
    userAnswers = {};
    
    // Clear all radio button selections
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    // Clear all text inputs
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => input.value = '');
    
    // Update progress
    updateProgress();
    
    console.log('All answers cleared');
    alert('✅ Semua jawaban telah dihapus!');
  }
}

// Function to add answers for testing
function addTestAnswers() {
  if (!questions || questions.length === 0) {
    alert('❌ Tidak ada soal yang dimuat!');
    return;
  }
  
  console.log('Adding test answers...');
  
  questions.forEach((q, index) => {
    if (q.type === "multiple-choice") {
      // Select first option for multiple choice
      const firstOption = q.options[0];
      userAnswers[q.id] = firstOption;
      
      // Check the radio button
      const radio = document.querySelector(`input[name="q${q.id}"][value="${firstOption}"]`);
      if (radio) radio.checked = true;
      
    } else if (q.type === "short-answer") {
      // Use correct answer for short answer
      userAnswers[q.id] = q.answer;
      
      // Fill the text input
      const input = document.getElementById(`q${q.id}`);
      if (input) input.value = q.answer;
    }
  });
  
  updateProgress();
  console.log('Test answers added:', userAnswers);
  alert(`✅ ${questions.length} jawaban test telah ditambahkan!`);
}

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
  console.log('Rendering quiz...');
  
  const container = document.getElementById("quiz-container");
  const progressContainer = document.getElementById("progress-container");
  
  if (!container) {
    console.error('Quiz container not found!');
    return;
  }
  
  if (!progressContainer) {
    console.error('Progress container not found!');
    return;
  }
  
  if (!questions || questions.length === 0) {
    console.error('No questions to render!');
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: red;">❌ Tidak ada soal untuk ditampilkan</p>
        <button onclick="loadSampleQuestions()" style="background: #17a2b8; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          📝 Muat Soal Demo
        </button>
      </div>
    `;
    return;
  }
  
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
  console.log('Quiz HTML rendered, updating progress...');
  updateProgress();
  console.log('Quiz rendering complete!');
}

function updateProgress() {
  console.log('Updating progress...');
  
  if (!questions || questions.length === 0) {
    console.warn('No questions available for progress update');
    return;
  }
  
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
  
  // Update submit button - make it always available but change appearance
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    if (answeredCount === questions.length) {
      submitBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      submitBtn.innerHTML = '✅ Kumpulkan Jawaban (Semua terisi)';
      submitBtn.disabled = false;
    } else if (answeredCount > 0) {
      submitBtn.style.background = 'linear-gradient(135deg, #ffc107 0%, #ffcd39 100%)';
      submitBtn.innerHTML = `⚠️ Kumpulkan Jawaban (${answeredCount}/${questions.length})`;
      submitBtn.disabled = false;
    } else {
      submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      submitBtn.innerHTML = `📝 Kumpulkan Jawaban (${answeredCount}/${questions.length})`;
      submitBtn.disabled = false; // Allow submission even with no answers for testing
    }
  }
  
  console.log(`Progress updated: ${answeredCount}/${questions.length} answered`);
}

function testSubmit() {
  console.log('=== TEST SUBMIT CALLED ===');
  console.log('Questions:', questions);
  console.log('User Answers:', userAnswers);
  console.log('Submit button exists:', !!document.getElementById('submit-btn'));
  console.log('Result container exists:', !!document.getElementById('result'));
  
  // Add a test answer if none exist
  if (Object.keys(userAnswers).length === 0 && questions.length > 0) {
    const firstQuestion = questions[0];
    userAnswers[firstQuestion.id] = firstQuestion.type === 'multiple-choice' ? firstQuestion.options[0] : 'test answer';
    console.log('Added test answer:', userAnswers);
  }
  
  // Try to submit
  submitQuiz();
}

function submitQuiz() {
  console.log('=== SUBMIT QUIZ CALLED ===');
  console.log('Questions available:', questions.length);
  console.log('User answers:', Object.keys(userAnswers).length);
  console.log('Current answers:', userAnswers);
  
  if (!questions || questions.length === 0) {
    alert('⚠️ Tidak ada soal yang dimuat!\n\nSilakan muat soal terlebih dahulu dengan klik "Mulai Quiz Demo" atau "Muat Soal Lengkap".');
    return;
  }
  
  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = questions.length;
  
  if (answeredCount === 0) {
    const proceed = confirm('⚠️ Anda belum menjawab satupun soal!\n\nApakah Anda yakin ingin mengumpulkan jawaban kosong?\n\n(Klik Cancel untuk melanjutkan mengerjakan)');
    if (!proceed) return;
  } else if (answeredCount < totalQuestions) {
    const proceed = confirm(`⚠️ Anda baru menjawab ${answeredCount} dari ${totalQuestions} soal.\n\nSoal yang belum dijawab akan dianggap salah.\n\nApakah Anda yakin ingin mengumpulkan jawaban sekarang?\n\n(Klik Cancel untuk melanjutkan mengerjakan)`);
    if (!proceed) return;
  } else {
    const proceed = confirm(`✅ Anda telah menjawab semua ${totalQuestions} soal.\n\nApakah Anda yakin ingin mengumpulkan jawaban?`);
    if (!proceed) return;
  }
  
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
