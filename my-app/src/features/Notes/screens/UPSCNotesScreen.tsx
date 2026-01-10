import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
    Animated,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getAllNotes,
    getAllTags,
    searchNotes,
    deleteNote,
    getNotesStats,
    LocalNote,
    LocalTag,
} from '../services/localNotesStorage';
import { checkNewsMatches, MatchedArticle } from '../../../services/NewsMatchService';
import { Modal } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UPSCNotesScreenProps {
    navigation: any;
}

// Source type icons and colors
const SOURCE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    manual: { icon: 'create-outline', color: '#6366F1', label: 'Manual' },
    scraped: { icon: 'link-outline', color: '#06B6D4', label: 'Web Article' },
    ncert: { icon: 'book-outline', color: '#10B981', label: 'NCERT' },
    book: { icon: 'library-outline', color: '#8B5CF6', label: 'Book' },
    current_affairs: { icon: 'newspaper-outline', color: '#F59E0B', label: 'Current Affairs' },
    report: { icon: 'document-text-outline', color: '#EF4444', label: 'Report' },
};

// Tabs for filtering
const TABS = [
    { key: 'all', label: 'All Notes', icon: 'documents-outline' },
    { key: 'scraped', label: 'Web Clips', icon: 'link-outline' },
    { key: 'manual', label: 'My Notes', icon: 'create-outline' },
    { key: 'current_affairs', label: 'Current Affairs', icon: 'newspaper-outline' },
];

export const UPSCNotesScreen: React.FC<UPSCNotesScreenProps> = ({ navigation }) => {
    // State
    const [notes, setNotes] = useState<LocalNote[]>([]);
    const [tags, setTags] = useState<LocalTag[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<LocalNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [stats, setStats] = useState({ totalNotes: 0, pinnedNotes: 0, scrapedNotes: 0 });
    const [showTagFilter, setShowTagFilter] = useState(false);
    const [newsMatches, setNewsMatches] = useState<MatchedArticle[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Filter notes when search/tab/tags change
    useEffect(() => {
        filterNotes();
    }, [notes, searchQuery, activeTab, selectedTags]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [notesData, tagsData, statsData] = await Promise.all([
                getAllNotes(),
                getAllTags(),
                getNotesStats(),
            ]);
            setNotes(notesData);
            setTags(tagsData);
            setStats(statsData);

            // Check for news matches
            try {
                const matches = await checkNewsMatches();
                setNewsMatches(matches);
            } catch (err) {
                console.error("Failed to check news matches", err);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            Alert.alert('Error', 'Failed to load notes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    };

    const filterNotes = useCallback(async () => {
        let filtered = [...notes];

        // Filter by tab (source type)
        if (activeTab !== 'all') {
            filtered = filtered.filter(note => note.sourceType === activeTab);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.summary?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by selected tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(note =>
                selectedTags.some(tagId => note.tags.some(t => t.id === tagId))
            );
        }

        // Exclude archived
        filtered = filtered.filter(note => !note.isArchived);

        // Sort: pinned first, then by date
        filtered.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        setFilteredNotes(filtered);
    }, [notes, searchQuery, activeTab, selectedTags]);

    const handleDeleteNote = (noteId: number) => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteNote(noteId);
                        loadData();
                    },
                },
            ]
        );
    };

    const toggleTag = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const renderNoteCard = ({ item: note }: { item: LocalNote }) => {
        const sourceConfig = SOURCE_CONFIG[note.sourceType || 'manual'];

        return (
            <TouchableOpacity
                style={styles.noteCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('NoteDetailScreen', { noteId: note.id })}
                onLongPress={() => handleDeleteNote(note.id)}
            >
                {/* Pin indicator */}
                {note.isPinned && (
                    <View style={styles.pinnedBadge}>
                        <Ionicons name="pin" size={12} color="#F59E0B" />
                    </View>
                )}

                {/* Source indicator */}
                <View style={[styles.sourceIndicator, { backgroundColor: sourceConfig.color + '20' }]}>
                    <Ionicons name={sourceConfig.icon as any} size={14} color={sourceConfig.color} />
                    <Text style={[styles.sourceLabel, { color: sourceConfig.color }]}>
                        {sourceConfig.label}
                    </Text>
                </View>

                {/* Title */}
                <Text style={styles.noteTitle} numberOfLines={2}>
                    {note.title}
                </Text>

                {/* Summary or content preview */}
                <Text style={styles.notePreview} numberOfLines={3}>
                    {note.summary || note.content.slice(0, 150)}
                </Text>

                {/* Tags */}
                {note.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {note.tags.slice(0, 3).map(tag => (
                            <TouchableOpacity
                                key={tag.id}
                                style={[styles.tagChip, { backgroundColor: tag.color + '20' }]}
                                onPress={() => toggleTag(tag.id)}
                            >
                                <Text style={[styles.tagText, { color: tag.color }]}>
                                    #{tag.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {note.tags.length > 3 && (
                            <Text style={styles.moreTagsText}>+{note.tags.length - 3}</Text>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.noteFooter}>
                    <Text style={styles.noteDate}>{formatDate(note.updatedAt)}</Text>
                    {note.sourceUrl && (
                        <Ionicons name="link" size={14} color="#9CA3AF" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>
                {searchQuery ? 'No notes found' : 'Start Your UPSC Notes'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {searchQuery
                    ? 'Try different search terms or tags'
                    : 'Create notes from web articles, books, or your own insights'}
            </Text>
            {!searchQuery && (
                <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => navigation.navigate('CreateNoteScreen')}
                >
                    <Text style={styles.emptyButtonText}>Create Your First Note</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderHeader = () => (
        <View style={styles.headerContent}>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="documents-outline" size={20} color="#6366F1" />
                    <Text style={styles.statNumber}>{stats.totalNotes}</Text>
                    <Text style={styles.statLabel}>Total Notes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="pin-outline" size={20} color="#F59E0B" />
                    <Text style={styles.statNumber}>{stats.pinnedNotes}</Text>
                    <Text style={styles.statLabel}>Pinned</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#CFFAFE' }]}>
                    <Ionicons name="link-outline" size={20} color="#06B6D4" />
                    <Text style={styles.statNumber}>{stats.scrapedNotes}</Text>
                    <Text style={styles.statLabel}>Web Clips</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search notes, tags..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={16}
                            color={activeTab === tab.key ? '#6366F1' : '#9CA3AF'}
                        />
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.key && styles.activeTabText
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tag Filter Toggle */}
            <TouchableOpacity
                style={styles.tagFilterToggle}
                onPress={() => setShowTagFilter(!showTagFilter)}
            >
                <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                <Text style={styles.tagFilterText}>
                    {selectedTags.length > 0 ? `${selectedTags.length} tags selected` : 'Filter by tags'}
                </Text>
                <Ionicons
                    name={showTagFilter ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#6B7280"
                />
            </TouchableOpacity>

            {/* Tag Filter Pills */}
            {showTagFilter && (
                <View style={styles.tagFilterContainer}>
                    {tags.slice(0, 15).map(tag => (
                        <TouchableOpacity
                            key={tag.id}
                            style={[
                                styles.filterTagChip,
                                selectedTags.includes(tag.id) && { backgroundColor: tag.color + '30' },
                            ]}
                            onPress={() => toggleTag(tag.id)}
                        >
                            <Text style={[
                                styles.filterTagText,
                                selectedTags.includes(tag.id) && { color: tag.color, fontWeight: '600' },
                            ]}>
                                #{tag.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Results count */}
            <Text style={styles.resultsCount}>
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Loading notes...</Text>
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
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>UPSC Notes</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('WebClipperScreen')}
                    style={styles.clipButton}
                >
                    <Ionicons name="globe-outline" size={26} color="#06B6D4" />
                </TouchableOpacity>

                {/* Notification Bell */}
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => setShowNotifications(true)}
                >
                    <Ionicons
                        name={newsMatches.length > 0 ? "notifications" : "notifications-outline"}
                        size={24}
                        color={newsMatches.length > 0 ? "#F59E0B" : "#9CA3AF"}
                    />
                    {newsMatches.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{newsMatches.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Notifications Modal */}
            <Modal
                visible={showNotifications}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {newsMatches.length > 0 ? `News Matches (${newsMatches.length})` : 'News Notifications'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <Ionicons name="close" size={24} color="#1F2937" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Current affairs related to your notes</Text>

                        {newsMatches.length > 0 ? (
                            <FlatList
                                data={newsMatches}
                                keyExtractor={(item) => item.articleId.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.matchItem}
                                        onPress={() => {
                                            setShowNotifications(false);
                                            navigation.navigate('ArticleDetailScreen', { articleId: item.articleId });
                                        }}
                                    >
                                        <View style={styles.matchHeader}>
                                            <Ionicons name="newspaper-outline" size={16} color="#6366F1" />
                                            <Text style={styles.matchReason}>{item.matchReason}</Text>
                                        </View>
                                        <Text style={styles.matchTitle} numberOfLines={2}>{item.articleTitle}</Text>
                                        <Text style={styles.matchNoteLink}>
                                            <Ionicons name="document-text-outline" size={12} color="#6B7280" /> Related to: {item.noteTitle}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={styles.matchList}
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                                <Text style={styles.emptySubtitle}>
                                    No new matches found between your notes and recent news articles.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <FlatList
                data={filteredNotes}
                renderItem={renderNoteCard}
                keyExtractor={item => item.id.toString()}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#6366F1']}
                    />
                }
            />

            {/* FAB for new note */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateNoteScreen')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={28} color="#FFFFFF" />
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    clipButton: {
        padding: 4,
    },
    notificationButton: {
        padding: 4,
        position: 'relative',
        marginLeft: 8,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    matchList: {
        paddingBottom: 20,
    },
    matchItem: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    matchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    matchReason: {
        fontSize: 12,
        color: '#6366F1',
        fontWeight: '600',
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 6,
        lineHeight: 22,
    },
    matchNoteLink: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    listContent: {
        paddingBottom: 100,
    },
    headerContent: {
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#1F2937',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 4,
    },
    activeTab: {
        backgroundColor: '#EEF2FF',
        borderColor: '#6366F1',
    },
    tabText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#6366F1',
        fontWeight: '600',
    },
    tagFilterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    tagFilterText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
    },
    tagFilterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
        marginBottom: 12,
    },
    filterTagChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
    },
    filterTagText: {
        fontSize: 12,
        color: '#6B7280',
    },
    resultsCount: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 4,
    },
    noteCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    pinnedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    sourceIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
        marginBottom: 8,
    },
    sourceLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    noteTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 6,
        lineHeight: 22,
    },
    notePreview: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 10,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    tagChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '500',
    },
    moreTagsText: {
        fontSize: 11,
        color: '#9CA3AF',
        alignSelf: 'center',
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noteDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        borderRadius: 28,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default UPSCNotesScreen;
