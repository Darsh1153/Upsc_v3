import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Defs, Marker } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  withRepeat,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { MindMapConnection, MindMapNode } from '../types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ConnectionLineProps {
  connection: MindMapConnection;
  sourceNode: MindMapNode;
  targetNode: MindMapNode;
  isSelected?: boolean;
  isTemp?: boolean;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  sourceNode,
  targetNode,
  isSelected = false,
  isTemp = false,
}) => {
  // Animation for dashed/animated lines
  const dashOffset = useSharedValue(0);

  React.useEffect(() => {
    if (connection.animated || isTemp) {
      dashOffset.value = withRepeat(
        withTiming(20, { duration: 1000, easing: Easing.linear }),
        -1, // Infinite
        false
      );
    }
  }, [connection.animated, isTemp]);

  // Calculate bezier curve control points
  const pathData = useMemo(() => {
    // Source point (center of source node)
    const sx = sourceNode.x;
    const sy = sourceNode.y;
    
    // Target point (center of target node, or temp position)
    const tx = targetNode.x;
    const ty = targetNode.y;
    
    // Calculate direction
    const dx = tx - sx;
    const dy = ty - sy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // For short distances, use straight line
    if (distance < 100) {
      return `M ${sx} ${sy} L ${tx} ${ty}`;
    }
    
    // Calculate control points for smooth bezier curve
    // Control points are offset perpendicular to the line for a gentle curve
    const midX = (sx + tx) / 2;
    const midY = (sy + ty) / 2;
    
    // Curve intensity based on distance
    const curveIntensity = Math.min(distance * 0.2, 50);
    
    // Determine curve direction (alternate based on positions)
    const curveDirection = (sx < tx) === (sy < ty) ? 1 : -1;
    
    // Control point offset perpendicular to the line
    const perpX = -dy / distance * curveIntensity * curveDirection;
    const perpY = dx / distance * curveIntensity * curveDirection;
    
    const cx = midX + perpX;
    const cy = midY + perpY;
    
    return `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`;
  }, [sourceNode.x, sourceNode.y, targetNode.x, targetNode.y]);

  // Calculate SVG bounds
  const bounds = useMemo(() => {
    const minX = Math.min(sourceNode.x, targetNode.x) - 100;
    const minY = Math.min(sourceNode.y, targetNode.y) - 100;
    const maxX = Math.max(sourceNode.x, targetNode.x) + 100;
    const maxY = Math.max(sourceNode.y, targetNode.y) + 100;
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [sourceNode.x, sourceNode.y, targetNode.x, targetNode.y]);

  // Get stroke dash array based on style
  const getStrokeDashArray = () => {
    switch (connection.style) {
      case 'dashed':
        return '8,4';
      case 'dotted':
        return '2,4';
      case 'solid':
      default:
        return undefined;
    }
  };

  // Animated props for dash offset
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  // Calculate label position (middle of the curve)
  const labelPosition = useMemo(() => {
    const sx = sourceNode.x;
    const sy = sourceNode.y;
    const tx = targetNode.x;
    const ty = targetNode.y;
    
    // Approximate position on quadratic bezier at t=0.5
    const midX = (sx + tx) / 2;
    const midY = (sy + ty) / 2;
    
    return { x: midX, y: midY - 10 };
  }, [sourceNode.x, sourceNode.y, targetNode.x, targetNode.y]);

  return (
    <Svg
      style={[
        styles.svg,
        {
          position: 'absolute',
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
      ]}
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
    >
      <Defs>
        <Marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <Path
            d="M0,0 L0,7 L10,3.5 z"
            fill={connection.color}
          />
        </Marker>
      </Defs>

      {/* Shadow/glow effect for selected state */}
      {isSelected && (
        <Path
          d={pathData}
          fill="none"
          stroke={connection.color}
          strokeWidth={connection.strokeWidth + 4}
          strokeOpacity={0.3}
          strokeLinecap="round"
        />
      )}

      {/* Main connection line */}
      <AnimatedPath
        d={pathData}
        fill="none"
        stroke={isTemp ? '#3B82F6' : connection.color}
        strokeWidth={connection.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={getStrokeDashArray()}
        animatedProps={(connection.animated || isTemp) ? animatedProps : undefined}
        opacity={isTemp ? 0.6 : 1}
        markerEnd={!isTemp ? `url(#arrowhead-${connection.id})` : undefined}
      />

      {/* Connection label */}
      {connection.label && !isTemp && (
        <>
          {/* Label background */}
          <Circle
            cx={labelPosition.x}
            cy={labelPosition.y}
            r={20}
            fill="#FFFFFF"
            opacity={0.9}
          />
          <SvgText
            x={labelPosition.x}
            y={labelPosition.y}
            fontSize={10}
            fontWeight="500"
            fill={connection.color}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {connection.label.length > 10 
              ? connection.label.substring(0, 10) + '...' 
              : connection.label}
          </SvgText>
        </>
      )}
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    pointerEvents: 'none',
  },
});

export default ConnectionLine;

