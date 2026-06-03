/**
 * NEPAL DRIVING LICENSE MCQ - QUIZ ENGINE
 * Complete quiz logic with timer, answers, and local storage
 */

// ========================================
// GLOBAL STATE
// ========================================
const quizState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  timer: null,
  timeRemaining: 1800,
  category: 'a',
  mode: 'exam',
  isQuizComplete: false,
  lang: localStorage.getItem('lang') || 'en'
};

// Initialize theme immediately
const savedTheme = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initializeQuiz();
  setupEventListeners();
  setupLangToggle();
  setupThemeToggle();
  setupMobileMenu();
  applyLanguage(quizState.lang);
  updateLangButtons(quizState.lang);
});

function initializeQuiz() {
  const urlParams = new URLSearchParams(window.location.search);
  quizState.category = urlParams.get('cat') || 'a';
  quizState.mode = urlParams.get('mode') || 'exam';
  updateBadges();
  checkSavedQuiz();
}

function updateBadges() {
  const categoryBadge = document.getElementById('category-badge');
  const modeBadge = document.getElementById('mode-badge');
  if (categoryBadge) categoryBadge.textContent = quizState.category === 'a' ? 'Category A (Motorcycle)' : 'Category B (Car)';
  if (modeBadge) modeBadge.textContent = quizState.mode === 'exam' ? 'Exam Mode' : 'Practice Mode';
  if (quizState.mode === 'practice') {
    const timerParent = document.getElementById('timer');
    if (timerParent) timerParent.parentElement.style.display = 'none';
  }
}

// ========================================
// LOAD QUESTIONS
// ========================================
function loadQuestions() {
  return fetch('data/questions.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    })
    .then(data => {
      const categoryQuestions = data.questions.filter(q => q.category === quizState.category);
      if (categoryQuestions.length === 0) {
        showError('No questions found for this category. Please check the questions file.');
        return;
      }
      const shuffled = shuffleArray(categoryQuestions);
      quizState.questions = shuffled.slice(0, Math.min(25, shuffled.length));
      setTimeout(() => {
        const skeleton = document.getElementById('loading-skeleton');
        const container = document.getElementById('quiz-container');
        if (skeleton) skeleton.style.display = 'none';
        if (container) container.style.display = 'block';
       showQuestion(quizState.currentQuestionIndex || 0);
        if (quizState.mode === 'exam') startTimer();
      }, 500);
    })
    .catch(error => {
      console.error('Error loading questions:', error);
      showError('Failed to load questions. Please make sure you are running this on a server (not opening the file directly).');
    });
}

function showError(message) {
  const skeleton = document.getElementById('loading-skeleton');
  if (skeleton) {
    skeleton.innerHTML = `
      <div style="text-align:center; padding:2rem; color:var(--error);">
        <div style="font-size:3rem; margin-bottom:1rem;">⚠️</div>
        <h3>Error Loading Quiz</h3>
        <p style="margin-top:0.5rem; color:var(--text-muted);">${message}</p>
        <button onclick="window.location.reload()" style="margin-top:1rem; padding:0.75rem 1.5rem; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer;">
          Retry
        </button>
      </div>
    `;
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ========================================
// SHOW QUESTION
// ========================================
function showQuestion(index) {
  if (!quizState.questions.length) return;
  quizState.currentQuestionIndex = index;
  const question = quizState.questions[index];

  // Scroll to top of question card smoothly
  const questionCard = document.querySelector('.question-card');
  if (questionCard) {
    questionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const questionNumber = document.getElementById('question-number');
  if (questionNumber) questionNumber.textContent =
    `${quizState.lang === 'en' ? 'Question' : 'प्रश्न'} ${index + 1} / ${quizState.questions.length}`;

  const difficultyBadge = document.getElementById('difficulty-badge');
  if (difficultyBadge) {
    const difficultyText = {
      'easy':   quizState.lang === 'en' ? 'Easy'   : 'सजिलो',
      'medium': quizState.lang === 'en' ? 'Medium' : 'मध्यम',
      'hard':   quizState.lang === 'en' ? 'Hard'   : 'कठिन'
    };
    difficultyBadge.textContent = difficultyText[question.difficulty] || question.difficulty;
  }

  const questionText = document.getElementById('question-text');
  if (questionText) questionText.textContent = question[`question_${quizState.lang}`] || question.question_en;

  const questionImage = document.getElementById('question-image');
  if (questionImage) {
    if (question.image) {
      questionImage.src = question.image;
      questionImage.style.display = 'block';
    } else {
      questionImage.style.display = 'none';
    }
  }

  showOptions(question);
  updateProgressBar();
  updateQuestionGrid();
  updateNavigationButtons();

  const explanation = document.getElementById('explanation');
  if (quizState.answers[question.id] !== undefined && quizState.mode === 'practice') {
    showExplanation(question);
  } else {
    if (explanation) explanation.style.display = 'none';
  }

  saveQuizProgress();
}

function showOptions(question) {
  const container = document.getElementById('options-container');
  if (!container) return;
  container.innerHTML = '';

  const optionsEn = question.options_en || [];
  const optionsNp = question.options_np || [];

  optionsEn.forEach((option, index) => {
    const isSelected = quizState.answers[question.id] === index;
    const isCorrect = index === question.correct;
    const selectedAnswer = quizState.answers[question.id];

    let className = 'option';
    if (isSelected) className += ' selected';

    if (quizState.mode === 'practice' && selectedAnswer !== undefined) {
      if (isCorrect) className += ' correct';
      else if (isSelected && !isCorrect) className += ' wrong';
    }

    const optionText = quizState.lang === 'np' && optionsNp[index]
      ? optionsNp[index]
      : optionsEn[index];

    const optionElement = document.createElement('div');
    optionElement.className = className;
    optionElement.dataset.index = index;
    optionElement.innerHTML = `
      <span class="option__badge">${String.fromCharCode(65 + index)}</span>
      <span>${optionText}</span>
    `;
    optionElement.addEventListener('click', () => selectOption(question.id, index, question));
    container.appendChild(optionElement);
  });
}

function selectOption(questionId, selectedIndex, question) {
  quizState.answers[questionId] = selectedIndex;
  showOptions(question);
  if (quizState.mode === 'practice') showExplanation(question);
  updateProgressBar();
  updateQuestionGrid();
  saveQuizProgress();
}

function showExplanation(question) {
  const explanation = document.getElementById('explanation');
  const explanationText = document.getElementById('explanation-text');
  if (!explanation || !explanationText) return;
  const text = question[`explanation_${quizState.lang}`] || question.explanation_en || '';
  explanationText.textContent = text;
  explanation.style.display = 'block';
}

// ========================================
// TIMER
// ========================================
function startTimer() {
  const timerElement = document.getElementById('timer');
  if (!timerElement) return;

  quizState.timer = setInterval(() => {
    quizState.timeRemaining--;
    const minutes = Math.floor(quizState.timeRemaining / 60);
    const seconds = quizState.timeRemaining % 60;
    timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (quizState.timeRemaining <= 300) {
      timerElement.style.color = 'var(--error)';
      timerElement.style.fontWeight = '800';
    }
    if (quizState.timeRemaining <= 0) {
      clearInterval(quizState.timer);
      autoSubmitQuiz();
    }
  }, 1000);
}

function stopTimer() {
  if (quizState.timer) clearInterval(quizState.timer);
}

function autoSubmitQuiz() {
  stopTimer();
  quizState.isQuizComplete = true;
  let correctCount = 0;
  quizState.questions.forEach(question => {
    if (quizState.answers[question.id] === question.correct) correctCount++;
  });
  saveResult(correctCount);
  const passed = correctCount >= 20;
  const timeTaken = 1800 - quizState.timeRemaining;
  window.location.href = `results.html?score=${correctCount}&total=${quizState.questions.length}&passed=${passed}&time=${timeTaken}&category=${quizState.category}`;
}

// ========================================
// PROGRESS
// ========================================
function updateProgressBar() {
  const answeredCount = Object.keys(quizState.answers).length;
  const total = quizState.questions.length || 1;
  const progress = (answeredCount / total) * 100;
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = `${progress}%`;
}

function updateQuestionGrid() {
  const grid = document.getElementById('question-grid');
  if (!grid) return;
  grid.innerHTML = '';
  quizState.questions.forEach((question, index) => {
    const dot = document.createElement('div');
    const isAnswered = quizState.answers[question.id] !== undefined;
    const isCurrent = index === quizState.currentQuestionIndex;
    dot.style.cssText = `
      width:12px; height:12px; border-radius:50%; cursor:pointer; flex-shrink:0;
      background:${isAnswered ? 'var(--success)' : 'var(--border)'};
      border:${isCurrent ? '2px solid var(--primary)' : '2px solid transparent'};
      transition: all 0.2s;
    `;
    dot.title = `Question ${index + 1}`;
    dot.addEventListener('click', () => showQuestion(index));
    grid.appendChild(dot);
  });
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  if (!prevBtn || !nextBtn || !submitBtn) return;

  prevBtn.disabled = quizState.currentQuestionIndex === 0;
  const isLast = quizState.currentQuestionIndex === quizState.questions.length - 1;
  nextBtn.style.display = isLast ? 'none' : 'inline-flex';
  submitBtn.style.display = isLast ? 'inline-flex' : 'none';
}

// ========================================
// NAVIGATION EVENT LISTENERS
// ========================================
function setupEventListeners() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');

  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (quizState.currentQuestionIndex > 0)
      showQuestion(quizState.currentQuestionIndex - 1);
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1)
      showQuestion(quizState.currentQuestionIndex + 1);
  });

  if (submitBtn) submitBtn.addEventListener('click', submitQuiz);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && quizState.currentQuestionIndex > 0)
      showQuestion(quizState.currentQuestionIndex - 1);
    else if (e.key === 'ArrowRight' && quizState.currentQuestionIndex < quizState.questions.length - 1)
      showQuestion(quizState.currentQuestionIndex + 1);
  });

  window.addEventListener('beforeunload', (e) => {
    if (!quizState.isQuizComplete && Object.keys(quizState.answers).length > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ========================================
// SUBMIT QUIZ
// ========================================
function submitQuiz() {
  const msg = quizState.lang === 'en'
    ? 'Submit quiz and see results?'
    : 'प्रश्नोत्तर submit गर्नु र परिणाम हेर्नुहोस्?';
  if (!confirm(msg)) return;

  stopTimer();
  quizState.isQuizComplete = true;

  let correctCount = 0;
  quizState.questions.forEach(question => {
    if (quizState.answers[question.id] === question.correct) correctCount++;
  });

  saveResult(correctCount);

  const passed = correctCount >= 20;
  const timeTaken = 1800 - quizState.timeRemaining;
  window.location.href = `results.html?score=${correctCount}&total=${quizState.questions.length}&passed=${passed}&time=${timeTaken}&category=${quizState.category}`;
}

// ========================================
// LOCAL STORAGE
// ========================================
function saveQuizProgress() {
  const progress = {
    questions: quizState.questions.map(q => q.id),
    currentQuestionIndex: quizState.currentQuestionIndex,
    answers: quizState.answers,
    timeRemaining: quizState.timeRemaining,
    category: quizState.category,
    mode: quizState.mode,
    timestamp: Date.now()
  };
  try { localStorage.setItem('dlQuizProgress', JSON.stringify(progress)); } catch(e) {}
}

function checkSavedQuiz() {
  const saved = localStorage.getItem('dlQuizProgress');
  if (!saved) { loadQuestions(); return; }

  let progress;
  try { progress = JSON.parse(saved); } catch(e) {
    localStorage.removeItem('dlQuizProgress');
    loadQuestions();
    return;
  }

  const hoursPassed = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
  if (hoursPassed > 24 || progress.category !== quizState.category) {
    localStorage.removeItem('dlQuizProgress');
    loadQuestions();
    return;
  }

  const msg = quizState.lang === 'en'
    ? 'Continue your previous quiz?'
    : 'अघिल्लो प्रश्नोत्तर जारी राख्नुहोस्?';

  if (confirm(msg)) {
    quizState.answers = progress.answers || {};
    quizState.currentQuestionIndex = progress.currentQuestionIndex || 0;
    quizState.timeRemaining = progress.timeRemaining || 1800;
    loadQuestions();
  } else {
    localStorage.removeItem('dlQuizProgress');
    loadQuestions();
  }
}

function saveResult(correctCount) {
  const result = {
    date: new Date().toISOString(),
    score: correctCount,
    total: quizState.questions.length,
    percentage: Math.round((correctCount / quizState.questions.length) * 100),
    passed: correctCount >= 20,
    category: quizState.category,
    timeTaken: 1800 - quizState.timeRemaining,
    mode: quizState.mode
  };
  try {
    const history = JSON.parse(localStorage.getItem('dlQuizHistory') || '[]');
    history.unshift(result);
    if (history.length > 50) history.length = 50;
    localStorage.setItem('dlQuizHistory', JSON.stringify(history));
  } catch(e) {}
}

// ========================================
// LANGUAGE
// ========================================
function applyLanguage(lang) {
  quizState.lang = lang;
  try { localStorage.setItem('lang', lang); } catch(e) {}

  document.querySelectorAll('[data-en]').forEach(el => {
    const text = el.dataset[lang];
    if (text) el.textContent = text;
  });

  document.body.classList.toggle('lang-np', lang === 'np');

  if (quizState.questions.length > 0) {
    showQuestion(quizState.currentQuestionIndex);
  }
}

function updateLangButtons(lang) {
  document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function setupLangToggle() {
  document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      updateLangButtons(lang);
      applyLanguage(lang);
    });
  });
}

// ========================================
// THEME
// ========================================
function setupThemeToggle() {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  const current = document.documentElement.getAttribute('data-theme');
  btn.textContent = current === 'dark' ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('theme', next); } catch(e) {}
  });
}

// ========================================
// MOBILE MENU
// ========================================
function setupMobileMenu() {
  const toggle = document.querySelector('.navbar__toggle');
  const menu = document.querySelector('.navbar__menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    menu.classList.toggle('open', !isOpen);
    menu.style.display = isOpen ? '' : 'flex';
  });
}

// ========================================
// MOBILE AD
// ========================================
window.addEventListener('load', () => {
  const mobileAd = document.getElementById('mobile-ad');
  if (mobileAd && window.innerWidth <= 768) {
    mobileAd.style.display = 'block';
  }
});