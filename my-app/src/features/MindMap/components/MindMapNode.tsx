import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { MindMapNode } from '../types';

interface MindMapNodeProps {
  node: MindMapNode;
  isSelected: boolean;
  isConnecting: boolean;
  isConnectingFrom: boolean;
  scale: SharedValue<number>;
  onTap: () => void;
  onDoubleTap: () => void;
  onLongPress: (screenX: number, screenY: number) => void;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
}

const MindMapNodeComponent: React.FC<MindMapNodeProps> = ({
  node,
  isSelected,
  isConnecting,
  isConnectingFrom,
  scale,
  onTap,
  onDoubleTap,
  onLongPress,
  onDragStart,
  onDragEnd,
}) => {
  // Animated position values
  const translateX = useSharedValue(node.x);
  const translateY = useSharedValue(node.y);
  const savedTranslateX = useSharedValue(node.x);
  const savedTranslateY = useSharedValue(node.y);
  
  // Animation values
  const nodeScale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);

  // Update position when node prop changes
  React.useEffect(() => {
    translateX.value = withTiming(node.x, { duration: 100 });
    translateY.value = withTiming(node.y, { duration: 100 });
    savedTranslateX.value = node.x;
    savedTranslateY.value = node.y;
  }, [node.x, node.y]);

  // Drag gesture
  const dragGesture = Gesture.Pan()
    .minDistance(5)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      nodeScale.value = withSpring(1.05);
      shadowOpacity.value = withTiming(0.3);
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      // Adjust translation by scale to keep movement consistent at different zoom levels
      translateX.value = savedTranslateX.value + e.translationX / scale.value;
      translateY.value = savedTranslateY.value + e.translationY / scale.value;
    })
    .onEnd(() => {
      nodeScale.value = withSpring(1);
      shadowOpacity.value = withTiming(0.1);
      runOnJS(onDragEnd)(translateX.value, translateY.value);
    });

  // Tap gesture
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(onTap)();
    });

  // Double tap gesture
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(onDoubleTap)();
    });

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onEnd((e) => {
      runOnJS(onLongPress)(e.absoluteX, e.absoluteY);
    });

  // Compose gestures - double tap takes priority over single tap
  const composedGesture = Gesture.Race(
    dragGesture,
    Gesture.Exclusive(doubleTapGesture, longPressGesture, tapGesture)
  );

  // Get shape styles
  const getShapeStyle = () => {
    switch (node.shape) {
      case 'circle':
        return {
          borderRadius: Math.max(node.width, node.height) / 2,
          width: Math.max(node.width, node.height),
          height: Math.max(node.width, node.height),
        };
      case 'diamond':
        return {
          transform: [{ rotate: '45deg' }],
          borderRadius: 8,
        };
      case 'rectangle':
        return {
          borderRadius: 4,
        };
      case 'rounded':
      default:
        return {
          borderRadius: 12,
        };
    }
  };

  // Get reference icon
  const getReferenceIcon = () => {
    switch (node.referenceType) {
      case 'roadmap_topic':
        return 'map-outline';
      case 'timeline_event':
        return 'time-outline';
      case 'article':
        return 'newspaper-outline';
      case 'note':
        return 'document-text-outline';
      default:
        return null;
    }
  };

  const referenceIcon = getReferenceIcon();

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value - node.width / 2 },
      { translateY: translateY.value - node.height / 2 },
      { scale: nodeScale.value },
    ],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.nodeContainer,
          {
            width: node.width,
            height: node.height,
          },
          animatedContainerStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.node,
            getShapeStyle(),
            {
              backgroundColor: node.color,
              width: node.width,
              height: node.height,
            },
            isSelected && styles.nodeSelected,
            isConnecting && !isConnectingFrom && styles.nodeConnectTarget,
            isConnectingFrom && styles.nodeConnectingFrom,
            animatedShadowStyle,
          ]}
        >
          {/* Diamond shape needs inner content rotated back */}
          <View style={node.shape === 'diamond' ? styles.diamondContent : styles.nodeContent}>
            {referenceIcon && (
              <Ionicons
                name={referenceIcon as any}
                size={14}
                color="rgba(255,255,255,0.8)"
                style={styles.referenceIcon}
              />
            )}
            <Text
              style={[
                styles.nodeLabel,
                { fontSize: node.fontSize },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {node.label}
            </Text>
            {node.noteId && (
              <Ionicons
                name="attach"
                size={12}
                color="rgba(255,255,255,0.6)"
                style={styles.attachIcon}
              />
            )}
          </View>
        </Animated.View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={[styles.selectionRing, { borderColor: node.color }]} />
        )}

        {/* Connecting indicator */}
        {isConnectingFrom && (
          <View style={styles.connectingIndicator}>
            <Ionicons name="link" size={16} color="#3B82F6" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        cursor: 'grab',
        userSelect: 'none',
      },
    }),
  },
  nodeContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  diamondContent: {
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '100%',
  },
  referenceIcon: {
    marginBottom: 2,
  },
  attachIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  nodeSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  nodeConnectTarget: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  nodeConnectingFrom: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  selectionRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  connectingIndicator: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default MindMapNodeComponent;

