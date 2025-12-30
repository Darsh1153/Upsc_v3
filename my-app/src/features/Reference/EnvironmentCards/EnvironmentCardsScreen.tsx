import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import ExpandableCard from '../components/ExpandableCard';
import SearchHeader from '../components/SearchHeader';
import { useWebStyles } from '../../../components/WebContainer';

// Import data
import { environmentReference } from '../../../../environmentReference';
import { useVisualReference } from '../../../context/VisualReferenceContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnvironmentCardsScreenProps {
  navigation?: any;
}

const EnvironmentCardsScreen: React.FC<EnvironmentCardsScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useWebStyles();
  const { getReferences, fallbackData } = useVisualReference();
  const [searchQuery, setSearchQuery] = useState('');
  const [envData, setEnvData] = useState(fallbackData.environment);

  // Fetch data from API on mount
  React.useEffect(() => {
    const loadData = async () => {
      const data = await getReferences('environment');
      if (data) {
        setEnvData(data);
      }
    };
    loadData();
  }, [getReferences]);

  // Filter items based on search
  const filterItems = (items: string[], query: string): string[] => {
    if (!query.trim()) return items;
    return items.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
  };

  const renderBiodiversityHotspots = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#22C55E', '#16A34A'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="leaf" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Biodiversity Hotspots
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Areas with high species diversity
          </Text>
        </View>
      </View>

      {/* India Hotspots */}
      <View
        style={[
          styles.hotspotsCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.hotspotsHeader}>
          <Text style={[styles.hotspotsTitle, { color: theme.colors.text }]}>
            🇮🇳 Indian Hotspots
          </Text>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: theme.colors.environmentBg },
            ]}
          >
            <Text style={[styles.countText, { color: theme.colors.environment }]}>
              {envData.biodiversityHotspots.india.length}
            </Text>
          </View>
        </View>
        <View style={styles.hotspotsGrid}>
          {filterItems(envData.biodiversityHotspots.india, searchQuery).map(
            (hotspot, index) => (
              <Animated.View
                key={hotspot}
                entering={FadeInUp.delay(index * 100)}
                style={[
                  styles.hotspotItem,
                  { backgroundColor: theme.colors.environmentBg },
                ]}
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A'] as readonly [string, string, ...string[]]}
                  style={styles.hotspotIcon}
                >
                  <Ionicons name="location" size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text
                  style={[styles.hotspotText, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {hotspot}
                </Text>
              </Animated.View>
            )
          )}
        </View>
      </View>

      {/* World Hotspots */}
      <ExpandableCard
        title="World Hotspots"
        subtitle={`${envData.biodiversityHotspots.world.length} major regions`}
        icon="globe"
        iconColor={theme.colors.environment}
      >
        <View style={styles.chipContainer}>
          {filterItems(envData.biodiversityHotspots.world, searchQuery).map(
            (hotspot, index) => (
              <View
                key={hotspot}
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.environmentBg },
                ]}
              >
                <Ionicons name="leaf" size={12} color={theme.colors.environment} />
                <Text
                  style={[styles.chipText, { color: theme.colors.environment }]}
                >
                  {hotspot}
                </Text>
              </View>
            )
          )}
        </View>
      </ExpandableCard>
    </View>
  );

  const renderProtectedAreas = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#10B981', '#059669'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Protected Areas
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Conservation categories
          </Text>
        </View>
      </View>

      {/* India Categories */}
      <ExpandableCard
        title="Indian Categories"
        subtitle={`${envData.protectedAreaCategories.india.length} types`}
        icon="flag"
        iconColor={theme.colors.environment}
        initialExpanded
      >
        {filterItems(envData.protectedAreaCategories.india, searchQuery).map(
          (category, index) => (
            <Animated.View
              key={category}
              entering={FadeIn.delay(index * 50)}
              style={[
                styles.protectedItem,
                { borderBottomColor: theme.colors.borderLight },
                index === envData.protectedAreaCategories.india.length - 1 &&
                  styles.lastItem,
              ]}
            >
              <View
                style={[
                  styles.protectedNumber,
                  { backgroundColor: theme.colors.environmentBg },
                ]}
              >
                <Text
                  style={[
                    styles.protectedNumberText,
                    { color: theme.colors.environment },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.protectedText, { color: theme.colors.text }]}>
                {category}
              </Text>
            </Animated.View>
          )
        )}
      </ExpandableCard>

      {/* IUCN Categories */}
      <ExpandableCard
        title="IUCN Categories"
        subtitle="International classification"
        icon="globe"
        iconColor="#0EA5E9"
      >
        {Object.entries(envData.protectedAreaCategories.iucnCategories).map(
          ([key, value], index) => (
            <View
              key={key}
              style={[
                styles.iucnItem,
                { borderBottomColor: theme.colors.borderLight },
                index ===
                  Object.entries(envData.protectedAreaCategories.iucnCategories)
                    .length -
                    1 && styles.lastItem,
              ]}
            >
              <View style={[styles.iucnBadge, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.iucnBadgeText, { color: '#0EA5E9' }]}>
                  {key}
                </Text>
              </View>
              <Text
                style={[styles.iucnText, { color: theme.colors.textSecondary }]}
              >
                {value}
              </Text>
            </View>
          )
        )}
      </ExpandableCard>
    </View>
  );

  const renderEcologicalConcepts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#34D399', '#10B981'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="git-network" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Ecological Concepts
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Food chains & cycles
          </Text>
        </View>
      </View>

      {/* Food Chain/Web */}
      <View style={styles.conceptCards}>
        <View
          style={[
            styles.conceptCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A'] as readonly [string, string, ...string[]]}
            style={styles.conceptIcon}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.conceptTitle, { color: theme.colors.text }]}>
            Food Chain
          </Text>
          <Text
            style={[styles.conceptDesc, { color: theme.colors.textSecondary }]}
            numberOfLines={4}
          >
            {envData.foodChainFoodWeb.foodChain}
          </Text>
        </View>

        <View
          style={[
            styles.conceptCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <LinearGradient
            colors={['#10B981', '#059669'] as readonly [string, string, ...string[]]}
            style={styles.conceptIcon}
          >
            <Ionicons name="git-network" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.conceptTitle, { color: theme.colors.text }]}>
            Food Web
          </Text>
          <Text
            style={[styles.conceptDesc, { color: theme.colors.textSecondary }]}
            numberOfLines={4}
          >
            {envData.foodChainFoodWeb.foodWeb}
          </Text>
        </View>
      </View>

      {/* Biogeochemical Cycles */}
      <ExpandableCard
        title="Biogeochemical Cycles"
        subtitle="Nutrient cycling in nature"
        icon="sync"
        iconColor={theme.colors.environment}
      >
        <View style={styles.cycleContainer}>
          <View
            style={[
              styles.cycleCard,
              { backgroundColor: theme.colors.surfaceSecondary },
            ]}
          >
            <View style={styles.cycleHeader}>
              <View style={[styles.cycleDot, { backgroundColor: '#64748B' }]} />
              <Text style={[styles.cycleTitle, { color: theme.colors.text }]}>
                Carbon Cycle
              </Text>
            </View>
            <Text
              style={[styles.cycleDesc, { color: theme.colors.textSecondary }]}
            >
              {envData.biogeochemicalCycles.carbonCycle}
            </Text>
          </View>

          <View
            style={[
              styles.cycleCard,
              { backgroundColor: theme.colors.surfaceSecondary },
            ]}
          >
            <View style={styles.cycleHeader}>
              <View style={[styles.cycleDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={[styles.cycleTitle, { color: theme.colors.text }]}>
                Nitrogen Cycle
              </Text>
            </View>
            <Text
              style={[styles.cycleDesc, { color: theme.colors.textSecondary }]}
            >
              {envData.biogeochemicalCycles.nitrogenCycle}
            </Text>
          </View>
        </View>
      </ExpandableCard>
    </View>
  );

  const renderPollution = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#F59E0B', '#D97706'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="warning" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Types of Pollution
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Environmental degradation
          </Text>
        </View>
      </View>

      <View style={styles.pollutionGrid}>
        {filterItems(envData.pollutionTypes, searchQuery).map(
          (pollution, index) => {
            const getPollutionIcon = (type: string) => {
              if (type.includes('Air')) return 'cloud';
              if (type.includes('Water')) return 'water';
              if (type.includes('Soil')) return 'earth';
              if (type.includes('Noise')) return 'volume-high';
              if (type.includes('Thermal')) return 'thermometer';
              if (type.includes('Radio')) return 'nuclear';
              if (type.includes('Light')) return 'bulb';
              if (type.includes('Plastic')) return 'bag';
              if (type.includes('E-Waste')) return 'phone-portrait';
              return 'alert-circle';
            };

            const getPollutionColor = (type: string) => {
              if (type.includes('Air')) return '#64748B';
              if (type.includes('Water')) return '#0EA5E9';
              if (type.includes('Soil')) return '#78716C';
              if (type.includes('Noise')) return '#8B5CF6';
              if (type.includes('Thermal')) return '#EF4444';
              if (type.includes('Radio')) return '#F59E0B';
              if (type.includes('Light')) return '#FBBF24';
              if (type.includes('Plastic')) return '#EC4899';
              if (type.includes('E-Waste')) return '#6366F1';
              return '#F97316';
            };

            return (
              <Animated.View
                key={pollution}
                entering={FadeIn.delay(index * 50)}
                style={[
                  styles.pollutionCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.pollutionIcon,
                    { backgroundColor: `${getPollutionColor(pollution)}15` },
                  ]}
                >
                  <Ionicons
                    name={getPollutionIcon(pollution) as any}
                    size={20}
                    color={getPollutionColor(pollution)}
                  />
                </View>
                <Text
                  style={[styles.pollutionText, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {pollution}
                </Text>
              </Animated.View>
            );
          }
        )}
      </View>
    </View>
  );

  const renderTreaties = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="document-text" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Environmental Treaties
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            International agreements
          </Text>
        </View>
      </View>

      <View style={styles.treatiesContainer}>
        {filterItems(envData.majorEnvironmentalTreaties, searchQuery).map(
          (treaty, index) => (
            <Animated.View
              key={treaty}
              entering={FadeInUp.delay(index * 60)}
              style={styles.treatyRow}
            >
              {/* Timeline connector */}
              <View style={styles.treatyTimeline}>
                <View
                  style={[
                    styles.treatyDot,
                    { backgroundColor: theme.colors.environment },
                  ]}
                />
                {index < envData.majorEnvironmentalTreaties.length - 1 && (
                  <View
                    style={[
                      styles.treatyLine,
                      { backgroundColor: theme.colors.borderLight },
                    ]}
                  />
                )}
              </View>

              {/* Treaty Card */}
              <View
                style={[
                  styles.treatyCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.treatyContent}>
                  <Text
                    style={[styles.treatyText, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {treaty}
                  </Text>
                </View>
                <View
                  style={[
                    styles.treatyNumber,
                    { backgroundColor: theme.colors.environmentBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.treatyNumberText,
                      { color: theme.colors.environment },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchHeader
        title="Environment"
        subtitle="Ecology & conservation"
        searchPlaceholder="Search environmental topics..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onBackPress={navigation?.goBack}
        showThemeToggle
        accentColor={theme.colors.environment}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20, paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Banner */}
        <LinearGradient
          colors={theme.gradients.environment as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="leaf" size={40} color="rgba(255,255,255,0.3)" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Environment & Ecology</Text>
              <Text style={styles.bannerSubtitle}>
                Biodiversity, conservation & sustainability
              </Text>
            </View>
          </View>
        </LinearGradient>

        {renderBiodiversityHotspots()}
        {renderProtectedAreas()}
        {renderEcologicalConcepts()}
        {renderPollution()}
        {renderTreaties()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  banner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  hotspotsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  hotspotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  hotspotsTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hotspotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hotspotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 10,
    width: (SCREEN_WIDTH - 74) / 2,
  },
  hotspotIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  protectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  protectedNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectedNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  protectedText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  iucnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  iucnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  iucnBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iucnText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  conceptCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  conceptCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  conceptIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  conceptTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  conceptDesc: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  cycleContainer: {
    gap: 12,
  },
  cycleCard: {
    padding: 14,
    borderRadius: 12,
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cycleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cycleTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cycleDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  pollutionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pollutionCard: {
    width: (SCREEN_WIDTH - 52) / 3,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  pollutionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pollutionText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  treatiesContainer: {
    marginLeft: 8,
  },
  treatyRow: {
    flexDirection: 'row',
  },
  treatyTimeline: {
    width: 20,
    alignItems: 'center',
  },
  treatyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  treatyLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  treatyCard: {
    flex: 1,
    marginLeft: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  treatyContent: {
    flex: 1,
  },
  treatyText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  treatyNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  treatyNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default EnvironmentCardsScreen;

