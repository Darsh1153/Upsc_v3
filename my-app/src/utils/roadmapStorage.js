import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOPIC_STATUS, REVISION_STATUS } from '../data/roadmapData';

const KEYS = {
  USER_PREFERENCES: '@upsc_user_preferences',
  TOPIC_PROGRESS: '@upsc_topic_progress',
  DAILY_PLAN: '@upsc_daily_plan',
  WEEKLY_PLAN: '@upsc_weekly_plan',
  STUDY_SESSIONS: '@upsc_study_sessions',
  CUSTOM_SOURCES: '@upsc_custom_sources',
  ACHIEVEMENTS: '@upsc_achievements',
};

// ==================== USER PREFERENCES ====================

const defaultPreferences = {
  // Attempt Details
  previousAttempts: 0,
  targetYear: new Date().getFullYear() + 1,
  targetExam: 'CSE', // CSE, IFoS, Both
  isWorkingProfessional: false,
  availableHoursDaily: 6,
  preferredTimeSlots: ['morning', 'evening'], // morning, afternoon, evening, night

  // Customization
  optionalSubject: null,
  interestAreas: [],
  studyStyle: 'balanced', // reading, videos, notes, balanced
  darkMode: false,
  language: 'English',

  // Reminders
  dailyReminderEnabled: true,
  dailyReminderTime: '07:00',
  revisionRemindersEnabled: true,
  mockTestRemindersEnabled: true,
  currentAffairsReminderEnabled: true,

  // Performance Goals
  dailyTargetHours: 6,
  weeklyCompletionTarget: 80, // percentage
  mockTestsPerWeek: 2,
  monthlyRevisionTarget: 4, // topics

  // Privacy
  cloudSyncEnabled: false,
  lastBackup: null,

  // Onboarding
  onboardingCompleted: false,
  setupCompletedAt: null,
};

export const getUserPreferences = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
    if (data) {
      return { ...defaultPreferences, ...JSON.parse(data) };
    }
    return defaultPreferences;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return defaultPreferences;
  }
};

export const saveUserPreferences = async (preferences) => {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

// ==================== TOPIC PROGRESS ====================

const defaultTopicProgress = {
  status: TOPIC_STATUS.PENDING,
  revisionStatus: REVISION_STATUS.NOT_STARTED,
  completedSubtopics: [],
  completedSources: [],
  hoursStudied: 0,
  startedAt: null,
  completedAt: null,
  lastStudiedAt: null,
  revisionDates: [],
  notes: '',
  customSources: [],
  testScores: [],
};

export const getTopicProgress = async (topicId) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TOPIC_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};
    return allProgress[topicId] || { ...defaultTopicProgress };
  } catch (error) {
    console.error('Error getting topic progress:', error);
    return { ...defaultTopicProgress };
  }
};

export const getAllTopicProgress = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TOPIC_PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting all topic progress:', error);
    return {};
  }
};

export const updateTopicProgress = async (topicId, updates) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TOPIC_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};
    
    const currentProgress = allProgress[topicId] || { ...defaultTopicProgress };
    allProgress[topicId] = { 
      ...currentProgress, 
      ...updates,
      lastStudiedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(KEYS.TOPIC_PROGRESS, JSON.stringify(allProgress));
    return true;
  } catch (error) {
    console.error('Error updating topic progress:', error);
    return false;
  }
};

export const markSubtopicComplete = async (topicId, subtopicId, topics = []) => {
  try {
    const progress = await getTopicProgress(topicId);
    if (!progress.completedSubtopics.includes(subtopicId)) {
      progress.completedSubtopics.push(subtopicId);
    }
    
    // Auto-update status
    const topic = topics.find(t => t.id === topicId);
    if (topic && progress.completedSubtopics.length === topic.subtopics.length) {
      progress.status = TOPIC_STATUS.COMPLETED;
      progress.completedAt = new Date().toISOString();
    } else if (progress.completedSubtopics.length > 0) {
      progress.status = TOPIC_STATUS.IN_PROGRESS;
      if (!progress.startedAt) {
        progress.startedAt = new Date().toISOString();
      }
    }
    
    return await updateTopicProgress(topicId, progress);
  } catch (error) {
    console.error('Error marking subtopic complete:', error);
    return false;
  }
};

export const markSourceComplete = async (topicId, sourceIndex) => {
  try {
    const progress = await getTopicProgress(topicId);
    if (!progress.completedSources.includes(sourceIndex)) {
      progress.completedSources.push(sourceIndex);
    }
    return await updateTopicProgress(topicId, progress);
  } catch (error) {
    console.error('Error marking source complete:', error);
    return false;
  }
};

export const updateRevisionStatus = async (topicId, revisionStatus) => {
  try {
    const progress = await getTopicProgress(topicId);
    progress.revisionStatus = revisionStatus;
    progress.revisionDates.push({
      status: revisionStatus,
      date: new Date().toISOString(),
    });
    return await updateTopicProgress(topicId, progress);
  } catch (error) {
    console.error('Error updating revision status:', error);
    return false;
  }
};

// ==================== DAILY & WEEKLY PLANS ====================

export const getDailyPlan = async (date) => {
  try {
    const dateKey = date || new Date().toISOString().split('T')[0];
    const data = await AsyncStorage.getItem(KEYS.DAILY_PLAN);
    const allPlans = data ? JSON.parse(data) : {};
    return allPlans[dateKey] || { tasks: [], completed: [], notes: '' };
  } catch (error) {
    console.error('Error getting daily plan:', error);
    return { tasks: [], completed: [], notes: '' };
  }
};

export const saveDailyPlan = async (date, plan) => {
  try {
    const dateKey = date || new Date().toISOString().split('T')[0];
    const data = await AsyncStorage.getItem(KEYS.DAILY_PLAN);
    const allPlans = data ? JSON.parse(data) : {};
    allPlans[dateKey] = plan;
    await AsyncStorage.setItem(KEYS.DAILY_PLAN, JSON.stringify(allPlans));
    return true;
  } catch (error) {
    console.error('Error saving daily plan:', error);
    return false;
  }
};

export const getWeeklyPlan = async (weekStart) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.WEEKLY_PLAN);
    const allPlans = data ? JSON.parse(data) : {};
    return allPlans[weekStart] || { goals: [], topics: [], notes: '' };
  } catch (error) {
    console.error('Error getting weekly plan:', error);
    return { goals: [], topics: [], notes: '' };
  }
};

export const saveWeeklyPlan = async (weekStart, plan) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.WEEKLY_PLAN);
    const allPlans = data ? JSON.parse(data) : {};
    allPlans[weekStart] = plan;
    await AsyncStorage.setItem(KEYS.WEEKLY_PLAN, JSON.stringify(allPlans));
    return true;
  } catch (error) {
    console.error('Error saving weekly plan:', error);
    return false;
  }
};

// ==================== STUDY SESSIONS ====================

export const logStudySession = async (session) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STUDY_SESSIONS);
    const sessions = data ? JSON.parse(data) : [];
    
    const newSession = {
      id: Date.now().toString(),
      ...session,
      timestamp: new Date().toISOString(),
    };
    
    sessions.push(newSession);
    await AsyncStorage.setItem(KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
    
    // Update topic hours
    if (session.topicId && session.duration) {
      const progress = await getTopicProgress(session.topicId);
      progress.hoursStudied = (progress.hoursStudied || 0) + (session.duration / 60);
      await updateTopicProgress(session.topicId, progress);
    }
    
    return true;
  } catch (error) {
    console.error('Error logging study session:', error);
    return false;
  }
};

export const getStudySessions = async (days = 30) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STUDY_SESSIONS);
    const sessions = data ? JSON.parse(data) : [];
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return sessions.filter(s => new Date(s.timestamp) > cutoff);
  } catch (error) {
    console.error('Error getting study sessions:', error);
    return [];
  }
};

export const getTotalStudyHours = async (days = 30) => {
  const sessions = await getStudySessions(days);
  return sessions.reduce((total, s) => total + (s.duration || 0), 0) / 60;
};

// ==================== ACHIEVEMENTS ====================

export const getAchievements = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : {
      topicsCompleted: 0,
      revisionsCompleted: 0,
      studyStreak: 0,
      longestStreak: 0,
      totalHoursStudied: 0,
      testsCompleted: 0,
      badges: [],
    };
  } catch (error) {
    console.error('Error getting achievements:', error);
    return {};
  }
};

export const updateAchievements = async (updates) => {
  try {
    const current = await getAchievements();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error updating achievements:', error);
    return false;
  }
};

// ==================== ANALYTICS ====================

export const getRoadmapStats = async (topics = []) => {
  try {
    const allProgress = await getAllTopicProgress();
    
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let totalHours = 0;
    let estimatedHours = 0;
    
    topics.forEach(topic => {
      const progress = allProgress[topic.id];
      estimatedHours += topic.estimatedHours || 0;
      
      if (progress) {
        totalHours += progress.hoursStudied || 0;
        
        if (progress.status === TOPIC_STATUS.COMPLETED) {
          completed++;
        } else if (progress.status === TOPIC_STATUS.IN_PROGRESS) {
          inProgress++;
        } else {
          pending++;
        }
      } else {
        pending++;
      }
    });
    
    return {
      totalTopics: topics.length,
      completed,
      inProgress,
      pending,
      completionPercentage: topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0,
      totalHoursStudied: Math.round(totalHours),
      estimatedTotalHours: estimatedHours,
      hoursRemaining: Math.max(0, estimatedHours - totalHours),
    };
  } catch (error) {
    console.error('Error getting roadmap stats:', error);
    return {};
  }
};

export const getWeakestTopics = async (topics = []) => {
  try {
    const allProgress = await getAllTopicProgress();
    
    const topicsWithScores = topics.map(topic => {
      const progress = allProgress[topic.id] || {};
      const scores = progress.testScores || [];
      const avgScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : null;
      
      return {
        ...topic,
        avgScore,
        progress,
      };
    }).filter(t => t.avgScore !== null && t.avgScore < 60);
    
    return topicsWithScores.sort((a, b) => a.avgScore - b.avgScore).slice(0, 5);
  } catch (error) {
    console.error('Error getting weakest topics:', error);
    return [];
  }
};

// ==================== AUTO-GENERATE PLANS ====================

export const generateDailyPlan = async (topics = []) => {
  try {
    const preferences = await getUserPreferences();
    const allProgress = await getAllTopicProgress();
    
    const availableHours = preferences.availableHoursDaily || 6;
    const tasks = [];
    let plannedHours = 0;
    
    // Get topics in priority order
    const sortedTopics = [...topics].sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Add topics that are in progress first
    for (const topic of sortedTopics) {
      if (plannedHours >= availableHours) break;
      
      const progress = allProgress[topic.id] || {};
      
      if (progress.status === TOPIC_STATUS.IN_PROGRESS) {
        const incompleteSubtopics = topic.subtopics.filter(
          st => !progress.completedSubtopics?.includes(st.id)
        );
        
        for (const subtopic of incompleteSubtopics) {
          if (plannedHours + subtopic.estimatedHours <= availableHours) {
            tasks.push({
              id: `${topic.id}_${subtopic.id}`,
              topicId: topic.id,
              subtopicId: subtopic.id,
              topicName: topic.name,
              subtopicName: subtopic.name,
              estimatedHours: subtopic.estimatedHours,
              type: 'study',
              completed: false,
            });
            plannedHours += subtopic.estimatedHours;
          }
        }
      }
    }
    
    // Add pending topics if there's room
    for (const topic of sortedTopics) {
      if (plannedHours >= availableHours) break;
      
      const progress = allProgress[topic.id] || {};
      
      if (progress.status === TOPIC_STATUS.PENDING || !progress.status) {
        const firstSubtopic = topic.subtopics[0];
        if (firstSubtopic && plannedHours + firstSubtopic.estimatedHours <= availableHours) {
          tasks.push({
            id: `${topic.id}_${firstSubtopic.id}`,
            topicId: topic.id,
            subtopicId: firstSubtopic.id,
            topicName: topic.name,
            subtopicName: firstSubtopic.name,
            estimatedHours: firstSubtopic.estimatedHours,
            type: 'study',
            completed: false,
          });
          plannedHours += firstSubtopic.estimatedHours;
        }
      }
    }
    
    // Add revision tasks
    const needsRevision = sortedTopics.filter(topic => {
      const progress = allProgress[topic.id] || {};
      if (progress.revisionStatus === REVISION_STATUS.NOT_STARTED && 
          progress.status === TOPIC_STATUS.COMPLETED) {
        return true;
      }
      // Check if due for next revision based on last revision date
      const lastRevision = progress.revisionDates?.slice(-1)[0];
      if (lastRevision) {
        const daysSinceRevision = (Date.now() - new Date(lastRevision.date)) / (1000 * 60 * 60 * 24);
        return daysSinceRevision >= 7;
      }
      return false;
    });
    
    if (needsRevision.length > 0 && plannedHours < availableHours) {
      const revisionTopic = needsRevision[0];
      tasks.push({
        id: `revision_${revisionTopic.id}`,
        topicId: revisionTopic.id,
        topicName: revisionTopic.name,
        estimatedHours: Math.min(1, availableHours - plannedHours),
        type: 'revision',
        completed: false,
      });
    }
    
    // Add current affairs
    if (plannedHours < availableHours) {
      tasks.push({
        id: 'ca_daily',
        topicName: 'Current Affairs',
        subtopicName: "Today's News & Analysis",
        estimatedHours: Math.min(1, availableHours - plannedHours),
        type: 'current_affairs',
        completed: false,
      });
    }
    
    return { tasks, totalPlannedHours: plannedHours };
  } catch (error) {
    console.error('Error generating daily plan:', error);
    return { tasks: [], totalPlannedHours: 0 };
  }
};

// ==================== REVISION SCHEDULE ====================

export const getRevisionSchedule = async (topics = []) => {
  try {
    const allProgress = await getAllTopicProgress();
    const schedule = [];
    
    // 1-1-7-15 revision rule
    const revisionIntervals = [1, 1, 7, 15];
    
    for (const topic of topics) {
      const progress = allProgress[topic.id];
      
      if (progress?.status === TOPIC_STATUS.COMPLETED && 
          progress.completedAt) {
        
        const completedDate = new Date(progress.completedAt);
        const revisionCount = progress.revisionDates?.length || 0;
        
        if (revisionCount < revisionIntervals.length) {
          let nextRevisionDate = new Date(completedDate);
          let totalDays = 0;
          
          for (let i = 0; i <= revisionCount; i++) {
            totalDays += revisionIntervals[i] || 0;
          }
          
          nextRevisionDate.setDate(nextRevisionDate.getDate() + totalDays);
          
          schedule.push({
            topicId: topic.id,
            topicName: topic.name,
            icon: topic.icon,
            revisionNumber: revisionCount + 1,
            dueDate: nextRevisionDate.toISOString(),
            isOverdue: nextRevisionDate < new Date(),
          });
        }
      }
    }
    
    return schedule.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } catch (error) {
    console.error('Error getting revision schedule:', error);
    return [];
  }
};

// ==================== RESET & EXPORT ====================

export const resetRoadmap = async () => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.TOPIC_PROGRESS,
      KEYS.DAILY_PLAN,
      KEYS.WEEKLY_PLAN,
      KEYS.STUDY_SESSIONS,
      KEYS.ACHIEVEMENTS,
    ]);
    return true;
  } catch (error) {
    console.error('Error resetting roadmap:', error);
    return false;
  }
};

export const exportProgress = async () => {
  try {
    const data = {
      preferences: await getUserPreferences(),
      progress: await getAllTopicProgress(),
      achievements: await getAchievements(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error exporting progress:', error);
    return null;
  }
};

export const importProgress = async (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.preferences) {
      await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(data.preferences));
    }
    if (data.progress) {
      await AsyncStorage.setItem(KEYS.TOPIC_PROGRESS, JSON.stringify(data.progress));
    }
    if (data.achievements) {
      await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(data.achievements));
    }
    
    return true;
  } catch (error) {
    console.error('Error importing progress:', error);
    return false;
  }
};

