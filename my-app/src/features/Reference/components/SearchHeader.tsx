import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Input } from '../../../components/Input';

interface SearchHeaderProps {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (text: string) => void;
  onBackPress?: () => void;
  showThemeToggle?: boolean;
  accentColor?: string;
  rightContent?: React.ReactNode;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  onBackPress,
  showThemeToggle = false,
  accentColor,
  rightContent,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof Input>>(null);
  const searchFocusValue = useSharedValue(0);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    searchFocusValue.value = withTiming(1, { duration: 200 });
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    searchFocusValue.value = withTiming(0, { duration: 200 });
  };

  const clearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const animatedSearchStyle = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(
        searchFocusValue.value,
        [0, 1],
        [1, 2],
        Extrapolation.CLAMP
      ),
    };
  });

  const finalAccentColor = accentColor || theme.colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.borderLight,
          paddingTop: insets.top + 8,
        },
      ]}
    >
      {/* Top Row */}
      <View style={styles.topRow}>
        {onBackPress && (
          <Pressable
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.surfaceSecondary },
            ]}
            onPress={onBackPress}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.colors.text}
            />
          </Pressable>
        )}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {rightContent}
          {showThemeToggle && (
            <Pressable
              style={[
                styles.themeButton,
                { backgroundColor: theme.colors.surfaceSecondary },
              ]}
              onPress={toggleTheme}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          animatedSearchStyle,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderColor: isSearchFocused
              ? finalAccentColor
              : theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={
            isSearchFocused ? finalAccentColor : theme.colors.textTertiary
          }
          style={styles.searchIcon}
        />
        <Input
          ref={inputRef}
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder={searchPlaceholder}
          placeholderTextColor={theme.colors.textTertiary}
          value={searchValue}
          onChangeText={onSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchValue.length > 0 && (
          <Pressable onPress={clearSearch} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchHeader;
