import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Linking,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getMobileApiEndpoint } from '../config/api';

export default function ArticleDetailScreen({ route, navigation }) {
  const { articleId } = route.params;
  const { theme, isDark } = useTheme();
  const { horizontalPadding } = useWebStyles();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [mcqsLoading, setMcqsLoading] = useState(false);
  const [generatingMCQs, setGeneratingMCQs] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { mcqId: 'A' | 'B' | 'C' | 'D' }
  const [showResults, setShowResults] = useState({}); // { mcqId: true/false }
  const [animationValues, setAnimationValues] = useState({}); // { mcqId: Animated.Value }
  const [feedbackAnimations, setFeedbackAnimations] = useState({}); // { mcqId: Animated.Value }
  const [shuffledMcqs, setShuffledMcqs] = useState({}); // { mcqId: { shuffledOptions: { A: text, B: text, C: text, D: text }, correctAnswer: 'A' } }

  useEffect(() => {
    fetchArticle();
    fetchMCQs();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const endpoint = getMobileApiEndpoint(`/articles/${articleId}`);
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setArticle(data.article);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load article. Please try again.');
      console.error('Fetch article error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${article.title}\n\nRead more on UPSC Prep App`,
        title: article.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenSource = () => {
    if (article.sourceUrl) {
      Linking.openURL(article.sourceUrl);
    }
  };

  const fetchMCQs = async () => {
    try {
      setMcqsLoading(true);
      console.log('[ArticleDetailScreen] Fetching MCQs for article:', articleId);
      const endpoint = getMobileApiEndpoint(`/articles/${articleId}/mcqs`);
      console.log('[ArticleDetailScreen] API URL:', endpoint);

      const response = await fetch(endpoint);
      console.log('[ArticleDetailScreen] MCQs response status:', response.status);

      const data = await response.json();
      console.log('[ArticleDetailScreen] MCQs response data:', data);

      if (data.mcqs) {
        console.log('[ArticleDetailScreen] Setting MCQs:', data.mcqs.length);
        setMcqs(data.mcqs);
      } else if (data.error) {
        console.error('[ArticleDetailScreen] MCQs fetch error:', data.error);
      }
    } catch (err) {
      console.error('[ArticleDetailScreen] Fetch MCQs error:', err);
      console.error('[ArticleDetailScreen] Error details:', err.message);
    } finally {
      setMcqsLoading(false);
    }
  };

  const handleGenerateMCQs = async () => {
    try {
      setGeneratingMCQs(true);
      console.log('[ArticleDetailScreen] Generating MCQs for article:', articleId);
      const endpoint = getMobileApiEndpoint(`/articles/${articleId}/mcqs/generate`);
      console.log('[ArticleDetailScreen] API URL:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[ArticleDetailScreen] Generate MCQs response status:', response.status);

      const data = await response.json();
      console.log('[ArticleDetailScreen] Generate MCQs response data:', data);

      if (response.ok && data.mcqs) {
        console.log('[ArticleDetailScreen] Successfully generated MCQs:', data.count);
        setMcqs(data.mcqs);
        alert(`Successfully generated ${data.count} MCQs!`);
      } else {
        console.error('[ArticleDetailScreen] Generate MCQs failed:', data.error, data.details);
        alert(data.error || data.details || 'Failed to generate MCQs. Please try again.');
      }
    } catch (err) {
      console.error('[ArticleDetailScreen] Generate MCQs error:', err);
      console.error('[ArticleDetailScreen] Error details:', err.message);
      alert('Failed to generate MCQs. Please try again.');
    } finally {
      setGeneratingMCQs(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Shuffle array function (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize animation values and shuffle option values when MCQs are loaded
  useEffect(() => {
    if (mcqs.length > 0) {
      const newAnimations = {};
      const newFeedbackAnimations = {};
      const newShuffledMcqs = {};

      mcqs.forEach((mcq) => {
        newAnimations[mcq.id] = new Animated.Value(1);
        newFeedbackAnimations[mcq.id] = new Animated.Value(0);

        // Get original option values
        const originalOptions = [
          { label: 'A', text: mcq.optionA },
          { label: 'B', text: mcq.optionB },
          { label: 'C', text: mcq.optionC },
          { label: 'D', text: mcq.optionD },
        ];

        // Shuffle the option values (text), but keep labels A, B, C, D in order
        const shuffledOptions = shuffleArray(originalOptions);

        // Create shuffled options object with labels A, B, C, D in order
        const shuffledOptionsMap = {
          A: shuffledOptions[0].text,
          B: shuffledOptions[1].text,
          C: shuffledOptions[2].text,
          D: shuffledOptions[3].text,
        };

        // Find which label (A, B, C, or D) now contains the originally correct answer's text
        const originalCorrectText = mcq[`option${mcq.correctAnswer}`];
        const newCorrectAnswer = Object.keys(shuffledOptionsMap).find(
          label => shuffledOptionsMap[label] === originalCorrectText
        ) || mcq.correctAnswer; // Fallback to original if not found

        newShuffledMcqs[mcq.id] = {
          shuffledOptions: shuffledOptionsMap,
          correctAnswer: newCorrectAnswer,
        };

        console.log(`[MCQ ${mcq.id}] Original correct: ${mcq.correctAnswer}, New correct: ${newCorrectAnswer}`);
      });

      setAnimationValues(newAnimations);
      setFeedbackAnimations(newFeedbackAnimations);
      setShuffledMcqs(newShuffledMcqs);
    }
  }, [mcqs]);

  // Handle option selection
  const handleOptionSelect = (mcqId, selectedOption) => {
    const shuffledData = shuffledMcqs[mcqId];
    if (!shuffledData) {
      console.error('Shuffled data not found for MCQ:', mcqId);
      return;
    }

    const isCorrect = selectedOption === shuffledData.correctAnswer;

    setSelectedAnswers((prev) => ({
      ...prev,
      [mcqId]: selectedOption, // Store selected option for comparison
    }));

    // Show result immediately
    setShowResults((prev) => ({
      ...prev,
      [mcqId]: true,
    }));

    // Animate feedback
    if (animationValues[mcqId] && feedbackAnimations[mcqId]) {
      // Pulse animation - bounce effect
      Animated.sequence([
        Animated.spring(animationValues[mcqId], {
          toValue: 1.15,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(animationValues[mcqId], {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Feedback animation - fade in with scale, stay, then fade out
      feedbackAnimations[mcqId].setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(feedbackAnimations[mcqId], {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2500),
        Animated.timing(feedbackAnimations[mcqId], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      console.warn('[ArticleDetailScreen] Animation values not found for MCQ:', mcqId);
    }

    // Haptic feedback (if available)
    if (Platform.OS !== 'web') {
      // You can add haptic feedback here if needed
    }
  };

  // Generate and download report
  const handleDownloadReport = async () => {
    try {
      const totalQuestions = mcqs.length;
      const answeredQuestions = Object.keys(selectedAnswers).length;
      const correctAnswers = mcqs.filter((mcq) => {
        const shuffledData = shuffledMcqs[mcq.id];
        if (shuffledData) {
          return selectedAnswers[mcq.id] === shuffledData.correctAnswer;
        }
        return selectedAnswers[mcq.id] === mcq.correctAnswer;
      }).length;
      const wrongAnswers = answeredQuestions - correctAnswers;
      const score = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0;

      let reportContent = `MCQ TEST REPORT\n`;
      reportContent += `========================\n\n`;
      reportContent += `Article: ${article.title}\n`;
      reportContent += `Date: ${new Date().toLocaleString('en-IN')}\n\n`;
      reportContent += `SUMMARY\n`;
      reportContent += `-------\n`;
      reportContent += `Total Questions: ${totalQuestions}\n`;
      reportContent += `Answered: ${answeredQuestions}\n`;
      reportContent += `Correct: ${correctAnswers}\n`;
      reportContent += `Wrong: ${wrongAnswers}\n`;
      reportContent += `Score: ${score}%\n\n`;
      reportContent += `DETAILED RESULTS\n`;
      reportContent += `----------------\n\n`;

      mcqs.forEach((mcq, index) => {
        const shuffledData = shuffledMcqs[mcq.id];
        const selected = selectedAnswers[mcq.id];
        const isCorrect = shuffledData ? selected === shuffledData.correctAnswer : selected === mcq.correctAnswer;
        const status = selected
          ? isCorrect
            ? '✓ CORRECT'
            : '✗ WRONG'
          : 'NOT ANSWERED';

        reportContent += `Question ${index + 1}: ${mcq.question}\n`;

        // Use shuffled options if available, otherwise use original
        if (shuffledData) {
          reportContent += `A. ${shuffledData.shuffledOptions.A}\n`;
          reportContent += `B. ${shuffledData.shuffledOptions.B}\n`;
          reportContent += `C. ${shuffledData.shuffledOptions.C}\n`;
          reportContent += `D. ${shuffledData.shuffledOptions.D}\n`;
          reportContent += `Correct Answer: ${shuffledData.correctAnswer}\n`;
        } else {
          reportContent += `A. ${mcq.optionA}\n`;
          reportContent += `B. ${mcq.optionB}\n`;
          reportContent += `C. ${mcq.optionC}\n`;
          reportContent += `D. ${mcq.optionD}\n`;
          reportContent += `Correct Answer: ${mcq.correctAnswer}\n`;
        }

        reportContent += `Your Answer: ${selected || 'Not answered'}\n`;
        reportContent += `Status: ${status}\n`;
        if (mcq.explanation) {
          reportContent += `Explanation: ${mcq.explanation}\n`;
        }
        reportContent += `\n---\n\n`;
      });

      // Handle web platform
      if (Platform.OS === 'web') {
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MCQ_Report_${article.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Create file for mobile platforms
      const fileName = `MCQ_Report_${article.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, reportContent);

      // Share or download
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Download MCQ Report',
        });
      } else {
        // Fallback: use Share API
        await Share.share({
          message: reportContent,
          title: 'MCQ Test Report',
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const renderContentBlock = (block, index) => {
    switch (block.type) {
      case 'heading':
        const HeadingStyle = block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3;
        return (
          <Text key={index} style={[HeadingStyle, { color: theme.colors.text }]}>
            {block.content}
          </Text>
        );
      case 'paragraph':
        return (
          <Text key={index} style={[styles.paragraph, { color: theme.colors.text }]}>
            {block.content}
          </Text>
        );
      case 'quote':
        return (
          <View key={index} style={[styles.quoteContainer, { borderLeftColor: theme.colors.primary }]}>
            <Text style={[styles.quoteText, { color: theme.colors.textSecondary }]}>
              {block.content}
            </Text>
          </View>
        );
      case 'unordered-list':
      case 'ordered-list':
        return (
          <View key={index} style={styles.listContainer}>
            {(block.items || []).map((item, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: theme.colors.primary }]}>
                  {block.type === 'ordered-list' ? `${i + 1}.` : '•'}
                </Text>
                <Text style={[styles.listText, { color: theme.colors.text }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        );
      default:
        if (block.content) {
          return (
            <Text key={index} style={[styles.paragraph, { color: theme.colors.text }]}>
              {block.content}
            </Text>
          );
        }
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading article...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding || 20 }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Error</Text>
          <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
            {error || 'Article not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchArticle}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding || 20 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {article.sourceUrl && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleOpenSource}
            >
              <Ionicons name="open-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Header */}
        <View style={styles.articleHeader}>
          {/* Badges */}
          <View style={styles.badgesContainer}>
            {article.gsPaper && (
              <View style={[styles.paperBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.paperBadgeText, { color: theme.colors.primary }]}>
                  {article.gsPaper}
                </Text>
              </View>
            )}
            {article.subject && (
              <View style={[styles.subjectBadge, { backgroundColor: isDark ? '#4A4A52' : '#F0F0F5' }]}>
                <Text style={[styles.subjectBadgeText, { color: theme.colors.textSecondary }]}>
                  {article.subject}
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {article.title}
          </Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {article.author && (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {article.author}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {formatDate(article.publishedDate || article.createdAt)}
              </Text>
            </View>
          </View>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {article.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}>
                  <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Summary */}
        {article.summary && (
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="bulb-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Key Takeaway</Text>
            </View>
            <View style={styles.summaryContent}>
              {article.summary.split('\n').map((line, index) => {
                // Remove all asterisks/stars from the line
                const cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '').trim();

                // Skip empty lines
                if (!cleanLine) return null;

                // Check if it's a numbered list item (starts with number and period)
                const numberMatch = cleanLine.match(/^(\d+)\.\s*(.+)$/);

                if (numberMatch) {
                  const [, number, text] = numberMatch;
                  return (
                    <View key={index} style={styles.summaryListItem}>
                      <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>
                        {number}.
                      </Text>
                      <Text style={[styles.summaryItemText, { color: theme.colors.textSecondary }]}>
                        {text}
                      </Text>
                    </View>
                  );
                }

                // Regular paragraph line
                return (
                  <Text
                    key={index}
                    style={[styles.summaryText, { color: theme.colors.textSecondary }]}
                  >
                    {cleanLine}
                  </Text>
                );
              })}
            </View>
          </View>
        )}

        {/* Generate MCQs Button */}
        {/*
        <TouchableOpacity
          style={[styles.generateMCQsButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleGenerateMCQs}
          disabled={generatingMCQs || mcqs.length > 0}
        >
          {generatingMCQs ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.generateMCQsButtonText}>Generating MCQs...</Text>
            </>
          ) : mcqs.length > 0 ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.generateMCQsButtonText}>MCQs Generated ({mcqs.length})</Text>
            </>
          ) : (
            <>
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.generateMCQsButtonText}>Generate MCQs</Text>
            </>
          )}
        </TouchableOpacity>
        */}

        {/* MCQs Section */}
        {mcqsLoading ? (
          <View style={styles.mcqsLoadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.mcqsLoadingText, { color: theme.colors.textSecondary }]}>
              Loading MCQs...
            </Text>
          </View>
        ) : mcqs.length > 0 ? (
          <View style={styles.mcqsContainer}>
            <View style={styles.mcqsHeader}>
              <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.mcqsTitle, { color: theme.colors.text }]}>
                Multiple Choice Questions ({mcqs.length})
              </Text>
              {Object.keys(selectedAnswers).length > 0 && (
                <TouchableOpacity
                  style={[styles.downloadReportButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleDownloadReport}
                >
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadReportButtonText}>Download Report</Text>
                </TouchableOpacity>
              )}
            </View>
            {mcqs.map((mcq, index) => {
              // Safety check: ensure MCQ has required properties
              if (!mcq || !mcq.id) {
                console.error('[ArticleDetailScreen] Invalid MCQ:', mcq);
                return null;
              }

              const shuffledData = shuffledMcqs[mcq.id];
              if (!shuffledData) {
                // Show loading state if shuffled data not ready
                return (
                  <View key={mcq.id || index} style={[styles.mcqCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.mcqQuestion, { color: theme.colors.text }]}>
                      {index + 1}. {mcq.question.replace(/^:\s*/, '')}
                    </Text>
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 20 }} />
                  </View>
                );
              }

              const selected = selectedAnswers[mcq.id];
              const isCorrect = selected === shuffledData.correctAnswer;
              const showResult = showResults[mcq.id];
              const animValue = animationValues[mcq.id] || new Animated.Value(1);
              const feedbackAnim = feedbackAnimations[mcq.id] || new Animated.Value(0);

              const getOptionStyle = (option) => {
                if (!showResult) {
                  return selected === option
                    ? { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary, borderWidth: 2 }
                    : { backgroundColor: isDark ? '#2A2A2E' : '#F5F5F7' };
                }

                if (option === shuffledData.correctAnswer) {
                  return { backgroundColor: '#10B981' + '30', borderColor: '#10B981', borderWidth: 2 };
                }
                if (selected === option && !isCorrect) {
                  return { backgroundColor: '#EF4444' + '30', borderColor: '#EF4444', borderWidth: 2 };
                }
                return { backgroundColor: isDark ? '#2A2A2E' : '#F5F5F7' };
              };

              const getOptionIcon = (option) => {
                if (!showResult) return null;
                if (option === shuffledData.correctAnswer) {
                  return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
                }
                if (selected === option && !isCorrect) {
                  return <Ionicons name="close-circle" size={20} color="#EF4444" />;
                }
                return null;
              };

              const feedbackOpacity = feedbackAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });

              const feedbackScale = feedbackAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 1.1, 1],
              });

              return (
                <Animated.View
                  key={mcq.id || index}
                  style={[
                    styles.mcqCard,
                    { backgroundColor: theme.colors.surface },
                    { transform: [{ scale: animValue }] },
                  ]}
                >
                  <Text style={[styles.mcqQuestion, { color: theme.colors.text }]}>
                    {index + 1}. {mcq.question.replace(/^:\s*/, '')}
                  </Text>

                  {/* Feedback Animation */}
                  {showResult && (
                    <Animated.View
                      style={[
                        styles.feedbackContainer,
                        {
                          opacity: feedbackOpacity,
                          transform: [{ scale: feedbackScale }],
                          backgroundColor: isCorrect ? '#10B981' + '20' : '#EF4444' + '20',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={24}
                        color={isCorrect ? '#10B981' : '#EF4444'}
                      />
                      <Text
                        style={[
                          styles.feedbackText,
                          { color: isCorrect ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {isCorrect ? 'Correct!' : 'Wrong Answer'}
                      </Text>
                    </Animated.View>
                  )}

                  <View style={styles.mcqOptions}>
                    {['A', 'B', 'C', 'D'].map((option) => {
                      // Get shuffled option text
                      const optionText = shuffledData.shuffledOptions[option];

                      if (!optionText) {
                        console.error('[ArticleDetailScreen] Missing option text for:', option, 'in MCQ:', mcq.id);
                        return null;
                      }

                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.mcqOption,
                            getOptionStyle(option),
                            selected === option && !showResult && styles.selectedOption,
                          ]}
                          onPress={() => !showResult && handleOptionSelect(mcq.id, option)}
                          disabled={showResult}
                        >
                          <View style={styles.mcqOptionContent}>
                            <Text style={[styles.mcqOptionLabel, { color: theme.colors.primary }]}>
                              {option}.
                            </Text>
                            <Text style={[styles.mcqOptionText, { color: theme.colors.text }]}>
                              {optionText}
                            </Text>
                            {getOptionIcon(option)}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {showResult && (
                    <View style={[styles.mcqAnswer, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Text style={[styles.mcqAnswerLabel, { color: theme.colors.primary }]}>
                        Correct Answer: {shuffledData.correctAnswer}
                      </Text>
                      {mcq.explanation && (
                        <Text style={[styles.mcqExplanation, { color: theme.colors.textSecondary }]}>
                          {mcq.explanation}
                        </Text>
                      )}
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        ) : null}

        {/* Content */}

        {/* Source Link */}
        {article.sourceUrl && (
          <TouchableOpacity
            style={[styles.sourceButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleOpenSource}
          >
            <Ionicons name="link-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.sourceButtonText, { color: theme.colors.primary }]}>
              Read Original Article
            </Text>
            <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  articleHeader: {
    marginBottom: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  paperBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paperBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subjectBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '400',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryContent: {
    marginTop: 4,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  summaryListItem: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingRight: 8,
  },
  summaryNumber: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 28,
    marginRight: 8,
    lineHeight: 26,
  },
  summaryItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  contentContainer: {
    marginBottom: 24,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  quoteContainer: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginVertical: 16,
    paddingVertical: 8,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  listContainer: {
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  listBullet: {
    fontSize: 16,
    fontWeight: '600',
    width: 24,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  sourceButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  generateMCQsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  generateMCQsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mcqsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    marginBottom: 24,
  },
  mcqsLoadingText: {
    fontSize: 14,
    fontWeight: '400',
  },
  mcqsContainer: {
    marginBottom: 24,
  },
  mcqsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mcqsTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  downloadReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadReportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mcqCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  mcqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 12,
  },
  mcqOptions: {
    gap: 8,
    marginBottom: 12,
  },
  mcqOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#3B82F6',
  },
  mcqOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  mcqOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
  },
  mcqOptionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mcqAnswer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  mcqAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  mcqExplanation: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});

