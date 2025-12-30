import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeOutDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MindMapNode, NodeAction, NODE_COLORS } from '../types';

interface ActionBarProps {
  selectedNode: MindMapNode | null;
  onAction: (action: NodeAction) => void;
  onColorSelect: (color: string) => void;
  showColorPicker: boolean;
  onToggleColorPicker: () => void;
}

const ActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}> = ({ icon, label, onPress, color, danger }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={[styles.actionButton, animatedStyle]}>
        <View style={[
          styles.actionIconContainer,
          { backgroundColor: danger ? '#FEE2E2' : color ? `${color}20` : '#F1F5F9' }
        ]}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={danger ? '#EF4444' : color || '#64748B'} 
          />
        </View>
        <Text style={[
          styles.actionLabel,
          danger && styles.actionLabelDanger
        ]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const ActionBar: React.FC<ActionBarProps> = ({
  selectedNode,
  onAction,
  onColorSelect,
  showColorPicker,
  onToggleColorPicker,
}) => {
  const insets = useSafeAreaInsets();

  if (!selectedNode) return null;

  return (
    <Animated.View 
      entering={FadeInDown.springify()}
      exiting={FadeOutDown.springify()}
      style={[
        styles.container,
        { paddingBottom: insets.bottom + 8 }
      ]}
    >
      {/* Selected node info */}
      <View style={styles.nodeInfo}>
        <View style={[styles.nodeColorDot, { backgroundColor: selectedNode.color }]} />
        <Text style={styles.nodeLabel} numberOfLines={1}>
          {selectedNode.label}
        </Text>
      </View>

      {/* Color picker */}
      {showColorPicker && (
        <Animated.View 
          entering={FadeInDown.springify()}
          style={styles.colorPicker}
        >
          {NODE_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => onColorSelect(color)}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedNode.color === color && styles.colorOptionSelected,
              ]}
            />
          ))}
        </Animated.View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <ActionButton
          icon="create-outline"
          label="Edit"
          onPress={() => onAction('edit')}
        />
        <ActionButton
          icon="link-outline"
          label="Connect"
          onPress={() => onAction('connect')}
          color="#3B82F6"
        />
        <ActionButton
          icon="color-palette-outline"
          label="Color"
          onPress={onToggleColorPicker}
          color={selectedNode.color}
        />
        <ActionButton
          icon="document-attach-outline"
          label="Note"
          onPress={() => onAction('attachNote')}
          color="#10B981"
        />
        <ActionButton
          icon="trash-outline"
          label="Delete"
          onPress={() => onAction('delete')}
          danger
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  nodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  nodeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  nodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1E293B',
    borderWidth: 3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  actionLabelDanger: {
    color: '#EF4444',
  },
});

export default ActionBar;

