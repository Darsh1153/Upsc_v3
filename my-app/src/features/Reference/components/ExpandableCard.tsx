import React, { useState, useEffect } from 'react';
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
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  children: React.ReactNode;
  initialExpanded?: boolean;
  headerRight?: React.ReactNode;
  accentColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  iconBgColor,
  children,
  initialExpanded = false,
  headerRight,
  accentColor,
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const expandValue = useSharedValue(initialExpanded ? 1 : 0);
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    expandValue.value = withSpring(isExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [isExpanded]);

  const handlePress = () => {
    setIsExpanded(!isExpanded);
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
            expandValue.value,
            [0, 1],
            [0, 180],
            Extrapolation.CLAMP
          )}deg`,
        },
      ],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: expandValue.value,
      maxHeight: interpolate(
        expandValue.value,
        [0, 1],
        [0, 2000],
        Extrapolation.CLAMP
      ),
    };
  });

  const finalIconColor = iconColor || accentColor || theme.colors.primary;
  const finalIconBgColor = iconBgColor || (accentColor ? `${accentColor}20` : theme.colors.primaryLight);

  return (
    <Animated.View
      style={[
        styles.container,
        animatedCardStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: finalIconBgColor },
              ]}
            >
              <Ionicons
                name={icon}
                size={22}
                color={finalIconColor}
              />
            </View>
          )}
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          {headerRight}
          <Animated.View style={animatedChevronStyle}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Animated.View>
        </View>
      </Pressable>

      {/* Content */}
      <Animated.View style={[styles.content, animatedContentStyle]}>
        <View
          style={[
            styles.contentInner,
            { borderTopColor: theme.colors.borderLight },
          ]}
        >
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  content: {
    overflow: 'hidden',
  },
  contentInner: {
    borderTopWidth: 1,
    padding: 16,
  },
});

export default ExpandableCard;

