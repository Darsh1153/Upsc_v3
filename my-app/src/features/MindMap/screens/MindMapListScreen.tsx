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

import { useTheme } from '../../Reference/theme/ThemeContext';
import { fetchUserMindMaps, createMindMap, deleteMindMap, MindMapListItem } from '../services/mindMapApi';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/Input';

interface MindMapListScreenProps {
  navigation: any;
}

const MindMapListScreen: React.FC<MindMapListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const { user } = useAuth();

  const [mindMaps, setMindMaps] = useState<MindMapListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Load mind maps
  const loadMindMaps = useCallback(async (showLoader = true) => {
    if (!user?.id) return;

    try {
      if (showLoader) setLoading(true);
      const data = await fetchUserMindMaps(user.id);
      setMindMaps(data);
    } catch (error) {
      console.error('Failed to load mind maps:', error);
      Alert.alert('Error', 'Failed to load mind maps. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMindMaps();
  }, [loadMindMaps]);

  // Refresh on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMindMaps(false);
    });
    return unsubscribe;
  }, [navigation, loadMindMaps]);

  // Create new mind map
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Please log in to create a mind map');
      return;
    }

    try {
      setCreating(true);
      const newMindMap = await createMindMap(user.id, newTitle.trim(), newDescription.trim() || undefined);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');

      // Navigate to the new mind map
      navigation.navigate('MindMapEditor', { mindMapId: newMindMap.id, isNew: true });
    } catch (error) {
      console.error('Failed to create mind map:', error);
      Alert.alert('Error', 'Failed to create mind map. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Delete mind map
  const handleDelete = (item: MindMapListItem) => {
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
  const renderItem = ({ item }: { item: MindMapListItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={() => navigation.navigate('MindMapEditor', { mindMapId: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIcon, { backgroundColor: colors.primaryLight }]}>
        <MaterialCommunityIcons name="graph" size={24} color={colors.primary} />
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
        <Text style={[styles.cardDate, { color: colors.textTertiary }]}>
          Updated {formatDate(item.updatedAt)}
        </Text>
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
      <MaterialCommunityIcons name="graph-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Mind Maps Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Create your first mind map to visualize your thoughts and ideas.
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={20} color="#FFF" />
        <Text style={styles.emptyBtnText}>Create Mind Map</Text>
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
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surfaceSecondary }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mind Maps</Text>
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

      {/* List */}
      <FlatList
        data={mindMaps}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={[styles.list, mindMaps.length === 0 && styles.listEmpty]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadMindMaps(false); }}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Mind Map</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
            <Input
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter title..."
              placeholderTextColor={colors.textTertiary}
              autoFocus
              maxLength={100}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description (optional)</Text>
            <Input
              style={[styles.input, styles.inputMulti, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="What is this mind map about?"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={300}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => { setShowCreateModal(false); setNewTitle(''); setNewDescription(''); }}
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
  cardDate: { fontSize: 11, marginTop: 4 },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginTop: 24, gap: 6 },
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, marginBottom: 16 },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, minWidth: 90, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
});

export default MindMapListScreen;
