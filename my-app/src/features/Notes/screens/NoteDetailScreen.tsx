import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Linking,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getNoteById,
    updateNote,
    deleteNote,
    LocalNote,
    LocalTag,
    NoteBlock,
} from '../services/localNotesStorage';
import { analyzeForUPSC } from '../services/aiSummarizer';

interface NoteDetailScreenProps {
    navigation: any;
    route: {
        params: {
            noteId: number;
        };
    };
}

// Source config
const SOURCE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    manual: { icon: 'create-outline', color: '#6366F1', label: 'My Note' },
    scraped: { icon: 'link-outline', color: '#06B6D4', label: 'Web Article' },
    ncert: { icon: 'book-outline', color: '#10B981', label: 'NCERT' },
    book: { icon: 'library-outline', color: '#8B5CF6', label: 'Book' },
    current_affairs: { icon: 'newspaper-outline', color: '#F59E0B', label: 'Current Affairs' },
    report: { icon: 'document-text-outline', color: '#EF4444', label: 'Report' },
};

export const NoteDetailScreen: React.FC<NoteDetailScreenProps> = ({ navigation, route }) => {
    const { noteId } = route.params;

    const [note, setNote] = useState<LocalNote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        loadNote();
    }, [noteId]);

    const loadNote = async () => {
        setIsLoading(true);
        try {
            const noteData = await getNoteById(noteId);
            setNote(noteData);
        } catch (error) {
            console.error('Error loading note:', error);
            Alert.alert('Error', 'Failed to load note');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePin = async () => {
        if (!note) return;
        try {
            await updateNote(note.id, { isPinned: !note.isPinned });
            setNote(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null);
        } catch (error) {
            Alert.alert('Error', 'Failed to update note');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteNote(noteId);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete note');
                        }
                    },
                },
            ]
        );
    };

    const handleShare = async () => {
        if (!note) return;
        try {
            await Share.share({
                title: note.title,
                message: `${note.title}\n\n${note.summary || note.content}`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleAnalyze = async () => {
        if (!note) return;

        setIsAnalyzing(true);
        try {
            const analysis = await analyzeForUPSC(note.content, note.title);

            if (analysis.error) {
                Alert.alert('Analysis Failed', analysis.error);
                return;
            }

            // Update note with analysis
            const updatedNote = await updateNote(note.id, {
                summary: analysis.summary,
            });

            if (updatedNote) {
                setNote(updatedNote);
                Alert.alert('Success', 'Note analyzed and summary added!');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to analyze note');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleEdit = () => {
        if (!note) return;
        navigation.navigate('CreateNoteScreen', { initialNote: note });
    };

    // Render block content
    const renderBlock = (block: NoteBlock, index: number) => {
        switch (block.type) {
            case 'h1':
                return (
                    <Text key={block.id} style={styles.h1Text}>
                        {block.content}
                    </Text>
                );
            case 'h2':
                return (
                    <Text key={block.id} style={styles.h2Text}>
                        {block.content}
                    </Text>
                );
            case 'h3':
                return (
                    <Text key={block.id} style={styles.h3Text}>
                        {block.content}
                    </Text>
                );
            case 'bullet':
                return (
                    <View key={block.id} style={styles.bulletItem}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{block.content}</Text>
                    </View>
                );
            case 'numbered':
                return (
                    <View key={block.id} style={styles.numberedItem}>
                        <Text style={styles.numberedNumber}>{index + 1}.</Text>
                        <Text style={styles.numberedText}>{block.content}</Text>
                    </View>
                );
            case 'quote':
                return (
                    <View key={block.id} style={styles.quoteBlock}>
                        <View style={styles.quoteBar} />
                        <Text style={styles.quoteText}>{block.content}</Text>
                    </View>
                );
            case 'callout':
                return (
                    <View key={block.id} style={styles.calloutBlock}>
                        <Ionicons name="information-circle" size={18} color="#F59E0B" />
                        <Text style={styles.calloutText}>{block.content}</Text>
                    </View>
                );
            case 'divider':
                return <View key={block.id} style={styles.divider} />;
            default:
                return (
                    <Text key={block.id} style={styles.paragraphText}>
                        {block.content}
                    </Text>
                );
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Loading note...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!note) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="document-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.errorTitle}>Note not found</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const sourceConfig = SOURCE_CONFIG[note.sourceType || 'manual'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={handleTogglePin}
                        style={styles.headerButton}
                    >
                        <Ionicons
                            name={note.isPinned ? 'pin' : 'pin-outline'}
                            size={22}
                            color={note.isPinned ? '#F59E0B' : '#6B7280'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleShare}
                        style={styles.headerButton}
                    >
                        <Ionicons name="share-outline" size={22} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowActions(!showActions)}
                        style={styles.headerButton}
                    >
                        <Ionicons name="ellipsis-vertical" size={22} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Actions Menu */}
            {showActions && (
                <View style={styles.actionsMenu}>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                            setShowActions(false);
                            handleEdit();
                        }}
                    >
                        <Ionicons name="create-outline" size={20} color="#6B7280" />
                        <Text style={styles.actionText}>Edit Note</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                            setShowActions(false);
                            handleAnalyze();
                        }}
                    >
                        <Ionicons name="sparkles-outline" size={20} color="#8B5CF6" />
                        <Text style={[styles.actionText, { color: '#8B5CF6' }]}>AI Analyze</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                            setShowActions(false);
                            handleDelete();
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Source indicator */}
                <View style={[styles.sourceTag, { backgroundColor: sourceConfig.color + '15' }]}>
                    <Ionicons name={sourceConfig.icon as any} size={14} color={sourceConfig.color} />
                    <Text style={[styles.sourceLabel, { color: sourceConfig.color }]}>
                        {sourceConfig.label}
                    </Text>
                    {note.sourceUrl && (
                        <TouchableOpacity onPress={() => Linking.openURL(note.sourceUrl!)}>
                            <Ionicons name="open-outline" size={14} color={sourceConfig.color} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Title */}
                <Text style={styles.title}>{note.title}</Text>

                {/* Meta info */}
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                        Created {new Date(note.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Text>
                    {note.updatedAt !== note.createdAt && (
                        <Text style={styles.metaText}>
                            · Edited {new Date(note.updatedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </Text>
                    )}
                </View>

                {/* Tags */}
                {note.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {note.tags.map(tag => (
                            <View
                                key={tag.id}
                                style={[styles.tagChip, { backgroundColor: tag.color + '20' }]}
                            >
                                <Text style={[styles.tagText, { color: tag.color }]}>
                                    #{tag.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* AI Summary */}
                {note.summary && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                            <Text style={styles.summaryLabel}>AI Summary</Text>
                        </View>
                        <Text style={styles.summaryText}>{note.summary}</Text>
                    </View>
                )}

                {/* Divider */}
                <View style={styles.sectionDivider} />

                {/* Content blocks */}
                <View style={styles.blocksContainer}>
                    {note.blocks && note.blocks.length > 0 ? (
                        note.blocks.map((block, index) => renderBlock(block, index))
                    ) : (
                        <Text style={styles.paragraphText}>{note.content}</Text>
                    )}
                </View>
            </ScrollView>

            {/* Bottom actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomButton}
                    onPress={handleEdit}
                >
                    <Ionicons name="create-outline" size={20} color="#6366F1" />
                    <Text style={styles.bottomButtonText}>Edit</Text>
                </TouchableOpacity>

                {!note.summary && (
                    <TouchableOpacity
                        style={[styles.bottomButton, styles.analyzeButton]}
                        onPress={handleAnalyze}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                                <Text style={styles.analyzeButtonText}>AI Summarize</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerButton: {
        padding: 8,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionsMenu: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    actionText: {
        fontSize: 15,
        color: '#374151',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    sourceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
        marginBottom: 12,
    },
    sourceLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 36,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    metaText: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    tagChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    summaryCard: {
        backgroundColor: '#F5F3FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7C3AED',
    },
    summaryText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 22,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    blocksContainer: {
        gap: 8,
    },
    h1Text: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 32,
        marginTop: 12,
        marginBottom: 8,
    },
    h2Text: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 28,
        marginTop: 10,
        marginBottom: 6,
    },
    h3Text: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 24,
        marginTop: 8,
        marginBottom: 4,
    },
    paragraphText: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 26,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 4,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#6B7280',
        marginTop: 9,
        marginRight: 12,
    },
    bulletText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        lineHeight: 26,
    },
    numberedItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 4,
    },
    numberedNumber: {
        fontSize: 16,
        color: '#6B7280',
        marginRight: 8,
        lineHeight: 26,
    },
    numberedText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        lineHeight: 26,
    },
    quoteBlock: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginVertical: 8,
        paddingLeft: 0,
    },
    quoteBar: {
        width: 4,
        backgroundColor: '#6366F1',
        borderRadius: 2,
        marginRight: 12,
    },
    quoteText: {
        flex: 1,
        fontSize: 16,
        color: '#6B7280',
        fontStyle: 'italic',
        lineHeight: 26,
    },
    calloutBlock: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        gap: 10,
    },
    calloutText: {
        flex: 1,
        fontSize: 15,
        color: '#78350F',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 12,
    },
    bottomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        gap: 6,
    },
    bottomButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6366F1',
    },
    analyzeButton: {
        backgroundColor: '#8B5CF6',
        flex: 1,
        justifyContent: 'center',
    },
    analyzeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default NoteDetailScreen;
