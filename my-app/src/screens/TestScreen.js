import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';

export default function TestScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const { config, questions: passedQuestions } = route.params || {};
  const timeLimit = parseInt(config?.timeLimit || '15') * 60; // Convert to seconds
  
  const questions = passedQuestions || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [testStartTime] = useState(Date.now());
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / questions.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex) => {
    setAnswers({ ...answers, [currentIndex]: optionIndex });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    
    Alert.alert(
      'Submit Test',
      'Are you sure you want to submit your test?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            navigation.replace('Result', {
              questions,
              answers,
              timeTaken,
              config,
            });
          },
        },
      ]
    );
  };

  const currentQuestion = questions[currentIndex];
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Timer */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, paddingHorizontal: horizontalPadding || 20 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.exitText}>✕ Exit</Text>
          </TouchableOpacity>
          <View style={[styles.timerBadge, { backgroundColor: theme.colors.background }, timeRemaining < 60 && styles.timerWarning]}>
            <Text style={[styles.timerText, { color: theme.colors.text }, timeRemaining < 60 && styles.timerTextWarning]}>
              ⏱ {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: theme.colors.border }]}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Question Card */}
        <View style={[styles.questionCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>Q{currentIndex + 1}</Text>
          <Text style={[styles.questionText, { color: theme.colors.text }]}>{currentQuestion.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentIndex] === index;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionCard, { backgroundColor: theme.colors.surface }, isSelected && [styles.optionSelected, { backgroundColor: isDark ? '#1A3A5C' : '#F0F7FF' }]]}
                activeOpacity={0.7}
                onPress={() => handleAnswer(index)}
              >
                <View style={[styles.optionBadge, { backgroundColor: theme.colors.background }, isSelected && styles.optionBadgeSelected]}>
                  <Text style={[styles.optionLetter, { color: theme.colors.textSecondary }, isSelected && styles.optionLetterSelected]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text }, isSelected && [styles.optionTextSelected, { color: theme.colors.primary }]]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Question Navigator */}
        <View style={[styles.navigator, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.navigatorTitle, { color: theme.colors.textSecondary }]}>Quick Jump</Text>
          <View style={styles.navigatorGrid}>
            {questions.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.navDot,
                  { backgroundColor: theme.colors.background },
                  answers[index] !== undefined && styles.navDotAnswered,
                  currentIndex === index && styles.navDotCurrent,
                ]}
                onPress={() => setCurrentIndex(index)}
              >
                <Text style={[
                  styles.navDotText,
                  { color: theme.colors.textSecondary },
                  answers[index] !== undefined && styles.navDotTextAnswered,
                  currentIndex === index && styles.navDotTextCurrent,
                ]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingHorizontal: horizontalPadding || 20 }]}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navButtonText, { color: theme.colors.primary }, currentIndex === 0 && [styles.navButtonTextDisabled, { color: theme.colors.textSecondary }]]}>
            ← Previous
          </Text>
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Test</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exitText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FF3B30',
    letterSpacing: -0.3,
  },
  timerBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerWarning: {
    backgroundColor: '#FFE5E5',
  },
  timerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  timerTextWarning: {
    color: '#FF3B30',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1C1C1E',
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionBadgeSelected: {
    backgroundColor: '#007AFF',
  },
  optionLetter: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  optionLetterSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  optionTextSelected: {
    fontWeight: '500',
    color: '#007AFF',
  },
  navigator: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  navigatorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  navigatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  navDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navDotAnswered: {
    backgroundColor: '#34C759',
  },
  navDotCurrent: {
    backgroundColor: '#007AFF',
  },
  navDotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  navDotTextAnswered: {
    color: '#FFFFFF',
  },
  navDotTextCurrent: {
    color: '#FFFFFF',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#007AFF',
    letterSpacing: -0.4,
  },
  navButtonTextDisabled: {
    color: '#8E8E93',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  submitButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});

