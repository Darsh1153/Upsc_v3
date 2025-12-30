import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { getStats, getStreak, getTestHistory } from '../utils/storage';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';

const screenWidth = Dimensions.get('window').width - 40;

export default function ProgressScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    const [statsData, streakData, historyData] = await Promise.all([
      getStats(),
      getStreak(),
      getTestHistory(),
    ]);
    setStats(statsData);
    setStreak(streakData);
    setHistory(historyData);
    setLoading(false);
  };

  const getWeeklyChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(days[date.getDay()]);
      
      const dayData = stats?.weeklyData?.find(d => d.date === dateStr);
      data.push(dayData?.avgScore || 0);
    }

    return {
      labels,
      datasets: [{ data: data.length ? data : [0, 0, 0, 0, 0, 0, 0] }],
    };
  };

  const getTopicChartData = () => {
    if (!stats?.topicStats || Object.keys(stats.topicStats).length === 0) {
      return [
        { name: 'No Data', count: 1, color: isDark ? '#475569' : '#E5E5EA', legendFontColor: isDark ? '#94A3B8' : '#8E8E93' },
      ];
    }

    const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5856D6'];
    const topics = Object.entries(stats.topicStats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);

    return topics.map(([name, data], index) => ({
      name: name.length > 12 ? name.substring(0, 12) + '...' : name,
      count: data.total,
      color: colors[index % colors.length],
      legendFontColor: isDark ? '#F8FAFC' : '#1C1C1E',
      legendFontSize: 12,
    }));
  };

  const getAccuracyByTopic = () => {
    if (!stats?.topicStats || Object.keys(stats.topicStats).length === 0) {
      return { labels: ['No Data'], datasets: [{ data: [0] }] };
    }

    const topics = Object.entries(stats.topicStats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);

    return {
      labels: topics.map(([name]) => name.substring(0, 8)),
      datasets: [{
        data: topics.map(([, data]) => 
          data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
        ),
      }],
    };
  };

  const avgScore = stats?.totalQuestions > 0 
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
    : 0;

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => isDark ? `rgba(129, 140, 248, ${opacity})` : `rgba(0, 122, 255, ${opacity})`,
    labelColor: () => theme.colors.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 11,
      fontWeight: '500',
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Your Progress</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Track your UPSC preparation journey</Text>
        </View>

        {/* Streak Card */}
        <View style={[styles.streakCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.streakMain}>
            <Ionicons name="flame" size={32} color="#FF9500" />
            <View style={styles.streakInfo}>
              <Text style={[styles.streakNumber, { color: theme.colors.text }]}>{streak?.currentStreak || 0}</Text>
              <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>Day Streak</Text>
            </View>
          </View>
          <View style={[styles.streakStats, { borderTopColor: theme.colors.border }]}>
            <View style={styles.streakStatItem}>
              <Text style={[styles.streakStatNum, { color: theme.colors.text }]}>{streak?.longestStreak || 0}</Text>
              <Text style={[styles.streakStatLabel, { color: theme.colors.textSecondary }]}>Best Streak</Text>
            </View>
            <View style={[styles.streakDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.streakStatItem}>
              <Text style={[styles.streakStatNum, { color: theme.colors.text }]}>{streak?.activeDays?.length || 0}</Text>
              <Text style={[styles.streakStatLabel, { color: theme.colors.textSecondary }]}>Active Days</Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.totalTests || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tests Taken</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.warning} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.totalQuestions || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Questions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats?.correctAnswers || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Correct</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="analytics-outline" size={24} color={theme.colors.secondary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{avgScore}%</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Accuracy</Text>
          </View>
        </View>

        {/* Weekly Performance Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Weekly Performance</Text>
          <Text style={[styles.chartSubtitle, { color: theme.colors.textSecondary }]}>Average score per day</Text>
          <LineChart
            data={getWeeklyChartData()}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withDots={true}
            withShadow={false}
            yAxisSuffix="%"
            fromZero
          />
        </View>

        {/* Topic Distribution */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Topics Practiced</Text>
          <Text style={[styles.chartSubtitle, { color: theme.colors.textSecondary }]}>Questions by subject</Text>
          <PieChart
            data={getTopicChartData()}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Accuracy by Topic */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Accuracy by Topic</Text>
          <Text style={[styles.chartSubtitle, { color: theme.colors.textSecondary }]}>Your strongest subjects</Text>
          <BarChart
            data={getAccuracyByTopic()}
            width={screenWidth - 32}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
            }}
            style={styles.chart}
            withInnerLines={false}
            showValuesOnTopOfBars
            fromZero
            yAxisSuffix="%"
          />
        </View>

        {/* Recent Tests */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Tests</Text>
          {history.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>No tests taken yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Start practicing to see your history</Text>
            </View>
          ) : (
            history.slice(0, 5).map((test, index) => (
              <View key={test.id || index} style={[styles.historyCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.historyLeft}>
                  <Text style={[styles.historyDate, { color: theme.colors.text }]}>
                    {new Date(test.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Text style={[styles.historyTime, { color: theme.colors.textSecondary }]}>
                    {new Date(test.date).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.historyMiddle}>
                  <Text style={[styles.historyQuestions, { color: theme.colors.text }]}>
                    {test.correctCount}/{test.questionsCount} correct
                  </Text>
                  <Text style={[styles.historyDuration, { color: theme.colors.textSecondary }]}>
                    {Math.floor(test.timeTaken / 60)}m {test.timeTaken % 60}s
                  </Text>
                </View>
                <View style={[
                  styles.historyScore,
                  test.score >= 70 ? { backgroundColor: isDark ? '#064E3B' : '#E8F8ED' } : 
                  test.score >= 40 ? { backgroundColor: isDark ? '#451A03' : '#FFF3E0' } : { backgroundColor: isDark ? '#7F1D1D' : '#FFE5E5' }
                ]}>
                  <Text style={[styles.historyScoreText, { color: theme.colors.text }]}>{test.score}%</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Time Stats */}
        <View style={[styles.timeCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="time-outline" size={40} color={theme.colors.primary} />
          <View style={styles.timeInfo}>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Total Study Time</Text>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>
              {Math.floor((stats?.totalTimeSpent || 0) / 3600)}h{' '}
              {Math.floor(((stats?.totalTimeSpent || 0) % 3600) / 60)}m
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  streakCard: {
    backgroundColor: '#FF9500',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakFire: {
    fontSize: 48,
    marginRight: 16,
  },
  streakInfo: {},
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: -0.3,
  },
  streakStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  streakStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakStatNum: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakStatLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  chartSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  recentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  historyLeft: {
    marginRight: 14,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  historyTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  historyMiddle: {
    flex: 1,
  },
  historyQuestions: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  historyDuration: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  historyScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreGood: {
    backgroundColor: '#E8F8ED',
  },
  scoreOk: {
    backgroundColor: '#FFF3E0',
  },
  scoreBad: {
    backgroundColor: '#FFE5E5',
  },
  historyScoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  timeIconWrapper: {
    marginRight: 16,
  },
  timeInfo: {},
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginTop: 2,
  },
});

