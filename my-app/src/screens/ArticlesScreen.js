import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Added
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { SmartTextInput } from '../components/SmartTextInput'; // Added

import { MOBILE_API_URL } from '../config/api';

const FILTERS = {
  sources: ['TH', 'ET', 'PIB'],
  subjects: [
    'All',
    'Polity',
    'Economy',
    'Geography',
    'History',
    'Science & Technology',
    'Environment',
    'Current Affairs',
  ],
};

const SOURCE_LOGOS = {
  'TH': require('../../assets/logos/the_hindu.png'),
  'ET': require('../../assets/logos/economic_times.png'),
  'PIB': require('../../assets/logos/pib.png'),
};

export default function ArticlesScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding } = useWebStyles();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      // Use the date object directly, but format it for the API query
      // The API expects YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const fetchArticles = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let url = `${MOBILE_API_URL}/articles?page=${pageNum}&limit=20`;
      if (selectedSource) {
        url += `&source=${encodeURIComponent(selectedSource)}`;
      }
      if (selectedSubject !== 'All') {
        url += `&subject=${encodeURIComponent(selectedSubject)}`;
      }
      if (selectedDate) {
        url += `&date=${encodeURIComponent(selectedDate)}`;
      }

      console.log('Fetching articles URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      if (pageNum === 1) {
        setArticles(data.articles || []);
      } else {
        setArticles(prev => [...prev, ...(data.articles || [])]);
      }

      setHasMore(pageNum < (data.pagination?.totalPages || 1));
      setError(null);
    } catch (err) {
      setError('Failed to load articles. Please try again.');
      console.error('Fetch articles error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSource, selectedSubject, selectedDate]);

  useEffect(() => {
    setPage(1);
    fetchArticles(1);
  }, [selectedSource, selectedSubject, selectedDate]);

  const handleRefresh = () => {
    setPage(1);
    fetchArticles(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArticles(nextPage);
    }
  };

  const filteredArticles = articles.filter(article => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title?.toLowerCase().includes(query) ||
      article.summary?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderArticleCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.articleCard, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
    >
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          {item.gsPaper && (
            <View style={[styles.paperBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.paperBadgeText, { color: theme.colors.primary }]}>
                {item.gsPaper}
              </Text>
            </View>
          )}
          {item.subject && (
            <View style={[styles.subjectBadge, { backgroundColor: isDark ? '#4A4A52' : '#F0F0F5' }]}>
              <Text style={[styles.subjectBadgeText, { color: theme.colors.textSecondary }]}>
                {item.subject}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.articleTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.summary && (
          <Text style={[styles.articleSummary, { color: theme.colors.textSecondary }]} numberOfLines={3}>
            {item.summary}
          </Text>
        )}

        <View style={styles.articleFooter}>
          {item.author && (
            <View style={styles.authorInfo}>
              <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.authorText, { color: theme.colors.textSecondary }]}>
                {item.author}
              </Text>
            </View>
          )}
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}>
                <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.moreTagsText, { color: theme.colors.textSecondary }]}>
                +{item.tags.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.articleArrow}>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Articles Found</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {error || 'Check back later for new content'}
      </Text>
      {error && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || !loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding || 20 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Articles</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingHorizontal: horizontalPadding || 20 }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <SmartTextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search articles..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Source Buttons */}
      <View style={[styles.sourceButtonsContainer, { paddingHorizontal: horizontalPadding || 20 }]}>
        {FILTERS.sources.map((source) => (
          <TouchableOpacity
            key={source}
            style={[
              styles.sourceButtonItem,
              {
                backgroundColor: theme.colors.surface,
                borderColor: selectedSource === source ? theme.colors.primary : 'transparent',
                borderWidth: selectedSource === source ? 2 : 0,
              },
            ]}
            onPress={() => setSelectedSource(selectedSource === source ? null : source)}
          >
            <Image
              source={SOURCE_LOGOS[source]}
              style={[
                styles.sourceLogo,
                source === 'ET' && styles.sourceLogoET,
                { opacity: selectedSource === source ? 1 : 0.6 }
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Filter - Dropdown Style */}
      <View style={[styles.dateFilterContainer, { paddingHorizontal: horizontalPadding || 20 }]}>
        <View style={styles.dateFilterRow}>
          {Platform.OS === 'web' ? (
            <View style={[styles.dateDropdownButton, { backgroundColor: theme.colors.surface, paddingVertical: 8 }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
              {React.createElement('input', {
                type: 'date',
                value: selectedDate || '',
                onChange: (e) => {
                  const dateStr = e.target.value;
                  // e.target.value is YYYY-MM-DD
                  if (dateStr) {
                    setSelectedDate(dateStr);
                  } else {
                    setSelectedDate(null);
                  }
                },
                style: {
                  border: 'none',
                  background: 'transparent',
                  color: theme.colors.text,
                  fontSize: 15,
                  fontWeight: '500',
                  fontFamily: 'inherit',
                  outline: 'none',
                  flex: 1,
                  appearance: 'none', // Remove default web appearance if possible
                  minWidth: 120, // Ensure it has width
                  height: '100%',
                },
                placeholder: 'Select Date'
              })}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.dateDropdownButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.dateDropdownText, { color: theme.colors.text }]}>
                {selectedDate ? formatDate(selectedDate) : 'Select Date'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}

          {selectedDate && (
            <TouchableOpacity
              onPress={clearDateFilter}
              style={[styles.clearDateButton, { backgroundColor: theme.colors.surface }]}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {Platform.OS !== 'web' && showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate ? new Date(selectedDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()} // Cannot select future dates
          />
        )}
      </View>

      {/* Subject Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterScroll, { paddingHorizontal: horizontalPadding || 20 }]}
        >
          {FILTERS.subjects.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.filterChip,
                styles.subjectFilterChip,
                {
                  backgroundColor: selectedSubject === subject
                    ? (isDark ? '#4A4A52' : '#E5E5EA')
                    : 'transparent',
                  borderColor: isDark ? '#4A4A52' : '#E5E5EA',
                },
              ]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedSubject === subject ? theme.colors.text : theme.colors.textSecondary },
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Articles List */}
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading articles...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          renderItem={renderArticleCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            { paddingHorizontal: horizontalPadding || 20 },
            filteredArticles.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  searchContainer: {
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  sourceButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  sourceButtonItem: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    padding: 2,
  },
  sourceLogo: {
    width: '95%',
    height: '90%',
  },
  sourceLogoET: {
    width: '100%',
    height: '100%',
  },
  filtersContainer: {
    paddingVertical: 6,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subjectFilterChip: {
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateFilterContainer: {
    paddingVertical: 8,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
    // flex: 1, // Removed to fix width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateDropdownText: {
    // flex: 1, // Removed
    fontSize: 15,
    fontWeight: '500',
  },
  clearDateButton: {
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyList: {
    flex: 1,
  },
  articleCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  articleContent: {
    flex: 1,
  },
  articleHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  paperBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paperBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  articleSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: 13,
    fontWeight: '400',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '400',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    fontWeight: '500',
  },
  articleArrow: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
