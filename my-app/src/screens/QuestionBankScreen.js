import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';

export default function QuestionBankScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const [questions, setQuestions] = useState([]);
  const [allTags, setAllTags] = useState({ system: [], user: [] });
  const [selectedTags, setSelectedTags] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const loadQuestions = async () => {
    try {
      const data = await AsyncStorage.getItem('questionBank');
      const savedQuestions = data ? JSON.parse(data) : [];
      setQuestions(savedQuestions);

      // Extract all unique tags
      const systemTags = new Set();
      const userTags = new Set();
      savedQuestions.forEach(q => {
        q.systemTags?.forEach(tag => systemTags.add(tag));
        q.userTags?.forEach(tag => userTags.add(tag));
      });
      setAllTags({
        system: Array.from(systemTags),
        user: Array.from(userTags),
      });
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadQuestions();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    setRefreshing(false);
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const filteredQuestions = selectedTags.length === 0
    ? questions
    : questions.filter(q => {
        const allQuestionTags = [...(q.systemTags || []), ...(q.userTags || [])];
        return selectedTags.some(tag => allQuestionTags.includes(tag));
      });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleSelectQuestion = (id) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter(qId => qId !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const deleteQuestion = async (id) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to remove this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedQuestions = questions.filter(q => q.id !== id);
            await AsyncStorage.setItem('questionBank', JSON.stringify(updatedQuestions));
            setQuestions(updatedQuestions);
          },
        },
      ]
    );
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const startTestWithSelected = () => {
    if (selectedQuestions.length === 0) {
      Alert.alert('Select Questions', 'Please select at least one question to start the test.');
      return;
    }
    const testQuestions = questions.filter(q => selectedQuestions.includes(q.id));
    navigation.navigate('Test', {
      questions: testQuestions,
      config: { numQuestions: testQuestions.length.toString(), timeLimit: '15' },
    });
  };

  const selectAll = () => {
    setSelectedQuestions(filteredQuestions.map(q => q.id));
  };

  const deselectAll = () => {
    setSelectedQuestions([]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Question Bank</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{questions.length} saved questions</Text>
        </View>

        {/* Tag Filters */}
        {(allTags.system.length > 0 || allTags.user.length > 0) && (
          <View style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { color: theme.colors.text }]}>Filter by Tags</Text>
              {selectedTags.length > 0 && (
                <TouchableOpacity onPress={clearAllTags}>
                  <Text style={[styles.clearText, { color: theme.colors.error }]}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* System Tags */}
            {allTags.system.length > 0 && (
              <View style={styles.tagGroup}>
                <Text style={[styles.tagGroupLabel, { color: theme.colors.textSecondary }]}>Topic Tags</Text>
                <View style={styles.tagsList}>
                  {allTags.system.map((tag, i) => (
                    <TouchableOpacity
                      key={`sys-${i}`}
                      style={[
                        styles.filterTag,
                        { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                        selectedTags.includes(tag) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[
                        styles.filterTagText,
                        { color: theme.colors.text },
                        selectedTags.includes(tag) && styles.filterTagTextActive,
                      ]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* User Tags */}
            {allTags.user.length > 0 && (
              <View style={styles.tagGroup}>
                <Text style={[styles.tagGroupLabel, { color: theme.colors.textSecondary }]}>Your Tags</Text>
                <View style={styles.tagsList}>
                  {allTags.user.map((tag, i) => (
                    <TouchableOpacity
                      key={`usr-${i}`}
                      style={[
                        styles.filterTag,
                        { backgroundColor: 'transparent', borderColor: theme.colors.success },
                        selectedTags.includes(tag) && { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[
                        styles.filterTagText,
                        { color: theme.colors.success },
                        selectedTags.includes(tag) && styles.filterTagTextActive,
                      ]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Selection Actions */}
        {filteredQuestions.length > 0 && (
          <View style={styles.selectionBar}>
            <Text style={[styles.selectionText, { color: theme.colors.textSecondary }]}>
              {selectedQuestions.length} selected
            </Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity onPress={selectedQuestions.length === filteredQuestions.length ? deselectAll : selectAll}>
                <Text style={[styles.selectAllText, { color: theme.colors.primary }]}>
                  {selectedQuestions.length === filteredQuestions.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {questions.length === 0 ? 'No Saved Questions' : 'No Matching Questions'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
              {questions.length === 0
                ? 'Generate questions and save them here for later practice'
                : 'Try adjusting your tag filters'}
            </Text>
          </View>
        ) : (
          filteredQuestions.map((q, index) => (
            <View key={q.id} style={[styles.questionCard, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity
                style={styles.questionHeader}
                activeOpacity={0.7}
                onPress={() => toggleExpand(q.id)}
              >
                {/* Checkbox */}
                <TouchableOpacity
                  style={[styles.checkbox, { borderColor: theme.colors.border }, selectedQuestions.includes(q.id) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                  onPress={() => toggleSelectQuestion(q.id)}
                >
                  {selectedQuestions.includes(q.id) && (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  )}
                </TouchableOpacity>

                <View style={styles.questionInfo}>
                  <Text style={[styles.qText, { color: theme.colors.text }]} numberOfLines={expandedId === q.id ? undefined : 2}>
                    {q.question}
                  </Text>
                </View>
                <Ionicons name={expandedId === q.id ? 'remove' : 'add'} size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {/* Tags Preview (always visible) */}
              <View style={styles.tagsPreview}>
                {q.systemTags?.slice(0, 3).map((tag, i) => (
                  <View key={`st-${i}`} style={styles.previewSystemTag}>
                    <Text style={styles.previewSystemTagText}>{tag}</Text>
                  </View>
                ))}
                {q.userTags?.slice(0, 2).map((tag, i) => (
                  <View key={`ut-${i}`} style={styles.previewUserTag}>
                    <Text style={styles.previewUserTagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {expandedId === q.id && (
                <View style={[styles.expandedContent, { borderTopColor: theme.colors.border }]}>
                  {/* Options */}
                  <View style={styles.optionsList}>
                    {q.options.map((opt, i) => (
                      <View
                        key={i}
                        style={[styles.optionItem, { backgroundColor: theme.colors.surfaceSecondary }, i === q.correct && { backgroundColor: theme.colors.successBg }]}
                      >
                        <Text style={[styles.optionLetter, { color: theme.colors.textSecondary }, i === q.correct && { color: theme.colors.success }]}>
                          {String.fromCharCode(65 + i)}
                        </Text>
                        <Text style={[styles.optionText, { color: theme.colors.text }, i === q.correct && { color: theme.colors.success }]}>
                          {opt}
                        </Text>
                        {i === q.correct && <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />}
                      </View>
                    ))}
                  </View>

                  {/* Explanation */}
                  <View style={[styles.explanationBox, { backgroundColor: theme.colors.warningBg }]}>
                    <Text style={[styles.explanationTitle, { color: theme.colors.warning }]}>
                      <Ionicons name="book" size={13} color={theme.colors.warning} /> Explanation
                    </Text>
                    <Text style={[styles.explanationText, { color: theme.colors.text }]}>{q.explanation}</Text>
                  </View>

                  {/* All Tags */}
                  <View style={styles.allTagsContainer}>
                    {q.systemTags?.length > 0 && (
                      <View style={styles.tagSection}>
                        <Text style={styles.tagSectionLabel}>Topic Tags</Text>
                        <View style={styles.tagsList}>
                          {q.systemTags.map((tag, i) => (
                            <View key={i} style={styles.systemTag}>
                              <Text style={styles.systemTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {q.userTags?.length > 0 && (
                      <View style={styles.tagSection}>
                        <Text style={styles.tagSectionLabel}>Your Tags</Text>
                        <View style={styles.tagsList}>
                          {q.userTags.map((tag, i) => (
                            <View key={i} style={styles.userTag}>
                              <Text style={styles.userTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: theme.colors.errorBg }]}
                    onPress={() => deleteQuestion(q.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                    <Text style={[styles.deleteText, { color: theme.colors.error }]}> Remove from Bank</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {/* Start Test Button */}
        {selectedQuestions.length > 0 && (
          <TouchableOpacity style={styles.testButton} activeOpacity={0.8} onPress={startTestWithSelected}>
            <LinearGradient
              colors={['#007AFF', '#0055D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.testGradient}
            >
              <Text style={styles.testButtonText}>
                Take Test ({selectedQuestions.length} questions) →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
    letterSpacing: -0.3,
  },
  tagGroup: {
    marginBottom: 12,
  },
  tagGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  systemFilterTag: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  userFilterTag: {
    backgroundColor: 'transparent',
    borderColor: '#34C759',
  },
  filterTagActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  userFilterTagActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  systemFilterTagText: {
    color: '#1C1C1E',
  },
  userFilterTagText: {
    color: '#34C759',
  },
  filterTagTextActive: {
    color: '#FFFFFF',
  },
  userFilterTagTextActive: {
    color: '#FFFFFF',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.3,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  questionInfo: {
    flex: 1,
  },
  qText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#8E8E93',
    marginLeft: 12,
  },
  tagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  previewSystemTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  previewSystemTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  previewUserTag: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewUserTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#34C759',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  optionsList: {
    marginTop: 12,
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  correctOption: {
    backgroundColor: '#E8F8ED',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginRight: 12,
    width: 20,
  },
  correctLetter: {
    color: '#34C759',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  correctText: {
    color: '#34C759',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '700',
  },
  explanationBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  allTagsContainer: {
    marginTop: 14,
  },
  tagSection: {
    marginBottom: 10,
  },
  tagSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  systemTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  systemTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  userTag: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  userTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34C759',
    letterSpacing: -0.2,
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    letterSpacing: -0.3,
  },
  testButton: {
    marginTop: 12,
  },
  testGradient: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});

