// js/history.js - Score history management

function getQuizHistory() {
  return JSON.parse(localStorage.getItem('dlQuizHistory') || '[]');
}

function addQuizResult(result) {
  const history = getQuizHistory();
  history.unshift(result);
  
  // Keep only last 50
  if (history.length > 50) {
    history.length = 50;
  }
  
  localStorage.setItem('dlQuizHistory', JSON.stringify(history));
}

function clearQuizHistory() {
  localStorage.removeItem('dlQuizHistory');
}

function getStats() {
  const history = getQuizHistory();
  
  if (history.length === 0) {
    return {
      totalAttempts: 0,
      bestScore: 0,
      avgScore: 0,
      passRate: 0
    };
  }
  
  const passed = history.filter(s => s.passed).length;
  const scores = history.map(s => s.score);
  
  return {
    totalAttempts: history.length,
    bestScore: Math.max(...scores),
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    passRate: Math.round((passed / history.length) * 100)
  };
}