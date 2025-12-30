import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { TagPicker } from '../components/TagPicker';
import { useSaveNote } from '../hooks/useSaveNote';
import { useLoadNote } from '../hooks/useLoadNote';
import type { Tag } from '../types';
import { Input } from '../../../components/Input';

// Block types
type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'quote' | 'divider';

interface Block {
    id: string;
    type: BlockType;
    content: string;
}

// Parse a line to determine its type and content
const parseLineType = (text: string): { type: BlockType; content: string } => {
    if (text.startsWith('# ')) return { type: 'h1', content: text.slice(2) };
    if (text.startsWith('## ')) return { type: 'h2', content: text.slice(3) };
    if (text.startsWith('### ')) return { type: 'h3', content: text.slice(4) };
    if (text.startsWith('- ') || text.startsWith('* ')) return { type: 'bullet', content: text.slice(2) };
    if (/^\d+\.\s/.test(text)) return { type: 'numbered', content: text.replace(/^\d+\.\s/, '') };
    if (text.startsWith('> ')) return { type: 'quote', content: text.slice(2) };
    if (text === '---' || text === '***') return { type: 'divider', content: '' };
    return { type: 'paragraph', content: text };
};

// Convert blocks back to plain text for saving
const blocksToText = (blocks: Block[]): string => {
    return blocks.map(block => {
        switch (block.type) {
            case 'h1': return `# ${block.content}`;
            case 'h2': return `## ${block.content}`;
            case 'h3': return `### ${block.content}`;
            case 'bullet': return `- ${block.content}`;
            case 'numbered': return `1. ${block.content}`;
            case 'quote': return `> ${block.content}`;
            case 'divider': return '---';
            default: return block.content;
        }
    }).join('\n');
};

// Parse text into blocks
const textToBlocks = (text: string): Block[] => {
    if (!text) return [{ id: '1', type: 'paragraph', content: '' }];
    const lines = text.split('\n');
    return lines.map((line, i) => {
        const { type, content } = parseLineType(line);
        return { id: String(i + 1), type, content };
    });
};

// Generate unique ID
let blockIdCounter = Date.now();
const generateId = () => String(++blockIdCounter);

interface NoteEditorScreenProps {
    navigation: any;
    route: {
        params?: {
            noteId?: number;
        };
    };
}

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({
    navigation,
    route,
}) => {
    const noteId = route.params?.noteId;
    const { user } = useAuth();
    const userId = user?.id || 1;

    // State
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<Block[]>([{ id: '1', type: 'paragraph', content: '' }]);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>('1');
    const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

    // Hooks
    const {
        note,
        isLoading: isLoadingNote,
        load: loadNote,
        title: loadedTitle,
        content: loadedContent,
        tags: loadedTags,
    } = useLoadNote({ noteId, autoLoad: true });

    const {
        saveNow,
        setNoteId,
        isSaving,
        lastSaved,
    } = useSaveNote({
        userId,
        onSaveSuccess: (savedNote) => {
            if (!noteId) {
                setNoteId(savedNote.id);
            }
        },
        onSaveError: (error) => {
            Alert.alert('Save Error', error.message);
        },
    });

    // Load note data into state
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setBlocks(textToBlocks(note.plainText || ''));
            setSelectedTags(note.tags);
            setNoteId(note.id);
        }
    }, [note, setNoteId]);

    // Handle block content change
    const handleBlockChange = useCallback((blockId: string, newText: string) => {
        setBlocks(prev => {
            const blockIndex = prev.findIndex(b => b.id === blockId);
            if (blockIndex === -1) return prev;

            // Check if Enter was pressed (newText contains newline)
            if (newText.includes('\n')) {
                const lines = newText.split('\n');
                const newBlocks = [...prev];

                // Update current block with first line
                const { type, content } = parseLineType(lines[0]);
                newBlocks[blockIndex] = { ...newBlocks[blockIndex], type, content };

                // Insert new blocks for remaining lines
                const additionalBlocks = lines.slice(1).map(line => {
                    const parsed = parseLineType(line);
                    return { id: generateId(), type: parsed.type, content: parsed.content };
                });

                newBlocks.splice(blockIndex + 1, 0, ...additionalBlocks);

                // Focus the last new block
                setTimeout(() => {
                    const lastNewBlockId = additionalBlocks[additionalBlocks.length - 1]?.id;
                    if (lastNewBlockId) {
                        setFocusedBlockId(lastNewBlockId);
                        inputRefs.current[lastNewBlockId]?.focus();
                    }
                }, 50);

                return newBlocks;
            }

            // Normal text change - check for markdown prefixes
            const { type, content } = parseLineType(newText);
            const newBlocks = [...prev];
            newBlocks[blockIndex] = { ...newBlocks[blockIndex], type, content };
            return newBlocks;
        });
    }, []);

    // Handle backspace on empty block
    const handleKeyPress = useCallback((blockId: string, key: string) => {
        if (key === 'Backspace') {
            setBlocks(prev => {
                const blockIndex = prev.findIndex(b => b.id === blockId);
                if (blockIndex <= 0) return prev;

                const currentBlock = prev[blockIndex];
                if (currentBlock.content === '' && currentBlock.type === 'paragraph') {
                    // Delete this block and focus previous
                    const newBlocks = prev.filter(b => b.id !== blockId);
                    setTimeout(() => {
                        const prevBlockId = prev[blockIndex - 1]?.id;
                        if (prevBlockId) {
                            setFocusedBlockId(prevBlockId);
                            inputRefs.current[prevBlockId]?.focus();
                        }
                    }, 50);
                    return newBlocks;
                }
                return prev;
            });
        }
    }, []);

    // Handle title change (no autosave)
    const handleTitleChange = useCallback((newTitle: string) => {
        setTitle(newTitle);
    }, []);

    // Handle tags change (no autosave)
    const handleTagsChange = useCallback((newTags: Tag[]) => {
        setSelectedTags(newTags);
    }, []);

    // Manual save
    const handleSave = useCallback(async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        const plainText = blocksToText(blocks);
        await saveNow(title, plainText, selectedTags.map(t => t.id));
    }, [title, blocks, selectedTags, saveNow]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    // Format last saved time
    const formatLastSaved = () => {
        if (!lastSaved) return '';
        const now = new Date();
        const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
        if (diff < 5) return 'Saved just now';
        if (diff < 60) return `Saved ${diff}s ago`;
        return `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    if (isLoadingNote) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading note...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.headerButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        {isSaving && (
                            <Text style={styles.savingText}>Saving...</Text>
                        )}
                        {lastSaved && !isSaving && (
                            <Text style={styles.savedText}>{formatLastSaved()}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        disabled={isSaving}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Title Input */}
                <View style={styles.titleContainer}>
                    <Input
                        style={styles.titleInput}
                        placeholder="Note title..."
                        placeholderTextColor="#9ca3af"
                        value={title}
                        onChangeText={handleTitleChange}
                        multiline={false}
                        autoFocus={!noteId}
                    />
                </View>

                {/* Tags Picker */}
                <View style={styles.tagsContainer}>
                    <TagPicker
                        selectedTags={selectedTags}
                        onTagsChange={handleTagsChange}
                        placeholder="Add tags..."
                        maxTags={5}
                    />
                </View>

                {/* Block-based Editor (Notion-like) */}
                <ScrollView
                    style={styles.editorScroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {blocks.map((block, index) => (
                        <View key={block.id} style={styles.blockContainer}>
                            {block.type === 'divider' ? (
                                <View style={styles.dividerBlock} />
                            ) : (
                                <Input
                                    ref={(ref) => { inputRefs.current[block.id] = ref; }}
                                    style={[
                                        styles.blockInput,
                                        block.type === 'h1' && styles.h1Block,
                                        block.type === 'h2' && styles.h2Block,
                                        block.type === 'h3' && styles.h3Block,
                                        block.type === 'bullet' && styles.bulletBlock,
                                        block.type === 'numbered' && styles.numberedBlock,
                                        block.type === 'quote' && styles.quoteBlock,
                                    ]}
                                    value={block.content}
                                    onChangeText={(text) => {
                                        // Reconstruct full line with prefix for parsing
                                        let fullText = text;
                                        if (block.type === 'h1') fullText = `# ${text}`;
                                        else if (block.type === 'h2') fullText = `## ${text}`;
                                        else if (block.type === 'h3') fullText = `### ${text}`;
                                        else if (block.type === 'bullet') fullText = `- ${text}`;
                                        else if (block.type === 'numbered') fullText = `1. ${text}`;
                                        else if (block.type === 'quote') fullText = `> ${text}`;
                                        handleBlockChange(block.id, fullText);
                                    }}
                                    onKeyPress={({ nativeEvent }) => {
                                        if (nativeEvent.key === 'Backspace' && block.content === '') {
                                            handleKeyPress(block.id, 'Backspace');
                                        }
                                    }}
                                    onFocus={() => setFocusedBlockId(block.id)}
                                    placeholder={index === 0 ? "Type '# ' for heading, '- ' for list..." : ''}
                                    placeholderTextColor="#c4c4c4"
                                    multiline
                                    blurOnSubmit={false}
                                    autoFocus={index === 0 && !noteId}
                                    underlineColorAndroid="transparent"
                                    selectionColor="#6366f1"
                                />
                            )}
                            {block.type === 'bullet' && (
                                <Text style={styles.bulletMarker}>•</Text>
                            )}
                            {block.type === 'numbered' && (
                                <Text style={styles.numberedMarker}>{index + 1}.</Text>
                            )}
                            {block.type === 'quote' && (
                                <View style={styles.quoteBar} />
                            )}
                        </View>
                    ))}
                    {/* Add block button */}
                    <TouchableOpacity
                        style={styles.addBlockButton}
                        onPress={() => {
                            const newBlock = { id: generateId(), type: 'paragraph' as BlockType, content: '' };
                            setBlocks(prev => [...prev, newBlock]);
                            setTimeout(() => {
                                setFocusedBlockId(newBlock.id);
                                inputRefs.current[newBlock.id]?.focus();
                            }, 50);
                        }}
                    >
                        <Ionicons name="add" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoid: {
        flex: 1,
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
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    savingText: {
        fontSize: 12,
        color: '#6b7280',
    },
    savedText: {
        fontSize: 12,
        color: '#22c55e',
    },
    saveButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#a5b4fc',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    tagsContainer: {
        paddingHorizontal: 20,
    },
    editorScroll: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    blockContainer: {
        position: 'relative',
    },
    blockInput: {
        fontSize: 16,
        lineHeight: 20,
        color: '#1a1a1a',
        paddingVertical: 1,
        paddingHorizontal: 0,
        borderWidth: 0,
        outlineWidth: 0,
        backgroundColor: 'transparent',
        minHeight: 22,
    },
    h1Block: {
        fontSize: 26,
        fontWeight: '700',
        lineHeight: 30,
        color: '#111',
        minHeight: 32,
    },
    h2Block: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 24,
        color: '#111',
        minHeight: 26,
    },
    h3Block: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 22,
        color: '#111',
        minHeight: 24,
    },
    bulletBlock: {
        paddingLeft: 20,
    },
    numberedBlock: {
        paddingLeft: 24,
    },
    quoteBlock: {
        paddingLeft: 16,
        fontStyle: 'italic',
        color: '#6b7280',
    },
    bulletMarker: {
        position: 'absolute',
        left: 0,
        top: 1,
        fontSize: 16,
        color: '#1a1a1a',
        lineHeight: 20,
    },
    numberedMarker: {
        position: 'absolute',
        left: 0,
        top: 1,
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
    quoteBar: {
        position: 'absolute',
        left: 0,
        top: 2,
        bottom: 2,
        width: 3,
        backgroundColor: '#6366f1',
        borderRadius: 1,
    },
    dividerBlock: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    addBlockButton: {
        paddingVertical: 12,
        alignItems: 'center',
        opacity: 0.5,
    },
});

export default NoteEditorScreen;
