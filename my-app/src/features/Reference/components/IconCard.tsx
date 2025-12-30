import React from 'react';
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
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

type IconFamily = 'ionicons' | 'material' | 'fontawesome';

interface IconCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon: string;
  iconFamily?: IconFamily;
  iconColor?: string;
  iconBgColor?: string;
  gradientColors?: readonly [string, string, ...string[]];
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: object;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IconCard: React.FC<IconCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  iconFamily = 'ionicons',
  iconColor,
  iconBgColor,
  gradientColors,
  onPress,
  size = 'medium',
  style,
}) => {
  const { theme } = useTheme();
  const scaleValue = useSharedValue(1);

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const renderIcon = (color: string, iconSize: number) => {
    switch (iconFamily) {
      case 'material':
        return (
          <MaterialCommunityIcons
            name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={iconSize}
            color={color}
          />
        );
      case 'fontawesome':
        return (
          <FontAwesome5
            name={icon as keyof typeof FontAwesome5.glyphMap}
            size={iconSize}
            color={color}
          />
        );
      default:
        return (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={iconSize}
            color={color}
          />
        );
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          card: styles.smallCard,
          iconSize: 24,
          iconContainer: styles.smallIconContainer,
          title: styles.smallTitle,
          subtitle: styles.smallSubtitle,
        };
      case 'large':
        return {
          card: styles.largeCard,
          iconSize: 36,
          iconContainer: styles.largeIconContainer,
          title: styles.largeTitle,
          subtitle: styles.largeSubtitle,
        };
      default:
        return {
          card: styles.mediumCard,
          iconSize: 28,
          iconContainer: styles.mediumIconContainer,
          title: styles.mediumTitle,
          subtitle: styles.mediumSubtitle,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const finalIconColor = iconColor || theme.colors.primary;
  const finalIconBgColor = iconBgColor || `${finalIconColor}15`;

  return (
    <AnimatedPressable
      style={[
        styles.container,
        sizeStyles.card,
        animatedStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      {/* Icon Container */}
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconContainerBase, sizeStyles.iconContainer]}
        >
          {renderIcon('#FFFFFF', sizeStyles.iconSize)}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.iconContainerBase,
            sizeStyles.iconContainer,
            { backgroundColor: finalIconBgColor },
          ]}
        >
          {renderIcon(finalIconColor, sizeStyles.iconSize)}
        </View>
      )}

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text
          style={[sizeStyles.title, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[sizeStyles.subtitle, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
        {description && size === 'large' && (
          <Text
            style={[styles.description, { color: theme.colors.textTertiary }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}
      </View>

      {/* Arrow indicator for clickable cards */}
      {onPress && (
        <View style={styles.arrowContainer}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.textTertiary}
          />
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  iconContainerBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Small size
  smallCard: {
    padding: 10,
  },
  smallIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: 10,
  },
  smallTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  smallSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  // Medium size
  mediumCard: {
    padding: 14,
  },
  mediumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 14,
  },
  mediumTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  mediumSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  // Large size
  largeCard: {
    padding: 16,
  },
  largeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    marginRight: 16,
  },
  largeTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  largeSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  arrowContainer: {
    marginLeft: 8,
  },
});

export default IconCard;

