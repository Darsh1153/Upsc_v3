import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    Pressable,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '../types';
import { useTagSuggestions } from '../hooks/useTagSuggestions';
import { Input } from '../../../components/Input';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TagPickerProps {
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    placeholder?: string;
    maxTags?: number;
    theme?: 'light' | 'dark';
}

interface TagChipProps {
    tag: Tag;
    onRemove?: () => void;
    removable?: boolean;
    theme: 'light' | 'dark';
}

const TagChip: React.FC<TagChipProps> = ({ tag, onRemove, removable = true, theme }) => {
    const isDark = theme === 'dark';

    return (
        <View style={[styles.tagChip, { backgroundColor: tag.color }]}>
            <Text style={styles.tagChipText}>#{tag.name}</Text>
            {removable && onRemove && (
                <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}>
                    <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
};

export const TagPicker: React.FC<TagPickerProps> = ({
    selectedTags,
    onTagsChange,
    placeholder = 'Add tags...',
    maxTags = 10,
    theme = 'light',
}) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6366F1');

    const {
        suggestions,
        isLoading,
        search,
        createNewTag,
        clearSearch,
    } = useTagSuggestions();

    const isDark = theme === 'dark';

    const colors = {
        bg: isDark ? '#1a1a2e' : '#ffffff',
        text: isDark ? '#e0e0e0' : '#1a1a1a',
        border: isDark ? '#333' : '#e5e7eb',
        placeholder: isDark ? '#666' : '#9ca3af',
        inputBg: isDark ? '#252540' : '#f9fafb',
        suggestionBg: isDark ? '#1e1e3f' : '#f3f4f6',
        overlay: 'rgba(0, 0, 0, 0.5)',
    };

    const colorOptions = [
        '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#14B8A6',
        '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
    ];

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
        search(text);
    }, [search]);

    const handleSelectTag = useCallback((tag: Tag) => {
        if (selectedTags.some(t => t.id === tag.id)) {
            // Remove if already selected
            onTagsChange(selectedTags.filter(t => t.id !== tag.id));
        } else if (selectedTags.length < maxTags) {
            // Add if not at limit
            onTagsChange([...selectedTags, tag]);
        }
    }, [selectedTags, onTagsChange, maxTags]);

    const handleRemoveTag = useCallback((tagId: number) => {
        onTagsChange(selectedTags.filter(t => t.id !== tagId));
    }, [selectedTags, onTagsChange]);

    const handleCreateTag = useCallback(async () => {
        if (!searchQuery.trim()) return;

        const newTag = await createNewTag(searchQuery.trim(), newTagColor);
        if (newTag && selectedTags.length < maxTags) {
            onTagsChange([...selectedTags, newTag]);
            setSearchQuery('');
            clearSearch();
        }
    }, [searchQuery, newTagColor, createNewTag, selectedTags, maxTags, onTagsChange, clearSearch]);

    const handleOpenModal = useCallback(() => {
        setIsModalVisible(true);
        setSearchQuery('');
        clearSearch();
    }, [clearSearch]);

    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
        setSearchQuery('');
    }, []);

    // Filter out already selected tags from suggestions
    const filteredSuggestions = suggestions.filter(
        tag => !selectedTags.some(t => t.id === tag.id)
    );

    const canCreateNew = searchQuery.trim().length > 0 &&
        !suggestions.some(t => t.name.toLowerCase() === searchQuery.trim().toLowerCase());

    return (
        <View style={styles.container}>
            {/* Selected Tags Display */}
            <View style={styles.selectedContainer}>
                {selectedTags.length > 0 ? (
                    <View style={styles.tagsRow}>
                        {selectedTags.map((tag) => (
                            <TagChip
                                key={tag.id}
                                tag={tag}
                                theme={theme}
                                onRemove={() => handleRemoveTag(tag.id)}
                            />
                        ))}
                        {selectedTags.length < maxTags && (
                            <TouchableOpacity
                                style={[styles.addButton, { borderColor: colors.border }]}
                                onPress={handleOpenModal}
                            >
                                <Ionicons name="add" size={18} color={colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.placeholderButton, { borderColor: colors.border }]}
                        onPress={handleOpenModal}
                    >
                        <Ionicons name="pricetag-outline" size={16} color={colors.placeholder} />
                        <Text style={[styles.placeholderText, { color: colors.placeholder }]}>
                            {placeholder}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tag Selection Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseModal}
            >
                <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={handleCloseModal}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardAvoid}
                    >
                        <Pressable style={[styles.modalContent, { backgroundColor: colors.bg }]} onPress={e => e.stopPropagation()}>
                            {/* Header */}
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Tags</Text>
                                <TouchableOpacity onPress={handleCloseModal}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Search Input */}
                            <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
                                <Ionicons name="search" size={18} color={colors.placeholder} />
                                <Input
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Search or create tags..."
                                    placeholderTextColor={colors.placeholder}
                                    value={searchQuery}
                                    onChangeText={handleSearchChange}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => handleSearchChange('')}>
                                        <Ionicons name="close-circle" size={18} color={colors.placeholder} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Create New Tag Option */}
                            {canCreateNew && (
                                <View style={styles.createNewSection}>
                                    <View style={styles.colorPicker}>
                                        {colorOptions.map((color) => (
                                            <TouchableOpacity
                                                key={color}
                                                onPress={() => setNewTagColor(color)}
                                                style={[
                                                    styles.colorOption,
                                                    { backgroundColor: color },
                                                    newTagColor === color && styles.colorOptionSelected,
                                                ]}
                                            />
                                        ))}
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.createButton, { backgroundColor: newTagColor }]}
                                        onPress={handleCreateTag}
                                    >
                                        <Ionicons name="add" size={18} color="#fff" />
                                        <Text style={styles.createButtonText}>
                                            Create "{searchQuery}"
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Selected Tags in Modal */}
                            {selectedTags.length > 0 && (
                                <View style={styles.selectedInModal}>
                                    <Text style={[styles.sectionTitle, { color: colors.placeholder }]}>
                                        Selected ({selectedTags.length}/{maxTags})
                                    </Text>
                                    <View style={styles.tagsRow}>
                                        {selectedTags.map((tag) => (
                                            <TagChip
                                                key={tag.id}
                                                tag={tag}
                                                theme={theme}
                                                onRemove={() => handleRemoveTag(tag.id)}
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Suggestions List */}
                            <Text style={[styles.sectionTitle, { color: colors.placeholder }]}>
                                {searchQuery ? 'Matching Tags' : 'Popular Tags'}
                            </Text>
                            <FlatList
                                data={filteredSuggestions}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.suggestionItem, { backgroundColor: colors.suggestionBg }]}
                                        onPress={() => handleSelectTag(item)}
                                    >
                                        <View style={[styles.tagDot, { backgroundColor: item.color }]} />
                                        <Text style={[styles.suggestionText, { color: colors.text }]}>
                                            #{item.name}
                                        </Text>
                                        {item.usageCount !== undefined && (
                                            <Text style={[styles.usageCount, { color: colors.placeholder }]}>
                                                {item.usageCount} notes
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                                style={styles.suggestionsList}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                                        {isLoading ? 'Loading...' : 'No tags found'}
                                    </Text>
                                }
                            />
                        </Pressable>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    selectedContainer: {
        minHeight: 40,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    tagChipText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 8,
    },
    placeholderText: {
        fontSize: 14,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    keyboardAvoid: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: SCREEN_HEIGHT * 0.75,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    createNewSection: {
        marginBottom: 16,
    },
    colorPicker: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    colorOption: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    selectedInModal: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    suggestionsList: {
        maxHeight: 250,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 8,
        gap: 10,
    },
    tagDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    suggestionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    usageCount: {
        fontSize: 12,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 20,
        fontSize: 14,
    },
});

export default TagPicker;
