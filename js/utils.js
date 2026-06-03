/**
 * NEPAL DRIVING LICENSE MCQ - UTILITIES
 * Language toggle, theme toggle, and helper functions
 */

// ========================================
// LANGUAGE SYSTEM
// ========================================
function initLanguage() {
  const savedLang = localStorage.getItem('lang') || 'en';
  applyLanguage(savedLang);
  updateLanguageButtons(savedLang);
}

function applyLanguage(lang) {
  localStorage.setItem('lang', lang);
  
  // Update all elements with data-en/data-np attributes
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.dataset[lang];
  });
  
  // Apply Nepali font
  if (lang === 'np') {
    document.body.classList.add('lang-np');
    document.body.style.fontFamily = "'Noto Sans Devanagari', sans-serif";
  } else {
    document.body.classList.remove('lang-np');
    document.body.style.fontFamily = "'Inter', sans-serif";
  }
}

function updateLanguageButtons(lang) {
  document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
    if (btn.dataset.lang === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguage);
} else {
  initLanguage();
}

// ========================================
// THEME SYSTEM
// ========================================
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Initialize theme
initTheme();

// ========================================
// DATE UTILITIES
// ========================================
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

// ========================================
// STORAGE UTILITIES
// ========================================
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getFromStorage(key, defaultValue = null) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
}

function clearFromStorage(key) {
  localStorage.removeItem(key);
}

// ========================================
// DEBUGGING
// ========================================
function log(message, data = null) {
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('netlify')) {
    console.log(`[DL Nepal] ${message}`, data || '');
  }
}