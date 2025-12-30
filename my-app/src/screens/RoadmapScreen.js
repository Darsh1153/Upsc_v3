import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { 
  TOPIC_STATUS,
  REVISION_STATUS,
} from '../data/roadmapData';
import { useRoadmap } from '../context/RoadmapContext';
import { 
  getAllTopicProgress, 
  getRoadmapStats,
  getRevisionSchedule,
} from '../utils/roadmapStorage';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';

const { width } = Dimensions.get('window');

export default function RoadmapScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const { topics, loading: roadmapLoading, error: roadmapError, paperCategories, refreshTopics } = useRoadmap();
  const [selectedPaper, setSelectedPaper] = useState('all');
  const [topicProgress, setTopicProgress] = useState({});
  const [stats, setStats] = useState({});
  const [revisionDue, setRevisionDue] = useState([]);
  const [viewMode, setViewMode] = useState('topics'); // topics, revisions

  useFocusEffect(
    useCallback(() => {
      loadData();
      refreshTopics(); // Refresh topics from API on focus
    }, [])
  );

  const loadData = async () => {
    const [progress, roadmapStats, revisions] = await Promise.all([
      getAllTopicProgress(),
      getRoadmapStats(topics),
      getRevisionSchedule(topics),
    ]);
    setTopicProgress(progress);
    setStats(roadmapStats);
    setRevisionDue(revisions.filter(r => r.isOverdue || 
      new Date(r.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  };

  // Reload stats when topics change
  useFocusEffect(
    useCallback(() => {
      if (topics.length > 0) {
        loadData();
      }
    }, [topics])
  );

  const filteredTopics = selectedPaper === 'all' 
    ? topics 
    : topics.filter(t => t.paper === selectedPaper);

  const getStatusColor = (status) => {
    switch (status) {
      case TOPIC_STATUS.COMPLETED: return '#34C759';
      case TOPIC_STATUS.IN_PROGRESS: return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case TOPIC_STATUS.COMPLETED: return '✓';
      case TOPIC_STATUS.IN_PROGRESS: return '◐';
      default: return '○';
    }
  };

  const getRevisionLabel = (revisionStatus) => {
    switch (revisionStatus) {
      case REVISION_STATUS.FIRST_READ: return 'Read Once';
      case REVISION_STATUS.FIRST_REVISION: return '1st Revision';
      case REVISION_STATUS.SECOND_REVISION: return '2nd Revision';
      case REVISION_STATUS.FINAL_REVISION: return 'Final Revision';
      default: return 'Not Started';
    }
  };

  const calculateTopicCompletion = (topic, progress) => {
    if (!progress || !progress.completedSubtopics) return 0;
    return Math.round((progress.completedSubtopics.length / topic.subtopics.length) * 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Study Roadmap</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Your personalized UPSC preparation path</Text>
        </View>

        {/* Overall Progress Card */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercentage}>{stats.completionPercentage || 0}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${stats.completionPercentage || 0}%` }]} />
          </View>
          
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{stats.completed || 0}</Text>
              <Text style={styles.progressStatLabel}>Completed</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{stats.inProgress || 0}</Text>
              <Text style={styles.progressStatLabel}>In Progress</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{stats.pending || 0}</Text>
              <Text style={styles.progressStatLabel}>Pending</Text>
            </View>
          </View>
          
          <View style={styles.hoursRow}>
            <Text style={styles.hoursText}>
              📚 {stats.totalHoursStudied || 0}h studied / {stats.estimatedTotalHours || 0}h estimated
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('DailyPlan')}
          >
            <LinearGradient
              colors={['#11998e', '#38ef7d']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="calendar" size={26} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Today's Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setViewMode(viewMode === 'topics' ? 'revisions' : 'topics')}
          >
            <LinearGradient
              colors={['#eb3349', '#f45c43']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="refresh" size={26} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Revisions</Text>
            {revisionDue.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{revisionDue.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('UserPreferences')}
          >
            <LinearGradient
              colors={['#4776E6', '#8E54E9']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="settings" size={26} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Revision Due Section */}
        {viewMode === 'revisions' && revisionDue.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              <Ionicons name="pin" size={18} color={theme.colors.text} /> Revisions Due
            </Text>
            {revisionDue.map((item) => (
              <TouchableOpacity 
                key={item.topicId}
                style={[styles.revisionCard, { backgroundColor: theme.colors.surface }, item.isOverdue && { backgroundColor: isDark ? '#3D1515' : '#FFF5F5', borderLeftColor: theme.colors.error }]}
                onPress={() => navigation.navigate('TopicDetail', { topicId: item.topicId })}
              >
                <Text style={styles.revisionIcon}>{item.icon}</Text>
                <View style={styles.revisionInfo}>
                  <Text style={[styles.revisionTopicName, { color: theme.colors.text }]}>{item.topicName}</Text>
                  <Text style={[styles.revisionDue, { color: theme.colors.textSecondary }, item.isOverdue && { color: theme.colors.error }]}>
                    {item.isOverdue ? '⚠️ Overdue' : `Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                  </Text>
                </View>
                <View style={styles.revisionBadge}>
                  <Text style={styles.revisionBadgeText}>R{item.revisionNumber}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Paper Filter */}
        {viewMode === 'topics' && (
          <>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, selectedPaper === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedPaper('all')}
              >
                <Text style={[styles.filterText, { color: theme.colors.text }, selectedPaper === 'all' && styles.filterTextActive]}>
                  All Topics
                </Text>
              </TouchableOpacity>
              {paperCategories.map((paper) => (
                <TouchableOpacity
                  key={paper.id}
                  style={[
                    styles.filterChip, 
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    selectedPaper === paper.id && styles.filterChipActive,
                    selectedPaper === paper.id && { backgroundColor: paper.color }
                  ]}
                  onPress={() => setSelectedPaper(paper.id)}
                >
                  <Text style={[
                    styles.filterText, 
                    { color: theme.colors.text },
                    selectedPaper === paper.id && styles.filterTextActive
                  ]}>
                    {paper.icon} {paper.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Topics List */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                <Ionicons name="book" size={18} color={theme.colors.text} /> Topics ({filteredTopics.length})
              </Text>
              
              {filteredTopics.map((topic) => {
                const progress = topicProgress[topic.id] || {};
                const completion = calculateTopicCompletion(topic, progress);
                const status = progress.status || TOPIC_STATUS.PENDING;
                
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={[styles.topicCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.navigate('TopicDetail', { topicId: topic.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.topicHeader}>
                      <View style={[styles.topicIconContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
                        <Text style={styles.topicIcon}>{topic.icon}</Text>
                      </View>
                      <View style={styles.topicInfo}>
                        <Text style={[styles.topicName, { color: theme.colors.text }]}>{topic.name}</Text>
                        <View style={styles.topicMeta}>
                          <Text style={[styles.topicPaper, { color: theme.colors.textSecondary }]}>{topic.paper}</Text>
                          <Text style={[styles.topicDot, { color: theme.colors.textTertiary }]}>•</Text>
                          <Text style={[styles.topicHours, { color: theme.colors.textSecondary }]}>{topic.estimatedHours}h</Text>
                          <Text style={[styles.topicDot, { color: theme.colors.textTertiary }]}>•</Text>
                          <Text style={[
                            styles.topicDifficulty,
                            topic.difficulty === 'Advanced' && styles.difficultyAdvanced,
                            topic.difficulty === 'Moderate' && styles.difficultyModerate,
                          ]}>
                            {topic.difficulty}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                        <Text style={styles.statusIcon}>{getStatusIcon(status)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.topicProgress}>
                      <View style={[styles.topicProgressBar, { backgroundColor: theme.colors.border }]}>
                        <View 
                          style={[
                            styles.topicProgressFill, 
                            { width: `${completion}%`, backgroundColor: getStatusColor(status) }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.topicProgressText, { color: theme.colors.textSecondary }]}>{completion}%</Text>
                    </View>
                    
                    <View style={styles.topicFooter}>
                      <Text style={[styles.subtopicsCount, { color: theme.colors.textSecondary }]}>
                        {progress.completedSubtopics?.length || 0}/{topic.subtopics.length} subtopics
                      </Text>
                      {progress.revisionStatus && progress.revisionStatus !== REVISION_STATUS.NOT_STARTED && (
                        <View style={[styles.revisionTag, { backgroundColor: theme.colors.infoBg }]}>
                          <Text style={[styles.revisionTagText, { color: theme.colors.info }]}>
                            {getRevisionLabel(progress.revisionStatus)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
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
    fontWeight: '400',
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
  progressCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
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
  hoursRow: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  hoursText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionIcon: {
    fontSize: 26,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: '25%',
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  filterScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  filterTextActive: {
    color: '#FFF',
  },
  topicCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicIcon: {
    fontSize: 22,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicPaper: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  topicDot: {
    fontSize: 12,
    color: '#C7C7CC',
    marginHorizontal: 6,
  },
  topicHours: {
    fontSize: 12,
    color: '#8E8E93',
  },
  topicDifficulty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34C759',
  },
  difficultyModerate: {
    color: '#FF9500',
  },
  difficultyAdvanced: {
    color: '#FF3B30',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
  },
  topicProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginRight: 10,
  },
  topicProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  topicProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    width: 40,
    textAlign: 'right',
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtopicsCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  revisionTag: {
    backgroundColor: '#E5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  revisionTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  revisionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  overdueCard: {
    borderLeftColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  revisionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  revisionInfo: {
    flex: 1,
  },
  revisionTopicName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  revisionDue: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  revisionBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  revisionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
});

