/**
 * AI MCQ Generator Screen
 * 
 * Generates UPSC-level MCQs using AI based on:
 * - Exam Type (Prelims/Mains)
 * - Paper Type (GS1, GS2, GS3, GS4, Optional)
 * - Difficulty Level (Beginner, Pro, Advanced)
 * - Language (English/Hindi)
 * - Number of Questions
 * 
 * Works on: Web, iOS, Android
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import { useTheme } from '../../Reference/theme/ThemeContext';
// @ts-ignore
import { useWebStyles } from '../../../components/WebContainer';
import { API_BASE_URL } from '../../../config/api';

// ===================== CONFIGURATION =====================
// ===================== CONFIGURATION =====================
// API Key is now handled in backend


// ===================== TYPES =====================
interface MCQ {
    id: number;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string;
}

type DifficultyLevel = 'beginner' | 'pro' | 'advanced';
type ExamType = 'prelims' | 'mains';
type PaperType = 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Optional';
type Language = 'english' | 'hindi';

// ===================== DIFFICULTY PROMPTS =====================
const DIFFICULTY_PROMPTS: Record<DifficultyLevel, string> = {
    beginner: `You are creating MCQs for UPSC aspirants who are just starting their preparation.
DIFFICULTY: BEGINNER
- Questions should test basic factual knowledge
- Options should have one clearly correct answer
- Avoid tricky or nuanced questions
- Focus on fundamental concepts and direct information
- Questions that 70-80% of serious aspirants would answer correctly`,

    pro: `You are creating MCQs for UPSC aspirants at an intermediate level.
DIFFICULTY: PRO (Intermediate)
- Questions should require understanding of concepts, not just memorization
- Include some application-based questions
- Options should be carefully crafted with plausible distractors
- Test connections between different topics
- Moderate complexity - questions that 40-60% of serious aspirants would answer correctly
- Similar to actual UPSC Prelims difficulty`,

    advanced: `You are creating MCQs for UPSC aspirants aiming for top ranks (India's top 0.1%).
DIFFICULTY: ADVANCED (Expert Level)
- Questions should test deep understanding and analytical ability
- Include multi-concept questions that require connecting various topics
- Create subtle distinctions in options that require careful analysis
- Include statement-based questions with complex combinations
- Test exceptions, recent amendments, and nuanced interpretations
- Questions that only 15-25% of serious aspirants would answer correctly
- Similar to the most difficult UPSC Prelims questions`
};

const PAPER_TOPICS: Record<PaperType, string> = {
    GS1: 'History, Geography, Art & Culture, Indian Society',
    GS2: 'Polity, Governance, Constitution, International Relations, Social Justice',
    GS3: 'Economy, Environment, Science & Technology, Disaster Management, Security',
    GS4: 'Ethics, Integrity, Aptitude, Case Studies',
    Optional: 'General Knowledge across all subjects'
};

// ===================== EXPORT UTILITIES =====================
function exportToCSV(mcqs: MCQ[], selectedAnswers: Record<number, string>): void {
    const headers = ['Q.No', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Your Answer', 'Result', 'Explanation'];

    const rows = mcqs.map((mcq, index) => {
        const userAnswer = selectedAnswers[mcq.id] || 'Not Answered';
        const isCorrect = userAnswer === mcq.correctAnswer ? 'Correct' : (userAnswer === 'Not Answered' ? 'Skipped' : 'Wrong');

        return [
            index + 1,
            `"${mcq.question.replace(/"/g, '""')}"`,
            `"${mcq.optionA.replace(/"/g, '""')}"`,
            `"${mcq.optionB.replace(/"/g, '""')}"`,
            `"${mcq.optionC.replace(/"/g, '""')}"`,
            `"${mcq.optionD.replace(/"/g, '""')}"`,
            mcq.correctAnswer,
            userAnswer,
            isCorrect,
            `"${mcq.explanation.replace(/"/g, '""')}"`
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'mcq-results.csv', 'text/csv');
}

function exportToXLSX(mcqs: MCQ[], selectedAnswers: Record<number, string>): void {
    const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="MCQ Results"><Table>
<Row><Cell><Data ss:Type="String">Q.No</Data></Cell><Cell><Data ss:Type="String">Question</Data></Cell><Cell><Data ss:Type="String">Option A</Data></Cell><Cell><Data ss:Type="String">Option B</Data></Cell><Cell><Data ss:Type="String">Option C</Data></Cell><Cell><Data ss:Type="String">Option D</Data></Cell><Cell><Data ss:Type="String">Correct Answer</Data></Cell><Cell><Data ss:Type="String">Your Answer</Data></Cell><Cell><Data ss:Type="String">Result</Data></Cell><Cell><Data ss:Type="String">Explanation</Data></Cell></Row>`;

    mcqs.forEach((mcq, index) => {
        const userAnswer = selectedAnswers[mcq.id] || 'Not Answered';
        const isCorrect = userAnswer === mcq.correctAnswer ? 'Correct' : (userAnswer === 'Not Answered' ? 'Skipped' : 'Wrong');
        xmlContent += `<Row><Cell><Data ss:Type="Number">${index + 1}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(mcq.question)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(mcq.optionA)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(mcq.optionB)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(mcq.optionC)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(mcq.optionD)}</Data></Cell><Cell><Data ss:Type="String">${mcq.correctAnswer}</Data></Cell><Cell><Data ss:Type="String">${userAnswer}</Data></Cell><Cell><Data ss:Type="String">${isCorrect}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(mcq.explanation)}</Data></Cell></Row>`;
    });

    xmlContent += `</Table></Worksheet></Workbook>`;
    downloadFile(xmlContent, 'mcq-results.xls', 'application/vnd.ms-excel');
}

function exportToPDF(mcqs: MCQ[], selectedAnswers: Record<number, string>): void {
    let correct = 0, answered = 0;
    mcqs.forEach(mcq => {
        if (selectedAnswers[mcq.id]) {
            answered++;
            if (selectedAnswers[mcq.id] === mcq.correctAnswer) correct++;
        }
    });
    const scorePercent = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>MCQ Results Report</title>
<style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto}h1{color:#1a1a1a;text-align:center;border-bottom:2px solid #4F46E5;padding-bottom:10px}.summary{background:#f0f9ff;padding:15px;border-radius:8px;margin:20px 0;text-align:center}.score{font-size:32px;font-weight:bold;color:${scorePercent >= 70 ? '#10B981' : scorePercent >= 40 ? '#F59E0B' : '#EF4444'}}.mcq{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:15px;margin:15px 0}.question{font-weight:bold;font-size:14px;margin-bottom:10px}.option{padding:5px 10px;margin:3px 0;border-radius:4px}.correct{background:#d1fae5;border-left:3px solid #10B981}.wrong{background:#fee2e2;border-left:3px solid #EF4444}.explanation{background:#f3f4f6;padding:10px;border-radius:4px;font-size:12px;margin-top:10px}.result-tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold}.result-correct{background:#10B981;color:white}.result-wrong{background:#EF4444;color:white}.result-skipped{background:#9CA3AF;color:white}@media print{body{padding:0}.mcq{page-break-inside:avoid}}</style></head>
<body><h1>📝 MCQ Results Report</h1><div class="summary"><h2>Your Score</h2><div class="score">${scorePercent}%</div><p>${correct} correct out of ${answered} answered (${mcqs.length} total)</p></div>
${mcqs.map((mcq, i) => {
        const ua = selectedAnswers[mcq.id];
        const ic = ua === mcq.correctAnswer;
        const rc = !ua ? 'result-skipped' : ic ? 'result-correct' : 'result-wrong';
        const rt = !ua ? 'Skipped' : ic ? 'Correct' : 'Wrong';
        return `<div class="mcq"><div class="question">Q${i + 1}. ${mcq.question} <span class="result-tag ${rc}">${rt}</span></div><div class="options">${['A', 'B', 'C', 'D'].map(o => {
            const ot = mcq[`option${o}` as keyof MCQ];
            const ico = mcq.correctAnswer === o;
            const iua = ua === o;
            let oc = '';
            if (ico) oc = 'correct';
            else if (iua && !ic) oc = 'wrong';
            return `<div class="option ${oc}">${o}. ${ot} ${ico ? '✓' : ''}</div>`;
        }).join('')}</div><div class="explanation"><strong>Explanation:</strong> ${mcq.explanation}</div></div>`;
    }).join('')}
<p style="text-align:center;color:#9CA3AF;margin-top:30px">Generated by AI MCQ Generator</p></body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    if (Platform.OS !== 'web') {
        Alert.alert('Export', 'Export is only available on web platform');
        return;
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===================== MCQ GENERATION =====================
async function generateMCQs(
    examType: ExamType,
    paperType: PaperType,
    difficulty: DifficultyLevel,
    language: Language,
    count: number,
    preferences: string
): Promise<MCQ[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-mcq`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                examType,
                paperType,
                difficulty,
                language,
                numQuestions: count,
                preferences
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid response format from server');
        }

        // Map backend JSON to MCQ interface
        return data.questions.map((q: any, index: number) => {
            const options = q.options || [];
            if (options.length < 4) throw new Error(`Question ${index + 1} has fewer than 4 options`);

            let correctAnswer = 'A';
            if (options[1].isCorrect) correctAnswer = 'B';
            if (options[2].isCorrect) correctAnswer = 'C';
            if (options[3].isCorrect) correctAnswer = 'D';

            return {
                id: index + 1,
                question: q.question,
                optionA: options[0].text,
                optionB: options[1].text,
                optionC: options[2].text,
                optionD: options[3].text,
                correctAnswer,
                explanation: q.explanation || 'No explanation provided.'
            };
        });

    } catch (error: any) {
        console.error('MCQ Generation Error:', error);
        throw error;
    }
}

// ===================== MAIN COMPONENT =====================
export default function AIMCQGeneratorScreen() {
    const { theme, isDark } = useTheme();
    const { horizontalPadding } = useWebStyles();
    const navigation = useNavigation<any>();

    // Form state
    const [examType, setExamType] = useState<ExamType>('prelims');
    const [paperType, setPaperType] = useState<PaperType>('GS1');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('pro');
    const [language, setLanguage] = useState<Language>('english');
    const [questionCount, setQuestionCount] = useState('10');
    const [preferences, setPreferences] = useState('');

    // MCQ state
    const [mcqs, setMcqs] = useState<MCQ[]>([]);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setMcqs([]);
        setSelectedAnswers({});
        setShowResults({});

        try {
            const count = Math.min(50, Math.max(1, parseInt(questionCount) || 10));
            const generatedMcqs = await generateMCQs(examType, paperType, difficulty, language, count, preferences);

            if (generatedMcqs.length === 0) {
                throw new Error('No MCQs could be generated. Please try again.');
            }

            setMcqs(generatedMcqs);
        } catch (err: any) {
            setError(err.message || 'Failed to generate MCQs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnswer = (mcqId: number, option: string) => {
        if (showResults[mcqId]) return;
        setSelectedAnswers(prev => ({ ...prev, [mcqId]: option }));
        setShowResults(prev => ({ ...prev, [mcqId]: true }));
    };

    const handleReset = () => {
        setMcqs([]);
        setSelectedAnswers({});
        setShowResults({});
        setError('');
    };

    const getScore = () => {
        let correct = 0, answered = 0;
        mcqs.forEach(mcq => {
            if (selectedAnswers[mcq.id]) {
                answered++;
                if (selectedAnswers[mcq.id] === mcq.correctAnswer) correct++;
            }
        });
        return { correct, answered, total: mcqs.length };
    };

    // ===================== RENDER =====================
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: horizontalPadding || 20 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    AI MCQ Generator
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding || 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Generator Form */}
                {mcqs.length === 0 && !isLoading && (
                    <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                            ✨ Generate UPSC MCQs with AI
                        </Text>
                        <Text style={[styles.formSubtitle, { color: theme.colors.textSecondary }]}>
                            Select your preferences and generate custom MCQs instantly
                        </Text>

                        {/* Difficulty Level */}
                        <Text style={[styles.label, { color: theme.colors.text }]}>Difficulty Level</Text>
                        <View style={styles.difficultyRow}>
                            {(['beginner', 'pro', 'advanced'] as DifficultyLevel[]).map(level => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.difficultyBtn,
                                        difficulty === level && styles.difficultyBtnActive,
                                        {
                                            backgroundColor: difficulty === level
                                                ? (level === 'beginner' ? '#10B981' : level === 'pro' ? '#F59E0B' : '#EF4444')
                                                : isDark ? '#333' : '#F0F0F5',
                                            borderColor: level === 'beginner' ? '#10B981' : level === 'pro' ? '#F59E0B' : '#EF4444',
                                        }
                                    ]}
                                    onPress={() => setDifficulty(level)}
                                >
                                    <Text style={[
                                        styles.difficultyText,
                                        { color: difficulty === level ? '#fff' : theme.colors.text }
                                    ]}>
                                        {level === 'beginner' ? 'Beginner' : level === 'pro' ? 'Pro' : 'Advanced'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Exam Type */}
                        <Text style={[styles.label, { color: theme.colors.text }]}>Exam Type</Text>
                        <View style={styles.optionRow}>
                            {(['prelims', 'mains'] as ExamType[]).map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.optionBtn,
                                        examType === type && { backgroundColor: theme.colors.primary },
                                        { borderColor: theme.colors.primary }
                                    ]}
                                    onPress={() => setExamType(type)}
                                >
                                    <Text style={{ color: examType === type ? '#fff' : theme.colors.text }}>
                                        {type === 'prelims' ? 'Prelims' : 'Mains'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Paper Type */}
                        <Text style={[styles.label, { color: theme.colors.text }]}>Paper Type</Text>
                        <View style={styles.optionRow}>
                            {(['GS1', 'GS2', 'GS3', 'GS4'] as PaperType[]).map(paper => (
                                <TouchableOpacity
                                    key={paper}
                                    style={[
                                        styles.optionBtn,
                                        paperType === paper && { backgroundColor: theme.colors.primary },
                                        { borderColor: theme.colors.primary }
                                    ]}
                                    onPress={() => setPaperType(paper)}
                                >
                                    <Text style={{ color: paperType === paper ? '#fff' : theme.colors.text }}>
                                        {paper}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Language */}
                        <Text style={[styles.label, { color: theme.colors.text }]}>Language</Text>
                        <View style={styles.optionRow}>
                            {(['english', 'hindi'] as Language[]).map(lang => (
                                <TouchableOpacity
                                    key={lang}
                                    style={[
                                        styles.optionBtn,
                                        language === lang && { backgroundColor: theme.colors.primary },
                                        { borderColor: theme.colors.primary }
                                    ]}
                                    onPress={() => setLanguage(lang)}
                                >
                                    <Text style={{ color: language === lang ? '#fff' : theme.colors.text }}>
                                        {lang === 'english' ? 'English' : 'हिंदी'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Question Count */}
                        <Text style={[styles.label, { color: theme.colors.text }]}>Number of Questions</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: isDark ? '#333' : '#F0F0F5',
                                color: theme.colors.text,
                                borderColor: theme.colors.primary
                            }]}
                            value={questionCount}
                            onChangeText={setQuestionCount}
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholder="10"
                            placeholderTextColor={theme.colors.textSecondary}
                        />

                        {/* Preferences */}
                        <Text style={[styles.label, { color: theme.colors.text }]}>Specific Topics (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, {
                                backgroundColor: isDark ? '#333' : '#F0F0F5',
                                color: theme.colors.text,
                                borderColor: theme.colors.border
                            }]}
                            value={preferences}
                            onChangeText={setPreferences}
                            placeholder="e.g., Focus on Indian Constitution amendments, Economic reforms..."
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Error */}
                        {error && (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Generate Button */}
                        <TouchableOpacity
                            style={[styles.generateBtn, { backgroundColor: theme.colors.primary }]}
                            onPress={handleGenerate}
                        >
                            <Ionicons name="sparkles" size={24} color="#fff" />
                            <Text style={styles.generateBtnText}>Generate MCQs</Text>
                        </TouchableOpacity>

                        {/* Info */}
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            💡 MCQs are generated instantly using AI. They are not stored on any server.
                        </Text>
                    </View>
                )}

                {/* Loading */}
                {isLoading && (
                    <View style={[styles.loadingCard, { backgroundColor: theme.colors.surface }]}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                            Generating {questionCount} MCQs...
                        </Text>
                        <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
                            {difficulty === 'advanced' ? '🔥 Creating challenging questions...' :
                                difficulty === 'pro' ? '⚡ Crafting quality questions...' :
                                    '🌱 Preparing beginner-friendly questions...'}
                        </Text>
                    </View>
                )}

                {/* MCQ Results */}
                {mcqs.length > 0 && !isLoading && (
                    <>
                        {/* Score Card */}
                        {getScore().answered > 0 && (
                            <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}>
                                <Text style={[styles.scoreTitle, { color: theme.colors.text }]}>Your Score</Text>
                                <Text style={[styles.scoreValue, {
                                    color: getScore().correct / getScore().answered >= 0.7 ? '#10B981' :
                                        getScore().correct / getScore().answered >= 0.4 ? '#F59E0B' : '#EF4444'
                                }]}>
                                    {Math.round((getScore().correct / getScore().answered) * 100)}%
                                </Text>
                                <Text style={{ color: theme.colors.textSecondary }}>
                                    {getScore().correct}/{getScore().answered} correct
                                </Text>
                            </View>
                        )}

                        {/* Header */}
                        <View style={styles.mcqHeader}>
                            <Text style={[styles.mcqHeaderTitle, { color: theme.colors.text }]}>
                                {mcqs.length} MCQs Generated
                            </Text>
                            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                                <Text style={{ color: '#EF4444' }}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Export Buttons */}
                        <View style={styles.exportRow}>
                            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#EF4444' }]} onPress={() => exportToPDF(mcqs, selectedAnswers)}>
                                <Ionicons name="document-text" size={16} color="#fff" />
                                <Text style={styles.exportBtnText}>PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#10B981' }]} onPress={() => exportToXLSX(mcqs, selectedAnswers)}>
                                <Ionicons name="grid" size={16} color="#fff" />
                                <Text style={styles.exportBtnText}>Excel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#3B82F6' }]} onPress={() => exportToCSV(mcqs, selectedAnswers)}>
                                <Ionicons name="download" size={16} color="#fff" />
                                <Text style={styles.exportBtnText}>CSV</Text>
                            </TouchableOpacity>
                        </View>

                        {/* MCQ Cards */}
                        {mcqs.map((mcq, index) => {
                            const selected = selectedAnswers[mcq.id];
                            const revealed = showResults[mcq.id];
                            const isCorrect = selected === mcq.correctAnswer;

                            return (
                                <View key={mcq.id} style={[styles.mcqCard, { backgroundColor: theme.colors.surface }]}>
                                    <Text style={[styles.mcqQuestion, { color: theme.colors.text }]}>
                                        {index + 1}. {mcq.question}
                                    </Text>

                                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                                        const optionText = mcq[`option${opt}` as keyof MCQ] as string;
                                        const isSelected = selected === opt;
                                        const isCorrectOption = mcq.correctAnswer === opt;

                                        let bgColor = isDark ? '#2A2A2E' : '#F5F5F7';
                                        let borderColor = 'transparent';

                                        if (revealed) {
                                            if (isCorrectOption) {
                                                bgColor = '#10B98125';
                                                borderColor = '#10B981';
                                            } else if (isSelected && !isCorrect) {
                                                bgColor = '#EF444425';
                                                borderColor = '#EF4444';
                                            }
                                        } else if (isSelected) {
                                            bgColor = theme.colors.primary + '25';
                                            borderColor = theme.colors.primary;
                                        }

                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.optionCard, { backgroundColor: bgColor, borderColor, borderWidth: borderColor !== 'transparent' ? 2 : 0 }]}
                                                onPress={() => handleSelectAnswer(mcq.id, opt)}
                                                disabled={revealed}
                                            >
                                                <View style={[styles.optionCircle, { borderColor: theme.colors.border }]}>
                                                    <Text style={[styles.optionLetter, { color: theme.colors.text }]}>{opt}</Text>
                                                </View>
                                                <Text style={[styles.optionText, { color: theme.colors.text }]}>{optionText}</Text>
                                                {revealed && isCorrectOption && (
                                                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                                                )}
                                                {revealed && isSelected && !isCorrect && (
                                                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {revealed && (
                                        <View style={[styles.explanationBox, { backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF' }]}>
                                            <Text style={[styles.explanationLabel, { color: theme.colors.primary }]}>
                                                💡 Explanation
                                            </Text>
                                            <Text style={[styles.explanationText, { color: theme.colors.text }]}>
                                                {mcq.explanation}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {/* Generate More */}
                        <TouchableOpacity
                            style={[styles.generateMoreBtn, { borderColor: theme.colors.primary }]}
                            onPress={handleReset}
                        >
                            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                            <Text style={[styles.generateMoreText, { color: theme.colors.primary }]}>
                                Generate New MCQs
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },

    formCard: { borderRadius: 16, padding: 24, marginBottom: 20 },
    formTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    formSubtitle: { fontSize: 14, marginBottom: 24 },

    label: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 16 },

    difficultyRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    difficultyBtn: { flex: 1, minWidth: 100, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
    difficultyBtnActive: {},
    difficultyText: { fontSize: 14, fontWeight: '600' },

    optionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    optionBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: 2 },

    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
    textArea: { height: 80, textAlignVertical: 'top' },

    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, marginTop: 16 },
    errorText: { color: '#DC2626', flex: 1 },

    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 18, borderRadius: 14, marginTop: 24 },
    generateBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

    infoText: { fontSize: 13, textAlign: 'center', marginTop: 16 },

    loadingCard: { padding: 40, borderRadius: 16, alignItems: 'center' },
    loadingText: { fontSize: 18, fontWeight: '600', marginTop: 20 },
    loadingSubtext: { fontSize: 14, marginTop: 8 },

    scoreCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
    scoreTitle: { fontSize: 16, fontWeight: '600' },
    scoreValue: { fontSize: 48, fontWeight: '800', marginVertical: 8 },

    mcqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    mcqHeaderTitle: { fontSize: 18, fontWeight: '700' },
    resetBtn: { padding: 8 },

    exportRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
    exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    exportBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    mcqCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
    mcqQuestion: { fontSize: 16, fontWeight: '600', lineHeight: 24, marginBottom: 16 },

    optionCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, gap: 12 },
    optionCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    optionLetter: { fontSize: 14, fontWeight: '700' },
    optionText: { flex: 1, fontSize: 15 },

    explanationBox: { marginTop: 16, padding: 16, borderRadius: 12 },
    explanationLabel: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
    explanationText: { fontSize: 14, lineHeight: 22 },

    generateMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', marginTop: 8 },
    generateMoreText: { fontSize: 16, fontWeight: '600' },
});
