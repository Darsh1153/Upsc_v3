import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  TextInput, // Keep for type reference if needed, but we'll use Input component
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import GraphView, { GraphViewRef, ThemeColors } from './components/GraphView';
import { MindMapNode, MindMapConnection, NODE_COLORS } from './types';
import { useTheme } from '../Reference/theme/ThemeContext';
import {
  fetchMindMap,
  createNode,
  updateNode,
  deleteNode,
  createConnection,
  deleteConnection,
  deleteNodeConnections,
  updateMindMap,
  MindMapData,
} from './services/mindMapApi';
import { Input } from '../../components/Input';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

interface MindMapScreenProps {
  navigation?: any;
  route?: { params?: { mindMapId?: number; isNew?: boolean } };
}

const MindMapScreen: React.FC<MindMapScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const graphRef = useRef<GraphViewRef>(null);
  const { theme, isDark } = useTheme();
  const colors = theme.colors;

  const mindMapId = route?.params?.mindMapId;
  const isNew = route?.params?.isNew;

  // Mind map data
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [connections, setConnections] = useState<MindMapConnection[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFromNodeId, setConnectFromNodeId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const [graphMode, setGraphMode] = useState<'global' | 'local'>('global');
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [newNodePosition, setNewNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(null);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;

  // Theme colors for GraphView
  const graphThemeColors: ThemeColors = {
    background: colors.background,
    surface: colors.surface,
    surfaceSecondary: colors.surfaceSecondary,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textTertiary: colors.textTertiary,
    primary: colors.primary,
    border: colors.border,
    borderLight: colors.borderLight,
    error: colors.error,
    success: colors.success,
  };

  // Load mind map from backend
  useEffect(() => {
    if (!mindMapId) {
      setLoading(false);
      return;
    }

    const loadMindMap = async () => {
      try {
        setLoading(true);
        const data = await fetchMindMap(mindMapId);
        setMindMapData(data);
        setNodes(data.nodes);
        setConnections(data.connections);
      } catch (error) {
        console.error('Failed to load mind map:', error);
        Alert.alert('Error', 'Failed to load mind map.', [
          { text: 'Go Back', onPress: () => navigation?.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadMindMap();
  }, [mindMapId, navigation]);

  // If this is a new mind map, prompt for first node
  useEffect(() => {
    if (!loading && isNew && mindMapId && nodes.length === 0) {
      // Automatically show the add node modal for new mind maps
      setTimeout(() => {
        setNewNodePosition({ x: 0, y: 0 });
        setEditingNodeId(null);
        setNodeLabel('');
        setShowNodeModal(true);
      }, 500);
    }
  }, [loading, isNew, mindMapId, nodes.length]);

  const toggleSearch = useCallback(() => {
    if (showSearch) {
      Keyboard.dismiss();
      setShowSearch(false);
      setSearchQuery('');
      graphRef.current?.search('');
    } else {
      setShowSearch(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    graphRef.current?.search(query);
  }, []);

  const toggleGraphMode = useCallback(() => {
    if (graphMode === 'global') {
      if (selectedNodeId) {
        setGraphMode('local');
        graphRef.current?.setGraphMode('local', selectedNodeId);
      } else {
        Alert.alert('Select a Node', 'Select a node first to view its local graph.');
      }
    } else {
      setGraphMode('global');
      graphRef.current?.setGraphMode('global');
    }
  }, [graphMode, selectedNodeId]);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string | null) => {
    if (connectMode && connectFromNodeId && nodeId && nodeId !== connectFromNodeId) {
      const exists = connections.some(c =>
        (c.sourceNodeId === connectFromNodeId && c.targetNodeId === nodeId) ||
        (c.sourceNodeId === nodeId && c.targetNodeId === connectFromNodeId)
      );
      if (!exists && mindMapId) {
        const newConn: MindMapConnection = {
          id: generateId(),
          sourceNodeId: connectFromNodeId,
          targetNodeId: nodeId,
          color: isDark ? '#475569' : '#CBD5E1',
          strokeWidth: 1.5,
          style: 'solid',
          animated: false,
        };
        setConnections(prev => [...prev, newConn]);

        // Save to backend
        createConnection(mindMapId, newConn).catch(err => {
          console.error('Failed to save connection:', err);
        });
      }
      setConnectMode(false);
      setConnectFromNodeId(null);
      setSelectedNodeId(nodeId);
      return;
    }
    setSelectedNodeId(nodeId);
    setShowColorPicker(false);
    setShowContextMenu(false);
    if (!nodeId && connectMode) { setConnectMode(false); setConnectFromNodeId(null); }
  }, [connectMode, connectFromNodeId, connections, isDark, mindMapId]);

  // Handle node move - debounced save
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleNodeMove = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: Math.round(x), y: Math.round(y) } : n));

    // Debounce save to backend
    if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    moveTimeoutRef.current = setTimeout(() => {
      if (mindMapId) {
        updateNode(mindMapId, nodeId, { x: Math.round(x), y: Math.round(y) }).catch(err => {
          console.error('Failed to save node position:', err);
        });
      }
    }, 500);
  }, [mindMapId]);

  const handleNodeDoubleTap = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    setEditingNodeId(nodeId);
    setNodeLabel(node?.label || '');
    setShowNodeModal(true);
    setShowContextMenu(false);
  }, [nodes]);

  const handleAddNode = useCallback((x: number, y: number) => {
    setNewNodePosition({ x: Math.round(x), y: Math.round(y) });
    setEditingNodeId(null);
    setNodeLabel('');
    setShowNodeModal(true);
  }, []);

  const handleLongPress = useCallback((nodeId: string, x: number, y: number) => {
    setContextMenuNodeId(nodeId);
    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
    setSelectedNodeId(nodeId);
  }, []);

  // Save node (create or update)
  const handleSaveNode = useCallback(async () => {
    if (!nodeLabel.trim()) { Alert.alert('Error', 'Please enter a label'); return; }
    if (!mindMapId) return;

    setSaving(true);
    try {
      if (editingNodeId) {
        // Update existing node
        setNodes(prev => prev.map(n => n.id === editingNodeId ? { ...n, label: nodeLabel.trim() } : n));
        await updateNode(mindMapId, editingNodeId, { label: nodeLabel.trim() });
      } else if (newNodePosition) {
        // Create new node
        const newNode: MindMapNode = {
          id: generateId(),
          label: nodeLabel.trim(),
          x: newNodePosition.x,
          y: newNodePosition.y,
          width: Math.max(100, nodeLabel.length * 8 + 40),
          height: 40,
          color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
          shape: 'rounded',
          fontSize: 14,
        };
        setNodes(prev => [...prev, newNode]);
        setSelectedNodeId(newNode.id);
        await createNode(mindMapId, newNode);
      }
    } catch (error) {
      console.error('Failed to save node:', error);
      Alert.alert('Error', 'Failed to save node. Please try again.');
    } finally {
      setSaving(false);
      setShowNodeModal(false);
      setEditingNodeId(null);
      setNodeLabel('');
      setNewNodePosition(null);
    }
  }, [nodeLabel, editingNodeId, newNodePosition, mindMapId]);

  // Delete node
  const handleDeleteNode = useCallback(() => {
    const nodeToDelete = contextMenuNodeId || selectedNodeId;
    if (!nodeToDelete || !mindMapId) return;

    Alert.alert('Delete Node', 'Delete this node and its connections?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            // Update local state first
            setNodes(prev => prev.filter(n => n.id !== nodeToDelete));
            setConnections(prev => prev.filter(c => c.sourceNodeId !== nodeToDelete && c.targetNodeId !== nodeToDelete));
            setSelectedNodeId(null);
            setShowContextMenu(false);
            setContextMenuNodeId(null);

            // Delete from backend
            await deleteNodeConnections(mindMapId, nodeToDelete);
            await deleteNode(mindMapId, nodeToDelete);
          } catch (error) {
            console.error('Failed to delete node:', error);
            Alert.alert('Error', 'Failed to delete node.');
          }
        },
      },
    ]);
  }, [contextMenuNodeId, selectedNodeId, mindMapId]);

  // Change node color
  const handleColorChange = useCallback(async (color: string) => {
    const nodeToUpdate = contextMenuNodeId || selectedNodeId;
    if (!nodeToUpdate || !mindMapId) return;

    setNodes(prev => prev.map(n => n.id === nodeToUpdate ? { ...n, color } : n));
    setShowColorPicker(false);
    setShowContextMenu(false);

    try {
      await updateNode(mindMapId, nodeToUpdate, { color });
    } catch (error) {
      console.error('Failed to update node color:', error);
    }
  }, [contextMenuNodeId, selectedNodeId, mindMapId]);

  const handleStartConnect = useCallback(() => {
    const nodeToConnect = contextMenuNodeId || selectedNodeId;
    if (!nodeToConnect) return;
    setConnectMode(true);
    setConnectFromNodeId(nodeToConnect);
    setShowColorPicker(false);
    setShowContextMenu(false);
  }, [contextMenuNodeId, selectedNodeId]);

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading mind map...</Text>
        </View>
      </View>
    );
  }

  // Show empty state if no mind map ID
  if (!mindMapId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="graph-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No mind map selected</Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surfaceSecondary }]} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        {showSearch ? (
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <Input
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search nodes..."
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
            // Don't auto-dismiss quickly while searching? Maybe 1.2s is OK.
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {mindMapData?.title || 'Mind Map'}
            </Text>
            <View style={[styles.statsBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.statsText, { color: colors.textSecondary }]}>{nodes.length} nodes</Text>
            </View>
            {saving && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
          </View>
        )}

        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surfaceSecondary }]} onPress={toggleSearch}>
            <Ionicons name={showSearch ? "close" : "search"} size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: graphMode === 'local' ? colors.primaryLight : colors.surfaceSecondary }]}
            onPress={toggleGraphMode}
          >
            <MaterialCommunityIcons name={graphMode === 'global' ? "graph-outline" : "graph"} size={20} color={graphMode === 'local' ? colors.primary : colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => { setNewNodePosition({ x: 0, y: 0 }); setEditingNodeId(null); setNodeLabel(''); setShowNodeModal(true); }}
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Badge */}
      {graphMode === 'local' && (
        <View style={[styles.modeBadge, { backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(99,102,241,0.1)', borderColor: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(99,102,241,0.2)' }]}>
          <MaterialCommunityIcons name="graph" size={14} color={colors.primary} />
          <Text style={[styles.modeBadgeText, { color: colors.primary }]}>Local View</Text>
          <TouchableOpacity onPress={() => { setGraphMode('global'); graphRef.current?.setGraphMode('global'); }}>
            <Ionicons name="close" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Connect Banner */}
      {connectMode && (
        <View style={[styles.connectBanner, { backgroundColor: colors.primary }]}>
          <Ionicons name="git-branch" size={16} color="#FFF" />
          <Text style={styles.connectText}>Tap another node to connect</Text>
          <TouchableOpacity onPress={() => { setConnectMode(false); setConnectFromNodeId(null); }} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Graph View */}
      <GraphView
        ref={graphRef}
        nodes={nodes}
        connections={connections}
        selectedNodeId={connectMode ? connectFromNodeId : selectedNodeId}
        onNodeSelect={handleNodeSelect}
        onNodeDoubleTap={handleNodeDoubleTap}
        onAddNode={handleAddNode}
        onNodeMove={handleNodeMove}
        onConnect={() => { }}
        onLongPress={handleLongPress}
        graphMode={graphMode}
        localGraphDepth={2}
        themeColors={graphThemeColors}
        isDark={isDark}
      />

      {/* Zoom Controls */}
      <View style={[styles.zoomControls, { bottom: selectedNode ? 170 : insets.bottom + 80 }]}>
        <TouchableOpacity style={[styles.zoomBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => graphRef.current?.zoomIn()}>
          <Ionicons name="add" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.zoomBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => graphRef.current?.zoomOut()}>
          <Ionicons name="remove" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.zoomBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => graphRef.current?.fitView()}>
          <Ionicons name="scan-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Action Sheet */}
      {selectedNode && (
        <View style={[styles.actionSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.actionSheetHandle} />

          <View style={styles.selectedInfo}>
            <View style={[styles.selectedDot, { backgroundColor: selectedNode.color }]} />
            <Text style={[styles.selectedLabel, { color: colors.text }]} numberOfLines={1}>{selectedNode.label}</Text>
            <TouchableOpacity onPress={() => setSelectedNodeId(null)}>
              <Ionicons name="close" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {showColorPicker && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll} contentContainerStyle={styles.colorRow}>
              {NODE_COLORS.map(color => (
                <TouchableOpacity key={color} style={[styles.colorDot, { backgroundColor: color }, selectedNode.color === color && styles.colorDotSelected]} onPress={() => handleColorChange(color)} />
              ))}
            </ScrollView>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surfaceSecondary }]} onPress={() => { setEditingNodeId(selectedNodeId); setNodeLabel(selectedNode.label); setShowNodeModal(true); }}>
              <Ionicons name="pencil" size={18} color={colors.text} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surfaceSecondary }]} onPress={handleStartConnect}>
              <Ionicons name="git-branch" size={18} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.primary }]}>Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surfaceSecondary }]} onPress={() => setShowColorPicker(p => !p)}>
              <View style={[styles.colorCircle, { backgroundColor: selectedNode.color }]} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Color</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surfaceSecondary }]} onPress={() => { graphRef.current?.focusNode(selectedNodeId!); }}>
              <Ionicons name="locate" size={18} color={colors.text} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Focus</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionItem, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)' }]} onPress={handleDeleteNode}>
              <Ionicons name="trash" size={18} color={colors.error} />
              <Text style={[styles.actionLabel, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Hint */}
      {!selectedNode && !connectMode && !showSearch && nodes.length > 0 && (
        <View style={[styles.hint, { bottom: insets.bottom + 16, backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)', borderColor: colors.borderLight }]}>
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>Double-tap to add • Long-press for menu</Text>
        </View>
      )}

      {/* Context Menu */}
      <Modal visible={showContextMenu} transparent animationType="fade" onRequestClose={() => setShowContextMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowContextMenu(false)}>
          <View style={[styles.contextMenu, { backgroundColor: colors.surface, top: Math.min(contextMenuPosition.y - 40, 380), left: Math.max(16, Math.min(contextMenuPosition.x - 100, 200)) }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { graphRef.current?.focusNode(contextMenuNodeId!); setShowContextMenu(false); }}>
              <Ionicons name="locate" size={18} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>Focus</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              const node = nodes.find(n => n.id === contextMenuNodeId);
              if (node) { setEditingNodeId(contextMenuNodeId); setNodeLabel(node.label); setShowNodeModal(true); setShowContextMenu(false); }
            }}>
              <Ionicons name="pencil" size={18} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleStartConnect}>
              <Ionicons name="git-branch" size={18} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>Connect</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.menuColors}>
              {NODE_COLORS.slice(0, 5).map(color => (
                <TouchableOpacity key={color} style={[styles.menuColorDot, { backgroundColor: color }]} onPress={() => handleColorChange(color)} />
              ))}
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.borderLight }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteNode}>
              <Ionicons name="trash" size={18} color={colors.error} />
              <Text style={[styles.menuText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Node Modal */}
      <Modal visible={showNodeModal} transparent animationType="fade" onRequestClose={() => setShowNodeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingNodeId ? 'Edit Node' : 'New Node'}</Text>
            <Input
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={nodeLabel}
              onChangeText={setNodeLabel}
              placeholder="Enter label..."
              placeholderTextColor={colors.textTertiary}
              autoFocus
              maxLength={80}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surfaceSecondary }]} onPress={() => { setShowNodeModal(false); setEditingNodeId(null); setNodeLabel(''); setNewNodePosition(null); }} disabled={saving}>
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveNode} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text>}
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
  emptyText: { marginTop: 16, fontSize: 15 },
  backBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', maxWidth: 160 },
  statsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statsText: { fontSize: 12, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, paddingHorizontal: 12, height: 40, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 8 },

  modeBadge: { position: 'absolute', top: Platform.OS === 'ios' ? 100 : 80, left: 12, flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, gap: 6, borderWidth: 1, zIndex: 5 },
  modeBadgeText: { fontSize: 12, fontWeight: '600' },

  connectBanner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, gap: 10 },
  connectText: { color: '#FFF', fontSize: 14, fontWeight: '500', flex: 1 },
  cancelBtn: { paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  cancelText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  zoomControls: { position: 'absolute', left: 12, gap: 8, zIndex: 20 },
  zoomBtn: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },

  actionSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  actionSheetHandle: { width: 36, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  selectedDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  selectedLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  colorScroll: { marginBottom: 14 },
  colorRow: { gap: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#FFF' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, gap: 4 },
  actionLabel: { fontSize: 11, fontWeight: '500' },
  colorCircle: { width: 18, height: 18, borderRadius: 9 },

  hint: { position: 'absolute', left: 16, right: 16, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  hintText: { fontSize: 12 },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  contextMenu: { position: 'absolute', borderRadius: 16, padding: 6, minWidth: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 12 },
  menuText: { fontSize: 14, fontWeight: '500' },
  menuDivider: { height: 1, marginVertical: 4 },
  menuColors: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  menuColorDot: { width: 28, height: 28, borderRadius: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 18 },
  modalInput: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, gap: 10 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, minWidth: 90, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
});

export default MindMapScreen;
