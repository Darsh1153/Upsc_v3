import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  // TextInput, // Replaced
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { Input } from '../components/Input';

// Sample generated questions with system tags
const generateSampleQuestions = (config) => {
  return [
    {
      id: 1,
      question: 'Which article of the Indian Constitution deals with the Right to Equality?',
      options: ['Article 12', 'Article 14', 'Article 19', 'Article 21'],
      correct: 1,
      explanation: 'Article 14 of the Indian Constitution guarantees equality before law and equal protection of laws to all persons within the territory of India.',
      systemTags: ['Indian Polity', 'Fundamental Rights', 'Constitution'],
    },
    {
      id: 2,
      question: 'The Preamble to the Constitution of India was amended by which Constitutional Amendment?',
      options: ['42nd Amendment', '44th Amendment', '73rd Amendment', '86th Amendment'],
      correct: 0,
      explanation: 'The 42nd Constitutional Amendment Act, 1976 added the words "Socialist", "Secular" and "Integrity" to the Preamble.',
      systemTags: ['Indian Polity', 'Preamble', 'Amendments'],
    },
    {
      id: 3,
      question: 'Which of the following is NOT a Fundamental Right under the Indian Constitution?',
      options: ['Right to Property', 'Right to Freedom', 'Right against Exploitation', 'Right to Constitutional Remedies'],
      correct: 0,
      explanation: 'Right to Property was removed from the list of Fundamental Rights by the 44th Amendment Act, 1978.',
      systemTags: ['Indian Polity', 'Fundamental Rights', 'Property Rights'],
    },
    {
      id: 4,
      question: 'The concept of Judicial Review in the Indian Constitution is borrowed from which country?',
      options: ['UK', 'USA', 'Canada', 'Australia'],
      correct: 1,
      explanation: 'The concept of Judicial Review has been adopted from the Constitution of the USA.',
      systemTags: ['Indian Polity', 'Judiciary', 'Borrowed Features'],
    },
    {
      id: 5,
      question: 'Which Schedule of the Indian Constitution deals with anti-defection law?',
      options: ['8th Schedule', '9th Schedule', '10th Schedule', '11th Schedule'],
      correct: 2,
      explanation: 'The 10th Schedule was added by the 52nd Amendment Act, 1985.',
      systemTags: ['Indian Polity', 'Schedules', 'Anti-Defection'],
    },
    {
      id: 6,
      question: 'The President of India can be removed from office by:',
      options: ['Prime Minister', 'Supreme Court', 'Parliament through Impeachment', 'Election Commission'],
      correct: 2,
      explanation: 'The President can be removed from office by a process of impeachment under Article 61.',
      systemTags: ['Indian Polity', 'President', 'Impeachment'],
    },
    {
      id: 7,
      question: 'Which writ is called "bulwark of personal freedom"?',
      options: ['Mandamus', 'Habeas Corpus', 'Certiorari', 'Quo Warranto'],
      correct: 1,
      explanation: 'Habeas Corpus literally means "to have the body" and protects against illegal detention.',
      systemTags: ['Indian Polity', 'Writs', 'Fundamental Rights'],
    },
    {
      id: 8,
      question: 'Directive Principles are contained in which Part of the Constitution?',
      options: ['Part III', 'Part IV', 'Part IVA', 'Part V'],
      correct: 1,
      explanation: 'Part IV (Articles 36-51) contains the Directive Principles of State Policy.',
      systemTags: ['Indian Polity', 'DPSP', 'Constitution'],
    },
    {
      id: 9,
      question: 'Minimum age to become a member of Rajya Sabha?',
      options: ['25 years', '30 years', '35 years', '21 years'],
      correct: 1,
      explanation: 'To become a member of Rajya Sabha, a person must be at least 30 years of age.',
      systemTags: ['Indian Polity', 'Parliament', 'Rajya Sabha'],
    },
    {
      id: 10,
      question: 'The Indian Constitution came into effect on:',
      options: ['15th August, 1947', '26th November, 1949', '26th January, 1950', '26th January, 1949'],
      correct: 2,
      explanation: 'The Constitution came into effect on 26th January, 1950, celebrated as Republic Day.',
      systemTags: ['Indian Polity', 'Constitution', 'Important Dates'],
    },
  ].slice(0, parseInt(config?.numQuestions || '10'));
};

export default function QuestionsListScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const { config, source = 'generated', pdfQuestions, pdfInfo } = route.params || {};

  // Use PDF questions if available, otherwise generate sample questions
  const [questions] = useState(() =>
    source === 'pdf' && pdfQuestions ? pdfQuestions : generateSampleQuestions(config)
  );

  const [expandedId, setExpandedId] = useState(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [customTags, setCustomTags] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const isPDFSource = source === 'pdf';

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openSaveModal = (question, isAll = false) => {
    setSelectedQuestion(question);
    setSavingAll(isAll);
    setCustomTags('');
    setSaveModalVisible(true);
  };

  const saveToQuestionBank = async () => {
    try {
      const userTags = customTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const existingData = await AsyncStorage.getItem('questionBank');
      const questionBank = existingData ? JSON.parse(existingData) : [];

      if (savingAll) {
        const newQuestions = questions.map(q => ({
          ...q,
          id: Date.now() + Math.random(),
          userTags,
          savedAt: new Date().toISOString(),
        }));
        await AsyncStorage.setItem('questionBank', JSON.stringify([...questionBank, ...newQuestions]));
        Alert.alert('Success', `${questions.length} questions saved to Question Bank!`);
      } else {
        const newQuestion = {
          ...selectedQuestion,
          id: Date.now(),
          userTags,
          savedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem('questionBank', JSON.stringify([...questionBank, newQuestion]));
        Alert.alert('Success', 'Question saved to Question Bank!');
      }

      setSaveModalVisible(false);
      setCustomTags('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save question');
    }
  };

  const generatePDF = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1C1C1E; }
          h1 { color: #007AFF; font-size: 24px; margin-bottom: 8px; }
          .subtitle { color: #8E8E93; font-size: 14px; margin-bottom: 30px; }
          .question { margin-bottom: 24px; page-break-inside: avoid; }
          .q-header { font-weight: 600; font-size: 14px; color: #007AFF; margin-bottom: 8px; }
          .q-text { font-size: 16px; font-weight: 500; margin-bottom: 12px; line-height: 1.5; }
          .option { padding: 8px 12px; margin: 4px 0; background: #F2F2F7; border-radius: 8px; font-size: 14px; }
          .correct { background: #E8F8ED; color: #34C759; font-weight: 500; }
          .answer { margin-top: 12px; padding: 12px; background: #FFF9E6; border-radius: 8px; }
          .answer-title { font-weight: 600; color: #B8860B; font-size: 12px; margin-bottom: 4px; }
          .answer-text { font-size: 13px; line-height: 1.4; }
          .tags { margin-top: 8px; }
          .tag { display: inline-block; padding: 4px 8px; background: #E5E5EA; border-radius: 4px; font-size: 11px; margin-right: 4px; color: #8E8E93; }
          hr { border: none; border-top: 1px solid #E5E5EA; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>UPSC Practice Questions</h1>
        <p class="subtitle">Generated on ${new Date().toLocaleDateString()} • ${questions.length} Questions</p>
        
        ${questions.map((q, index) => `
          <div class="question">
            <div class="q-header">Question ${index + 1}</div>
            <div class="q-text">${q.question}</div>
            ${q.options.map((opt, i) => `
              <div class="option ${i === q.correct ? 'correct' : ''}">${String.fromCharCode(65 + i)}. ${opt}</div>
            `).join('')}
            <div class="answer">
              <div class="answer-title">✓ Answer: ${String.fromCharCode(65 + q.correct)}</div>
              <div class="answer-text">${q.explanation}</div>
            </div>
            <div class="tags">
              ${q.systemTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
          ${index < questions.length - 1 ? '<hr/>' : ''}
        `).join('')}
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const startTest = () => {
    navigation.navigate('Test', { config, questions });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isPDFSource ? 'Extracted Questions' : 'Generated Questions'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{questions.length} questions ready</Text>
        </View>

        {/* PDF Source Info */}
        {isPDFSource && pdfInfo && (
          <View style={[styles.pdfInfoCard, { backgroundColor: isDark ? '#1A3A1A' : '#E8F8ED' }]}>
            <Text style={styles.pdfInfoIcon}>📄</Text>
            <View style={styles.pdfInfoContent}>
              <Text style={[styles.pdfInfoName, { color: theme.colors.text }]} numberOfLines={1}>{pdfInfo.fileName}</Text>
              <Text style={styles.pdfInfoMeta}>
                {pdfInfo.pagesScanned} pages scanned • {questions.length} questions found
              </Text>
            </View>
          </View>
        )}

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]} onPress={generatePDF}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]} onPress={() => openSaveModal(null, true)}>
            <Text style={styles.actionIcon}>💾</Text>
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Save All</Text>
          </TouchableOpacity>
        </View>

        {/* Questions List */}
        {questions.map((q, index) => (
          <View key={q.id} style={[styles.questionCard, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={styles.questionHeader}
              activeOpacity={0.7}
              onPress={() => toggleExpand(q.id)}
            >
              <View style={styles.questionInfo}>
                <Text style={[styles.qNumber, { color: theme.colors.primary }]}>Q{index + 1}</Text>
                <Text style={[styles.qText, { color: theme.colors.text }]} numberOfLines={expandedId === q.id ? undefined : 2}>
                  {q.question}
                </Text>
              </View>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>{expandedId === q.id ? '−' : '+'}</Text>
            </TouchableOpacity>

            {expandedId === q.id && (
              <View style={[styles.expandedContent, { borderTopColor: theme.colors.border }]}>
                {/* Options */}
                <View style={styles.optionsList}>
                  {q.options.map((opt, i) => (
                    <View
                      key={i}
                      style={[styles.optionItem, { backgroundColor: theme.colors.background }, i === q.correct && { backgroundColor: isDark ? '#1A3A1A' : '#E8F8ED' }]}
                    >
                      <Text style={[styles.optionLetter, { color: theme.colors.textSecondary }, i === q.correct && styles.correctLetter]}>
                        {String.fromCharCode(65 + i)}
                      </Text>
                      <Text style={[styles.optionText, { color: theme.colors.text }, i === q.correct && styles.correctText]}>
                        {opt}
                      </Text>
                      {i === q.correct && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  ))}
                </View>

                {/* Explanation */}
                <View style={[styles.explanationBox, { backgroundColor: isDark ? '#3A3000' : '#FFF9E6' }]}>
                  <Text style={[styles.explanationTitle, { color: isDark ? '#FFD700' : '#B8860B' }]}>📖 Explanation</Text>
                  <Text style={[styles.explanationText, { color: theme.colors.text }]}>{q.explanation}</Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsContainer}>
                  <Text style={[styles.tagsLabel, { color: theme.colors.textSecondary }]}>Tags</Text>
                  <View style={styles.tagsList}>
                    {q.systemTags.map((tag, i) => (
                      <View key={i} style={[styles.systemTag, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.systemTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.colors.background }]}
                  onPress={() => openSaveModal(q, false)}
                >
                  <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>💾 Save to Question Bank</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Start Test Button */}
        <TouchableOpacity style={styles.testButton} activeOpacity={0.8} onPress={startTest}>
          <LinearGradient
            colors={['#007AFF', '#0055D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.testGradient}
          >
            <Text style={styles.testButtonText}>Take Test →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Modal */}
      <Modal
        visible={saveModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSaveModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {savingAll ? 'Save All Questions' : 'Save Question'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>Add custom tags (comma separated)</Text>

            <Input
              style={[styles.tagInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
              placeholder="e.g., Important, Revision, Difficult"
              placeholderTextColor={theme.colors.textSecondary}
              value={customTags}
              onChangeText={setCustomTags}
              autoFocus={true}
            />

            {/* Preview Tags */}
            {customTags.length > 0 && (
              <View style={styles.previewTags}>
                <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>Your tags:</Text>
                <View style={styles.tagsList}>
                  {customTags.split(',').filter(t => t.trim()).map((tag, i) => (
                    <View key={i} style={styles.userTag}>
                      <Text style={styles.userTagText}>{tag.trim()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={saveToQuestionBank}>
                <Text style={styles.confirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  pdfInfoCard: {
    backgroundColor: '#E8F8ED',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pdfInfoIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  pdfInfoContent: {
    flex: 1,
  },
  pdfInfoName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  pdfInfoMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: '#34C759',
    marginTop: 2,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
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
  questionInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  qNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 10,
    marginTop: 2,
  },
  qText: {
    flex: 1,
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
  tagsContainer: {
    marginTop: 14,
  },
  tagsLabel: {
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
    gap: 6,
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
  saveButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  tagInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    minHeight: 60,
  },
  previewTags: {
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: -0.4,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});
