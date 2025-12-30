import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getDailyPlan,
  saveDailyPlan,
  generateDailyPlan,
  getUserPreferences,
  logStudySession,
} from '../utils/roadmapStorage';
import { useRoadmap } from '../context/RoadmapContext';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';

export default function DailyPlanScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const { topics } = useRoadmap();
  const [plan, setPlan] = useState({ tasks: [], completed: [] });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [weekDays, setWeekDays] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      generateWeekDays();
    }, [selectedDate])
  );

  const loadData = async () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const [planData, prefs] = await Promise.all([
      getDailyPlan(dateKey),
      getUserPreferences(),
    ]);
    setPlan(planData);
    setPreferences(prefs);
  };

  const generateWeekDays = () => {
    const days = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    setWeekDays(days);
  };

  const handleGeneratePlan = async () => {
    Alert.alert(
      'Generate Daily Plan',
      'This will create a study plan based on your preferences and pending topics. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setIsGenerating(true);
            const generatedPlan = await generateDailyPlan(topics);
            const newPlan = {
              tasks: generatedPlan.tasks,
              completed: [],
              notes: '',
              generatedAt: new Date().toISOString(),
            };
            await saveDailyPlan(selectedDate.toISOString().split('T')[0], newPlan);
            setPlan(newPlan);
            setIsGenerating(false);
            Alert.alert('✅ Plan Generated', `${generatedPlan.tasks.length} tasks added for today!`);
          },
        },
      ]
    );
  };

  const toggleTaskComplete = async (taskId) => {
    const isCompleted = plan.completed?.includes(taskId);
    let newCompleted;

    if (isCompleted) {
      newCompleted = plan.completed.filter(id => id !== taskId);
    } else {
      newCompleted = [...(plan.completed || []), taskId];

      // Log study session for the task
      const task = plan.tasks.find(t => t.id === taskId);
      if (task && task.topicId) {
        await logStudySession({
          topicId: task.topicId,
          topicName: task.topicName,
          subtopicName: task.subtopicName,
          duration: (task.estimatedHours || 1) * 60,
          type: task.type,
        });
      }
    }

    const newPlan = { ...plan, completed: newCompleted };
    await saveDailyPlan(selectedDate.toISOString().split('T')[0], newPlan);
    setPlan(newPlan);
  };

  const moveTask = async (taskId, direction) => {
    const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
    if (taskIndex < 0) return;

    const newIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (newIndex < 0 || newIndex >= plan.tasks.length) return;

    const newTasks = [...plan.tasks];
    [newTasks[taskIndex], newTasks[newIndex]] = [newTasks[newIndex], newTasks[taskIndex]];

    const newPlan = { ...plan, tasks: newTasks };
    await saveDailyPlan(selectedDate.toISOString().split('T')[0], newPlan);
    setPlan(newPlan);
  };

  const removeTask = async (taskId) => {
    Alert.alert(
      'Remove Task',
      'Remove this task from today\'s plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const newTasks = plan.tasks.filter(t => t.id !== taskId);
            const newPlan = { ...plan, tasks: newTasks };
            await saveDailyPlan(selectedDate.toISOString().split('T')[0], newPlan);
            setPlan(newPlan);
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const completedCount = plan.completed?.length || 0;
  const totalTasks = plan.tasks?.length || 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const totalPlannedHours = plan.tasks?.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) || 0;
  const completedHours = plan.tasks
    ?.filter(t => plan.completed?.includes(t.id))
    .reduce((sum, t) => sum + (t.estimatedHours || 0), 0) || 0;

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'revision': return '🔄';
      case 'current_affairs': return '📰';
      case 'test': return '📝';
      default: return '📚';
    }
  };

  const getTaskTypeColor = (type) => {
    switch (type) {
      case 'revision': return ['#FF9500', '#FF6B00'];
      case 'current_affairs': return ['#5856D6', '#4845B5'];
      case 'test': return ['#FF3B30', '#CC2F26'];
      default: return ['#007AFF', '#0055D4'];
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Daily Plan</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Plan your study day effectively</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekContainer}
          >
            {weekDays.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  { backgroundColor: theme.colors.surface },
                  isSelected(date) && { backgroundColor: theme.colors.primary },
                  isToday(date) && { borderWidth: 2, borderColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayName,
                  { color: theme.colors.textSecondary },
                  isSelected(date) && styles.dayTextSelected,
                ]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  { color: theme.colors.text },
                  isSelected(date) && styles.dayTextSelected,
                ]}>
                  {date.getDate()}
                </Text>
                {isToday(date) && !isSelected(date) && (
                  <View style={[styles.todayDot, { backgroundColor: theme.colors.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Progress Card */}
        <LinearGradient
          colors={completionPercentage >= 100 ? ['#34C759', '#28A745'] : ['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressDate}>{formatDate(selectedDate)}</Text>
              <Text style={styles.progressTitle}>
                {completionPercentage >= 100 ? '🎉 All Done!' : 'Keep Going!'}
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
            </View>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{completedCount}/{totalTasks}</Text>
              <Text style={styles.progressStatLabel}>Tasks Done</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{completedHours.toFixed(1)}h</Text>
              <Text style={styles.progressStatLabel}>Completed</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{totalPlannedHours.toFixed(1)}h</Text>
              <Text style={styles.progressStatLabel}>Planned</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGeneratePlan}
            disabled={isGenerating}
          >
            <LinearGradient
              colors={['#11998e', '#38ef7d']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="sparkles" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>
                {isGenerating ? 'Generating...' : 'Auto Generate'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Roadmap')}
          >
            <LinearGradient
              colors={['#4776E6', '#8E54E9']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="book" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>View Roadmap</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="clipboard" size={16} color={theme.colors.text} /> Today's Tasks
          </Text>

          {plan.tasks?.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No tasks for today</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Use "Auto Generate" to create a personalized study plan based on your roadmap progress.
              </Text>
            </View>
          ) : (
            plan.tasks?.map((task, index) => {
              const isCompleted = plan.completed?.includes(task.id);
              const typeColors = getTaskTypeColor(task.type);

              return (
                <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}>
                  <TouchableOpacity
                    style={[styles.taskMain, isCompleted && { backgroundColor: isDark ? '#0A2E1A' : '#F8FFF8' }]}
                    onPress={() => toggleTaskComplete(task.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.taskCheckbox, { borderColor: theme.colors.border }, isCompleted && styles.taskCheckboxDone]}>
                      {isCompleted && <Text style={styles.taskCheckmark}>✓</Text>}
                    </View>

                    <View style={styles.taskContent}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskTypeIcon}>{getTaskTypeIcon(task.type)}</Text>
                        <View style={[styles.taskTypeBadge, { backgroundColor: typeColors[0] }]}>
                          <Text style={styles.taskTypeBadgeText}>
                            {task.type?.replace('_', ' ') || 'Study'}
                          </Text>
                        </View>
                        <Text style={[styles.taskHours, { color: theme.colors.textSecondary }]}>{task.estimatedHours}h</Text>
                      </View>

                      <Text style={[styles.taskName, { color: theme.colors.text }, isCompleted && { textDecorationLine: 'line-through', color: theme.colors.textSecondary }]}>
                        {task.topicName}
                      </Text>
                      {task.subtopicName && (
                        <Text style={[styles.taskSubtopic, { color: theme.colors.textSecondary }]}>{task.subtopicName}</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={[styles.taskActions, { borderTopColor: theme.colors.border }]}>
                    <TouchableOpacity
                      style={[styles.taskActionButton, { borderRightColor: theme.colors.border }]}
                      onPress={() => moveTask(task.id, 'up')}
                      disabled={index === 0}
                    >
                      <Ionicons name="arrow-up" size={16} color={index === 0 ? theme.colors.textTertiary : theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taskActionButton, { borderRightColor: theme.colors.border }]}
                      onPress={() => moveTask(task.id, 'down')}
                      disabled={index === plan.tasks.length - 1}
                    >
                      <Ionicons name="arrow-down" size={16} color={index === plan.tasks.length - 1 ? theme.colors.textTertiary : theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.taskActionButton}
                      onPress={() => removeTask(task.id)}
                    >
                      <Ionicons name="close" size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Quick Add Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="add-circle" size={16} color={theme.colors.text} /> Quick Add
          </Text>
          <View style={styles.quickAddRow}>
            <TouchableOpacity
              style={[styles.quickAddCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                const newTask = {
                  id: `ca_${Date.now()}`,
                  topicName: 'Current Affairs',
                  subtopicName: "Today's News",
                  estimatedHours: 1,
                  type: 'current_affairs',
                  completed: false,
                };
                const newPlan = { ...plan, tasks: [...(plan.tasks || []), newTask] };
                saveDailyPlan(selectedDate.toISOString().split('T')[0], newPlan);
                setPlan(newPlan);
              }}
            >
              <Ionicons name="newspaper" size={24} color={theme.colors.primary} />
              <Text style={[styles.quickAddText, { color: theme.colors.text }]}>Current Affairs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAddCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                const newTask = {
                  id: `rev_${Date.now()}`,
                  topicName: 'Quick Revision',
                  subtopicName: 'Review notes',
                  estimatedHours: 1,
                  type: 'revision',
                  completed: false,
                };
                const newPlan = { ...plan, tasks: [...(plan.tasks || []), newTask] };
                saveDailyPlan(selectedDate.toISOString().split('T')[0], newPlan);
                setPlan(newPlan);
              }}
            >
              <Ionicons name="refresh" size={24} color={theme.colors.primary} />
              <Text style={[styles.quickAddText, { color: theme.colors.text }]}>Revision</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAddCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('Config')}
            >
              <Ionicons name="create" size={24} color={theme.colors.primary} />
              <Text style={[styles.quickAddText, { color: theme.colors.text }]}>MCQ Test</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Tips */}
        <View style={[styles.tipsCard, { backgroundColor: theme.colors.warningBg }]}>
          <Text style={[styles.tipsTitle, { color: theme.colors.warning }]}>
            <Ionicons name="bulb" size={14} color={theme.colors.warning} /> Daily Tip
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.text }]}>
            {preferences.availableHoursDaily >= 8
              ? "You have a full study day planned! Take regular breaks every 45-50 minutes."
              : preferences.availableHoursDaily >= 4
                ? "Focus on high-priority topics first when your energy is at its peak."
                : "Quality over quantity! Make every study hour count with focused learning."
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  comingSoonText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  weekCalendar: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  weekContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayCard: {
    width: 56,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardSelected: {
    backgroundColor: '#007AFF',
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  dayTextSelected: {
    color: '#FFF',
  },
  todayDot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  progressStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  progressStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  taskCompleted: {
    backgroundColor: '#F8FFF8',
  },
  taskCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  taskCheckboxDone: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  taskCheckmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTypeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  taskTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  taskTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  taskHours: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 'auto',
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  taskNameDone: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskSubtopic: {
    fontSize: 13,
    color: '#8E8E93',
  },
  taskActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  taskActionButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F2F2F7',
  },
  taskActionIcon: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  taskActionDisabled: {
    color: '#C7C7CC',
  },
  taskActionDelete: {
    color: '#FF3B30',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAddCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAddIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 14,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
});

