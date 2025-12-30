import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './theme/ThemeContext';
import { useWebStyles } from '../../components/WebContainer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReferenceScreenProps {
  navigation: any;
}

interface ModuleCard {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: readonly string[];
  screen: string;
  count?: string;
}

const MODULES: ModuleCard[] = [
  {
    id: 'history',
    title: 'History Timeline',
    subtitle: 'Indian & World History',
    icon: 'time',
    gradientColors: ['#F59E0B', '#D97706'],
    screen: 'HistoryTimeline',
    count: '200+ events',
  },
  {
    id: 'polity',
    title: 'Polity Hierarchy',
    subtitle: 'Constitution & Governance',
    icon: 'library',
    gradientColors: ['#3B82F6', '#1D4ED8'],
    screen: 'PolityFlow',
    count: '50+ nodes',
  },
  {
    id: 'geography',
    title: 'Geography',
    subtitle: 'Physical Features & Maps',
    icon: 'earth',
    gradientColors: ['#10B981', '#059669'],
    screen: 'GeographyView',
    count: '100+ features',
  },
  {
    id: 'economy',
    title: 'Economy',
    subtitle: 'Concepts & Indicators',
    icon: 'stats-chart',
    gradientColors: ['#F97316', '#EA580C'],
    screen: 'EconomyCards',
    count: '40+ concepts',
  },
  {
    id: 'environment',
    title: 'Environment',
    subtitle: 'Ecology & Conservation',
    icon: 'leaf',
    gradientColors: ['#22C55E', '#16A34A'],
    screen: 'EnvironmentCards',
    count: '30+ topics',
  },
  {
    id: 'scitech',
    title: 'Science & Tech',
    subtitle: 'ISRO, Defence & Biotech',
    icon: 'rocket',
    gradientColors: ['#6366F1', '#4F46E5'],
    screen: 'ScienceTechView',
    count: '50+ items',
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ModuleCardComponentProps {
  module: ModuleCard;
  index: number;
  onPress: () => void;
}

const ModuleCardComponent: React.FC<ModuleCardComponentProps> = ({
  module,
  index,
  onPress,
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

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).springify()}>
      <AnimatedPressable
        style={[
          styles.moduleCard,
          animatedStyle,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={module.gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.moduleIconContainer}
        >
          <Ionicons name={module.icon} size={28} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.moduleContent}>
          <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
            {module.title}
          </Text>
          <Text
            style={[styles.moduleSubtitle, { color: theme.colors.textSecondary }]}
          >
            {module.subtitle}
          </Text>
          {module.count && (
            <View
              style={[
                styles.moduleCountBadge,
                { backgroundColor: `${module.gradientColors[0]}15` },
              ]}
            >
              <Text
                style={[
                  styles.moduleCountText,
                  { color: module.gradientColors[0] },
                ]}
              >
                {module.count}
              </Text>
            </View>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textTertiary}
        />
      </AnimatedPressable>
    </Animated.View>
  );
};

const ReferenceScreen: React.FC<ReferenceScreenProps> = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isWeb } = useWebStyles();

  const handleModulePress = (screen: string) => {
    navigation.navigate(screen);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top + 8,
            borderBottomColor: theme.colors.borderLight,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Pressable
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.surfaceSecondary },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Visual Reference
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
            >
              Interactive study materials
            </Text>
          </View>

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
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={theme.gradients.header as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconsRow}>
              <Ionicons name="book" size={24} color="rgba(255,255,255,0.3)" />
              <Ionicons name="school" size={28} color="rgba(255,255,255,0.5)" />
              <Ionicons name="ribbon" size={24} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.heroTitle}>UPSC Visual Reference</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
            <Text style={styles.heroSubtitle}>
              Interactive timelines, flowcharts, and infographics for effective
              learning
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>6</Text>
                <Text style={styles.heroStatLabel}>Modules</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>400+</Text>
                <Text style={styles.heroStatLabel}>Items</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>∞</Text>
                <Text style={styles.heroStatLabel}>Learning</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Ionicons name="grid" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Study Modules
          </Text>
        </View>

        {/* Module Cards */}
        {MODULES.map((module, index) => (
          <ModuleCardComponent
            key={module.id}
            module={module}
            index={index}
            onPress={() => handleModulePress(module.screen)}
          />
        ))}

        {/* Tips Section */}
        <View
          style={[
            styles.tipsCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderLight,
            },
          ]}
        >
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
              Study Tips
            </Text>
          </View>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • Use timelines to understand chronological order of events
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • Expand flowchart nodes to see detailed information
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • Use search to quickly find specific topics
          </Text>
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            • Toggle dark mode for comfortable night study
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  heroBanner: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  moduleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  moduleSubtitle: {
    fontSize: 13,
    marginBottom: 6,
  },
  moduleCountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  moduleCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tipsCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 22,
  },
});

export default ReferenceScreen;

