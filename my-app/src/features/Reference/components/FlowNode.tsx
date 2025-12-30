import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export interface FlowNodeData {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: FlowNodeData[];
  level?: number;
  isLast?: boolean;
}

interface FlowNodeProps {
  node: FlowNodeData;
  level?: number;
  isLast?: boolean;
  onPress?: (node: FlowNodeData) => void;
  initialExpanded?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FlowNode: React.FC<FlowNodeProps> = ({
  node,
  level = 0,
  isLast = false,
  onPress,
  initialExpanded = false,
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const expandValue = useSharedValue(initialExpanded ? 1 : 0);
  const rotateValue = useSharedValue(initialExpanded ? 1 : 0);
  const scaleValue = useSharedValue(1);

  const hasChildren = node.children && node.children.length > 0;

  useEffect(() => {
    expandValue.value = withSpring(isExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
    rotateValue.value = withTiming(isExpanded ? 1 : 0, { duration: 200 });
  }, [isExpanded]);

  const handlePress = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onPress?.(node);
  };

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1);
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(
            rotateValue.value,
            [0, 1],
            [0, 90],
            Extrapolation.CLAMP
          )}deg`,
        },
      ],
    };
  });

  const animatedChildrenStyle = useAnimatedStyle(() => {
    return {
      opacity: expandValue.value,
      maxHeight: interpolate(
        expandValue.value,
        [0, 1],
        [0, 5000],
        Extrapolation.CLAMP
      ),
    };
  });

  const getLevelColor = () => {
    const colors = [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.polity,
      theme.colors.geography,
      theme.colors.economy,
    ];
    return colors[level % colors.length];
  };

  const getLevelBgColor = () => {
    const colors = [
      theme.colors.primaryLight,
      theme.colors.secondaryLight,
      theme.colors.polityBg,
      theme.colors.geographyBg,
      theme.colors.economyBg,
    ];
    return colors[level % colors.length];
  };

  const levelColor = getLevelColor();
  const levelBgColor = getLevelBgColor();

  return (
    <View style={styles.container}>
      {/* Connector Line from Parent */}
      {level > 0 && (
        <View style={styles.connectorWrapper}>
          <View
            style={[
              styles.verticalLine,
              {
                backgroundColor: theme.colors.timelineLine,
                height: isLast ? 24 : '100%',
              },
            ]}
          />
          <View
            style={[
              styles.horizontalLine,
              { backgroundColor: theme.colors.timelineLine },
            ]}
          />
        </View>
      )}

      <View style={[styles.nodeWrapper, { marginLeft: level * 24 }]}>
        {/* Node Card */}
        <AnimatedPressable
          style={[
            styles.nodeCard,
            animatedCardStyle,
            {
              backgroundColor: theme.colors.surface,
              borderColor: levelColor,
              borderLeftWidth: 4,
              shadowColor: theme.colors.shadow,
            },
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.nodeContent}>
            {/* Icon */}
            {node.icon && (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: levelBgColor },
                ]}
              >
                <Ionicons
                  name={node.icon}
                  size={20}
                  color={levelColor}
                />
              </View>
            )}

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text
                style={[styles.nodeTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {node.title}
              </Text>
              {node.subtitle && (
                <Text
                  style={[
                    styles.nodeSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {node.subtitle}
                </Text>
              )}
            </View>

            {/* Expand Chevron */}
            {hasChildren && (
              <Animated.View style={[styles.chevron, animatedChevronStyle]}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </Animated.View>
            )}

            {/* Child Count Badge */}
            {hasChildren && (
              <View
                style={[
                  styles.childCountBadge,
                  { backgroundColor: levelBgColor },
                ]}
              >
                <Text
                  style={[styles.childCountText, { color: levelColor }]}
                >
                  {node.children!.length}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {node.description && isExpanded && (
            <View
              style={[
                styles.descriptionContainer,
                { borderTopColor: theme.colors.borderLight },
              ]}
            >
              <Text
                style={[
                  styles.descriptionText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {node.description}
              </Text>
            </View>
          )}
        </AnimatedPressable>

        {/* Children */}
        {hasChildren && (
          <Animated.View style={[styles.childrenContainer, animatedChildrenStyle]}>
            {node.children!.map((child, index) => (
              <FlowNode
                key={child.id || index}
                node={child}
                level={level + 1}
                isLast={index === node.children!.length - 1}
                onPress={onPress}
              />
            ))}
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  connectorWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  verticalLine: {
    position: 'absolute',
    width: 2,
    left: 11,
    top: 0,
  },
  horizontalLine: {
    position: 'absolute',
    height: 2,
    width: 12,
    left: 11,
    top: 24,
  },
  nodeWrapper: {
    marginVertical: 6,
  },
  nodeCard: {
    borderRadius: 12,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  nodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  nodeSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
  childCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  childCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  childrenContainer: {
    marginLeft: 12,
    overflow: 'hidden',
  },
});

export default FlowNode;

