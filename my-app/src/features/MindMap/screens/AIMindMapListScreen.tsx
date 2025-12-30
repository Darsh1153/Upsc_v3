/**
 * AI Mind Map List Screen
 * Shows list of all AI-generated mind maps stored locally
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../Reference/theme/ThemeContext';
import {
  AIMindMap,
  getAllMindMaps,
  deleteMindMap,
  createMindMap,
  saveMindMap,
} from '../services/aiMindMapStorage';
import { Input } from '../../../components/Input';

interface AIMindMapListScreenProps {
  navigation: any;
}

const AIMindMapListScreen: React.FC<AIMindMapListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const colors = theme.colors;

  const [mindMaps, setMindMaps] = useState<AIMindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Load mind maps
  const loadMindMaps = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await getAllMindMaps();
      setMindMaps(data);
    } catch (error) {
      console.error('Failed to load mind maps:', error);
      Alert.alert('Error', 'Failed to load mind maps. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadMindMaps();
  }, [loadMindMaps]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      loadMindMaps(false);
    }, [loadMindMaps])
  );

  // Create new mind map
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      setCreating(true);
      const newMindMap = createMindMap(newTitle.trim(), newDescription.trim());
      await saveMindMap(newMindMap);

      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');

      // Navigate to the new mind map with description if provided
      navigation.navigate('AIMindMapEditor', {
        mindMapId: newMindMap.id,
        title: newMindMap.title,
        description: newMindMap.description,
        isNew: true,
      });
    } catch (error) {
      console.error('Failed to create mind map:', error);
      Alert.alert('Error', 'Failed to create mind map. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Delete mind map
  const handleDelete = (item: AIMindMap) => {
    Alert.alert(
      'Delete Mind Map',
      `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMindMap(item.id);
              setMindMaps(prev => prev.filter(m => m.id !== item.id));
            } catch (error) {
              console.error('Failed to delete mind map:', error);
              Alert.alert('Error', 'Failed to delete mind map.');
            }
          },
        },
      ]
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Render mind map item
  const renderItem = ({ item }: { item: AIMindMap }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={() => navigation.navigate('AIMindMapEditor', { mindMapId: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIcon, { backgroundColor: item.mermaidCode ? colors.primaryLight : colors.surfaceSecondary }]}>
        <MaterialCommunityIcons
          name={item.mermaidCode ? 'brain' : 'brain-outline'}
          size={24}
          color={item.mermaidCode ? colors.primary : colors.textTertiary}
        />
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.cardMeta}>
          <Text style={[styles.cardDate, { color: colors.textTertiary }]}>
            {formatDate(item.updatedAt)}
          </Text>
          {item.messages.length > 0 && (
            <View style={[styles.messageBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="chatbubble-outline" size={10} color={colors.textSecondary} />
              <Text style={[styles.messageCount, { color: colors.textSecondary }]}>
                {item.messages.length}
              </Text>
            </View>
          )}
          {item.mermaidCode && (
            <View style={[styles.mapBadge, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="graph" size={10} color={colors.primary} />
              <Text style={[styles.mapBadgeText, { color: colors.primary }]}>Map</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.deleteBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)' }]}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
        <MaterialCommunityIcons name="brain" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No AI Mind Maps Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Create your first AI-powered mind map. Just describe a topic and let AI help you visualize it with beautiful Mermaid diagrams.
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <MaterialCommunityIcons name="brain" size={20} color="#FFF" />
        <Text style={styles.emptyBtnText}>Create AI Mind Map</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading mind maps...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="brain" size={24} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Mind Maps</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{mindMaps.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
        <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          Mind maps are saved locally on your device
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={mindMaps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, mindMaps.length === 0 && styles.listEmpty]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadMindMaps(false);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="brain" size={28} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>New AI Mind Map</Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Topic / Title</Text>
            <Input
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g., Indian Constitution"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              maxLength={100}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description (optional)</Text>
            <Input
              style={[styles.input, styles.inputMulti, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Describe what you want to include in the mind map..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
            />

            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              💡 Tip: Add a description to get an AI-generated mind map immediately!
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewTitle('');
                  setNewDescription('');
                }}
                disabled={creating}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  countText: { fontSize: 13, fontWeight: '600' },
  createBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  infoText: { fontSize: 13, fontWeight: '500' },

  list: { padding: 16 },
  listEmpty: { flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDescription: { fontSize: 13, marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  cardDate: { fontSize: 11 },
  messageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 3,
  },
  messageCount: { fontSize: 10, fontWeight: '500' },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 3,
  },
  mapBadgeText: { fontSize: 10, fontWeight: '600' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 28,
    gap: 8,
  },
  emptyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, marginBottom: 16 },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  hint: { fontSize: 12, marginBottom: 16, fontStyle: 'italic' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, minWidth: 90, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
});

export default AIMindMapListScreen;
