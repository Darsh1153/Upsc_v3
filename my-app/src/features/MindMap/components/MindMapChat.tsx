/**
 * Mind Map Chat Component
 * Chat interface for AI-powered mind map generation
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  // TextInput, // Replaced
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  TextInput, // Type only or removed? Better to keep for Ref type if needed by TS, but Input forwards it.
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatMessage } from '../services/aiMindMapStorage';
import { Input } from '../../../components/Input';

interface MindMapChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  isDark: boolean;
  colors: any;
  onViewMindMap?: () => void;
  hasMindMap?: boolean;
}

// Quick action suggestions
const QUICK_ACTIONS = [
  { icon: 'add-circle-outline', label: 'Add Section', prompt: 'Add a new section about' },
  { icon: 'expand-outline', label: 'Expand', prompt: 'Expand the section on' },
  { icon: 'color-wand-outline', label: 'Improve', prompt: 'Improve and add more details to the mind map' },
  { icon: 'shuffle-outline', label: 'Reorganize', prompt: 'Reorganize the structure for better clarity' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MindMapChat: React.FC<MindMapChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  isDark,
  colors,
  onViewMindMap,
  hasMindMap = false,
}) => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  // Typing indicator animation
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnimation, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [isLoading]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    await onSendMessage(text);
  }, [inputText, isLoading, onSendMessage]);

  const handleQuickAction = useCallback((prompt: string) => {
    setInputText(prompt + ' ');
    inputRef.current?.focus();
  }, []);

  // Render message item
  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
      ]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="brain" size={18} color={colors.primary} />
          </View>
        )}

        <View style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.borderLight }],
        ]}>
          <Text style={[
            styles.messageText,
            isUser
              ? styles.userText
              : { color: colors.text },
          ]}>
            {item.content.replace(/```mermaid[\s\S]*?```/g, '[Mind Map Updated]').trim()}
          </Text>

          {item.mermaidCode && !isUser && (
            <TouchableOpacity
              style={[styles.viewMapBtn, { backgroundColor: colors.primaryLight }]}
              onPress={onViewMindMap}
            >
              <MaterialCommunityIcons name="graph" size={16} color={colors.primary} />
              <Text style={[styles.viewMapText, { color: colors.primary }]}>View Mind Map</Text>
            </TouchableOpacity>
          )}

          <Text style={[
            styles.messageTime,
            isUser ? styles.userTime : { color: colors.textTertiary },
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {isUser && (
          <View style={[styles.avatar, styles.userAvatar, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
          </View>
        )}
      </View>
    );
  }, [colors, isDark, onViewMindMap]);

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
        <MaterialCommunityIcons name="brain" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        AI Mind Map Creator
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Describe the topic you want to create a mind map for. I'll help you visualize and organize your ideas using Mermaid diagrams.
      </Text>

      <View style={styles.suggestionContainer}>
        <Text style={[styles.suggestionLabel, { color: colors.textTertiary }]}>
          Try asking:
        </Text>
        {[
          'Create a mind map about Indian Constitution',
          'Make a diagram of Economic Reforms in India',
          'Map out the Indian Independence Movement',
        ].map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => {
              setInputText(suggestion);
              inputRef.current?.focus();
            }}
          >
            <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <MaterialCommunityIcons name="brain" size={18} color={colors.primary} />
        </View>
        <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.typingDots}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.typingDot,
                  { backgroundColor: colors.primary },
                  {
                    opacity: typingAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: i === 0 ? [0.3, 1, 0.3] : i === 1 ? [1, 0.3, 1] : [0.3, 1, 0.3],
                    }),
                    transform: [{
                      scale: typingAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: i === 1 ? [1, 1.2, 1] : [1.2, 1, 1.2],
                      }),
                    }],
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.typingText, { color: colors.textSecondary }]}>
            Creating your mind map...
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.messagesListEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderTypingIndicator}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Actions */}
      {hasMindMap && !isLoading && (
        <View style={styles.quickActionsContainer}>
          <FlatList
            horizontal
            data={QUICK_ACTIONS}
            keyExtractor={(item) => item.label}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => handleQuickAction(item.prompt)}
              >
                <Ionicons name={item.icon as any} size={16} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Input
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your mind map..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() && !isLoading ? colors.primary : colors.surfaceSecondary },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? '#FFF' : colors.textTertiary}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    marginRight: 0,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
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
  typingBubble: {
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#FFF',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  viewMapText: {
    fontSize: 13,
    fontWeight: '600',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typingText: {
    fontSize: 12,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  suggestionContainer: {
    marginTop: 24,
    width: '100%',
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  quickActionsContainer: {
    paddingVertical: 8,
  },
  quickActionsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
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
});

export default MindMapChat;
