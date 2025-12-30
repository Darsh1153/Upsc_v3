import React from 'react';
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
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InfoCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  gradientColors?: readonly [string, string, ...string[]];
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'wide' | 'badge';
  accentColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  value,
  description,
  icon,
  iconColor,
  gradientColors,
  onPress,
  variant = 'default',
  accentColor,
}) => {
  const { theme } = useTheme();
  const scaleValue = useSharedValue(1);

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const finalAccentColor = accentColor || theme.colors.primary;
  const finalIconColor = iconColor || finalAccentColor;
  const finalGradient = gradientColors || [finalAccentColor, finalAccentColor];

  const renderContent = () => {
    if (variant === 'compact') {
      return (
        <View style={styles.compactContent}>
          {icon && (
            <View
              style={[
                styles.compactIcon,
                { backgroundColor: `${finalAccentColor}15` },
              ]}
            >
              <Ionicons name={icon} size={18} color={finalIconColor} />
            </View>
          )}
          <View style={styles.compactTextContainer}>
            <Text
              style={[styles.compactTitle, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {value && (
              <Text
                style={[
                  styles.compactValue,
                  { color: finalAccentColor },
                ]}
              >
                {value}
              </Text>
            )}
          </View>
        </View>
      );
    }

    if (variant === 'badge') {
      return (
        <View style={styles.badgeContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={16}
              color={finalIconColor}
              style={styles.badgeIcon}
            />
          )}
          <Text
            style={[styles.badgeTitle, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      );
    }

    if (variant === 'wide') {
      return (
        <View style={styles.wideContent}>
          <View style={styles.wideHeader}>
            {icon && (
              <View
                style={[
                  styles.wideIconContainer,
                  { backgroundColor: `${finalAccentColor}15` },
                ]}
              >
                <Ionicons name={icon} size={24} color={finalIconColor} />
              </View>
            )}
            <View style={styles.wideTextContainer}>
              <Text
                style={[styles.wideTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  style={[
                    styles.wideSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>
            {value && (
              <View
                style={[
                  styles.wideValueBadge,
                  { backgroundColor: `${finalAccentColor}15` },
                ]}
              >
                <Text
                  style={[styles.wideValue, { color: finalAccentColor }]}
                >
                  {value}
                </Text>
              </View>
            )}
          </View>
          {description && (
            <Text
              style={[
                styles.wideDescription,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={3}
            >
              {description}
            </Text>
          )}
        </View>
      );
    }

    // Default variant
    return (
      <View style={styles.defaultContent}>
        {gradientColors ? (
          <LinearGradient
            colors={finalGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientIconContainer}
          >
            {icon && (
              <Ionicons name={icon} size={28} color="#FFFFFF" />
            )}
          </LinearGradient>
        ) : (
          icon && (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${finalAccentColor}15` },
              ]}
            >
              <Ionicons name={icon} size={28} color={finalIconColor} />
            </View>
          )
        )}
        {value && (
          <Text
            style={[styles.defaultValue, { color: finalAccentColor }]}
          >
            {value}
          </Text>
        )}
        <Text
          style={[styles.defaultTitle, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.defaultSubtitle,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
        {description && (
          <Text
            style={[
              styles.defaultDescription,
              { color: theme.colors.textTertiary },
            ]}
            numberOfLines={3}
          >
            {description}
          </Text>
        )}
      </View>
    );
  };

  const getCardStyle = () => {
    switch (variant) {
      case 'compact':
        return styles.compactCard;
      case 'badge':
        return styles.badgeCard;
      case 'wide':
        return styles.wideCard;
      default:
        return styles.defaultCard;
    }
  };

  return (
    <AnimatedPressable
      style={[
        styles.container,
        getCardStyle(),
        animatedStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
          shadowColor: theme.colors.shadow,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      {renderContent()}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  // Default variant
  defaultCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    padding: 16,
    marginBottom: 12,
  },
  defaultContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gradientIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  defaultValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  defaultTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  defaultSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  defaultDescription: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 15,
  },
  // Compact variant
  compactCard: {
    padding: 12,
    marginBottom: 8,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  compactValue: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Badge variant
  badgeCard: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Wide variant
  wideCard: {
    padding: 16,
    marginBottom: 12,
  },
  wideContent: {},
  wideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  wideTextContainer: {
    flex: 1,
  },
  wideTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  wideSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  wideValueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  wideValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  wideDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
});

export default InfoCard;

