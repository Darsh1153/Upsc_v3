/**
 * PDF MCQ Local Storage Manager
 * Handles saving and retrieving PDF MCQ sessions locally
 * No backend storage - everything stays on device
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const PDF_MCQ_SESSIONS_KEY = 'pdf_mcq_sessions';
const PDF_MCQ_CURRENT_KEY = 'pdf_mcq_current';

export interface MCQ {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation?: string;
    userAnswer?: string;
}

export interface PDFMCQSession {
    id: string;
    pdfName: string;
    createdAt: string;
    mcqs: MCQ[];
    userAnswers: { [key: number]: string };
    completed: boolean;
    score?: number;
    lastAccessedAt: string;
}

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
    return `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Save a new PDF MCQ session
 */
export const savePDFMCQSession = async (
    pdfName: string,
    mcqs: MCQ[]
): Promise<PDFMCQSession> => {
    try {
        const session: PDFMCQSession = {
            id: generateSessionId(),
            pdfName,
            createdAt: new Date().toISOString(),
            mcqs,
            userAnswers: {},
            completed: false,
            lastAccessedAt: new Date().toISOString(),
        };

        // Get existing sessions
        const existingSessions = await getAllPDFMCQSessions();

        // Add new session at the beginning
        const updatedSessions = [session, ...existingSessions];

        // Limit to 50 sessions max to prevent storage bloat
        const trimmedSessions = updatedSessions.slice(0, 50);

        await AsyncStorage.setItem(PDF_MCQ_SESSIONS_KEY, JSON.stringify(trimmedSessions));

        // Also save as current session for quick access
        await AsyncStorage.setItem(PDF_MCQ_CURRENT_KEY, JSON.stringify(session));

        return session;
    } catch (error) {
        console.error('[pdfMCQStorage] Error saving session:', error);
        throw error;
    }
};

/**
 * Get all saved PDF MCQ sessions
 */
export const getAllPDFMCQSessions = async (): Promise<PDFMCQSession[]> => {
    try {
        const data = await AsyncStorage.getItem(PDF_MCQ_SESSIONS_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('[pdfMCQStorage] Error getting sessions:', error);
        return [];
    }
};

/**
 * Get a specific session by ID
 */
export const getPDFMCQSession = async (sessionId: string): Promise<PDFMCQSession | null> => {
    try {
        const sessions = await getAllPDFMCQSessions();
        return sessions.find(s => s.id === sessionId) || null;
    } catch (error) {
        console.error('[pdfMCQStorage] Error getting session:', error);
        return null;
    }
};

/**
 * Get the last/current session
 */
export const getCurrentPDFMCQSession = async (): Promise<PDFMCQSession | null> => {
    try {
        const data = await AsyncStorage.getItem(PDF_MCQ_CURRENT_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('[pdfMCQStorage] Error getting current session:', error);
        return null;
    }
};

/**
 * Update a session (e.g., when user answers questions)
 */
export const updatePDFMCQSession = async (
    sessionId: string,
    updates: Partial<PDFMCQSession>
): Promise<PDFMCQSession | null> => {
    try {
        const sessions = await getAllPDFMCQSessions();
        const index = sessions.findIndex(s => s.id === sessionId);

        if (index === -1) return null;

        const updatedSession = {
            ...sessions[index],
            ...updates,
            lastAccessedAt: new Date().toISOString(),
        };

        sessions[index] = updatedSession;
        await AsyncStorage.setItem(PDF_MCQ_SESSIONS_KEY, JSON.stringify(sessions));

        // Also update current session if it matches
        const current = await getCurrentPDFMCQSession();
        if (current?.id === sessionId) {
            await AsyncStorage.setItem(PDF_MCQ_CURRENT_KEY, JSON.stringify(updatedSession));
        }

        return updatedSession;
    } catch (error) {
        console.error('[pdfMCQStorage] Error updating session:', error);
        return null;
    }
};

/**
 * Delete a session
 */
export const deletePDFMCQSession = async (sessionId: string): Promise<boolean> => {
    try {
        const sessions = await getAllPDFMCQSessions();
        const filtered = sessions.filter(s => s.id !== sessionId);
        await AsyncStorage.setItem(PDF_MCQ_SESSIONS_KEY, JSON.stringify(filtered));

        // Clear current if it matches
        const current = await getCurrentPDFMCQSession();
        if (current?.id === sessionId) {
            await AsyncStorage.removeItem(PDF_MCQ_CURRENT_KEY);
        }

        return true;
    } catch (error) {
        console.error('[pdfMCQStorage] Error deleting session:', error);
        return false;
    }
};

/**
 * Clear all PDF MCQ sessions
 */
export const clearAllPDFMCQSessions = async (): Promise<boolean> => {
    try {
        await AsyncStorage.removeItem(PDF_MCQ_SESSIONS_KEY);
        await AsyncStorage.removeItem(PDF_MCQ_CURRENT_KEY);
        return true;
    } catch (error) {
        console.error('[pdfMCQStorage] Error clearing sessions:', error);
        return false;
    }
};

/**
 * Calculate score for a session
 */
export const calculateSessionScore = (session: PDFMCQSession): {
    answered: number;
    correct: number;
    total: number;
    percentage: number;
} => {
    const total = session.mcqs.length;
    const answered = Object.keys(session.userAnswers).length;

    let correct = 0;
    session.mcqs.forEach((mcq, index) => {
        if (session.userAnswers[index] === mcq.correctAnswer) {
            correct++;
        }
    });

    return {
        answered,
        correct,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
};

/**
 * Generate a text report for a session
 */
export const generateSessionReport = (session: PDFMCQSession): string => {
    const score = calculateSessionScore(session);

    let report = `PDF MCQ TEST REPORT\n`;
    report += `========================\n\n`;
    report += `PDF: ${session.pdfName}\n`;
    report += `Date: ${new Date(session.createdAt).toLocaleString('en-IN')}\n\n`;
    report += `SUMMARY\n`;
    report += `-------\n`;
    report += `Total Questions: ${score.total}\n`;
    report += `Answered: ${score.answered}\n`;
    report += `Correct: ${score.correct}\n`;
    report += `Wrong: ${score.answered - score.correct}\n`;
    report += `Score: ${score.percentage}%\n\n`;
    report += `DETAILED RESULTS\n`;
    report += `----------------\n\n`;

    session.mcqs.forEach((mcq, index) => {
        const userAnswer = session.userAnswers[index];
        const isCorrect = userAnswer === mcq.correctAnswer;
        const status = userAnswer
            ? isCorrect ? '✓ CORRECT' : '✗ WRONG'
            : 'NOT ANSWERED';

        report += `Question ${index + 1}: ${mcq.question}\n`;
        report += `A. ${mcq.optionA}\n`;
        report += `B. ${mcq.optionB}\n`;
        report += `C. ${mcq.optionC}\n`;
        report += `D. ${mcq.optionD}\n`;
        report += `Correct Answer: ${mcq.correctAnswer}\n`;
        report += `Your Answer: ${userAnswer || 'Not answered'}\n`;
        report += `Status: ${status}\n`;
        if (mcq.explanation) {
            report += `Explanation: ${mcq.explanation}\n`;
        }
        report += `\n---\n\n`;
    });

    return report;
};
