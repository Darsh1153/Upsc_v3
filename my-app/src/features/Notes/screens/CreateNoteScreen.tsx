import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    createNote,
    updateNote,
    getAllTags,
    LocalTag,
    LocalNote,
    NoteBlock,
} from '../services/localNotesStorage';
import { TagPicker } from '../components/TagPicker';
import { summarizeNoteContent } from '../services/aiSummarizer';
import { smartScrape, isValidUrl, extractDomain } from '../services/webScraper';
import { TypeWriterText } from '../../../components/TypeWriterText';

interface CreateNoteScreenProps {
    navigation: any;
    route: {
        params?: {
            noteId?: number;
            initialNote?: Partial<LocalNote>;
        };
    };
}

// Block type icons
const BLOCK_ICONS: Record<string, string> = {
    paragraph: 'text-outline',
    h1: 'text-outline',
    h2: 'text-outline',
    h3: 'text-outline',
    bullet: 'list-outline',
    numbered: 'list-outline',
    quote: 'chatbubble-outline',
    divider: 'remove-outline',
    callout: 'information-circle-outline',
};

// Generate unique block ID
let blockCounter = Date.now();
const generateBlockId = () => String(++blockCounter);

// Parse markdown line to block
const parseLineToBlock = (text: string): { type: NoteBlock['type']; content: string } => {
    if (text.startsWith('# ')) return { type: 'h1', content: text.slice(2) };
    if (text.startsWith('## ')) return { type: 'h2', content: text.slice(3) };
    if (text.startsWith('### ')) return { type: 'h3', content: text.slice(4) };
    if (text.startsWith('- ') || text.startsWith('* ')) return { type: 'bullet', content: text.slice(2) };
    if (/^\d+\.\s/.test(text)) return { type: 'numbered', content: text.replace(/^\d+\.\s/, '') };
    if (text.startsWith('> ')) return { type: 'quote', content: text.slice(2) };
    if (text === '---' || text === '***') return { type: 'divider', content: '' };
    if (text.startsWith('! ')) return { type: 'callout', content: text.slice(2) };
    return { type: 'paragraph', content: text };
};

// Convert blocks to plain text
const blocksToText = (blocks: NoteBlock[]): string => {
    return blocks.map(block => {
        switch (block.type) {
            case 'h1': return `# ${block.content}`;
            case 'h2': return `## ${block.content}`;
            case 'h3': return `### ${block.content}`;
            case 'bullet': return `- ${block.content}`;
            case 'numbered': return `1. ${block.content}`;
            case 'quote': return `> ${block.content}`;
            case 'divider': return '---';
            case 'callout': return `! ${block.content}`;
            default: return block.content;
        }
    }).join('\n');
};

// Source type options
const SOURCE_TYPES = [
    { key: 'manual', label: 'My Note', icon: 'create-outline', color: '#6366F1' },
    { key: 'ncert', label: 'NCERT', icon: 'book-outline', color: '#10B981' },
    { key: 'book', label: 'Standard Book', icon: 'library-outline', color: '#8B5CF6' },
    { key: 'current_affairs', label: 'Current Affairs', icon: 'newspaper-outline', color: '#F59E0B' },
    { key: 'report', label: 'Report', icon: 'document-text-outline', color: '#EF4444' },
];

export const CreateNoteScreen: React.FC<CreateNoteScreenProps> = ({ navigation, route }) => {
    const initialNote = route.params?.initialNote;

    // State
    const [title, setTitle] = useState(initialNote?.title || '');
    const [blocks, setBlocks] = useState<NoteBlock[]>(
        initialNote?.blocks || [{ id: generateBlockId(), type: 'paragraph', content: '' }]
    );
    const [selectedTags, setSelectedTags] = useState<LocalTag[]>(initialNote?.tags || []);
    const [sourceType, setSourceType] = useState<LocalNote['sourceType']>(initialNote?.sourceType || 'manual');
    const [showSourcePicker, setShowSourcePicker] = useState(false);
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(blocks[0]?.id);
    const [isSaving, setIsSaving] = useState(false);
    const [showBlockMenu, setShowBlockMenu] = useState(false);

    // Web scraping state
    const [showScrapeModal, setShowScrapeModal] = useState(false);
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);

    // AI Summarization state
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [generatedSummary, setGeneratedSummary] = useState('');

    const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

    // Handle block content change with markdown parsing
    const handleBlockChange = useCallback((blockId: string, newText: string) => {
        setBlocks(prev => {
            const blockIndex = prev.findIndex(b => b.id === blockId);
            if (blockIndex === -1) return prev;

            // Check for newline (Enter pressed)
            if (newText.includes('\n')) {
                const lines = newText.split('\n');
                const newBlocks = [...prev];

                // Update current block
                const { type, content } = parseLineToBlock(lines[0]);
                newBlocks[blockIndex] = { ...newBlocks[blockIndex], type, content };

                // Create new blocks for additional lines
                const additionalBlocks = lines.slice(1).map(line => {
                    const parsed = parseLineToBlock(line);
                    return { id: generateBlockId(), type: parsed.type, content: parsed.content };
                });

                newBlocks.splice(blockIndex + 1, 0, ...additionalBlocks);

                // Focus the last new block
                setTimeout(() => {
                    const lastBlockId = additionalBlocks[additionalBlocks.length - 1]?.id;
                    if (lastBlockId) {
                        setFocusedBlockId(lastBlockId);
                        inputRefs.current[lastBlockId]?.focus();
                    }
                }, 50);

                return newBlocks;
            }

            // Normal change - parse for markdown prefixes
            const { type, content } = parseLineToBlock(newText);
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

    // Add new block
    const addBlock = useCallback((type: NoteBlock['type'] = 'paragraph') => {
        const newBlock: NoteBlock = { id: generateBlockId(), type, content: '' };

        setBlocks(prev => {
            const focusIndex = prev.findIndex(b => b.id === focusedBlockId);
            const insertIndex = focusIndex >= 0 ? focusIndex + 1 : prev.length;
            const newBlocks = [...prev];
            newBlocks.splice(insertIndex, 0, newBlock);
            return newBlocks;
        });

        setTimeout(() => {
            setFocusedBlockId(newBlock.id);
            inputRefs.current[newBlock.id]?.focus();
        }, 50);

        setShowBlockMenu(false);
    }, [focusedBlockId]);

    // Change block type
    const changeBlockType = useCallback((blockId: string, newType: NoteBlock['type']) => {
        setBlocks(prev =>
            prev.map(block =>
                block.id === blockId ? { ...block, type: newType } : block
            )
        );
    }, []);

    // Toggle tag
    const toggleTag = useCallback((tag: LocalTag) => {
        setSelectedTags(prev =>
            prev.some(t => t.id === tag.id)
                ? prev.filter(t => t.id !== tag.id)
                : prev.length < 5 ? [...prev, tag] : prev
        );
    }, []);

    // Save note
    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        setIsSaving(true);

        try {
            const content = blocksToText(blocks);

            const noteData: Partial<LocalNote> = {
                title: title.trim(),
                content,
                blocks,
                tags: selectedTags,
                sourceType,
            };

            if (initialNote?.id) {
                await updateNote(initialNote.id, noteData);
            } else {
                await createNote(noteData);
            }

            Alert.alert('Success', 'Note saved!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error('Error saving note:', error);
            Alert.alert('Error', 'Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle web scraping
    const handleScrapeArticle = async () => {
        if (!scrapeUrl.trim()) {
            Alert.alert('Error', 'Please enter a URL');
            return;
        }

        if (!isValidUrl(scrapeUrl)) {
            Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
            return;
        }

        setIsScraping(true);

        try {
            const result = await smartScrape(scrapeUrl.trim());

            if (result.error || result.contentBlocks.length === 0) {
                Alert.alert(
                    'Scraping Failed',
                    result.error || 'Could not extract content from this URL. This may be due to CORS restrictions on web. Try on mobile device.'
                );
                setIsScraping(false);
                return;
            }

            // Set title if empty
            if (!title.trim() && result.title) {
                setTitle(result.title);
            }

            // Create blocks from scraped content blocks
            const newBlocks: NoteBlock[] = [];

            // Add source heading
            newBlocks.push({
                id: generateBlockId(),
                type: 'h2',
                content: `📰 From: ${extractDomain(scrapeUrl)}`,
            });

            // Add all content blocks from the article
            for (const block of result.contentBlocks) {
                if (block.type === 'heading') {
                    newBlocks.push({
                        id: generateBlockId(),
                        type: block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3',
                        content: block.content,
                    });
                } else if (block.type === 'paragraph' && block.content) {
                    newBlocks.push({
                        id: generateBlockId(),
                        type: 'paragraph',
                        content: block.content,
                    });
                } else if (block.type === 'bullet' && block.items) {
                    for (const item of block.items) {
                        newBlocks.push({
                            id: generateBlockId(),
                            type: 'bullet',
                            content: item,
                        });
                    }
                } else if (block.type === 'numbered' && block.items) {
                    for (const item of block.items) {
                        newBlocks.push({
                            id: generateBlockId(),
                            type: 'numbered',
                            content: item,
                        });
                    }
                } else if (block.type === 'quote' && block.content) {
                    newBlocks.push({
                        id: generateBlockId(),
                        type: 'quote',
                        content: block.content,
                    });
                }
            }

            // Add divider at end
            newBlocks.push({
                id: generateBlockId(),
                type: 'divider',
                content: '',
            });

            // Insert blocks at current position
            setBlocks(prev => {
                const focusIndex = prev.findIndex(b => b.id === focusedBlockId);
                const insertIndex = focusIndex >= 0 ? focusIndex + 1 : prev.length;
                const updated = [...prev];
                updated.splice(insertIndex, 0, ...newBlocks);
                return updated;
            });

            // Update source type
            setSourceType('scraped');

            // Close modal and reset
            setShowScrapeModal(false);
            setScrapeUrl('');

            Alert.alert(
                '✅ Article Imported!',
                `${result.contentBlocks.length} content blocks extracted from ${extractDomain(scrapeUrl)}`
            );
        } catch (error) {
            console.error('Scraping error:', error);
            Alert.alert('Error', 'Failed to scrape the article. This may be due to CORS restrictions when running on web.');
        } finally {
            setIsScraping(false);
        }
    };


    // Handle AI Summarization
    const handleSummarize = async () => {
        const content = blocksToText(blocks);
        if (!content || content.trim().length === 0) {
            Alert.alert('Empty Note', 'Please add some content to summarize.');
            return;
        }

        setIsSummarizing(true);
        try {
            const result = await summarizeNoteContent(content);
            if (result.error) {
                Alert.alert('AI Error', result.error);
            } else {
                setGeneratedSummary(result.summary);
                setShowSummaryModal(true);
            }
        } catch (error) {
            console.error('Summarize error:', error);
            Alert.alert('Error', 'Failed to generate summary.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const applySummary = () => {
        if (!generatedSummary) return;

        // Convert summary to blocks (simple split by newline for now, reusing scrape logic or just adding as markdown)
        const summaryBlocks: NoteBlock[] = [];

        summaryBlocks.push({
            id: generateBlockId(),
            type: 'h2',
            content: '✨ AI Summary'
        });

        const lines = generatedSummary.split('\n');
        lines.forEach(line => {
            const parsed = parseLineToBlock(line);
            if (parsed.content.trim()) {
                summaryBlocks.push({
                    id: generateBlockId(),
                    type: parsed.type,
                    content: parsed.content
                });
            }
        });

        summaryBlocks.push({
            id: generateBlockId(),
            type: 'divider',
            content: ''
        });

        // Insert at top or bottom? Let's insert at top for visibility
        setBlocks(prev => {
            // Find index after Title if possible, or just at start
            return [...summaryBlocks, ...prev];
        });

        setShowSummaryModal(false);
        setGeneratedSummary('');
    };

    // Render block
    const renderBlock = (block: NoteBlock, index: number) => {
        const isFirst = index === 0;

        return (
            <View key={block.id} style={styles.blockWrapper}>
                {/* Block type indicator */}
                <TouchableOpacity
                    style={styles.blockHandle}
                    onPress={() => {
                        setFocusedBlockId(block.id);
                        setShowBlockMenu(true);
                    }}
                >
                    <Ionicons
                        name={(BLOCK_ICONS[block.type] || 'text-outline') as any}
                        size={14}
                        color={focusedBlockId === block.id ? '#6366F1' : '#D1D5DB'}
                    />
                </TouchableOpacity>

                {block.type === 'divider' ? (
                    <View style={styles.divider} />
                ) : (
                    <TextInput
                        ref={ref => { inputRefs.current[block.id] = ref; }}
                        style={[
                            styles.blockInput,
                            block.type === 'h1' && styles.h1,
                            block.type === 'h2' && styles.h2,
                            block.type === 'h3' && styles.h3,
                            block.type === 'quote' && styles.quote,
                            block.type === 'callout' && styles.callout,
                            block.type === 'bullet' && styles.bulletBlock,
                            block.type === 'numbered' && styles.numberedBlock,
                        ]}
                        value={block.content}
                        onChangeText={(text) => {
                            // Handle markdown shortcuts
                            let fullText = text;
                            if (block.type !== 'paragraph') {
                                const prefix = block.type === 'h1' ? '# ' :
                                    block.type === 'h2' ? '## ' :
                                        block.type === 'h3' ? '### ' :
                                            block.type === 'bullet' ? '- ' :
                                                block.type === 'numbered' ? '1. ' :
                                                    block.type === 'quote' ? '> ' :
                                                        block.type === 'callout' ? '! ' : '';
                                fullText = prefix + text;
                            }
                            handleBlockChange(block.id, fullText);
                        }}
                        onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === 'Backspace' && block.content === '') {
                                handleKeyPress(block.id, 'Backspace');
                            }
                        }}
                        onFocus={() => setFocusedBlockId(block.id)}
                        placeholder={isFirst ? "Type '# ' for heading, '- ' for list..." : ''}
                        placeholderTextColor="#C4C4C4"
                        multiline
                        blurOnSubmit={false}
                    />
                )}

                {/* Bullet indicator */}
                {block.type === 'bullet' && (
                    <View style={styles.bulletMarker}>
                        <View style={styles.bulletDot} />
                    </View>
                )}

                {/* Number indicator */}
                {block.type === 'numbered' && (
                    <Text style={styles.numberMarker}>{index + 1}.</Text>
                )}

                {/* Quote bar */}
                {block.type === 'quote' && <View style={styles.quoteBar} />}

                {/* Callout icon */}
                {block.type === 'callout' && (
                    <View style={styles.calloutIcon}>
                        <Ionicons name="information-circle" size={18} color="#F59E0B" />
                    </View>
                )}
            </View>
        );
    };

    // Block type menu
    const renderBlockMenu = () => {
        if (!showBlockMenu) return null;

        const blockTypes: { type: NoteBlock['type']; label: string; icon: string }[] = [
            { type: 'paragraph', label: 'Text', icon: 'text-outline' },
            { type: 'h1', label: 'Heading 1', icon: 'text-outline' },
            { type: 'h2', label: 'Heading 2', icon: 'text-outline' },
            { type: 'h3', label: 'Heading 3', icon: 'text-outline' },
            { type: 'bullet', label: 'Bullet List', icon: 'list-outline' },
            { type: 'numbered', label: 'Numbered List', icon: 'list-outline' },
            { type: 'quote', label: 'Quote', icon: 'chatbubble-outline' },
            { type: 'callout', label: 'Callout', icon: 'information-circle-outline' },
            { type: 'divider', label: 'Divider', icon: 'remove-outline' },
        ];

        return (
            <View style={styles.blockMenuOverlay}>
                <TouchableOpacity
                    style={styles.blockMenuBackdrop}
                    onPress={() => setShowBlockMenu(false)}
                />
                <View style={styles.blockMenu}>
                    <Text style={styles.blockMenuTitle}>Block Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.blockMenuGrid}>
                            {blockTypes.map(({ type, label, icon }) => (
                                <TouchableOpacity
                                    key={type}
                                    style={styles.blockMenuItem}
                                    onPress={() => {
                                        if (focusedBlockId) {
                                            changeBlockType(focusedBlockId, type);
                                        } else {
                                            addBlock(type);
                                        }
                                        setShowBlockMenu(false);
                                    }}
                                >
                                    <Ionicons name={icon as any} size={20} color="#6366F1" />
                                    <Text style={styles.blockMenuItemText}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <TouchableOpacity
                            style={styles.sourceTypeButton}
                            onPress={() => setShowSourcePicker(!showSourcePicker)}
                        >
                            {(() => {
                                const source = SOURCE_TYPES.find(s => s.key === sourceType) || SOURCE_TYPES[0];
                                return (
                                    <>
                                        <Ionicons name={source.icon as any} size={14} color={source.color} />
                                        <Text style={[styles.sourceTypeText, { color: source.color }]}>
                                            {source.label}
                                        </Text>
                                        <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                                    </>
                                );
                            })()}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Source Type Picker */}
                {showSourcePicker && (
                    <View style={styles.sourcePicker}>
                        {SOURCE_TYPES.map(source => (
                            <TouchableOpacity
                                key={source.key}
                                style={[
                                    styles.sourceOption,
                                    sourceType === source.key && styles.sourceOptionActive,
                                ]}
                                onPress={() => {
                                    setSourceType(source.key as LocalNote['sourceType']);
                                    setShowSourcePicker(false);
                                }}
                            >
                                <Ionicons name={source.icon as any} size={18} color={source.color} />
                                <Text style={styles.sourceOptionText}>{source.label}</Text>
                                {sourceType === source.key && (
                                    <Ionicons name="checkmark" size={18} color="#10B981" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <TextInput
                        style={styles.titleInput}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Note title..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                    />

                    {/* Tags */}
                    <View style={styles.tagsSection}>
                        <TagPicker
                            selectedTags={selectedTags}
                            onTagsChange={setSelectedTags}
                            maxTags={5}
                            placeholder="Add tags (e.g. History, Polity)..."
                        />
                    </View>

                    {/* AI Summarize Button */}
                    <TouchableOpacity
                        style={styles.aiButton}
                        onPress={handleSummarize}
                        disabled={isSummarizing}
                    >
                        <LinearGradient
                            colors={isSummarizing ? ['#C7C7CC', '#A1A1A6'] : ['#4F46E5', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.aiButtonContent}
                        >
                            {isSummarizing ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.aiButtonText}>Generating Summary...</Text>
                                </>
                            ) : (
                                <Text style={styles.aiButtonText}>AI Summarize Note</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.sectionDivider} />

                    {/* Blocks */}
                    {blocks.map((block, index) => renderBlock(block, index))}

                    {/* Add block button */}
                    <TouchableOpacity
                        style={styles.addBlockButton}
                        onPress={() => addBlock('paragraph')}
                    >
                        <Ionicons name="add" size={20} color="#9CA3AF" />
                        <Text style={styles.addBlockText}>Add block</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Formatting toolbar */}
                <View style={styles.toolbar}>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => setShowBlockMenu(true)}
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#6366F1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toolbarButton, styles.webScrapeButton]}
                        onPress={() => setShowScrapeModal(true)}
                    >
                        <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => addBlock('h2')}
                    >
                        <Text style={styles.toolbarButtonTextBold}>H</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => addBlock('bullet')}
                    >
                        <Ionicons name="list-outline" size={22} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => addBlock('quote')}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => addBlock('callout')}
                    >
                        <Ionicons name="information-circle-outline" size={22} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Web Scrape Modal */}
                <Modal
                    visible={showScrapeModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowScrapeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.scrapeModal}>
                            <View style={styles.scrapeModalHeader}>
                                <Text style={styles.scrapeModalTitle}>🌐 Import from Web</Text>
                                <TouchableOpacity onPress={() => setShowScrapeModal(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.scrapeModalSubtitle}>
                                Paste a URL to extract article content as bullet points
                            </Text>

                            <View style={styles.urlInputContainer}>
                                <Ionicons name="link-outline" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.urlInput}
                                    placeholder="https://thehindu.com/article..."
                                    placeholderTextColor="#9CA3AF"
                                    value={scrapeUrl}
                                    onChangeText={setScrapeUrl}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="url"
                                    editable={!isScraping}
                                />
                                {scrapeUrl.length > 0 && !isScraping && (
                                    <TouchableOpacity onPress={() => setScrapeUrl('')}>
                                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[styles.scrapeButton, (!scrapeUrl.trim() || isScraping) && styles.scrapeButtonDisabled]}
                                onPress={handleScrapeArticle}
                                disabled={!scrapeUrl.trim() || isScraping}
                            >
                                {isScraping ? (
                                    <>
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                        <Text style={styles.scrapeButtonText}>Extracting...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                                        <Text style={styles.scrapeButtonText}>Extract Content</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.scrapeHintContainer}>
                                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                                <Text style={styles.scrapeHintText}>
                                    Content will be added as bullet points at your current position
                                </Text>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* AI Summary Modal */}
                <Modal
                    visible={showSummaryModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowSummaryModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.summaryModal}>
                            <View style={styles.summaryHeader}>
                                <View style={styles.summaryTitleRow}>
                                    <Ionicons name="sparkles" size={20} color="#6366F1" />
                                    <Text style={styles.summaryTitle}>AI Summary</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.summaryContent}>
                                <TypeWriterText
                                    style={styles.summaryText}
                                    text={generatedSummary}
                                    speed={5}
                                />
                            </ScrollView>

                            <View style={styles.summaryFooter}>
                                <TouchableOpacity
                                    style={styles.summaryCancelBtn}
                                    onPress={() => setShowSummaryModal(false)}
                                >
                                    <Text style={styles.summaryCancelText}>Close</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.summaryApplyBtn}
                                    onPress={applySummary}
                                >
                                    <Text style={styles.summaryApplyText}>Add to Note</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Block menu overlay */}
                {renderBlockMenu()}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        padding: 4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    sourceTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    sourceTypeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    sourcePicker: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    sourceOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 10,
    },
    aiButton: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    aiButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    aiButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    summaryModal: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        maxHeight: '80%',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    summaryContent: {
        marginBottom: 20,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#374151',
    },
    summaryFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    summaryCancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    summaryCancelText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '500',
    },
    summaryApplyBtn: {
        backgroundColor: '#6366F1',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    summaryApplyText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    sourceOptionActive: {
        backgroundColor: '#F3F4F6',
    },
    sourceOptionText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },
    titleInput: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        lineHeight: 32,
    },
    tagsSection: {
        marginBottom: 16,
    },
    addTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    addTagText: {
        fontSize: 13,
        color: '#6B7280',
    },
    selectedTagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    tagChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    tagPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 10,
    },
    tagPickerItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tagPickerText: {
        fontSize: 12,
        color: '#6B7280',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    blockWrapper: {
        position: 'relative',
        marginBottom: 2,
    },
    blockHandle: {
        position: 'absolute',
        left: -24,
        top: 4,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockInput: {
        fontSize: 16,
        color: '#1F2937',
        lineHeight: 24,
        paddingVertical: 2,
    },
    h1: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 30,
    },
    h2: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 26,
    },
    h3: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 24,
    },
    quote: {
        fontStyle: 'italic',
        color: '#6B7280',
        paddingLeft: 16,
    },
    callout: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        paddingLeft: 36,
        borderRadius: 8,
    },
    bulletBlock: {
        paddingLeft: 20,
    },
    numberedBlock: {
        paddingLeft: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    bulletMarker: {
        position: 'absolute',
        left: 4,
        top: 10,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#6B7280',
    },
    numberMarker: {
        position: 'absolute',
        left: 0,
        top: 4,
        fontSize: 14,
        color: '#6B7280',
    },
    quoteBar: {
        position: 'absolute',
        left: 0,
        top: 4,
        bottom: 4,
        width: 3,
        backgroundColor: '#6366F1',
        borderRadius: 2,
    },
    calloutIcon: {
        position: 'absolute',
        left: 10,
        top: 13,
    },
    addBlockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 6,
        opacity: 0.5,
    },
    addBlockText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    toolbarButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolbarButtonTextBold: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6B7280',
    },
    blockMenuOverlay: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    blockMenuBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    blockMenu: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    blockMenuTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    blockMenuGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    blockMenuItem: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        minWidth: 80,
    },
    blockMenuItemText: {
        fontSize: 12,
        color: '#4B5563',
        marginTop: 6,
    },
    // Web Scrape Button Styles
    webScrapeButton: {
        backgroundColor: '#06B6D4',
        borderRadius: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    scrapeModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    scrapeModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    scrapeModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    scrapeModalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    urlInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 10,
    },
    urlInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
    },
    scrapeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#06B6D4',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        marginBottom: 16,
    },
    scrapeButtonDisabled: {
        opacity: 0.5,
    },
    scrapeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    scrapeHintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
    },
    scrapeHintText: {
        flex: 1,
        fontSize: 13,
        color: '#15803D',
    },
});

export default CreateNoteScreen;
