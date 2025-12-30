import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { MindMapNode, MindMapConnection, CanvasState, GestureState } from '../types';
import MindMapNodeComponent from './MindMapNode';
import ConnectionLine from './ConnectionLine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Canvas dimensions
const CANVAS_WIDTH = 4000;
const CANVAS_HEIGHT = 4000;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

interface MindMapCanvasProps {
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  canvasState: CanvasState;
  selectedNodeId: string | null;
  isConnecting: boolean;
  connectingFromNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  onNodeDoubleTap: (nodeId: string) => void;
  onNodeLongPress: (nodeId: string, screenX: number, screenY: number) => void;
  onCanvasStateChange: (state: CanvasState) => void;
  onCanvasTap: (x: number, y: number) => void;
  onCanvasLongPress: (x: number, y: number) => void;
  onConnectionComplete: (targetNodeId: string) => void;
  onConnectionCancel: () => void;
  tempConnectionEnd?: { x: number; y: number };
}

const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  nodes,
  connections,
  canvasState,
  selectedNodeId,
  isConnecting,
  connectingFromNodeId,
  onNodeSelect,
  onNodeMove,
  onNodeDoubleTap,
  onNodeLongPress,
  onCanvasStateChange,
  onCanvasTap,
  onCanvasLongPress,
  onConnectionComplete,
  onConnectionCancel,
  tempConnectionEnd,
}) => {
  // Animated values for canvas transform
  const scale = useSharedValue(canvasState.zoom);
  const translateX = useSharedValue(canvasState.offsetX);
  const translateY = useSharedValue(canvasState.offsetY);
  
  // Saved values for gesture continuation
  const savedScale = useSharedValue(canvasState.zoom);
  const savedTranslateX = useSharedValue(canvasState.offsetX);
  const savedTranslateY = useSharedValue(canvasState.offsetY);
  
  // Focal point for pinch zoom
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Track if user is dragging a node
  const isDraggingNode = useSharedValue(false);

  // Update canvas state when animated values change
  const updateCanvasState = useCallback(() => {
    onCanvasStateChange({
      zoom: scale.value,
      offsetX: translateX.value,
      offsetY: translateY.value,
    });
  }, [onCanvasStateChange]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const canvasX = (screenX - translateX.value) / scale.value;
    const canvasY = (screenY - translateY.value) / scale.value;
    return { x: canvasX, y: canvasY };
  }, []);

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      savedScale.value = scale.value;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const newScale = Math.min(Math.max(savedScale.value * e.scale, MIN_ZOOM), MAX_ZOOM);
      
      // Zoom towards focal point
      const scaleDiff = newScale / scale.value;
      translateX.value = focalX.value - (focalX.value - translateX.value) * scaleDiff;
      translateY.value = focalY.value - (focalY.value - translateY.value) * scaleDiff;
      
      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(updateCanvasState)();
    });

  // Pan gesture for moving canvas
  const panGesture = Gesture.Pan()
    .minPointers(Platform.OS === 'web' ? 1 : 2) // 1 finger on web (middle mouse), 2 on mobile
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (!isDraggingNode.value) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(updateCanvasState)();
    });

  // Tap gesture for canvas
  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      if (isConnecting) {
        runOnJS(onConnectionCancel)();
      } else {
        const canvasPos = screenToCanvas(e.x, e.y);
        runOnJS(onCanvasTap)(canvasPos.x, canvasPos.y);
      }
    });

  // Long press gesture for canvas
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd((e) => {
      const canvasPos = screenToCanvas(e.x, e.y);
      runOnJS(onCanvasLongPress)(canvasPos.x, canvasPos.y);
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(
      longPressGesture,
      Gesture.Simultaneous(panGesture, tapGesture)
    )
  );

  // Animated style for the canvas transform
  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Handle node drag
  const handleNodeDragStart = useCallback((nodeId: string) => {
    isDraggingNode.value = true;
    onNodeSelect(nodeId);
  }, [onNodeSelect]);

  const handleNodeDragEnd = useCallback((nodeId: string, x: number, y: number) => {
    isDraggingNode.value = false;
    onNodeMove(nodeId, x, y);
  }, [onNodeMove]);

  // Handle node tap when connecting
  const handleNodeTap = useCallback((nodeId: string) => {
    if (isConnecting && connectingFromNodeId && nodeId !== connectingFromNodeId) {
      onConnectionComplete(nodeId);
    } else {
      onNodeSelect(nodeId);
    }
  }, [isConnecting, connectingFromNodeId, onConnectionComplete, onNodeSelect]);

  // Get source node for temp connection line
  const sourceNode = connectingFromNodeId 
    ? nodes.find(n => n.id === connectingFromNodeId)
    : null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.canvasWrapper}>
          <Animated.View style={[styles.canvas, canvasAnimatedStyle]}>
            {/* Render connections first (behind nodes) */}
            <View style={styles.connectionsLayer}>
              {connections.map((connection) => {
                const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
                const targetNode = nodes.find(n => n.id === connection.targetNodeId);
                
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <ConnectionLine
                    key={connection.id}
                    connection={connection}
                    sourceNode={sourceNode}
                    targetNode={targetNode}
                    isSelected={
                      selectedNodeId === connection.sourceNodeId ||
                      selectedNodeId === connection.targetNodeId
                    }
                  />
                );
              })}
              
              {/* Temporary connection line while connecting */}
              {isConnecting && sourceNode && tempConnectionEnd && (
                <ConnectionLine
                  connection={{
                    id: 'temp',
                    sourceNodeId: sourceNode.id,
                    targetNodeId: 'temp',
                    color: '#3B82F6',
                    strokeWidth: 2,
                    style: 'dashed',
                    animated: true,
                  }}
                  sourceNode={sourceNode}
                  targetNode={{
                    id: 'temp',
                    label: '',
                    x: tempConnectionEnd.x,
                    y: tempConnectionEnd.y,
                    width: 0,
                    height: 0,
                    color: '#3B82F6',
                    shape: 'rounded',
                    fontSize: 14,
                  }}
                  isTemp
                />
              )}
            </View>

            {/* Render nodes */}
            <View style={styles.nodesLayer}>
              {nodes.map((node) => (
                <MindMapNodeComponent
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  isConnecting={isConnecting}
                  isConnectingFrom={connectingFromNodeId === node.id}
                  scale={scale}
                  onTap={() => handleNodeTap(node.id)}
                  onDoubleTap={() => onNodeDoubleTap(node.id)}
                  onLongPress={(screenX, screenY) => onNodeLongPress(node.id, screenX, screenY)}
                  onDragStart={() => handleNodeDragStart(node.id)}
                  onDragEnd={(x, y) => handleNodeDragEnd(node.id, x, y)}
                />
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    position: 'absolute',
    // Center the canvas initially
    left: -CANVAS_WIDTH / 2 + SCREEN_WIDTH / 2,
    top: -CANVAS_HEIGHT / 2 + SCREEN_HEIGHT / 2,
  },
  connectionsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  nodesLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});

export default MindMapCanvas;

