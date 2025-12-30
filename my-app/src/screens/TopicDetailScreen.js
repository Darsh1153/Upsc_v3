import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  // TextInput, // Replaced
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  TOPIC_STATUS,
  REVISION_STATUS,
  SOURCE_TYPES,
} from '../data/roadmapData';
import { useRoadmap } from '../context/RoadmapContext';
import {
  getTopicProgress,
  updateTopicProgress,
  markSubtopicComplete,
  markSourceComplete,
  updateRevisionStatus,
  logStudySession,
} from '../utils/roadmapStorage';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { Input } from '../components/Input';

export default function TopicDetailScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const { topicId } = route.params;
  const { getTopicById, topics, loading: roadmapLoading } = useRoadmap();
  const topic = getTopicById(topicId);

  const [progress, setProgress] = useState({});
  const [activeTab, setActiveTab] = useState('subtopics'); // subtopics, sources, notes
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ type: SOURCE_TYPES.CUSTOM, name: '', link: '' });
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [studyTimer, setStudyTimer] = useState(0);
  const [isStudying, setIsStudying] = useState(false);
  const timerRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [topicId])
  );

  const loadProgress = async () => {
    const data = await getTopicProgress(topicId);
    setProgress(data);
    setNotes(data.notes || '');
  };

  if (!topic) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Topic not found</Text>
      </SafeAreaView>
    );
  }

  const completedSubtopics = progress.completedSubtopics || [];
  const completedSources = progress.completedSources || [];
  const completionPercentage = Math.round((completedSubtopics.length / topic.subtopics.length) * 100);

  const allSources = [
    ...topic.sources,
    ...(progress.customSources || []),
  ];

  const toggleSubtopic = async (subtopicId) => {
    const isCompleted = completedSubtopics.includes(subtopicId);

    if (isCompleted) {
      // Remove from completed
      const updated = completedSubtopics.filter(id => id !== subtopicId);
      await updateTopicProgress(topicId, {
        completedSubtopics: updated,
        status: updated.length === 0 ? TOPIC_STATUS.PENDING : TOPIC_STATUS.IN_PROGRESS,
      });
    } else {
      await markSubtopicComplete(topicId, subtopicId, topics);
    }

    loadProgress();
  };

  const toggleSource = async (index) => {
    const isCompleted = completedSources.includes(index);
    let updated;

    if (isCompleted) {
      updated = completedSources.filter(i => i !== index);
    } else {
      updated = [...completedSources, index];
    }

    await updateTopicProgress(topicId, { completedSources: updated });
    loadProgress();
  };

  const handleAddSource = async () => {
    if (!newSource.name.trim()) {
      Alert.alert('Error', 'Please enter a source name');
      return;
    }

    const customSources = [...(progress.customSources || []), newSource];
    await updateTopicProgress(topicId, { customSources });
    setNewSource({ type: SOURCE_TYPES.CUSTOM, name: '', link: '' });
    setShowAddSource(false);
    loadProgress();
  };

  const handleRevisionUpdate = async (newStatus) => {
    await updateRevisionStatus(topicId, newStatus);
    setShowRevisionModal(false);
    loadProgress();
    Alert.alert('✅ Updated', `Revision status updated to: ${getRevisionLabel(newStatus)}`);
  };

  const saveNotes = async () => {
    await updateTopicProgress(topicId, { notes });
    Alert.alert('Saved', 'Notes saved successfully!');
  };

  const toggleStudyTimer = () => {
    if (isStudying) {
      // Stop timer and log session
      clearInterval(timerRef.current);
      if (studyTimer > 60) { // Only log if studied for more than 1 minute
        logStudySession({
          topicId,
          topicName: topic.name,
          duration: Math.round(studyTimer / 60),
        });
        Alert.alert(
          '📚 Session Logged',
          `You studied for ${Math.round(studyTimer / 60)} minutes!`
        );
      }
      setStudyTimer(0);
    } else {
      // Start timer
      timerRef.current = setInterval(() => {
        setStudyTimer(prev => prev + 1);
      }, 1000);
    }
    setIsStudying(!isStudying);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRevisionLabel = (status) => {
    switch (status) {
      case REVISION_STATUS.FIRST_READ: return 'First Read';
      case REVISION_STATUS.FIRST_REVISION: return '1st Revision';
      case REVISION_STATUS.SECOND_REVISION: return '2nd Revision';
      case REVISION_STATUS.FINAL_REVISION: return 'Final Revision';
      default: return 'Not Started';
    }
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case SOURCE_TYPES.NCERT: return '📕';
      case SOURCE_TYPES.BOOK: return '📚';
      case SOURCE_TYPES.WEBSITE: return '🌐';
      case SOURCE_TYPES.YOUTUBE: return '📺';
      case SOURCE_TYPES.PDF: return '📄';
      case SOURCE_TYPES.NOTES: return '📝';
      default: return '📌';
    }
  };

  const openLink = (url) => {
    if (url && url.startsWith('http')) {
      Linking.openURL(url);
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

          <View style={styles.topicHeader}>
            <View style={[styles.topicIconLarge, { backgroundColor: theme.colors.surface }]}>
              <Text style={styles.topicIconText}>{topic.icon}</Text>
            </View>
            <View style={styles.topicHeaderInfo}>
              <Text style={[styles.topicName, { color: theme.colors.text }]}>{topic.name}</Text>
              <View style={styles.topicMeta}>
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{topic.paper}</Text>
                <Text style={[styles.metaDot, { color: theme.colors.border }]}>•</Text>
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{topic.estimatedHours}h</Text>
                <Text style={[styles.metaDot, { color: theme.colors.border }]}>•</Text>
                <Text style={[styles.metaText, styles.priorityHigh]}>
                  {topic.priority} Priority
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Progress</Text>
              <Text style={[styles.progressValue, { color: theme.colors.text }]}>{completionPercentage}%</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Status</Text>
              <Text style={[styles.progressValue, styles.statusText, { color: theme.colors.text }]}>
                {progress.status === TOPIC_STATUS.COMPLETED ? '✅' :
                  progress.status === TOPIC_STATUS.IN_PROGRESS ? '🔄' : '⏳'}
                {' '}{progress.status || 'Pending'}
              </Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Revision</Text>
              <TouchableOpacity onPress={() => setShowRevisionModal(true)}>
                <Text style={[styles.progressValue, styles.linkText, { color: theme.colors.primary }]}>
                  {getRevisionLabel(progress.revisionStatus)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.progressBarLarge, { backgroundColor: theme.colors.border }]}>
            <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
          </View>

          <Text style={[styles.subtopicsProgress, { color: theme.colors.textSecondary }]}>
            {completedSubtopics.length} / {topic.subtopics.length} subtopics completed
          </Text>
        </View>

        {/* Study Timer */}
        <View style={[styles.timerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.timerInfo}>
            <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>Study Timer</Text>
            <Text style={[styles.timerValue, { color: theme.colors.text }]}>{formatTime(studyTimer)}</Text>
            <Text style={[styles.timerHours, { color: theme.colors.textSecondary }]}>
              Total: {Math.round(progress.hoursStudied || 0)}h studied
            </Text>
          </View>
          <TouchableOpacity onPress={toggleStudyTimer}>
            <LinearGradient
              colors={isStudying ? ['#FF3B30', '#FF6B6B'] : ['#34C759', '#38ef7d']}
              style={styles.timerButton}
            >
              <Text style={styles.timerButtonText}>
                {isStudying ? '⏹ Stop' : '▶️ Start'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: theme.colors.border }]}>
          {['subtopics', 'sources', 'notes'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && [styles.tabActive, { backgroundColor: theme.colors.surface }]]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: theme.colors.textSecondary }, activeTab === tab && [styles.tabTextActive, { color: theme.colors.text }]]}>
                {tab === 'subtopics' ? `📚 Subtopics (${topic.subtopics.length})` :
                  tab === 'sources' ? `📖 Sources (${allSources.length})` :
                    '📝 Notes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'subtopics' && (
          <View style={styles.section}>
            {topic.subtopics.map((subtopic, index) => {
              const isCompleted = completedSubtopics.includes(subtopic.id);
              return (
                <TouchableOpacity
                  key={subtopic.id}
                  style={[styles.subtopicCard, { backgroundColor: theme.colors.surface }, isCompleted && { backgroundColor: isDark ? '#1A3A1A' : '#F0FFF4' }]}
                  onPress={() => toggleSubtopic(subtopic.id)}
                >
                  <View style={[styles.checkbox, { borderColor: theme.colors.border }, isCompleted && styles.checkboxChecked]}>
                    {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.subtopicInfo}>
                    <Text style={[styles.subtopicName, { color: theme.colors.text }, isCompleted && { textDecorationLine: 'line-through', color: theme.colors.textSecondary }]}>
                      {index + 1}. {subtopic.name}
                    </Text>
                    <Text style={[styles.subtopicHours, { color: theme.colors.textSecondary }]}>{subtopic.estimatedHours}h estimated</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeTab === 'sources' && (
          <View style={styles.section}>
            {allSources.map((source, index) => {
              const isCompleted = completedSources.includes(index);
              const isCustom = index >= topic.sources.length;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.sourceCard, { backgroundColor: theme.colors.surface }, isCompleted && { backgroundColor: isDark ? '#1A3A1A' : '#F0FFF4' }]}
                  onPress={() => toggleSource(index)}
                  onLongPress={() => source.link && openLink(source.link)}
                >
                  <Text style={styles.sourceIcon}>{getSourceIcon(source.type)}</Text>
                  <View style={styles.sourceInfo}>
                    <View style={styles.sourceHeader}>
                      <Text style={[styles.sourceName, { color: theme.colors.text }, isCompleted && { textDecorationLine: 'line-through', color: theme.colors.textSecondary }]}>
                        {source.name}
                      </Text>
                      {isCustom && (
                        <View style={[styles.customBadge, { backgroundColor: isDark ? '#1A3A5C' : '#E5F3FF' }]}>
                          <Text style={[styles.customBadgeText, { color: theme.colors.primary }]}>Custom</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.sourceType, { color: theme.colors.textSecondary }]}>{source.type}</Text>
                    {source.link && (
                      <Text style={[styles.sourceLink, { color: theme.colors.primary }]} numberOfLines={1}>🔗 {source.link}</Text>
                    )}
                  </View>
                  <View style={[styles.sourceCheck, { borderColor: theme.colors.border }, isCompleted && styles.sourceCheckDone]}>
                    {isCompleted && <Text style={styles.sourceCheckmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.addSourceButton, { borderColor: theme.colors.primary }]}
              onPress={() => setShowAddSource(true)}
            >
              <Text style={[styles.addSourceIcon, { color: theme.colors.primary }]}>+</Text>
              <Text style={[styles.addSourceText, { color: theme.colors.primary }]}>Add Custom Source</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'notes' && (
          <View style={styles.section}>
            <Input
              style={[styles.notesInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              multiline
              placeholder="Add your notes, key points, or reminders here..."
              placeholderTextColor={theme.colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.saveNotesButton} onPress={saveNotes}>
              <LinearGradient
                colors={['#007AFF', '#0055D4']}
                style={styles.saveNotesGradient}
              >
                <Text style={styles.saveNotesText}>💾 Save Notes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Take Test Button */}
        <TouchableOpacity
          style={styles.takeTestButton}
          onPress={() => navigation.navigate('Config', {
            prefillTopic: topic.name,
            fromRoadmap: true,
          })}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF3B30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.takeTestGradient}
          >
            <Text style={styles.takeTestText}>📝 Practice MCQs on this Topic</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Source Modal */}
      <Modal visible={showAddSource} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Custom Source</Text>

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Source Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {Object.values(SOURCE_TYPES).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, { backgroundColor: theme.colors.background }, newSource.type === type && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setNewSource({ ...newSource, type })}
                >
                  <Text style={[styles.typeChipText, { color: theme.colors.text }, newSource.type === type && styles.typeChipTextActive]}>
                    {getSourceIcon(type)} {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Source Name *</Text>
            <Input
              style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
              placeholder="e.g., Video Lecture on..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newSource.name}
              onChangeText={(text) => setNewSource({ ...newSource, name: text })}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Link (Optional)</Text>
            <Input
              style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
              placeholder="https://..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newSource.link}
              onChangeText={(text) => setNewSource({ ...newSource, link: text })}
              keyboardType="url"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButtonCancel, { backgroundColor: theme.colors.background }]}
                onPress={() => setShowAddSource(false)}
              >
                <Text style={[styles.modalButtonCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonAdd}
                onPress={handleAddSource}
              >
                <LinearGradient
                  colors={['#34C759', '#28A745']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonAddText}>Add Source</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Revision Modal */}
      <Modal visible={showRevisionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Update Revision Status</Text>
            <Text style={[styles.revisionHint, { color: theme.colors.textSecondary }]}>
              Current: {getRevisionLabel(progress.revisionStatus)}
            </Text>

            {[
              REVISION_STATUS.FIRST_READ,
              REVISION_STATUS.FIRST_REVISION,
              REVISION_STATUS.SECOND_REVISION,
              REVISION_STATUS.FINAL_REVISION,
            ].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.revisionOption,
                  { backgroundColor: theme.colors.background },
                  progress.revisionStatus === status && [styles.revisionOptionActive, { backgroundColor: isDark ? '#1A3A5C' : '#E5F3FF', borderColor: theme.colors.primary }]
                ]}
                onPress={() => handleRevisionUpdate(status)}
              >
                <Text style={[
                  styles.revisionOptionText,
                  { color: theme.colors.text },
                  progress.revisionStatus === status && { color: theme.colors.primary, fontWeight: '600' }
                ]}>
                  {getRevisionLabel(status)}
                </Text>
                {progress.revisionStatus === status && (
                  <Text style={[styles.revisionCheckmark, { color: theme.colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRevisionModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topicIconText: {
    fontSize: 32,
  },
  topicHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  topicName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  metaDot: {
    marginHorizontal: 6,
    color: '#C7C7CC',
  },
  priorityHigh: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statusText: {
    textTransform: 'capitalize',
  },
  linkText: {
    color: '#007AFF',
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  subtopicsProgress: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  timerInfo: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    fontVariant: ['tabular-nums'],
  },
  timerHours: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  timerButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  subtopicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  subtopicCompleted: {
    backgroundColor: '#F0FFF4',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  subtopicInfo: {
    flex: 1,
  },
  subtopicName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  subtopicNameDone: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  subtopicHours: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  sourceCompleted: {
    backgroundColor: '#F0FFF4',
  },
  sourceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  sourceNameDone: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  customBadge: {
    backgroundColor: '#E5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
  },
  sourceType: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sourceLink: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 2,
  },
  sourceCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceCheckDone: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  sourceCheckmark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  addSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
    marginTop: 8,
  },
  addSourceIcon: {
    fontSize: 20,
    color: '#007AFF',
    marginRight: 8,
  },
  addSourceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  notesInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1C1C1E',
    minHeight: 200,
    lineHeight: 22,
  },
  saveNotesButton: {
    marginTop: 16,
  },
  saveNotesGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveNotesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  takeTestButton: {
    marginTop: 20,
  },
  takeTestGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  takeTestText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 12,
  },
  typeScroll: {
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#007AFF',
  },
  typeChipText: {
    fontSize: 13,
    color: '#1C1C1E',
  },
  typeChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1C1C1E',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalButtonAdd: {
    flex: 1,
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalButtonAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  revisionHint: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  revisionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    marginBottom: 8,
  },
  revisionOptionActive: {
    backgroundColor: '#E5F3FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  revisionOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  revisionOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  revisionCheckmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
