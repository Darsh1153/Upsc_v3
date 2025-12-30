/**
 * PDF MCQ Generator Screen
 * 
 * WORKFLOW:
 * 1. User picks a PDF file
 * 2. OpenRouter parses PDF and generates MCQs with GPT-5.1
 * 3. Display MCQs with interactive UI
 * 
 * Works on: Web, iOS, Android
 */

import React, { useState, useEffect, useRef } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import { getMobileApiEndpoint } from '../../../config/api';
// @ts-ignore
import { useTheme } from '../../Reference/theme/ThemeContext';
// @ts-ignore
import { useWebStyles } from '../../../components/WebContainer';

// Conditionally import FileSystem only for native
let FileSystem: any = null;
if (Platform.OS !== 'web') {
    FileSystem = require('expo-file-system/legacy');
}

import { OPENROUTER_API_KEY } from '../../../utils/secureKey';

// ===================== CONFIGURATION =====================
const CONFIG = {
    OPENROUTER_API_KEY: OPENROUTER_API_KEY,
    OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
    // Gemini 3 Pro Preview
    AI_MODEL: 'google/gemini-3-flash-preview',
    // File size limits
    MAX_FILE_SIZE_MB: 20,
    MAX_TEXT_LENGTH: 200000,
};

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

interface PickedFile {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
    file?: File;  // Web only: actual File object
}

type ProcessStage = 'idle' | 'picking' | 'reading' | 'ocr' | 'generating' | 'parsing' | 'complete' | 'error';

// ===================== EXPORT UTILITIES =====================

// Export MCQs to CSV format
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

// Export MCQs to XLSX (Excel) format - using XML spreadsheet format
function exportToXLSX(mcqs: MCQ[], selectedAnswers: Record<number, string>): void {
    // Create XML Spreadsheet (Excel 2003 XML format - widely compatible)
    const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="MCQ Results">
<Table>
<Row>
<Cell><Data ss:Type="String">Q.No</Data></Cell>
<Cell><Data ss:Type="String">Question</Data></Cell>
<Cell><Data ss:Type="String">Option A</Data></Cell>
<Cell><Data ss:Type="String">Option B</Data></Cell>
<Cell><Data ss:Type="String">Option C</Data></Cell>
<Cell><Data ss:Type="String">Option D</Data></Cell>
<Cell><Data ss:Type="String">Correct Answer</Data></Cell>
<Cell><Data ss:Type="String">Your Answer</Data></Cell>
<Cell><Data ss:Type="String">Result</Data></Cell>
<Cell><Data ss:Type="String">Explanation</Data></Cell>
</Row>`;

    mcqs.forEach((mcq, index) => {
        const userAnswer = selectedAnswers[mcq.id] || 'Not Answered';
        const isCorrect = userAnswer === mcq.correctAnswer ? 'Correct' : (userAnswer === 'Not Answered' ? 'Skipped' : 'Wrong');

        xmlContent += `
<Row>
<Cell><Data ss:Type="Number">${index + 1}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.question)}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.optionA)}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.optionB)}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.optionC)}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.optionD)}</Data></Cell>
<Cell><Data ss:Type="String">${mcq.correctAnswer}</Data></Cell>
<Cell><Data ss:Type="String">${userAnswer}</Data></Cell>
<Cell><Data ss:Type="String">${isCorrect}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.explanation)}</Data></Cell>
</Row>`;
    });

    xmlContent += `
</Table>
</Worksheet>
</Workbook>`;

    downloadFile(xmlContent, 'mcq-results.xls', 'application/vnd.ms-excel');
}

// Export MCQs to PDF Report
function exportToPDF(mcqs: MCQ[], selectedAnswers: Record<number, string>): void {
    // Calculate score
    let correct = 0;
    let answered = 0;
    mcqs.forEach(mcq => {
        if (selectedAnswers[mcq.id]) {
            answered++;
            if (selectedAnswers[mcq.id] === mcq.correctAnswer) correct++;
        }
    });

    const scorePercent = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MCQ Results Report</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1a1a1a; text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
        .summary { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .summary h2 { margin: 0; color: #0369a1; }
        .score { font-size: 32px; font-weight: bold; color: ${scorePercent >= 70 ? '#10B981' : scorePercent >= 40 ? '#F59E0B' : '#EF4444'}; }
        .mcq { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .question { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
        .options { margin: 10px 0; }
        .option { padding: 5px 10px; margin: 3px 0; border-radius: 4px; }
        .correct { background: #d1fae5; border-left: 3px solid #10B981; }
        .wrong { background: #fee2e2; border-left: 3px solid #EF4444; }
        .explanation { background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px; margin-top: 10px; }
        .result-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .result-correct { background: #10B981; color: white; }
        .result-wrong { background: #EF4444; color: white; }
        .result-skipped { background: #9CA3AF; color: white; }
        @media print { body { padding: 0; } .mcq { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <h1>📝 MCQ Results Report</h1>
    
    <div class="summary">
        <h2>Your Score</h2>
        <div class="score">${scorePercent}%</div>
        <p>${correct} correct out of ${answered} answered (${mcqs.length} total questions)</p>
    </div>
    
    ${mcqs.map((mcq, index) => {
        const userAnswer = selectedAnswers[mcq.id];
        const isCorrect = userAnswer === mcq.correctAnswer;
        const resultClass = !userAnswer ? 'result-skipped' : isCorrect ? 'result-correct' : 'result-wrong';
        const resultText = !userAnswer ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong';

        return `
    <div class="mcq">
        <div class="question">
            Q${index + 1}. ${mcq.question}
            <span class="result-tag ${resultClass}">${resultText}</span>
        </div>
        <div class="options">
            ${['A', 'B', 'C', 'D'].map(opt => {
            const optText = mcq[`option${opt}` as keyof MCQ];
            const isCorrectOpt = mcq.correctAnswer === opt;
            const isUserAnswer = userAnswer === opt;
            let optClass = '';
            if (isCorrectOpt) optClass = 'correct';
            else if (isUserAnswer && !isCorrect) optClass = 'wrong';
            return `<div class="option ${optClass}">${opt}. ${optText} ${isCorrectOpt ? '✓' : ''}</div>`;
        }).join('')}
        </div>
        <div class="explanation"><strong>Explanation:</strong> ${mcq.explanation}</div>
    </div>`;
    }).join('')}
    
    <p style="text-align: center; color: #9CA3AF; margin-top: 30px;">Generated by UPSC MCQ Generator</p>
</body>
</html>`;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }
}

// Helper function to download files (Web only)
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

// ===================== STEP 1: Pick File (Web + Native) =====================
async function pickFile(): Promise<{
    success: boolean;
    file?: PickedFile;
    error?: string;
    canceled?: boolean;
}> {
    try {
        console.log('[PDF-MCQ] Step 1: Picking file... Platform:', Platform.OS);

        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            console.log('[PDF-MCQ] User canceled file picker');
            return { success: false, canceled: true };
        }

        const asset = result.assets[0];
        console.log('[PDF-MCQ] File selected:', asset.name, 'Size:', asset.size, 'bytes');

        // On web, asset.file contains the actual File object
        return {
            success: true,
            file: {
                uri: asset.uri,
                name: asset.name || 'document.pdf',
                size: asset.size || 0,
                mimeType: asset.mimeType || 'application/pdf',
                file: (asset as any).file,  // Web: File object
            },
        };
    } catch (error: any) {
        console.error('[PDF-MCQ] File pick error:', error);
        return { success: false, error: error.message || 'Failed to pick file' };
    }
}

// ===================== STEP 2: Read File as Base64 (Web + Native) =====================
async function readFileAsBase64(pickedFile: PickedFile): Promise<string> {
    console.log('[PDF-MCQ] Step 2: Reading file as base64... Platform:', Platform.OS);

    if (Platform.OS === 'web') {
        // WEB: Use FileReader API
        return new Promise((resolve, reject) => {
            // Get the file from various possible sources
            let file: File | Blob | null = pickedFile.file || null;

            if (!file && pickedFile.uri.startsWith('blob:')) {
                // Fetch the blob from URI
                fetch(pickedFile.uri)
                    .then(res => res.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const result = reader.result as string;
                            // Remove data URL prefix to get pure base64
                            const base64 = result.split(',')[1] || result;
                            console.log('[PDF-MCQ] Web: File read, base64 length:', base64.length);
                            resolve(base64);
                        };
                        reader.onerror = () => reject(new Error('Failed to read file'));
                        reader.readAsDataURL(blob);
                    })
                    .catch(reject);
                return;
            }

            if (!file) {
                reject(new Error('No file object available on web'));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix to get pure base64
                const base64 = result.split(',')[1] || result;
                console.log('[PDF-MCQ] Web: File read, base64 length:', base64.length);
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    } else {
        // NATIVE: Use expo-file-system
        if (!FileSystem) {
            throw new Error('FileSystem not available');
        }
        const base64 = await FileSystem.readAsStringAsync(pickedFile.uri, {
            encoding: 'base64',
        });
        console.log('[PDF-MCQ] Native: File read, base64 length:', base64.length);
        return base64;
    }
}

// ===================== STEP 3: Generate MCQs using Backend API =====================
async function generateMCQsFromPDF(base64Data: string, fileName: string, mimeType: string, count: number): Promise<MCQ[]> {
    console.log('[PDF-MCQ] Generating MCQs via Backend API...');

    // Get backend endpoint
    // Note: getMobileApiEndpoint handles adding /mobile prefix to MOBILE_API_URL
    const endpoint = getMobileApiEndpoint('/pdf-generator');
    console.log('[PDF-MCQ] Endpoint:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileBase64: base64Data,
                count: count,
                fileName: fileName,
                mimeType: mimeType
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[PDF-MCQ] Backend API Error:', response.status, errorText);

            // Try to parse parsing error
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || `Server Error: ${response.status}`);
            } catch (e) {
                throw new Error(`Server Error: ${response.status}`);
            }
        }

        const data = await response.json();

        if (!data.success || !data.mcqs) {
            throw new Error(data.error || 'Failed to generate MCQs');
        }

        console.log('[PDF-MCQ] Successfully received', data.mcqs.length, 'MCQs');
        return data.mcqs;

    } catch (error: any) {
        console.error('[PDF-MCQ] Error:', error);
        throw new Error(error.message || 'Failed to generate MCQs');
    }
}

// ===================== STEP 4: Generate MCQs from text (fallback) =====================
async function generateMCQsWithAI(text: string, count: number): Promise<MCQ[]> {
    console.log('[PDF-MCQ] Generating', count, 'MCQs from text...');

    const truncatedText = text.substring(0, CONFIG.MAX_TEXT_LENGTH);

    const prompt = `You are an expert UPSC exam question creator. Create EXACTLY ${count} Multiple Choice Questions (MCQs) from this content.

CONTENT TO ANALYZE:
${truncatedText}

REQUIREMENTS:
1. Create EXACTLY ${count} MCQs - no more, no less
2. Each question should be challenging and test understanding
3. 4 options per question (A, B, C, D)
4. Only ONE correct answer per question
5. Include brief explanation for each answer

OUTPUT FORMAT (follow EXACTLY for each question):

Question 1: [Question text]
A. [Option A text]
B. [Option B text]
C. [Option C text]
D. [Option D text]
Correct Answer: [Single letter: A, B, C, or D]
Explanation: [Brief explanation]

START GENERATING ${count} MCQs NOW:`;

    const response = await fetch(CONFIG.OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://upsc-prep-app.com',
            'X-Title': 'UPSC Prep App',
        },
        body: JSON.stringify({
            model: CONFIG.AI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: Math.min(16000, count * 500),
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[PDF-MCQ] AI API Error:', response.status, errorText);
        throw new Error(`AI Error: ${response.status}. Please try again.`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('AI returned empty response. Please try again.');
    }

    console.log('[PDF-MCQ] AI response length:', content.length);

    // Parse the response
    const mcqs = parseMCQResponse(content);
    console.log('[PDF-MCQ] Successfully parsed', mcqs.length, 'MCQs');

    return mcqs;
}

// ===================== STEP 5: Parse AI Response =====================
function parseMCQResponse(content: string): MCQ[] {
    console.log('[PDF-MCQ] Step 5: Parsing MCQ response...');

    const mcqs: MCQ[] = [];

    // Split by "Question X:" pattern
    const parts = content.split(/Question\s+(\d+)\s*:/gi);

    for (let i = 1; i < parts.length; i += 2) {
        const questionNum = parseInt(parts[i]);
        const questionContent = parts[i + 1];

        if (!questionContent || questionContent.length < 50) continue;

        try {
            // Extract the question text (before A.)
            const questionMatch = questionContent.match(/^([\s\S]+?)(?=\n\s*A\.)/i);
            const question = questionMatch ? questionMatch[1].trim() : '';

            if (!question || question.length < 10) continue;

            // Extract options - be more flexible with the regex
            const optionA = extractOption(questionContent, 'A', 'B');
            const optionB = extractOption(questionContent, 'B', 'C');
            const optionC = extractOption(questionContent, 'C', 'D');
            const optionD = extractOption(questionContent, 'D', 'Correct');

            if (!optionA || !optionB || !optionC || !optionD) {
                console.log('[PDF-MCQ] Skipping question', questionNum, '- missing options');
                continue;
            }

            // Extract correct answer
            const correctMatch = questionContent.match(/Correct\s*Answer\s*[:\s]*([A-D])/i);
            const correctAnswer = correctMatch ? correctMatch[1].toUpperCase() : 'A';

            // Extract explanation
            const explanationMatch = questionContent.match(/Explanation\s*[:\s]*([\s\S]+?)(?=\n\s*$|$)/i);
            const explanation = explanationMatch ? explanationMatch[1].trim() :
                `The correct answer is ${correctAnswer}.`;

            mcqs.push({
                id: questionNum,
                question,
                optionA,
                optionB,
                optionC,
                optionD,
                correctAnswer,
                explanation,
            });

        } catch (e) {
            console.warn('[PDF-MCQ] Failed to parse question', questionNum);
        }
    }

    return mcqs;
}

function extractOption(content: string, letter: string, nextLetter: string): string {
    // Try multiple patterns
    const patterns = [
        new RegExp(`${letter}\\.\\s*([\\s\\S]+?)(?=\\n\\s*${nextLetter}\\.)`, 'i'),
        new RegExp(`${letter}\\.\\s*(.+?)(?=\\n)`, 'i'),
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    // Fallback: try to find the option on a single line
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.trim().match(new RegExp(`^${letter}\\.`, 'i'))) {
            return line.replace(new RegExp(`^${letter}\\.\\s*`, 'i'), '').trim();
        }
    }

    return '';
}

// ===================== MAIN COMPONENT =====================
export default function PDFGeneratorScreen() {
    const { theme, isDark } = useTheme();
    const { horizontalPadding } = useWebStyles();
    const navigation = useNavigation<any>();

    // State
    const [stage, setStage] = useState<ProcessStage>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [mcqs, setMcqs] = useState<MCQ[]>([]);
    const [mcqCount, setMcqCount] = useState('10');
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState<Record<number, boolean>>({});
    const [errorMessage, setErrorMessage] = useState('');

    // Timer
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (stage !== 'idle' && stage !== 'complete' && stage !== 'error') {
            timerRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [stage]);

    // ===================== MAIN PROCESS =====================
    const startProcess = async () => {
        const count = Math.min(200, Math.max(1, parseInt(mcqCount) || 10));
        const estimatedTime = Math.max(20, count * 2);

        try {
            // Reset state
            setMcqs([]);
            setSelectedAnswers({});
            setShowResults({});
            setElapsedSeconds(0);
            setErrorMessage('');

            // STEP 1: Pick file
            setStage('picking');
            setProgress(5);
            setStatusMessage('📁 Select a PDF file...');

            const fileResult = await pickFile();

            if (fileResult.canceled) {
                setStage('idle');
                return;
            }

            if (!fileResult.success || !fileResult.file) {
                throw new Error(fileResult.error || 'Failed to select file');
            }

            const pickedFile = fileResult.file;
            const fileSizeMB = pickedFile.size / (1024 * 1024);

            // Check file size
            if (fileSizeMB > CONFIG.MAX_FILE_SIZE_MB) {
                throw new Error(
                    `File too large (${fileSizeMB.toFixed(1)}MB). Maximum: ${CONFIG.MAX_FILE_SIZE_MB}MB`
                );
            }

            setStatusMessage(`📄 Selected: ${pickedFile.name} (${fileSizeMB.toFixed(1)}MB)`);
            setProgress(10);

            // STEP 2: Read file
            setStage('reading');
            setStatusMessage('📖 Reading file...');
            setProgress(15);

            const base64Data = await readFileAsBase64(pickedFile);

            if (!base64Data || base64Data.length === 0) {
                throw new Error('Failed to read file. Please try again.');
            }

            console.log('[PDF-MCQ] File read, base64 length:', base64Data.length);
            setProgress(25);

            // STEP 3: Generate MCQs directly from PDF using OpenRouter
            // OpenRouter has native PDF parsing - no need for separate OCR!
            setStage('generating');
            setStatusMessage(`🤖 AI analyzing PDF and generating ${count} MCQs...`);
            setProgress(40);

            const generatedMcqs = await generateMCQsFromPDF(
                base64Data,
                pickedFile.name,
                pickedFile.mimeType,
                count
            );

            // STEP 4: Done
            setStage('parsing');
            setProgress(90);
            setStatusMessage('✨ Processing complete!');

            if (generatedMcqs.length === 0) {
                throw new Error('Could not generate MCQs. Please try a different PDF.');
            }

            // Success!
            setMcqs(generatedMcqs);
            setProgress(100);
            setStage('complete');
            setStatusMessage(`✅ Generated ${generatedMcqs.length} MCQs in ${elapsedSeconds}s`);

            Alert.alert(
                '🎉 Success!',
                `Generated ${generatedMcqs.length} MCQs in ${elapsedSeconds} seconds!\n\nStart practicing now.`
            );

        } catch (error: any) {
            console.error('[PDF-MCQ] Error:', error);
            setStage('error');
            setErrorMessage(error.message || 'Something went wrong');
            setStatusMessage(`❌ ${error.message || 'Error occurred'}`);
            Alert.alert('Error', error.message || 'Failed to process PDF');
        }
    };

    const handleOptionSelect = (mcqId: number, option: string) => {
        if (showResults[mcqId]) return;
        setSelectedAnswers(prev => ({ ...prev, [mcqId]: option }));
        setShowResults(prev => ({ ...prev, [mcqId]: true }));
    };

    const handleReset = () => {
        setStage('idle');
        setMcqs([]);
        setSelectedAnswers({});
        setShowResults({});
        setProgress(0);
        setElapsedSeconds(0);
        setErrorMessage('');
        setStatusMessage('');
    };

    const getScore = () => {
        let correct = 0;
        let answered = 0;
        mcqs.forEach(mcq => {
            if (selectedAnswers[mcq.id]) {
                answered++;
                if (selectedAnswers[mcq.id] === mcq.correctAnswer) {
                    correct++;
                }
            }
        });
        return { correct, answered };
    };

    const isLoading = ['picking', 'reading', 'ocr', 'generating', 'parsing'].includes(stage);
    const count = parseInt(mcqCount) || 10;
    const estimatedTime = Math.max(20, count * 2);

    // ===================== LOADING SCREEN =====================
    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.loadingContainer}>
                    {/* Icon */}
                    <View style={[styles.loadingIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Text style={{ fontSize: 56 }}>⚡</Text>
                    </View>

                    {/* Title */}
                    <Text style={[styles.loadingTitle, { color: theme.colors.text }]}>
                        Processing PDF
                    </Text>

                    {/* Status */}
                    <Text style={[styles.loadingStatus, { color: theme.colors.textSecondary }]}>
                        {statusMessage}
                    </Text>

                    {/* Progress Bar */}
                    <View style={[styles.progressContainer, { backgroundColor: isDark ? '#333' : '#E5E5EA' }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${progress}%`,
                                    backgroundColor: theme.colors.primary
                                }
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                        {progress}% complete
                    </Text>

                    {/* Timer */}
                    <View style={[styles.timerBox, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="time" size={24} color={theme.colors.primary} />
                        <Text style={[styles.timerValue, { color: theme.colors.text }]}>
                            {elapsedSeconds}s
                        </Text>
                        <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>
                            / ~{estimatedTime}s estimated
                        </Text>
                    </View>

                    {/* Spinner */}
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 24 }} />

                    {/* Cancel */}
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.colors.error }]}
                        onPress={handleReset}
                    >
                        <Text style={{ color: theme.colors.error, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ===================== MAIN SCREEN =====================
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
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    PDF to MCQ Generator
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding || 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Upload Card (when no MCQs) */}
                {mcqs.length === 0 && (
                    <View style={[styles.uploadCard, { backgroundColor: theme.colors.surface }]}>
                        {/* Icon */}
                        <View style={[styles.uploadIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                            <Ionicons name="document-text" size={56} color={theme.colors.primary} />
                        </View>

                        {/* Title */}
                        <Text style={[styles.uploadTitle, { color: theme.colors.text }]}>
                            Upload PDF
                        </Text>

                        {/* Description */}
                        <Text style={[styles.uploadDesc, { color: theme.colors.textSecondary }]}>
                            Convert any PDF into UPSC-level MCQs with AI.
                        </Text>

                        {/* MCQ Count */}
                        <View style={styles.countRow}>
                            <Text style={[styles.countLabel, { color: theme.colors.text }]}>
                                Number of MCQs:
                            </Text>
                            <TextInput
                                style={[styles.countInput, {
                                    backgroundColor: isDark ? '#333' : '#F0F0F5',
                                    color: theme.colors.text,
                                    borderColor: theme.colors.primary,
                                }]}
                                value={mcqCount}
                                onChangeText={setMcqCount}
                                keyboardType="number-pad"
                                maxLength={3}
                                placeholder="10"
                                placeholderTextColor={theme.colors.textSecondary}
                            />
                        </View>

                        {/* Estimated Time */}
                        <Text style={[styles.estimatedTime, { color: theme.colors.textSecondary }]}>
                            ⏱️ Estimated time: ~{estimatedTime} seconds
                        </Text>

                        {/* Upload Button */}
                        <TouchableOpacity
                            style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
                            onPress={startProcess}
                        >
                            <Ionicons name="cloud-upload" size={24} color="#FFF" />
                            <Text style={styles.uploadButtonText}>Select PDF & Generate MCQs</Text>
                        </TouchableOpacity>

                        {/* Features */}
                        <View style={styles.features}>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                    Works with any PDF
                                </Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                    Powered by AI
                                </Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                    Fast MCQ generation
                                </Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                    Supports PDFs
                                </Text>
                            </View>
                        </View>

                        {/* Error Display */}
                        {errorMessage && (
                            <View style={[styles.errorBox, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                <Text style={{ color: '#DC2626', flex: 1 }}>{errorMessage}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* MCQs Display */}
                {mcqs.length > 0 && (
                    <View style={styles.mcqsContainer}>
                        {/* Score Card */}
                        {getScore().answered > 0 && (
                            <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}>
                                <View>
                                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
                                        Your Score
                                    </Text>
                                    <Text style={[styles.scoreValue, { color: theme.colors.text }]}>
                                        {getScore().correct} / {getScore().answered}
                                    </Text>
                                </View>
                                <View style={[styles.scorePercentBadge, {
                                    backgroundColor: getScore().correct / getScore().answered >= 0.7
                                        ? '#10B98130'
                                        : getScore().correct / getScore().answered >= 0.4
                                            ? '#F59E0B30'
                                            : '#EF444430'
                                }]}>
                                    <Text style={{
                                        color: getScore().correct / getScore().answered >= 0.7
                                            ? '#10B981'
                                            : getScore().correct / getScore().answered >= 0.4
                                                ? '#F59E0B'
                                                : '#EF4444',
                                        fontWeight: '700',
                                        fontSize: 18,
                                    }}>
                                        {Math.round((getScore().correct / getScore().answered) * 100)}%
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Header */}
                        <View style={styles.mcqsHeader}>
                            <Text style={[styles.mcqsHeaderTitle, { color: theme.colors.text }]}>
                                {mcqs.length} MCQs Generated
                            </Text>
                            <TouchableOpacity
                                style={[styles.resetButton, { borderColor: theme.colors.error }]}
                                onPress={handleReset}
                            >
                                <Text style={{ color: theme.colors.error, fontSize: 13 }}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Export Buttons */}
                        <View style={styles.exportRow}>
                            <TouchableOpacity
                                style={[styles.exportButton, { backgroundColor: '#EF4444' }]}
                                onPress={() => exportToPDF(mcqs, selectedAnswers)}
                            >
                                <Ionicons name="document-text" size={16} color="#fff" />
                                <Text style={styles.exportButtonText}>PDF Report</Text>
                            </TouchableOpacity>



                            <TouchableOpacity
                                style={[styles.exportButton, { backgroundColor: '#3B82F6' }]}
                                onPress={() => exportToCSV(mcqs, selectedAnswers)}
                            >
                                <Ionicons name="download" size={16} color="#fff" />
                                <Text style={styles.exportButtonText}>CSV</Text>
                            </TouchableOpacity>
                        </View>

                        {/* MCQ Cards */}
                        {mcqs.map((mcq, index) => {
                            const selected = selectedAnswers[mcq.id];
                            const revealed = showResults[mcq.id];
                            const isCorrect = selected === mcq.correctAnswer;

                            return (
                                <View
                                    key={mcq.id}
                                    style={[styles.mcqCard, { backgroundColor: theme.colors.surface }]}
                                >
                                    {/* Question */}
                                    <Text style={[styles.mcqQuestion, { color: theme.colors.text }]}>
                                        {index + 1}. {mcq.question.replace(/\*\*/g, '')}
                                    </Text>

                                    {/* Options */}
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
                                            } else if (isSelected) {
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
                                                style={[
                                                    styles.optionButton,
                                                    { backgroundColor: bgColor, borderColor, borderWidth: 2 }
                                                ]}
                                                onPress={() => handleOptionSelect(mcq.id, opt)}
                                                disabled={revealed}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.optionLetter, {
                                                    backgroundColor: revealed && isCorrectOption
                                                        ? '#10B981'
                                                        : revealed && isSelected
                                                            ? '#EF4444'
                                                            : theme.colors.primary
                                                }]}>
                                                    <Text style={styles.optionLetterText}>{opt}</Text>
                                                </View>
                                                <Text style={[styles.optionText, { color: theme.colors.text }]}>
                                                    {optionText.replace(/\*\*/g, '')}
                                                </Text>
                                                {revealed && isCorrectOption && (
                                                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                                                )}
                                                {revealed && isSelected && !isCorrect && (
                                                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {/* Explanation */}
                                    {revealed && mcq.explanation && (
                                        <View style={[styles.explanationBox, { backgroundColor: theme.colors.primary + '10' }]}>
                                            <View style={styles.explanationHeader}>
                                                <Ionicons name="bulb" size={18} color={theme.colors.primary} />
                                                <Text style={[styles.explanationTitle, { color: theme.colors.primary }]}>
                                                    Explanation
                                                </Text>
                                            </View>
                                            <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>
                                                {mcq.explanation.replace(/\*\*/g, '')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {/* Generate More */}
                        <TouchableOpacity
                            style={[styles.generateMoreButton, { borderColor: theme.colors.primary }]}
                            onPress={startProcess}
                        >
                            <Ionicons name="add-circle" size={22} color={theme.colors.primary} />
                            <Text style={[styles.generateMoreText, { color: theme.colors.primary }]}>
                                Generate More MCQs
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { paddingBottom: 40 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },

    // Loading Screen
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    loadingTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
    },
    loadingStatus: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    progressContainer: {
        width: '100%',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    timerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    timerValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    timerLabel: {
        fontSize: 14,
    },
    cancelButton: {
        marginTop: 32,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
    },

    // Upload Card
    uploadCard: {
        padding: 28,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    uploadIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    uploadTitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 12,
    },
    uploadDesc: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    countLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    countInput: {
        width: 80,
        height: 48,
        borderRadius: 12,
        borderWidth: 2,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
    },
    estimatedTime: {
        fontSize: 14,
        marginBottom: 24,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 16,
        marginBottom: 28,
    },
    uploadButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
    features: {
        gap: 12,
        width: '100%',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        fontSize: 14,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        marginTop: 20,
        width: '100%',
    },

    // MCQs Container
    mcqsContainer: {
        marginTop: 20,
    },
    scoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    scoreLabel: {
        fontSize: 13,
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: '800',
    },
    scorePercentBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    mcqsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    mcqsHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    resetButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1.5,
    },

    // MCQ Card
    mcqCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    mcqQuestion: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 26,
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 14,
        marginBottom: 10,
    },
    optionLetter: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLetterText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    explanationBox: {
        marginTop: 16,
        padding: 16,
        borderRadius: 14,
    },
    explanationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    explanationTitle: {
        fontWeight: '700',
        fontSize: 15,
    },
    explanationText: {
        fontSize: 14,
        lineHeight: 22,
    },
    generateMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        borderRadius: 14,
        borderWidth: 2,
        borderStyle: 'dashed',
        marginTop: 8,
    },
    generateMoreText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Export Buttons
    exportRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    exportButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});
