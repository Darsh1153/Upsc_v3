/**
 * AI Mind Map Screen
 * Chat + Canvas view for AI-powered mind map creation
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  // TextInput, // Replaced
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '../../Reference/theme/ThemeContext';
import MermaidCanvas, { RenderType } from '../components/MermaidCanvas';
import {
  AIMindMap,
  ChatMessage,
  getMindMap,
  saveMindMap,
  createMindMap,
  addMessage,
} from '../services/aiMindMapStorage';
import {
  generateMindMap,
  Message,
} from '../services/openRouterApi';
import { Input } from '../../../components/Input';

interface AIMindMapScreenProps {
  navigation: any;
  route: {
    params?: {
      mindMapId?: string;
      title?: string;
      description?: string;
      isNew?: boolean;
    };
  };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ViewMode = 'chat' | 'canvas';

const AIMindMapScreen: React.FC<AIMindMapScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const scrollViewRef = useRef<ScrollView>(null);

  const mindMapId = route.params?.mindMapId;
  const isNew = route.params?.isNew;
  const initialTitle = route.params?.title || 'New Mind Map';
  const initialDescription = route.params?.description || '';

  // State
  const [mindMap, setMindMap] = useState<AIMindMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [renderType, setRenderType] = useState<RenderType>('mindmap');

  // Load or create mind map
  useEffect(() => {
    const loadMindMap = async () => {
      try {
        setLoading(true);

        if (mindMapId && !isNew) {
          const existing = await getMindMap(mindMapId);
          if (existing) {
            setMindMap(existing);
          } else {
            Alert.alert('Error', 'Mind map not found');
            navigation.goBack();
          }
        } else {
          const newMindMap = createMindMap(initialTitle, initialDescription);
          setMindMap(newMindMap);
          await saveMindMap(newMindMap);
        }
      } catch (err) {
        console.error('Failed to load mind map:', err);
        Alert.alert('Error', 'Failed to load mind map');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadMindMap();
  }, [mindMapId, isNew, initialTitle, initialDescription, navigation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (mindMap?.messages.length && viewMode === 'chat') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [mindMap?.messages.length, viewMode]);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    const message = inputText.trim();
    if (!message || !mindMap || generating) return;

    setInputText('');
    setGenerating(true);
    setError(null);

    try {
      // Add user message
      let updatedMindMap = addMessage(mindMap, 'user', message);
      setMindMap(updatedMindMap);

      // Build conversation history
      const conversationHistory: Message[] = mindMap.messages.map(m => ({
        role: m.role,
        content: m.content,
        reasoning_details: m.reasoning_details,
      }));

      // Generate response
      const response = await generateMindMap(
        message,
        conversationHistory,
        mindMap.mermaidCode
      );

      // Add assistant response
      updatedMindMap = addMessage(
        updatedMindMap,
        'assistant',
        response.content,
        response.mermaidCode,
        response.reasoning_details
      );

      setMindMap(updatedMindMap);
      await saveMindMap(updatedMindMap);
    } catch (err: any) {
      console.error('Failed to generate response:', err);
      setError(err.message || 'Failed to generate mind map. Please try again.');

      const errorMindMap = addMessage(
        mindMap,
        'assistant',
        `Error: ${err.message || 'Unknown error'}. Please try again.`
      );
      setMindMap(errorMindMap);
    } finally {
      setGenerating(false);
    }
  }, [inputText, mindMap, generating]);

  // Render message
  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === 'user';

    // Check for mermaid code in the message
    const hasMermaid = msg.mermaidCode || msg.content.includes('```mermaid');

    return (
      <View
        key={msg.id}
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.assistantMessageRow,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="brain" size={16} color={colors.primary} />
          </View>
        )}

        <View style={[styles.messageContent, isUser && { alignItems: 'flex-end' }]}>
          <View
            style={[
              styles.messageBubble,
              isUser
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.borderLight }],
            ]}
          >
            <Text style={[styles.messageText, isUser ? styles.userText : { color: colors.text }]}>
              {msg.content}
            </Text>
          </View>

          {/* Show "View Canvas" button if message has mermaid code */}
          {hasMermaid && !isUser && (
            <TouchableOpacity
              style={[styles.viewCanvasBtn, { backgroundColor: colors.primary }]}
              onPress={() => setViewMode('canvas')}
            >
              <MaterialCommunityIcons name="graph" size={16} color="#FFF" />
              <Text style={styles.viewCanvasBtnText}>View Canvas</Text>
            </TouchableOpacity>
          )}
        </View>

        {isUser && (
          <View style={[styles.avatar, styles.userAvatar, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="person" size={14} color={colors.textSecondary} />
          </View>
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
        <MaterialCommunityIcons name="brain" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>AI Mind Map</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Describe what you want to create. I'll generate a Mermaid mind map for you.
      </Text>

      <View style={styles.suggestionsContainer}>
        {[
          'Create a mind map about Indian Constitution',
          'Make a diagram of Indian Economy sectors',
          'Map the causes of World War 1',
        ].map((suggestion, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => setInputText(suggestion)}
          >
            <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render Canvas View
  const renderCanvasView = () => {
    const mermaidCode = mindMap?.mermaidCode || '';

    if (!mermaidCode) {
      return (
        <View style={styles.canvasEmpty}>
          <MaterialCommunityIcons name="graph-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.canvasEmptyTitle, { color: colors.text }]}>No Mind Map Yet</Text>
          <Text style={[styles.canvasEmptyText, { color: colors.textSecondary }]}>
            Go to Chat and describe what you want to create
          </Text>
          <TouchableOpacity
            style={[styles.goToChatBtn, { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('chat')}
          >
            <Ionicons name="chatbubble" size={18} color="#FFF" />
            <Text style={styles.goToChatBtnText}>Go to Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.canvasContainer}>
        {/* Render Type Toggle */}
        <View style={[styles.renderTypeToggle, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[styles.renderTypeBtn, renderType === 'mindmap' && { backgroundColor: colors.primary }]}
            onPress={() => setRenderType('mindmap')}
          >
            <MaterialCommunityIcons name="graph" size={16} color={renderType === 'mindmap' ? '#FFF' : colors.textSecondary} />
            <Text style={[styles.renderTypeBtnText, { color: renderType === 'mindmap' ? '#FFF' : colors.textSecondary }]}>
              Mind Map
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.renderTypeBtn, renderType === 'flowchart' && { backgroundColor: colors.primary }]}
            onPress={() => setRenderType('flowchart')}
          >
            <MaterialCommunityIcons name="sitemap" size={16} color={renderType === 'flowchart' ? '#FFF' : colors.textSecondary} />
            <Text style={[styles.renderTypeBtnText, { color: renderType === 'flowchart' ? '#FFF' : colors.textSecondary }]}>
              Flowchart
            </Text>
          </TouchableOpacity>
        </View>

        <MermaidCanvas
          code={mermaidCode}
          isDark={isDark}
          colors={colors}
          renderType={renderType}
        />

        {/* Floating Chat Button */}
        <TouchableOpacity
          style={[styles.floatingBtn, { backgroundColor: colors.primary }]}
          onPress={() => setViewMode('chat')}
        >
          <Ionicons name="chatbubble" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {mindMap?.title || 'Mind Map'}
          </Text>
        </View>

        {/* View Toggle */}
        <View style={[styles.viewToggle, { backgroundColor: colors.surfaceSecondary }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'chat' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('chat')}
          >
            <Ionicons name="chatbubble" size={16} color={viewMode === 'chat' ? '#FFF' : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'canvas' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('canvas')}
          >
            <MaterialCommunityIcons name="graph" size={16} color={viewMode === 'canvas' ? '#FFF' : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'chat' ? (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              (!mindMap?.messages.length) && styles.messagesEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {mindMap?.messages.length ? (
              mindMap.messages.map((msg, i) => renderMessage(msg, i))
            ) : (
              renderEmptyState()
            )}

            {generating && (
              <View style={[styles.messageRow, styles.assistantMessageRow]}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                  <MaterialCommunityIcons name="brain" size={16} color={colors.primary} />
                </View>
                <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                      Creating mind map...
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Input
                style={[styles.input, { color: colors.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Describe your mind map..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={1000}
                editable={!generating}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: inputText.trim() && !generating ? colors.primary : colors.surfaceSecondary },
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || generating}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && !generating ? '#FFF' : colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        renderCanvasView()
      )}

      {/* Error Toast */}
      {error && (
        <View style={[styles.errorToast, { backgroundColor: colors.error }]}>
          <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messagesEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  userAvatar: {
    marginLeft: 8,
  },
  messageContent: {
    flex: 1,
    maxWidth: SCREEN_WIDTH * 0.75,
    marginHorizontal: 8,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#FFF',
  },
  viewCanvasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
    alignSelf: 'flex-start',
  },
  viewCanvasBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionsContainer: {
    marginTop: 24,
    width: '100%',
  },
  suggestionChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  // Canvas styles
  canvasContainer: {
    flex: 1,
  },
  renderTypeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  renderTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  renderTypeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  canvasEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  canvasEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  canvasEmptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  goToChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  goToChatBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorToast: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
  },
});

export default AIMindMapScreen;
