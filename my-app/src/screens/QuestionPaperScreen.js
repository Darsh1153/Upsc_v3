import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../features/Reference/theme/ThemeContext';

const QuestionPaperScreen = ({ navigation, route }) => {
    const { setId, title } = route.params || {};
    const { theme, isDark } = useTheme();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    // Track selected option for each question: { questionId: selectedOptionKey }
    const [selectedAnswers, setSelectedAnswers] = useState({});

    useEffect(() => {
        if (setId) {
            fetchQuestions();
        }
    }, [setId]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('practice_questions')
                .select('*')
                .eq('question_set_id', setId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setQuestions(data || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
            Alert.alert('Error', 'Failed to load questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (questionId, optionKey) => {
        // If already answered, do nothing
        if (selectedAnswers[questionId]) return;

        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: optionKey
        }));
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                    {title || 'Question Paper'}
                </Text>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    onPress={fetchQuestions}
                >
                    <Ionicons name="refresh" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {questions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                No questions available yet.
                            </Text>
                        </View>
                    ) : (
                        questions.map((q, index) => {
                            const userSelectedOption = selectedAnswers[q.id];
                            const isAnswered = !!userSelectedOption;
                            const correctAnswer = q.correct_answer; // 'A', 'B', 'C', 'D'

                            return (
                                <View key={q.id} style={[styles.questionCard, { backgroundColor: theme.colors.surface }]}>
                                    <View style={styles.questionHeader}>
                                        <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>Q{index + 1}</Text>
                                        {!isAnswered && (
                                            <View style={styles.unansweredBadge}>
                                                <Text style={styles.unansweredText}>Unattempted</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={[styles.questionText, { color: theme.colors.text }]}>{q.question}</Text>

                                    <View style={styles.optionsContainer}>
                                        {['A', 'B', 'C', 'D'].map((opt) => {
                                            const dbKey = `option_${opt.toLowerCase()}`;
                                            const optionText = q[dbKey];

                                            // Determine styles based on state
                                            let optionStyle = { borderColor: theme.colors.border };
                                            let badgeStyle = { backgroundColor: theme.colors.border };
                                            let badgeTextStyle = { color: theme.colors.textSecondary };

                                            const isSelected = userSelectedOption === opt;
                                            const isCorrect = correctAnswer === opt;

                                            if (isAnswered) {
                                                if (isCorrect) {
                                                    // This is the correct answer - showing green
                                                    optionStyle = {
                                                        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
                                                        borderColor: '#22C55E',
                                                        borderWidth: 1
                                                    };
                                                    badgeStyle = { backgroundColor: '#22C55E' };
                                                    badgeTextStyle = { color: '#FFFFFF' };
                                                } else if (isSelected && !isCorrect) {
                                                    // User selected this, but it's wrong - showing red
                                                    optionStyle = {
                                                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                                                        borderColor: '#EF4444',
                                                        borderWidth: 1
                                                    };
                                                    badgeStyle = { backgroundColor: '#EF4444' };
                                                    badgeTextStyle = { color: '#FFFFFF' };
                                                }
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={opt}
                                                    activeOpacity={isAnswered ? 1 : 0.7}
                                                    onPress={() => handleOptionSelect(q.id, opt)}
                                                    style={[
                                                        styles.optionRow,
                                                        optionStyle
                                                    ]}
                                                >
                                                    <View style={[styles.optionBadge, badgeStyle]}>
                                                        <Text style={[styles.optionBadgeText, badgeTextStyle]}>{opt}</Text>
                                                    </View>
                                                    <Text style={[styles.optionText, { color: theme.colors.text }]}>{optionText}</Text>

                                                    {isAnswered && isCorrect && (
                                                        <Ionicons name="checkmark-circle" size={24} color="#22C55E" style={styles.feedbackIcon} />
                                                    )}
                                                    {isAnswered && isSelected && !isCorrect && (
                                                        <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.feedbackIcon} />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {/* Explanation shows strictly after answering */}
                                    {isAnswered && (
                                        <View style={[styles.explanationContainer, {
                                            backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                                            borderLeftColor: userSelectedOption === correctAnswer
                                                ? '#22C55E' // Green border if correct
                                                : '#EF4444' // Red border if wrong
                                        }]}>
                                            <Text style={[styles.explanationTitle, { color: theme.colors.text }]}>
                                                {userSelectedOption === correctAnswer ? 'Correct Answer!' : `Correct Answer: Option ${correctAnswer}`}
                                            </Text>
                                            <Text style={[styles.explanationLabel, { color: theme.colors.textSecondary }]}>Explanation:</Text>
                                            <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>{q.explanation}</Text>
                                        </View>
                                    )}
                                </View>
                            )
                        })
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    questionCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: '700',
    },
    unansweredBadge: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    unansweredText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#6B7280',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        marginBottom: 20,
    },
    optionsContainer: {
        gap: 12,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    optionText: {
        flex: 1,
        fontSize: 15,
    },
    feedbackIcon: {
        marginLeft: 8,
    },
    explanationContainer: {
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    explanationTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    explanationLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        opacity: 0.7,
    },
    explanationText: {
        fontSize: 14,
        lineHeight: 22,
    },
});

export default QuestionPaperScreen;
