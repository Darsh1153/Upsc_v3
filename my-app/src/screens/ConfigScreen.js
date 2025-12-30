import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  // TextInput, // Replaced with Input
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { pickPDF, processPDF, processManualText } from '../utils/pdfParser';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { Input } from '../components/Input';

export default function ConfigScreen({ navigation, route }) {
  const { topic = '', type = 'mcq' } = route.params || {};
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();

  const [mode, setMode] = useState('generate'); // 'generate' or 'upload'
  const [config, setConfig] = useState({
    language: 'English',
    numQuestions: '10',
    timeLimit: '15',
    includeCurrentAffairs: false,
    prompt: topic || '',
  });

  // PDF Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Manual text input
  const [showTextModal, setShowTextModal] = useState(false);
  const [manualText, setManualText] = useState('');

  const languages = ['English', 'Hindi'];
  const questionCounts = ['5', '10', '15', '20', '25'];
  const timeLimits = ['5', '10', '15', '20', '30', '45'];

  const examplePrompts = [
    'Indian Polity: Constitutional bodies, amendments',
    'Geography: Climate, monsoons, rivers of India',
    'Economy: Inflation, GDP, Fiscal policy',
    'History: Freedom movement, reforms',
    'Science & Tech: ISRO missions, AI, defence tech',
    'Environment: Biodiversity, climate change',
  ];

  const handleGenerate = () => {
    navigation.navigate('QuestionsList', { config, source: 'generated' });
  };

  const handlePickPDF = async () => {
    const result = await pickPDF();

    if (result.canceled) return;

    if (result.success) {
      setSelectedFile(result.file);
    } else {
      Alert.alert('Error', result.error || 'Failed to select file');
    }
  };

  const handleProcessPDF = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file first');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Preparing...');

    try {
      const result = await processPDF(selectedFile, setProcessingStatus);

      setIsProcessing(false);

      if (result.success) {
        navigation.navigate('QuestionsList', {
          config: { ...config, numQuestions: result.questions.length.toString() },
          source: 'pdf',
          pdfQuestions: result.questions,
          pdfInfo: {
            fileName: result.fileName,
            pagesScanned: result.pagesScanned,
          },
        });
      } else if (result.needsManualInput) {
        // Show scanned text if available for manual editing
        if (result.scannedText) {
          setManualText(result.scannedText);
        }
        Alert.alert(
          'Manual Input Needed',
          result.error || 'Could not parse questions automatically.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: result.scannedText ? 'Edit Scanned Text' : 'Paste Text',
              onPress: () => setShowTextModal(true)
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to process file');
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert(
        'Scanning Failed',
        'Could not scan the PDF. Try using "Paste Text" option instead.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Paste Text', onPress: () => setShowTextModal(true) },
        ]
      );
    }
  };

  const handleProcessManualText = () => {
    const result = processManualText(manualText);

    if (result.success) {
      setShowTextModal(false);
      setManualText('');
      navigation.navigate('QuestionsList', {
        config: { ...config, numQuestions: result.questions.length.toString() },
        source: 'pdf',
        pdfQuestions: result.questions,
        pdfInfo: {
          fileName: selectedFile?.name || 'Pasted Text',
          pagesScanned: result.pagesScanned,
        },
      });
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>MCQ Practice</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Generate or upload questions</Text>
        </View>

        {/* Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'generate' && { backgroundColor: theme.colors.primary }]}
            onPress={() => setMode('generate')}
          >
            <Text style={styles.modeIcon}>✨</Text>
            <Text style={[styles.modeText, { color: theme.colors.textSecondary }, mode === 'generate' && styles.modeTextActive]}>
              Generate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'upload' && { backgroundColor: theme.colors.primary }]}
            onPress={() => setMode('upload')}
          >
            <Text style={styles.modeIcon}>📄</Text>
            <Text style={[styles.modeText, { color: theme.colors.textSecondary }, mode === 'upload' && styles.modeTextActive]}>
              Upload
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'generate' ? (
          // ==================== GENERATE MODE ====================
          <>
            {/* Language Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Language</Text>
              <View style={styles.optionRow}>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.optionChip,
                      { backgroundColor: theme.colors.surface },
                      config.language === lang && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                    ]}
                    onPress={() => setConfig({ ...config, language: lang })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: theme.colors.text },
                        config.language === lang && { color: theme.colors.primary },
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Number of Questions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Number of Questions</Text>
              <View style={styles.optionRow}>
                {questionCounts.map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.optionChip,
                      styles.smallChip,
                      { backgroundColor: theme.colors.surface },
                      config.numQuestions === count && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                    ]}
                    onPress={() => setConfig({ ...config, numQuestions: count })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: theme.colors.text },
                        config.numQuestions === count && { color: theme.colors.primary },
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Limit */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Time Limit (minutes)</Text>
              <View style={styles.optionRow}>
                {timeLimits.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.optionChip,
                      styles.smallChip,
                      { backgroundColor: theme.colors.surface },
                      config.timeLimit === time && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                    ]}
                    onPress={() => setConfig({ ...config, timeLimit: time })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: theme.colors.text },
                        config.timeLimit === time && { color: theme.colors.primary },
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Current Affairs Toggle */}
            <View style={[styles.toggleSection, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>Include Current Affairs</Text>
                <Text style={[styles.toggleDesc, { color: theme.colors.textSecondary }]}>Questions from last 12 months</Text>
              </View>
              <Switch
                value={config.includeCurrentAffairs}
                onValueChange={(value) =>
                  setConfig({ ...config, includeCurrentAffairs: value })
                }
                trackColor={{ false: isDark ? '#475569' : '#E5E5EA', true: theme.colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Topic/Prompt Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Topic / Custom Prompt</Text>
              <Input
                style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                placeholder="e.g., Indian Polity: Fundamental Rights"
                placeholderTextColor={theme.colors.textTertiary}
                value={config.prompt}
                onChangeText={(text) => setConfig({ ...config, prompt: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Example Prompts */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Topics</Text>
              <View style={styles.examplesWrap}>
                {examplePrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.exampleChip, { backgroundColor: theme.colors.surface }]}
                    onPress={() => setConfig({ ...config, prompt })}
                  >
                    <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={handleGenerate}
            >
              <LinearGradient
                colors={['#007AFF', '#0055D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Generate Questions ✨</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          // ==================== UPLOAD MODE ====================
          <>
            {/* Upload Area */}
            <TouchableOpacity
              style={[styles.uploadArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, selectedFile && { borderColor: theme.colors.success, backgroundColor: isDark ? '#0A2E1A' : '#F8FFF9' }]}
              activeOpacity={0.7}
              onPress={handlePickPDF}
              disabled={isProcessing}
            >
              {selectedFile ? (
                <View style={styles.fileInfo}>
                  <Text style={styles.fileIcon}>📄</Text>
                  <View style={styles.fileDetails}>
                    <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={[styles.fileSize, { color: theme.colors.textSecondary }]}>
                      {formatFileSize(selectedFile.size)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.removeFile, { backgroundColor: theme.colors.errorBg }]}
                    onPress={() => setSelectedFile(null)}
                  >
                    <Text style={[styles.removeFileText, { color: theme.colors.error }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadIcon}>📤</Text>
                  <Text style={[styles.uploadTitle, { color: theme.colors.text }]}>Tap to Select PDF</Text>
                  <Text style={[styles.uploadDesc, { color: theme.colors.textSecondary }]}>
                    We'll scan and extract MCQs automatically
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.orDivider}>
              <View style={[styles.orLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.orText, { color: theme.colors.textSecondary }]}>OR</Text>
              <View style={[styles.orLine, { backgroundColor: theme.colors.border }]} />
            </View>

            {/* Paste Text Button */}
            <TouchableOpacity
              style={[styles.pasteButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowTextModal(true)}
            >
              <Text style={styles.pasteIcon}>📋</Text>
              <View style={styles.pasteInfo}>
                <Text style={[styles.pasteTitle, { color: theme.colors.text }]}>Paste Text</Text>
                <Text style={[styles.pasteDesc, { color: theme.colors.textSecondary }]}>Copy MCQs from PDF and paste here</Text>
              </View>
              <Text style={[styles.pasteArrow, { color: theme.colors.primary }]}>→</Text>
            </TouchableOpacity>

            {/* PDF Format Info */}
            <View style={[styles.infoCard, { backgroundColor: theme.colors.infoBg }]}>
              <Text style={[styles.infoTitle, { color: theme.colors.info }]}>📋 Supported Formats</Text>
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                MCQs should follow this format:
              </Text>
              <View style={[styles.formatExample, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.formatText, { color: theme.colors.textSecondary }]}>Q1. Question text here?</Text>
                <Text style={[styles.formatText, { color: theme.colors.textSecondary }]}>Option A: First option</Text>
                <Text style={[styles.formatText, { color: theme.colors.textSecondary }]}>Option B: Second option</Text>
                <Text style={[styles.formatText, { color: theme.colors.textSecondary }]}>Option C: Third option</Text>
                <Text style={[styles.formatText, { color: theme.colors.textSecondary }]}>Option D: Fourth option</Text>
                <Text style={[styles.formatText, { color: theme.colors.textSecondary }]}>Answer: B</Text>
              </View>
            </View>

            {/* Time Limit for PDF */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Test Time Limit (minutes)</Text>
              <View style={styles.optionRow}>
                {timeLimits.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.optionChip,
                      styles.smallChip,
                      { backgroundColor: theme.colors.surface },
                      config.timeLimit === time && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                    ]}
                    onPress={() => setConfig({ ...config, timeLimit: time })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: theme.colors.text },
                        config.timeLimit === time && { color: theme.colors.primary },
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Processing Status */}
            {isProcessing && (
              <View style={[styles.processingCard, { backgroundColor: theme.colors.surface }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.processingText, { color: theme.colors.primary }]}>{processingStatus}</Text>
              </View>
            )}

            {/* Scan Button */}
            <TouchableOpacity
              style={[styles.actionButton, (!selectedFile || isProcessing) && styles.buttonDisabled]}
              activeOpacity={0.8}
              onPress={handleProcessPDF}
              disabled={!selectedFile || isProcessing}
            >
              <LinearGradient
                colors={(!selectedFile || isProcessing) ? ['#C7C7CC', '#A1A1A6'] : ['#34C759', '#28A745']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isProcessing ? 'Scanning...' : 'Scan PDF & Extract 🔍'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Manual Text Input Modal */}
      <Modal
        visible={showTextModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTextModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Paste MCQ Text</Text>
              <TouchableOpacity onPress={() => setShowTextModal(false)}>
                <Text style={[styles.modalClose, { color: theme.colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Copy the MCQ content from your PDF and paste it below
            </Text>

            <Input
              style={[styles.manualTextInput, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text }]}
              placeholder={`Q1. Which planet is known as the Red Planet?\nOption A: Earth\nOption B: Mars\nOption C: Jupiter\nOption D: Venus\nAnswer: B\n\nQ2. Next question...`}
              placeholderTextColor={theme.colors.textTertiary}
              value={manualText}
              onChangeText={setManualText}
              multiline
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
                onPress={() => setShowTextModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: theme.colors.success }, !manualText.trim() && styles.modalBtnDisabled]}
                onPress={handleProcessManualText}
                disabled={!manualText.trim()}
              >
                <Text style={styles.modalSubmitText}>Extract Questions</Text>
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
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: '#007AFF',
  },
  modeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: -0.3,
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  smallChip: {
    paddingHorizontal: 16,
  },
  optionChipActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  optionTextActive: {
    color: '#007AFF',
  },
  toggleSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  toggleDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    minHeight: 80,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  examplesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  exampleText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  actionButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  // Upload Mode Styles
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
  },
  uploadAreaSelected: {
    borderColor: '#34C759',
    borderStyle: 'solid',
    backgroundColor: '#F8FFF9',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  uploadDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  fileIcon: {
    fontSize: 40,
    marginRight: 14,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  fileSize: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  removeFile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFileText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  orText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  pasteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  pasteIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  pasteInfo: {
    flex: 1,
  },
  pasteTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  pasteDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  pasteArrow: {
    fontSize: 20,
    color: '#007AFF',
  },
  infoCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  formatExample: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  formatText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#8E8E93',
    lineHeight: 18,
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  processingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  modalClose: {
    fontSize: 24,
    color: '#8E8E93',
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 16,
  },
  manualTextInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1C1C1E',
    minHeight: 250,
    maxHeight: 350,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#34C759',
  },
  modalBtnDisabled: {
    backgroundColor: '#C7C7CC',
  },
  modalSubmitText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
