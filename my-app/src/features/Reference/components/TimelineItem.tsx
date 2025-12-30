import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TimelineEvent {
  year: string;
  event: string;
  category: string;
  details: string;
}

interface TimelineItemProps {
  item: TimelineEvent;
  index: number;
  onPress?: (item: TimelineEvent) => void;
  isExpanded?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  index,
  onPress,
  isExpanded = false,
}) => {
  const { theme } = useTheme();
  const animatedValue = useSharedValue(0);
  const expandValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withDelay(
      index * 50,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
  }, [index]);

  useEffect(() => {
    expandValue.value = withSpring(isExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [isExpanded]);

  const getCategoryColors = () => {
    const category = item.category?.toLowerCase() || '';
    if (category.includes('ancient')) {
      return { bg: theme.colors.ancientBg, text: theme.colors.ancient };
    } else if (category.includes('medieval')) {
      return { bg: theme.colors.medievalBg, text: theme.colors.medieval };
    } else if (category.includes('modern')) {
      return { bg: theme.colors.modernBg, text: theme.colors.modern };
    } else if (category.includes('prehistoric')) {
      return { bg: theme.colors.prehistoricBg, text: theme.colors.prehistoric };
    }
    // Default colors for other categories
    return { bg: theme.colors.primaryLight, text: theme.colors.primary };
  };

  const categoryColors = getCategoryColors();

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedValue.value,
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, 1],
            [50, 0],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            animatedValue.value,
            [0, 1],
            [0.95, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const animatedDotStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            animatedValue.value,
            [0, 0.5, 1],
            [0, 1.2, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const animatedDetailsStyle = useAnimatedStyle(() => {
    return {
      maxHeight: interpolate(
        expandValue.value,
        [0, 1],
        [0, 200],
        Extrapolation.CLAMP
      ),
      opacity: expandValue.value,
      marginTop: interpolate(
        expandValue.value,
        [0, 1],
        [0, 12],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <View style={styles.container}>
      {/* Timeline Line and Dot */}
      <View style={styles.timelineContainer}>
        <View
          style={[
            styles.timelineLine,
            { backgroundColor: theme.colors.timelineLine },
          ]}
        />
        <Animated.View
          style={[
            styles.timelineDot,
            animatedDotStyle,
            {
              backgroundColor: theme.colors.timelineDot,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.timelineDotInner,
              { backgroundColor: theme.colors.surface },
            ]}
          />
        </Animated.View>
        {/* Connector Line */}
        <View
          style={[
            styles.connectorLine,
            { backgroundColor: theme.colors.timelineLine },
          ]}
        />
      </View>

      {/* Card Content */}
      <AnimatedPressable
        style={[
          styles.card,
          animatedCardStyle,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
            shadowColor: theme.colors.shadow,
          },
        ]}
        onPress={() => onPress?.(item)}
      >
        {/* Year Badge */}
        <View
          style={[
            styles.yearBadge,
            { backgroundColor: theme.colors.primaryLight },
          ]}
        >
          <Text
            style={[styles.yearText, { color: theme.colors.primary }]}
          >
            {item.year}
          </Text>
        </View>

        {/* Event Title */}
        <Text
          style={[styles.eventTitle, { color: theme.colors.text }]}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.event}
        </Text>

        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryColors.bg },
          ]}
        >
          <Text style={[styles.categoryText, { color: categoryColors.text }]}>
            {item.category}
          </Text>
        </View>

        {/* Expandable Details */}
        <Animated.View style={[styles.detailsContainer, animatedDetailsStyle]}>
          <View
            style={[
              styles.detailsDivider,
              { backgroundColor: theme.colors.borderLight },
            ]}
          />
          <Text
            style={[styles.detailsText, { color: theme.colors.textSecondary }]}
          >
            {item.details}
          </Text>
        </Animated.View>

        {/* Expand Indicator */}
        <View style={styles.expandIndicator}>
          <Text
            style={[
              styles.expandText,
              { color: theme.colors.textTertiary },
            ]}
          >
            {isExpanded ? 'Tap to collapse' : 'Tap for details'}
          </Text>
        </View>
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineContainer: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    width: 3,
    top: 0,
    bottom: 0,
    left: 18.5,
    borderRadius: 1.5,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    marginTop: 20,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectorLine: {
    position: 'absolute',
    height: 2,
    width: 12,
    top: 27,
    right: 0,
  },
  card: {
    flex: 1,
    marginLeft: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  yearBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  yearText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    overflow: 'hidden',
  },
  detailsDivider: {
    height: 1,
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  expandIndicator: {
    marginTop: 10,
    alignItems: 'center',
  },
  expandText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default TimelineItem;

