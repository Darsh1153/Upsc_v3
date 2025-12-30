/**
 * PDF MCQ List Screen
 * Shows history of all PDF MCQ sessions and allows creating new ones
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import { useTheme } from '../../Reference/theme/ThemeContext';
// @ts-ignore
import { useWebStyles } from '../../../components/WebContainer';
import {
    getAllPDFMCQSessions,
    deletePDFMCQSession,
    clearAllPDFMCQSessions,
    calculateSessionScore,
    PDFMCQSession,
} from '../utils/pdfMCQStorage';

export default function PDFMCQListScreen() {
    const { theme, isDark } = useTheme();
    const { horizontalPadding } = useWebStyles();
    const navigation = useNavigation<any>();

    const [sessions, setSessions] = useState<PDFMCQSession[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadSessions();
        }, [])
    );

    const loadSessions = async () => {
        setLoading(true);
        const data = await getAllPDFMCQSessions();
        setSessions(data);
        setLoading(false);
    };

    const handleDeleteSession = (session: PDFMCQSession) => {
        Alert.alert(
            'Delete Session',
            `Are you sure you want to delete "${session.pdfName}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deletePDFMCQSession(session.id);
                        loadSessions();
                    },
                },
            ]
        );
    };

    const handleClearAll = () => {
        if (sessions.length === 0) return;

        Alert.alert(
            'Clear All Sessions',
            'Are you sure you want to delete all saved PDF MCQ sessions? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAllPDFMCQSessions();
                        loadSessions();
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    const renderSession = ({ item }: { item: PDFMCQSession }) => {
        const score = calculateSessionScore(item);
        const hasAnswered = score.answered > 0;

        return (
            <TouchableOpacity
                style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('PDFMCQGenerator', { sessionId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.sessionHeader}>
                    <View style={[styles.pdfIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Ionicons name="document-text" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.sessionInfo}>
                        <Text style={[styles.pdfName, { color: theme.colors.text }]} numberOfLines={1}>
                            {item.pdfName}
                        </Text>
                        <Text style={[styles.sessionMeta, { color: theme.colors.textSecondary }]}>
                            {score.total} MCQs • {formatDate(item.createdAt)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteSession(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>

                {hasAnswered && (
                    <View style={styles.progressSection}>
                        <View style={[styles.progressBar, { backgroundColor: isDark ? '#2A2A2E' : '#F0F0F5' }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${(score.answered / score.total) * 100}%`,
                                        backgroundColor: score.percentage >= 70
                                            ? '#10B981'
                                            : score.percentage >= 40
                                                ? '#F59E0B'
                                                : '#EF4444',
                                    },
                                ]}
                            />
                        </View>
                        <View style={styles.scoreInfo}>
                            <Text style={[styles.scoreText, { color: theme.colors.textSecondary }]}>
                                {score.answered}/{score.total} answered
                            </Text>
                            <Text style={[styles.percentageText, {
                                color: score.percentage >= 70
                                    ? '#10B981'
                                    : score.percentage >= 40
                                        ? '#F59E0B'
                                        : '#EF4444',
                            }]}>
                                {score.percentage}% correct
                            </Text>
                        </View>
                    </View>
                )}

                {!hasAnswered && (
                    <View style={styles.notStartedBadge}>
                        <Text style={[styles.notStartedText, { color: theme.colors.primary }]}>
                            Tap to start practice
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="document-text-outline" size={64} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No PDF Sessions Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Upload a PDF to generate MCQs and start practicing. Your sessions will appear here.
            </Text>
            <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('PDFMCQGenerator')}
            >
                <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                <Text style={styles.createButtonText}>Upload PDF</Text>
            </TouchableOpacity>
        </View>
    );

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
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>AI PDF MCQ Generator</Text>
                {sessions.length > 0 && (
                    <TouchableOpacity
                        style={[styles.clearAllButton, { borderColor: theme.colors.error }]}
                        onPress={handleClearAll}
                    >
                        <Text style={{ color: theme.colors.error, fontSize: 12 }}>Clear All</Text>
                    </TouchableOpacity>
                )}
                {sessions.length === 0 && <View style={{ width: 60 }} />}
            </View>

            {/* New Session Button */}
            <TouchableOpacity
                style={[styles.newSessionButton, {
                    marginHorizontal: horizontalPadding || 20,
                    backgroundColor: theme.colors.primary
                }]}
                onPress={() => navigation.navigate('PDFMCQGenerator')}
            >
                <Ionicons name="add-circle-outline" size={22} color="#FFF" />
                <Text style={styles.newSessionButtonText}>Upload New PDF</Text>
            </TouchableOpacity>

            {/* Sessions List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Loading sessions...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSession}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingHorizontal: horizontalPadding || 20 },
                        sessions.length === 0 && styles.emptyListContent,
                    ]}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        marginBottom: 10,
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
    clearAllButton: {
        padding: 8,
        borderWidth: 1,
        borderRadius: 8,
    },
    newSessionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    newSessionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
    },
    listContent: {
        paddingBottom: 40,
    },
    emptyListContent: {
        flex: 1,
    },
    sessionCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pdfIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sessionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    pdfName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    sessionMeta: {
        fontSize: 13,
    },
    deleteButton: {
        padding: 8,
    },
    progressSection: {
        marginTop: 12,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    scoreInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    scoreText: {
        fontSize: 12,
    },
    percentageText: {
        fontSize: 12,
        fontWeight: '600',
    },
    notStartedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 12,
    },
    notStartedText: {
        fontSize: 13,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
