import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import TimelineItem, { TimelineEvent } from '../components/TimelineItem';
import FilterChips from '../components/FilterChips';
import SearchHeader from '../components/SearchHeader';
import { useWebStyles } from '../../../components/WebContainer';
import { useVisualReference } from '../../../context/VisualReferenceContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HistoryType = 'indian' | 'world';

const CATEGORY_FILTERS = [
  { id: 'prehistoric', label: 'Prehistoric', color: '#78716C' },
  { id: 'ancient', label: 'Ancient', color: '#F59E0B' },
  { id: 'medieval', label: 'Medieval', color: '#8B5CF6' },
  { id: 'modern', label: 'Modern', color: '#3B82F6' },
];

const WORLD_CATEGORY_FILTERS = [
  { id: 'ancient civilizations', label: 'Ancient', color: '#F59E0B' },
  { id: 'religion', label: 'Religion', color: '#EC4899' },
  { id: 'medieval europe', label: 'Medieval', color: '#8B5CF6' },
  { id: 'renaissance', label: 'Renaissance', color: '#06B6D4' },
  { id: 'enlightenment', label: 'Enlightenment', color: '#10B981' },
  { id: 'industrial revolution', label: 'Industrial', color: '#6366F1' },
  { id: 'world war', label: 'World Wars', color: '#EF4444' },
  { id: 'cold war', label: 'Cold War', color: '#64748B' },
  { id: 'modern era', label: 'Modern', color: '#3B82F6' },
];

interface HistoryTimelineScreenProps {
  navigation?: any;
}

const HistoryTimelineScreen: React.FC<HistoryTimelineScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { getHistoryTimeline, fallbackData } = useVisualReference();

  const [historyType, setHistoryType] = useState<HistoryType>('indian');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [indianData, setIndianData] = useState<TimelineEvent[]>(fallbackData.indianHistory);
  const [worldData, setWorldData] = useState<TimelineEvent[]>(fallbackData.worldHistory);

  const tabIndicatorPosition = useSharedValue(0);

  // Fetch data from API on mount
  React.useEffect(() => {
    const loadData = async () => {
      const indian = await getHistoryTimeline('indian');
      if (indian && indian.length > 0) {
        setIndianData(indian);
      }
      const world = await getHistoryTimeline('world');
      if (world && world.length > 0) {
        setWorldData(world);
      }
    };
    loadData();
  }, [getHistoryTimeline]);

  const currentData = useMemo(() => {
    return historyType === 'indian' ? indianData : worldData;
  }, [historyType, indianData, worldData]);

  const filteredData = useMemo(() => {
    let filtered = currentData;

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((item) =>
        item.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.event.toLowerCase().includes(query) ||
          item.year.toLowerCase().includes(query) ||
          item.details.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [currentData, selectedCategory, searchQuery]);

  const handleTabChange = (type: HistoryType) => {
    setHistoryType(type);
    setSelectedCategory(null);
    setSearchQuery('');
    tabIndicatorPosition.value = withSpring(type === 'indian' ? 0 : 1);
  };

  const handleItemPress = useCallback((item: TimelineEvent) => {
    setExpandedItem((prev) =>
      prev === `${item.year}-${item.event}` ? null : `${item.year}-${item.event}`
    );
  }, []);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: tabIndicatorPosition.value * (SCREEN_WIDTH / 2 - 16),
        },
      ],
    };
  });

  const currentFilters =
    historyType === 'indian' ? CATEGORY_FILTERS : WORLD_CATEGORY_FILTERS;

  const renderItem = useCallback(
    ({ item, index }: { item: TimelineEvent; index: number }) => (
      <TimelineItem
        item={item}
        index={index}
        onPress={handleItemPress}
        isExpanded={expandedItem === `${item.year}-${item.event}`}
      />
    ),
    [expandedItem, handleItemPress]
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Decorative Banner */}
      <LinearGradient
        colors={theme.gradients.header as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Ionicons name="time-outline" size={40} color="rgba(255,255,255,0.3)" />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>
            {historyType === 'indian' ? 'Indian History' : 'World History'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {filteredData.length} events • Swipe to explore
          </Text>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: theme.colors.surfaceSecondary },
        ]}
      >
        <Animated.View
          style={[
            styles.tabIndicator,
            animatedIndicatorStyle,
            { backgroundColor: theme.colors.primary },
          ]}
        />
        <Pressable
          style={styles.tabButton}
          onPress={() => handleTabChange('indian')}
        >
          <Ionicons
            name="flag"
            size={18}
            color={
              historyType === 'indian'
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  historyType === 'indian'
                    ? '#FFFFFF'
                    : theme.colors.textSecondary,
                fontWeight: historyType === 'indian' ? '600' : '500',
              },
            ]}
          >
            Indian
          </Text>
        </Pressable>
        <Pressable
          style={styles.tabButton}
          onPress={() => handleTabChange('world')}
        >
          <Ionicons
            name="globe"
            size={18}
            color={
              historyType === 'world'
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  historyType === 'world'
                    ? '#FFFFFF'
                    : theme.colors.textSecondary,
                fontWeight: historyType === 'world' ? '600' : '500',
              },
            ]}
          >
            World
          </Text>
        </Pressable>
      </View>

      {/* Category Filters */}
      <FilterChips
        filters={currentFilters}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="search-outline"
        size={48}
        color={theme.colors.textTertiary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
        No events found
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchHeader
        title="History Timeline"
        subtitle="Explore key historical events"
        searchPlaceholder="Search events, years, categories..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onBackPress={navigation?.goBack}
        showThemeToggle
        accentColor={theme.colors.history}
      />

      <FlatList
        ref={flatListRef}
        data={filteredData}
        keyExtractor={(item, index) => `${item.year}-${index}`}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    paddingBottom: 8,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  tabContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 4,
    marginBottom: 8,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    borderRadius: 14,
    left: 4,
    top: 4,
    bottom: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default HistoryTimelineScreen;

