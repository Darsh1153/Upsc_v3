import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  STATS: 'userStats',
  STREAK: 'streakData',
  TEST_HISTORY: 'testHistory',
  SETTINGS: 'appSettings',
  QUESTION_BANK: 'questionBank',
};

// Default stats structure
const defaultStats = {
  totalTests: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  totalTimeSpent: 0, // in seconds
  topicStats: {}, // { 'Indian Polity': { correct: 10, total: 15 } }
  weeklyData: [], // Last 7 days of scores
};

// Default streak structure
const defaultStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  activeDays: [], // Array of date strings 'YYYY-MM-DD'
};

// Default settings
const defaultSettings = {
  reminderEnabled: false,
  reminderTime: '09:00',
  language: 'English',
};

// ==================== STATS ====================

export const getStats = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STATS);
    return data ? JSON.parse(data) : defaultStats;
  } catch (error) {
    console.error('Error getting stats:', error);
    return defaultStats;
  }
};

export const updateStats = async (testResult) => {
  try {
    const stats = await getStats();
    const { questions, answers, timeTaken } = testResult;

    let correct = 0;
    questions.forEach((q, index) => {
      const isCorrect = answers[index] === q.correct;
      if (isCorrect) correct++;

      // Update topic stats
      const tags = q.systemTags || [];
      tags.forEach(tag => {
        if (!stats.topicStats[tag]) {
          stats.topicStats[tag] = { correct: 0, total: 0 };
        }
        stats.topicStats[tag].total++;
        if (isCorrect) stats.topicStats[tag].correct++;
      });
    });

    stats.totalTests++;
    stats.totalQuestions += questions.length;
    stats.correctAnswers += correct;
    stats.totalTimeSpent += timeTaken;

    // Update weekly data
    const today = new Date().toISOString().split('T')[0];
    const score = Math.round((correct / questions.length) * 100);

    // Keep only last 7 days
    stats.weeklyData = stats.weeklyData.filter(d => {
      const daysDiff = (new Date() - new Date(d.date)) / (1000 * 60 * 60 * 24);
      return daysDiff < 7;
    });

    const todayEntry = stats.weeklyData.find(d => d.date === today);
    if (todayEntry) {
      todayEntry.tests++;
      todayEntry.avgScore = Math.round((todayEntry.avgScore + score) / 2);
    } else {
      stats.weeklyData.push({ date: today, tests: 1, avgScore: score });
    }

    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));

    // Also update streak
    await updateStreak();

    return stats;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
};

// ==================== STREAK ====================

export const getStreak = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STREAK);
    return data ? JSON.parse(data) : defaultStreak;
  } catch (error) {
    console.error('Error getting streak:', error);
    return defaultStreak;
  }
};

export const updateStreak = async () => {
  try {
    const streak = await getStreak();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If already active today, no change
    if (streak.lastActiveDate === today) {
      return streak;
    }

    // Add today to active days
    if (!streak.activeDays.includes(today)) {
      streak.activeDays.push(today);
    }

    // Keep only last 30 days
    streak.activeDays = streak.activeDays.filter(d => {
      const daysDiff = (new Date() - new Date(d)) / (1000 * 60 * 60 * 24);
      return daysDiff < 30;
    });

    // Calculate streak
    if (streak.lastActiveDate === yesterday) {
      // Continuing streak
      streak.currentStreak++;
    } else if (streak.lastActiveDate !== today) {
      // Streak broken, start new
      streak.currentStreak = 1;
    }

    // Update longest streak
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActiveDate = today;

    await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
    return streak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return defaultStreak;
  }
};

export const checkStreakStatus = async () => {
  try {
    const streak = await getStreak();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if streak is still valid
    if (streak.lastActiveDate !== today && streak.lastActiveDate !== yesterday) {
      // Streak is broken
      streak.currentStreak = 0;
      await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
    }

    return streak;
  } catch (error) {
    console.error('Error checking streak:', error);
    return defaultStreak;
  }
};

// ==================== TEST HISTORY ====================

export const getTestHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TEST_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting test history:', error);
    return [];
  }
};

export const saveTestResult = async (result) => {
  try {
    const history = await getTestHistory();
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      questionsCount: result.questions.length,
      correctCount: Object.values(result.answers).filter(
        (ans, idx) => ans === result.questions[idx]?.correct
      ).length,
      timeTaken: result.timeTaken,
      score: Math.round(
        (Object.values(result.answers).filter(
          (ans, idx) => ans === result.questions[idx]?.correct
        ).length / result.questions.length) * 100
      ),
    };

    history.unshift(newEntry); // Add to beginning

    // Keep only last 50 tests
    const trimmed = history.slice(0, 50);

    await AsyncStorage.setItem(KEYS.TEST_HISTORY, JSON.stringify(trimmed));

    // Update stats
    await updateStats(result);

    return newEntry;
  } catch (error) {
    console.error('Error saving test result:', error);
  }
};

// ==================== SETTINGS ====================

export const getSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaultSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
};

export const updateSettings = async (newSettings) => {
  try {
    const settings = await getSettings();
    const updated = { ...settings, ...newSettings };
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error updating settings:', error);
  }
};

// ==================== QUESTION BANK ====================

export const getQuestionBank = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.QUESTION_BANK);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting question bank:', error);
    return [];
  }
};

export const saveToQuestionBank = async (questions, userTags = []) => {
  try {
    const bank = await getQuestionBank();
    const newQuestions = Array.isArray(questions) ? questions : [questions];

    const questionsToSave = newQuestions.map(q => ({
      ...q,
      id: Date.now() + Math.random(),
      userTags,
      savedAt: new Date().toISOString(),
    }));

    await AsyncStorage.setItem(
      KEYS.QUESTION_BANK,
      JSON.stringify([...bank, ...questionsToSave])
    );

    return questionsToSave;
  } catch (error) {
    console.error('Error saving to question bank:', error);
  }
};

// ==================== ESSAY ATTEMPTS ====================

const ESSAY_ATTEMPTS_KEY = 'essay_attempts';

export const getEssayAttempts = async () => {
  try {
    const data = await AsyncStorage.getItem(ESSAY_ATTEMPTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting essay attempts:', error);
    return [];
  }
};

export const saveEssayAttempt = async (essayData) => {
  try {
    const attempts = await getEssayAttempts();
    const newAttempt = {
      id: `essay_${Date.now()}`,
      topic: essayData.topic,
      answerText: essayData.answerText,
      score: essayData.score,
      evaluation: essayData.evaluation,
      wordCount: essayData.wordCount,
      createdAt: new Date().toISOString(),
    };

    attempts.unshift(newAttempt); // Add to beginning

    // Keep only last 50 attempts
    const trimmed = attempts.slice(0, 50);

    await AsyncStorage.setItem(ESSAY_ATTEMPTS_KEY, JSON.stringify(trimmed));
    return newAttempt;
  } catch (error) {
    console.error('Error saving essay attempt:', error);
    throw error;
  }
};

export const getEssayAttempt = async (id) => {
  try {
    const attempts = await getEssayAttempts();
    return attempts.find(attempt => attempt.id === id);
  } catch (error) {
    console.error('Error getting essay attempt:', error);
    return null;
  }
};

export const deleteEssayAttempt = async (id) => {
  try {
    const attempts = await getEssayAttempts();
    const filtered = attempts.filter(attempt => attempt.id !== id);
    await AsyncStorage.setItem(ESSAY_ATTEMPTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting essay attempt:', error);
    return false;
  }
};

// ==================== CLEAR DATA ====================

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([...Object.values(KEYS), ESSAY_ATTEMPTS_KEY]);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

