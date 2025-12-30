import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // Ensure this is used if needed, or remove if unused in updated code
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { saveEssayAttempt, getEssayAttempts } from '../utils/storage';
import { getMobileApiEndpoint } from '../config/api';
// import { useAutoDismissKeyboard } from '../hooks/useAutoDismissKeyboard';
import { SmartTextInput } from '../components/SmartTextInput';

export default function EssayScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();

  // State management
  const [topic, setTopic] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [wordLimit, setWordLimit] = useState('1000');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [essayHistory, setEssayHistory] = useState([]);

  // Auto-dismiss keyboard hook handled by SmartTextInput

  // Load essay history on mount
  useEffect(() => {
    loadEssayHistory();
  }, []);

  // ... (existing helper functions: saveEssayToHistory, loadEssayHistory, handleUploadDocument) ...
  // Need to retain these if they are within the start-end range, but replace_file doesn't show them here unless I include them.
  // Wait, I am replacing the top part ONLY. But replace_file_content must match EXACTLY.
  // I must be careful. I will view the file first to be safe about line numbers.


  const loadEssayHistory = async () => {
    const history = await getEssayAttempts();
    setEssayHistory(history);
  };

  // Calculate word count
  const wordCount = answerText.trim().split(/\s+/).filter(w => w.length > 0).length;

  // Handle essay evaluation
  const handleEvaluate = async () => {
    if (!topic.trim()) {
      Alert.alert('Missing Topic', 'Please enter an essay topic');
      return;
    }

    if (!answerText.trim() && !selectedImage) {
      Alert.alert('Missing Essay', 'Please write your essay or upload an image');
      return;
    }

    // Word count check only if text is provided
    if (answerText.trim() && wordCount < 50 && !selectedImage) {
      Alert.alert('Essay Too Short', 'Please write at least 50 words');
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const endpoint = getMobileApiEndpoint('/essay/evaluate');
      console.log('Calling essay evaluation API:', endpoint);

      const body = {
        topic: topic.trim(),
        answerText: answerText.trim(), // Optional if image is present
      };

      if (selectedImage) {
        body.image = selectedImage; // Base64 image
        body.isHandwritten = true;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : (data.error || 'Failed to evaluate essay');
        throw new Error(errorMessage);
      }

      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);

        // If OCR returned text, update the text input
        if (data.ocrText) {
          setAnswerText(data.ocrText);
        }

        // Save to local storage
        await saveEssayAttempt({
          topic: topic.trim(),
          answerText: data.ocrText || answerText.trim() || 'Handwritten Essay',
          score: data.evaluation.score,
          evaluation: data.evaluation,
          wordCount: data.wordCount || wordCount,
          image: selectedImage ? 'stored_locally' : null // Don't save full base64 to avoid storage limits
        });

        // Reload history
        await loadEssayHistory();

        Alert.alert(
          'Evaluation Complete! 🎉',
          `Your essay scored ${data.evaluation.score}/100`,
          [{ text: 'View Results', style: 'default' }]
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Essay evaluation error:', error);
      Alert.alert(
        'Evaluation Failed',
        error.message || 'Failed to evaluate essay. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle document upload (OCR Implementation)
  const handleUploadDocument = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.3, // Compress image to avoid payload limits
        base64: true, // Get base64 for API
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setSelectedImage(result.assets[0].base64);
        Alert.alert(
          'Image Selected',
          'Your handwritten essay has been attached. Click "Evaluate Essay" to transcribe and analyze it.'
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Clear form
  const handleClear = () => {
    Alert.alert(
      'Clear Essay',
      'Are you sure you want to clear your essay?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setTopic('');
            setAnswerText('');
            setEvaluation(null);
          },
        },
      ]
    );
  };

  // Render score badge
  const renderScoreBadge = (score) => {
    let color = '#FF3B30';
    let label = 'Needs Improvement';

    if (score >= 80) {
      color = '#34C759';
      label = 'Excellent';
    } else if (score >= 60) {
      color = '#FF9500';
      label = 'Good';
    } else if (score >= 40) {
      color = '#FFCC00';
      label = 'Average';
    }

    return (
      <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  // Render evaluation results
  const renderEvaluation = () => {
    if (!evaluation) return null;

    return (
      <View style={styles.evaluationSection}>
        {/* Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}>
          {renderScoreBadge(evaluation.score)}
          <Text style={[styles.examinerRemark, { color: theme.colors.text }]}>
            {evaluation.examinerRemark}
          </Text>
        </View>

        {/* Strengths */}
        <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Strengths</Text>
          </View>
          {evaluation.strengths?.map((strength, index) => (
            <Text key={index} style={[styles.feedbackItem, { color: theme.colors.text }]}>
              • {strength}
            </Text>
          ))}
        </View>

        {/* Weaknesses */}
        <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="alert-circle" size={20} color="#FF9500" />
            <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Areas to Improve</Text>
          </View>
          {evaluation.weaknesses?.map((weakness, index) => (
            <Text key={index} style={[styles.feedbackItem, { color: theme.colors.text }]}>
              • {weakness}
            </Text>
          ))}
        </View>

        {/* Improvement Plan */}
        <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="bulb" size={20} color="#007AFF" />
            <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Action Plan</Text>
          </View>
          {evaluation.improvementPlan?.map((plan, index) => (
            <Text key={index} style={[styles.feedbackItem, { color: theme.colors.text }]}>
              {index + 1}. {plan}
            </Text>
          ))}
        </View>

        {/* Rewritten Intro */}
        {evaluation.rewrittenIntro && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="create" size={20} color="#8E54E9" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Improved Introduction</Text>
            </View>
            <Text style={[styles.rewrittenText, { color: theme.colors.textSecondary }]}>
              {evaluation.rewrittenIntro}
            </Text>
          </View>
        )}

        {/* Rewritten Conclusion */}
        {evaluation.rewrittenConclusion && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="create" size={20} color="#8E54E9" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Improved Conclusion</Text>
            </View>
            <Text style={[styles.rewrittenText, { color: theme.colors.textSecondary }]}>
              {evaluation.rewrittenConclusion}
            </Text>
          </View>
        )}

        {/* Detailed Feedback */}
        {evaluation.detailedFeedback && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="document-text" size={20} color="#FF2D55" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Detailed Analysis</Text>
            </View>
            {Object.entries(evaluation.detailedFeedback).map(([key, value]) => (
              <View key={key} style={styles.detailedItem}>
                <Text style={[styles.detailedLabel, { color: theme.colors.primary }]}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                </Text>
                <Text style={[styles.detailedText, { color: theme.colors.text }]}>{value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Essay Evaluation</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            AI-powered feedback for UPSC Mains
          </Text>
        </View>

        {/* Topic Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Essay Topic *</Text>
          <SmartTextInput
            style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="Enter your essay topic..."
            placeholderTextColor={theme.colors.textTertiary}
            value={topic}
            onChangeText={setTopic}
            multiline
            editable={!isEvaluating}
          />
        </View>

        {/* Word Limit Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Target Word Limit</Text>
          <View style={styles.optionRow}>
            {['250', '500', '750', '1000', '1250'].map((limit) => (
              <TouchableOpacity
                key={limit}
                style={[
                  styles.optionChip,
                  { backgroundColor: theme.colors.surface },
                  wordLimit === limit && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }
                ]}
                onPress={() => setWordLimit(limit)}
                disabled={isEvaluating}
              >
                <Text style={[
                  styles.optionText,
                  { color: theme.colors.text },
                  wordLimit === limit && { color: theme.colors.primary }
                ]}>
                  {limit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Essay Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Essay (Handwritten)</Text>

          {/* Image Upload / Preview */}
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
              <View style={styles.imageActions}>
                <Text style={[styles.imageAttachedText, { color: theme.colors.primary }]}>
                  <Ionicons name="checkmark-circle" size={16} /> Handwritten Essay Attached
                </Text>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                  disabled={isEvaluating}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.colors.surfaceSecondary }]}
              onPress={handleUploadDocument}
              disabled={isEvaluating}
            >
              <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.uploadText, { color: theme.colors.primary }]}>
                Upload / Scan Handwritten Essay
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleClear}
            disabled={isEvaluating}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            <Text style={[styles.secondaryButtonText, { color: '#FF3B30' }]}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.evaluateButton, (!topic || (!answerText && !selectedImage) || isEvaluating) && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleEvaluate}
            disabled={!topic || (!answerText && !selectedImage) || isEvaluating}
          >
            <LinearGradient
              colors={(!topic || (!answerText && !selectedImage) || isEvaluating) ? ['#C7C7CC', '#A1A1A6'] : ['#8E54E9', '#6B3FD6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isEvaluating ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.buttonText}>Evaluating...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Evaluate Essay</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Evaluation Results */}
        {renderEvaluation()}

        {/* Info Card */}
        {!evaluation && (
          <View style={[styles.infoCard, { backgroundColor: theme.colors.infoBg }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.info }]}>
              <Ionicons name="information-circle" size={16} color={theme.colors.info} /> How it works
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              • Write your essay on any UPSC-relevant topic{'\n'}
              • Get AI-powered evaluation with detailed feedback{'\n'}
              • Receive a score out of 100 based on UPSC standards{'\n'}
              • Get specific improvement suggestions{'\n'}
              • All evaluations are saved locally on your device
            </Text>
          </View>
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
    marginBottom: 24,
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
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  wordCount: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  essayInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  evaluateButton: {
    flex: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  evaluationSection: {
    marginTop: 8,
    gap: 16,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  examinerRemark: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  feedbackItem: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  rewrittenText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  detailedItem: {
    marginBottom: 12,
  },
  detailedLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  detailedText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  infoCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  imagePreviewContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  imageAttachedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeImageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FF3B3020',
  },
  removeImageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
