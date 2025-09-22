// Authentication and Authorization System

// Check if user is logged in and has correct role
function checkAuth(requiredRole = null) {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    redirectToLogin();
    return false;
  }
  
  if (requiredRole && currentUser.role !== requiredRole) {
    showAccessDenied();
    return false;
  }
  
  return true;
}

// Get current logged in user
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// Logout user
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// Redirect to login
function redirectToLogin() {
  alert('Anda harus login terlebih dahulu!');
  window.location.href = 'login.html';
}

// Show access denied message
function showAccessDenied() {
  alert('Akses ditolak! Anda tidak memiliki izin untuk mengakses halaman ini.');
  window.location.href = 'index.html';
}

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const username = formData.get('username').trim();
  const password = formData.get('password').trim();
  const role = formData.get('role');
  
  // Validate input
  if (!username || !password || !role) {
    showMessage('loginMessage', 'Semua field harus diisi!', 'error');
    return;
  }
  
  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Check demo accounts first
  const demoAccounts = [
    { username: 'guru', password: 'guru123', role: 'guru', fullName: 'Demo Guru', email: 'guru@demo.com' },
    { username: 'siswa', password: 'siswa123', role: 'siswa', fullName: 'Demo Siswa', email: 'siswa@demo.com' }
  ];
  
  const allUsers = [...demoAccounts, ...users];
  
  // Find user
  const user = allUsers.find(u => 
    (u.username === username || u.email === username) && 
    u.password === password && 
    u.role === role
  );
  
  if (user) {
    // Login successful
    setCurrentUser({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      loginTime: new Date().toISOString()
    });
    
    showMessage('loginMessage', 'Login berhasil! Mengalihkan...', 'success');
    
    // Redirect based on role
    setTimeout(() => {
      if (role === 'guru') {
        window.location.href = 'dashboard.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 1500);
  } else {
    showMessage('loginMessage', 'Username, password, atau role tidak valid!', 'error');
  }
}

// Handle register form submission
function handleRegister(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const fullName = formData.get('fullName').trim();
  const email = formData.get('email').trim();
  const username = formData.get('username').trim();
  const password = formData.get('password').trim();
  const confirmPassword = formData.get('confirmPassword').trim();
  const role = formData.get('role');
  const teacherCode = formData.get('teacherCode')?.trim();
  
  // Validate input
  if (!fullName || !email || !username || !password || !confirmPassword || !role) {
    showMessage('registerMessage', 'Semua field harus diisi!', 'error');
    return;
  }
  
  // Validate password
  if (password.length < 6) {
    showMessage('registerMessage', 'Password minimal 6 karakter!', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showMessage('registerMessage', 'Password tidak cocok!', 'error');
    return;
  }
  
  // Validate teacher code for guru role
  if (role === 'guru' && teacherCode !== 'GURU2025') {
    showMessage('registerMessage', 'Kode guru tidak valid!', 'error');
    return;
  }
  
  // Get existing users
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Check if username or email already exists
  const existingUser = users.find(u => u.username === username || u.email === email);
  if (existingUser) {
    showMessage('registerMessage', 'Username atau email sudah terdaftar!', 'error');
    return;
  }
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    fullName,
    email,
    username,
    password,
    role,
    createdAt: new Date().toISOString()
  };
  
  // Save user
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  showMessage('registerMessage', 'Registrasi berhasil! Mengalihkan ke halaman login...', 'success');
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 2000);
}

// Show message helper
function showMessage(elementId, message, type) {
  const messageEl = document.getElementById(elementId);
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
  }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop();
  
  // Check authentication for protected pages
  if (currentPage === 'dashboard.html') {
    if (!checkAuth('guru')) {
      return;
    }
  }
  
  // Add logout functionality if user is logged in
  addLogoutButton();
  updateNavigation();
});

// Add logout button for logged in users
function addLogoutButton() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  // Create user info and logout button
  const userInfo = document.createElement('div');
  userInfo.className = 'user-info';
  userInfo.innerHTML = `
    <div style="position: fixed; top: 20px; left: 20px; background: rgba(255,255,255,0.95); padding: 10px 15px; border-radius: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); z-index: 1001; font-size: 0.9rem;">
      <span style="color: #667eea; font-weight: 600;">👋 ${currentUser.fullName}</span>
      <span style="color: #4a5568; margin: 0 8px;">|</span>
      <span style="color: #4a5568;">${currentUser.role === 'guru' ? '👨‍🏫 Guru' : '👨‍🎓 Siswa'}</span>
      <button onclick="logout()" style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 15px; margin-left: 10px; cursor: pointer; font-size: 0.8rem;">🚪 Logout</button>
    </div>
  `;
  
  document.body.appendChild(userInfo);
}

// Update navigation based on user role
function updateNavigation() {
  const currentUser = getCurrentUser();
  const navLinks = document.querySelector('.nav-links');
  
  if (!navLinks) return;
  
  // Add dashboard link for teachers
  if (currentUser && currentUser.role === 'guru') {
    const dashboardLink = navLinks.querySelector('a[href="dashboard.html"]');
    if (!dashboardLink) {
      const newDashboardLink = document.createElement('a');
      newDashboardLink.href = 'dashboard.html';
      newDashboardLink.className = 'btn';
      newDashboardLink.style.cssText = 'background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); color: white;';
      newDashboardLink.innerHTML = '📊 Dashboard Guru';
      navLinks.appendChild(newDashboardLink);
    }
  }
  
  // Hide dashboard link for students
  if (currentUser && currentUser.role === 'siswa') {
    const dashboardLink = navLinks.querySelector('a[href="dashboard.html"]');
    if (dashboardLink) {
      dashboardLink.style.display = 'none';
    }
  }
  
  // Add login/register links if not logged in
  if (!currentUser) {
    const loginLink = document.createElement('a');
    loginLink.href = 'login.html';
    loginLink.className = 'btn';
    loginLink.style.cssText = 'background: linear-gradient(135deg, #4c51bf 0%, #667eea 100%); color: white;';
    loginLink.innerHTML = '🔐 Login';
    navLinks.appendChild(loginLink);
    
    const registerLink = document.createElement('a');
    registerLink.href = 'register.html';
    registerLink.className = 'btn';
    registerLink.style.cssText = 'background: linear-gradient(135deg, #38a169 0%, #48bb78 100%); color: white;';
    registerLink.innerHTML = '📝 Register';
    navLinks.appendChild(registerLink);
  }
}