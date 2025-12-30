import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Share,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { fetchNote, updateNote, deleteNote } from '../services/notesApi';
import { Note } from '../types';

interface NotePreviewScreenProps {
    navigation: any;
    route: {
        params: {
            noteId: number;
        };
    };
}

export const NotePreviewScreen: React.FC<NotePreviewScreenProps> = ({
    navigation,
    route,
}) => {
    const { noteId } = route.params;
    const [note, setNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadNote = useCallback(async () => {
        try {
            setIsLoading(true);
            const fetchedNote = await fetchNote(noteId);
            setNote(fetchedNote);
        } catch (error) {
            console.error('Failed to load note:', error);
            Alert.alert('Error', 'Failed to load note');
        } finally {
            setIsLoading(false);
        }
    }, [noteId]);

    useEffect(() => {
        loadNote();
    }, [loadNote]);

    // Handle edit
    const handleEdit = useCallback(() => {
        navigation.navigate('NoteEditor', { noteId });
    }, [navigation, noteId]);

    // Handle pin toggle
    const handleTogglePin = useCallback(async () => {
        if (!note) return;
        try {
            const updated = await updateNote(noteId, { isPinned: !note.isPinned });
            setNote(updated);
        } catch (error) {
            Alert.alert('Error', 'Failed to update note');
        }
    }, [note, noteId]);

    // Handle archive
    const handleArchive = useCallback(async () => {
        if (!note) return;
        Alert.alert(
            note.isArchived ? 'Unarchive Note' : 'Archive Note',
            `Are you sure you want to ${note.isArchived ? 'unarchive' : 'archive'} this note?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: note.isArchived ? 'Unarchive' : 'Archive',
                    onPress: async () => {
                        try {
                            const updated = await updateNote(noteId, { isArchived: !note.isArchived });
                            setNote(updated);
                            if (!note.isArchived) {
                                navigation.goBack();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update note');
                        }
                    },
                },
            ]
        );
    }, [note, noteId, navigation]);

    // Handle delete
    const handleDelete = useCallback(() => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note? This action cannot be undone.',
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
    }, [noteId, navigation]);

    // Handle share
    const handleShare = useCallback(async () => {
        if (!note) return;
        try {
            await Share.share({
                title: note.title,
                message: `${note.title}\n\n${note.plainText || ''}`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    }, [note]);

    // Handle options menu
    const handleOptions = useCallback(() => {
        Alert.alert(
            'Note Options',
            '',
            [
                {
                    text: note?.isPinned ? 'Unpin' : 'Pin',
                    onPress: handleTogglePin,
                },
                {
                    text: note?.isArchived ? 'Unarchive' : 'Archive',
                    onPress: handleArchive,
                },
                {
                    text: 'Share',
                    onPress: handleShare,
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: handleDelete,
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    }, [note, handleTogglePin, handleArchive, handleShare, handleDelete]);

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading note...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!note) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                    <Text style={styles.errorText}>Note not found</Text>
                    <TouchableOpacity
                        style={styles.backHomeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backHomeButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                        <Ionicons name="create-outline" size={22} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleOptions} style={styles.headerButton}>
                        <Ionicons name="ellipsis-horizontal" size={22} color="#1a1a1a" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.titleContainer}>
                    <View style={styles.titleRow}>
                        {note.isPinned && (
                            <Ionicons name="pin" size={18} color="#f59e0b" style={styles.pinIcon} />
                        )}
                        <Text style={styles.title}>{note.title}</Text>
                    </View>
                </View>

                {/* Meta info */}
                <View style={styles.metaContainer}>
                    <Text style={styles.metaText}>
                        Updated {formatDate(note.updatedAt)}
                    </Text>
                </View>

                {/* Tags */}
                {note.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {note.tags.map((tag) => (
                            <View
                                key={tag.id}
                                style={[styles.tagChip, { backgroundColor: tag.color }]}
                            >
                                <Text style={styles.tagChipText}>#{tag.name}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Content */}
                <View style={styles.contentContainer}>
                    {note.plainText ? (
                        <Markdown style={markdownStyles}>
                            {note.plainText}
                        </Markdown>
                    ) : (
                        <Text style={styles.emptyContent}>No content</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Markdown styles
const markdownStyles = StyleSheet.create({
    body: {
        color: '#1a1a1a',
        fontSize: 16,
        lineHeight: 24,
    },
    heading1: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111',
        marginTop: 20,
        marginBottom: 12,
        lineHeight: 34,
    },
    heading2: {
        fontSize: 22,
        fontWeight: '600',
        color: '#111',
        marginTop: 18,
        marginBottom: 10,
        lineHeight: 28,
    },
    heading3: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
        marginTop: 16,
        marginBottom: 8,
        lineHeight: 24,
    },
    paragraph: {
        marginBottom: 12,
        lineHeight: 24,
    },
    strong: {
        fontWeight: '700',
    },
    em: {
        fontStyle: 'italic',
    },
    blockquote: {
        backgroundColor: '#f9fafb',
        borderLeftWidth: 4,
        borderLeftColor: '#6366f1',
        paddingLeft: 16,
        paddingVertical: 8,
        marginVertical: 12,
        fontStyle: 'italic',
    },
    code_inline: {
        backgroundColor: '#f3f4f6',
        color: '#e11d48',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: 'monospace',
        fontSize: 14,
    },
    code_block: {
        backgroundColor: '#1e1e2e',
        color: '#e0e0e0',
        padding: 16,
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 14,
        marginVertical: 12,
    },
    fence: {
        backgroundColor: '#1e1e2e',
        color: '#e0e0e0',
        padding: 16,
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 14,
        marginVertical: 12,
    },
    bullet_list: {
        marginVertical: 8,
    },
    ordered_list: {
        marginVertical: 8,
    },
    list_item: {
        marginBottom: 6,
    },
    hr: {
        backgroundColor: '#e5e7eb',
        height: 2,
        marginVertical: 16,
    },
    link: {
        color: '#6366f1',
        textDecorationLine: 'underline',
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ef4444',
        marginTop: 16,
    },
    backHomeButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#6366f1',
        borderRadius: 12,
    },
    backHomeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerButton: {
        padding: 8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    titleContainer: {
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    pinIcon: {
        marginRight: 8,
        marginTop: 4,
    },
    title: {
        flex: 1,
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        lineHeight: 36,
    },
    metaContainer: {
        marginBottom: 16,
    },
    metaText: {
        fontSize: 13,
        color: '#9ca3af',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    tagChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#fff',
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 20,
    },
    contentContainer: {
        flex: 1,
    },
    emptyContent: {
        color: '#9ca3af',
        fontSize: 14,
        fontStyle: 'italic',
    },
});

export default NotePreviewScreen;

