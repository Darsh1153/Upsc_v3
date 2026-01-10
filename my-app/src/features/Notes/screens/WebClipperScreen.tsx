import React, { useState, useCallback } from 'react';
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
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    smartScrape,
    isValidUrl,
    extractDomain,
    contentBlocksToNoteBlocks,
    ScrapedArticle,
} from '../services/webScraper';
import { createNote, saveScrapedLink, getAllTags, LocalTag, NoteBlock } from '../services/localNotesStorage';

interface WebClipperScreenProps {
    navigation: any;
    route?: any;
}

export const WebClipperScreen: React.FC<WebClipperScreenProps> = ({ navigation, route }) => {
    // State
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [scrapedContent, setScrapedContent] = useState<ScrapedArticle | null>(null);
    const [selectedTags, setSelectedTags] = useState<LocalTag[]>([]);
    const [availableTags, setAvailableTags] = useState<LocalTag[]>([]);
    const [customTitle, setCustomTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { params } = route || {};

    // Load available tags and check for shared URL
    React.useEffect(() => {
        loadTags();
        checkInitialUrl();
        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, []);

    const checkInitialUrl = async () => {
        // 1. Check navigation params (internal navigation)
        if (params?.url) {
            const sharedUrl = decodeURIComponent(params.url);
            setUrl(sharedUrl);
            setTimeout(() => autoScrape(sharedUrl), 500);
            return;
        }

        // 2. Check initial app launch URL (deep link)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
            handleDeepLink({ url: initialUrl });
        }
    };

    const handleDeepLink = ({ url: link }: { url: string }) => {
        // Expected format: upscprep://clip?url=https%3A%2F%2Fexample.com
        try {
            const parsed = new URL(link);
            const sharedUrl = parsed.searchParams.get('url');
            if (sharedUrl) {
                const decodedUrl = decodeURIComponent(sharedUrl);
                setUrl(decodedUrl);
                setTimeout(() => autoScrape(decodedUrl), 500);
            }
        } catch (e) {
            console.log('Error parsing deep link:', e);
        }
    };

    const autoScrape = (targetUrl: string) => {
        if (isValidUrl(targetUrl)) {
            handleScrape(targetUrl);
        }
    };

    const loadTags = async () => {
        const tags = await getAllTags();
        setAvailableTags(tags);
    };

    const handleScrape = async (targetUrl = url) => {
        if (!targetUrl.trim()) {
            Alert.alert('Error', 'Please enter a URL');
            return;
        }

        if (!isValidUrl(targetUrl)) {
            Alert.alert('Invalid URL', 'Please enter a valid URL');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const result = await smartScrape(targetUrl.trim());

            if (result.error || result.contentBlocks.length === 0) {
                setError(result.error || 'Could not extract content from this URL');
                setIsLoading(false);
                return;
            }

            setScrapedContent(result);
            setCustomTitle(result.title);
            setIsLoading(false);
        } catch (err) {
            console.error('Scraping error:', err);
            setError(err instanceof Error ? err.message : 'Failed to scrape the URL');
            setIsLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!scrapedContent) return;

        setIsSaving(true);

        try {
            // Create note blocks from scraped content
            const noteBlocks: NoteBlock[] = contentBlocksToNoteBlocks(scrapedContent.contentBlocks);

            // Build plain text content
            const plainText = scrapedContent.contentBlocks
                .map(b => b.items ? b.items.join('\n') : b.content)
                .join('\n\n');

            // Save scraped link
            await saveScrapedLink({
                url: scrapedContent.url,
                title: customTitle || scrapedContent.title,
                content: scrapedContent.content,
                summary: ((scrapedContent.metaDescription) ? scrapedContent.metaDescription.substring(0, 150) : plainText.substring(0, 150)) + '...',
            });

            // Create note
            await createNote({
                title: customTitle || scrapedContent.title,
                content: plainText,
                blocks: noteBlocks,
                tags: selectedTags,
                sourceType: 'scraped',
                sourceUrl: scrapedContent.url,
                summary: ((scrapedContent.metaDescription) ? scrapedContent.metaDescription.substring(0, 150) : plainText.substring(0, 150)) + '...',
            });

            Alert.alert(
                '✅ Note Saved!',
                `${scrapedContent.contentBlocks.length} content blocks extracted and saved.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (err) {
            console.error('Save error:', err);
            Alert.alert('Error', 'Failed to save the note');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTag = (tag: LocalTag) => {
        setSelectedTags(prev =>
            prev.some(t => t.id === tag.id)
                ? prev.filter(t => t.id !== tag.id)
                : [...prev, tag]
        );
    };

    const resetForm = () => {
        setScrapedContent(null);
        setUrl('');
        setCustomTitle('');
        setSelectedTags([]);
        setError(null);
    };

    // Input Step
    if (!scrapedContent && !isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons name="close" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Save from Web</Text>
                        <View style={{ width: 32 }} />
                    </View>

                    <View style={styles.inputContent}>
                        <View style={styles.iconCircle}>
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.iconGradient}
                            >
                                <Ionicons name="link" size={32} color="#FFFFFF" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.stepTitle}>Clip Any Article</Text>
                        <Text style={styles.stepSubtitle}>
                            Paste a URL to extract content as bullet points
                        </Text>

                        <View style={styles.urlInputContainer}>
                            <Ionicons name="globe-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.urlInput}
                                placeholder="https://thehindu.com/news/..."
                                placeholderTextColor="#9CA3AF"
                                value={url}
                                onChangeText={setUrl}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                onSubmitEditing={() => handleScrape()}
                                autoFocus={Platform.OS === 'web'}
                            />
                            {url.length > 0 && (
                                <TouchableOpacity onPress={() => setUrl('')}>
                                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.primaryButton, !url.trim() && styles.disabledButton]}
                            onPress={() => handleScrape()}
                            disabled={!url.trim()}
                        >
                            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>Extract Content</Text>
                        </TouchableOpacity>

                        <View style={styles.tipsContainer}>
                            <Text style={styles.tipsTitle}>✨ How it works</Text>
                            <View style={styles.tipsList}>
                                <Text style={styles.tipItem}>• Extracts headings, paragraphs, and lists</Text>
                                <Text style={styles.tipItem}>• Converts content to bullet points</Text>
                                <Text style={styles.tipItem}>• Saves everything locally on your device</Text>
                                <Text style={styles.tipItem}>• Works with most news sites and blogs</Text>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // Loading Step
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={resetForm} style={styles.backButton}>
                        <Ionicons name="close" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Extracting...</Text>
                    <View style={{ width: 32 }} />
                </View>

                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingTitle}>Extracting Content</Text>
                    <Text style={styles.loadingSubtitle}>
                        Parsing article from {extractDomain(url)}...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Result Step - Show extracted bullet points
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={resetForm} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Review & Save</Text>
                    <TouchableOpacity
                        onPress={handleSaveNote}
                        disabled={isSaving}
                        style={styles.saveHeaderButton}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#6366F1" />
                        ) : (
                            <Text style={styles.saveHeaderText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
                    {/* Source Card */}
                    <View style={styles.sourceCard}>
                        <Ionicons name="globe-outline" size={18} color="#6366F1" />
                        <View style={styles.sourceInfo}>
                            <Text style={styles.sourceDomain}>{extractDomain(url)}</Text>
                            <TouchableOpacity onPress={() => Linking.openURL(url)}>
                                <Text style={styles.sourceUrl} numberOfLines={1}>Open original →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Title */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Title</Text>
                        <TextInput
                            style={styles.titleInput}
                            value={customTitle}
                            onChangeText={setCustomTitle}
                            placeholder="Enter title..."
                            multiline
                        />
                    </View>

                    {/* Bullet Points */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>
                                Extracted Content ({scrapedContent?.contentBlocks.length} blocks)
                            </Text>
                        </View>

                        <View style={styles.bulletPointsContainer}>
                            {scrapedContent?.contentBlocks.slice(0, 5).map((block, index) => (
                                <View key={index} style={styles.bulletPoint}>
                                    <View style={styles.bulletNumber}>
                                        <Text style={styles.bulletNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.bulletText} numberOfLines={3}>
                                        {block.items ? block.items.join(', ') : block.content}
                                    </Text>
                                </View>
                            ))}
                            {scrapedContent?.contentBlocks.length > 5 && (
                                <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 8 }}>
                                    ... and {scrapedContent.contentBlocks.length - 5} more blocks
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Add Tags</Text>
                        <View style={styles.tagsGrid}>
                            {availableTags.slice(0, 15).map(tag => (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[
                                        styles.tagOption,
                                        selectedTags.some(t => t.id === tag.id) && {
                                            backgroundColor: tag.color + '30',
                                            borderColor: tag.color
                                        },
                                    ]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={[
                                        styles.tagOptionText,
                                        selectedTags.some(t => t.id === tag.id) && {
                                            color: tag.color,
                                            fontWeight: '600'
                                        },
                                    ]}>
                                        #{tag.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.disabledButton]}
                        onPress={handleSaveNote}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="save" size={20} color="#FFFFFF" />
                                <Text style={styles.saveButtonText}>
                                    Save Note
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    saveHeaderButton: {
        padding: 4,
    },
    saveHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6366F1',
    },
    inputContent: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    iconCircle: {
        marginBottom: 24,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    urlInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    urlInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1F2937',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 10,
        width: '100%',
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: '#EF4444',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disabledButton: {
        opacity: 0.5,
    },
    tipsContainer: {
        marginTop: 40,
        width: '100%',
        backgroundColor: '#F0FDF4',
        padding: 16,
        borderRadius: 12,
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#166534',
        marginBottom: 10,
    },
    tipsList: {
        gap: 6,
    },
    tipItem: {
        fontSize: 13,
        color: '#15803D',
        lineHeight: 20,
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 20,
    },
    loadingSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    resultScroll: {
        flex: 1,
    },
    sourceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        margin: 16,
        padding: 12,
        borderRadius: 10,
        gap: 10,
    },
    sourceInfo: {
        flex: 1,
    },
    sourceDomain: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    sourceUrl: {
        fontSize: 12,
        color: '#6366F1',
        marginTop: 2,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    titleInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    bulletPointsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    bulletNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        flexShrink: 0,
    },
    bulletNumberText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6366F1',
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tagOptionText: {
        fontSize: 12,
        color: '#6B7280',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        marginHorizontal: 16,
        marginBottom: 40,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default WebClipperScreen;
