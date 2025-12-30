import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
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
import { scienceTechReference } from '../../../../scienceTechReference';
import { useVisualReference } from '../../../context/VisualReferenceContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScienceTechViewScreenProps {
  navigation?: any;
}

const ScienceTechViewScreen: React.FC<ScienceTechViewScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useWebStyles();
  const { getReferences, fallbackData } = useVisualReference();
  const [searchQuery, setSearchQuery] = useState('');
  const [sciData, setSciData] = useState(fallbackData.scienceTech);

  // Fetch data from API on mount
  React.useEffect(() => {
    const loadData = async () => {
      const data = await getReferences('scienceTech');
      if (data) {
        setSciData(data);
      }
    };
    loadData();
  }, [getReferences]);

  const getMissionIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type.includes('Launch')) return 'rocket';
    if (type.includes('Lunar')) return 'moon';
    if (type.includes('Interplanetary') || type.includes('Solar')) return 'sunny';
    if (type.includes('Navigation')) return 'navigate';
    return 'planet';
  };

  const getMissionColor = (type: string): string => {
    if (type.includes('Launch')) return '#F97316';
    if (type.includes('Lunar')) return '#8B5CF6';
    if (type.includes('Interplanetary')) return '#EF4444';
    if (type.includes('Solar')) return '#F59E0B';
    if (type.includes('Navigation')) return '#3B82F6';
    return '#6366F1';
  };

  // Filter functions
  const filterBySearch = <T extends { name?: string; invention?: string }>(
    items: T[],
    query: string
  ): T[] => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter((item) => {
      const name = item.name || item.invention || '';
      return name.toLowerCase().includes(lowerQuery);
    });
  };

  const renderISROMissions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#6366F1', '#4F46E5'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="rocket" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ISRO Missions
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            India's space journey
          </Text>
        </View>
        <Text style={[styles.swipeHint, { color: theme.colors.textTertiary }]}>
          Swipe →
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.missionScrollContent}
        decelerationRate="fast"
      >
        {filterBySearch(sciData.isroMissions, searchQuery).map((mission, index) => (
          <Animated.View
            key={mission.name}
            entering={FadeInRight.delay(index * 60)}
            style={[
              styles.missionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <LinearGradient
              colors={[getMissionColor(mission.type), `${getMissionColor(mission.type)}CC`] as readonly [string, string, ...string[]]}
              style={styles.missionIconContainer}
            >
              <Ionicons
                name={getMissionIcon(mission.type)}
                size={24}
                color="#FFFFFF"
              />
            </LinearGradient>
            <View
              style={[
                styles.missionYearBadge,
                { backgroundColor: `${getMissionColor(mission.type)}15` },
              ]}
            >
              <Text
                style={[
                  styles.missionYearText,
                  { color: getMissionColor(mission.type) },
                ]}
              >
                {mission.year}
              </Text>
            </View>
            <Text
              style={[styles.missionName, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {mission.name}
            </Text>
            <Text
              style={[styles.missionType, { color: theme.colors.textSecondary }]}
            >
              {mission.type}
            </Text>
            <Text
              style={[styles.missionDesc, { color: theme.colors.textTertiary }]}
              numberOfLines={2}
            >
              {mission.description}
            </Text>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );

  const renderLaunchVehicles = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#F97316', '#EA580C'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="rocket" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Launch Vehicles
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            ISRO's rocket fleet
          </Text>
        </View>
      </View>

      {Object.entries(sciData.launchVehicles).map(([key, vehicle], index) => (
        <Animated.View
          key={key}
          entering={FadeIn.delay(index * 80)}
        >
          <ExpandableCard
            title={vehicle.fullName}
            subtitle={`${vehicle.stages} stages • First Launch: ${vehicle.firstLaunch}`}
            icon="rocket"
            iconColor="#F97316"
            initialExpanded={index === 0}
          >
            <View style={styles.vehicleContent}>
              <View style={styles.vehicleRow}>
                <View
                  style={[
                    styles.vehicleLabel,
                    { backgroundColor: theme.colors.economyBg },
                  ]}
                >
                  <Text
                    style={[styles.vehicleLabelText, { color: theme.colors.economy }]}
                  >
                    Payload
                  </Text>
                </View>
                <Text
                  style={[
                    styles.vehicleValue,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {vehicle.payloadCapacity}
                </Text>
              </View>
              <Text
                style={[
                  styles.vehicleDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {vehicle.description}
              </Text>
            </View>
          </ExpandableCard>
        </Animated.View>
      ))}
    </View>
  );

  const renderDNARNA = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#10B981', '#059669'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <MaterialCommunityIcons name="dna" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            DNA & RNA
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Building blocks of life
          </Text>
        </View>
      </View>

      <View style={styles.dnaContainer}>
        {/* DNA Card */}
        <View
          style={[
            styles.dnaCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8'] as readonly [string, string, ...string[]]}
            style={styles.dnaHeader}
          >
            <MaterialCommunityIcons name="dna" size={24} color="#FFFFFF" />
            <Text style={styles.dnaTitle}>DNA</Text>
          </LinearGradient>
          <View style={styles.dnaContent}>
            <Text style={[styles.dnaFullName, { color: theme.colors.text }]}>
              {sciData.dnaRnaBasics.DNA.fullName}
            </Text>
            <View style={styles.dnaRow}>
              <Text style={[styles.dnaLabel, { color: theme.colors.textSecondary }]}>
                Structure:
              </Text>
              <Text style={[styles.dnaValue, { color: theme.colors.text }]}>
                {sciData.dnaRnaBasics.DNA.structure}
              </Text>
            </View>
            <View style={styles.dnaRow}>
              <Text style={[styles.dnaLabel, { color: theme.colors.textSecondary }]}>
                Location:
              </Text>
              <Text style={[styles.dnaValue, { color: theme.colors.text }]}>
                {sciData.dnaRnaBasics.DNA.location}
              </Text>
            </View>
            <Text
              style={[styles.dnaBasesLabel, { color: theme.colors.textSecondary }]}
            >
              Bases:
            </Text>
            <View style={styles.basesContainer}>
              {sciData.dnaRnaBasics.DNA.bases.map((base, idx) => (
                <View
                  key={base}
                  style={[
                    styles.baseBadge,
                    { backgroundColor: theme.colors.polityBg },
                  ]}
                >
                  <Text style={[styles.baseText, { color: theme.colors.polity }]}>
                    {base[0]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* RNA Card */}
        <View
          style={[
            styles.dnaCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <LinearGradient
            colors={['#EC4899', '#DB2777'] as readonly [string, string, ...string[]]}
            style={styles.dnaHeader}
          >
            <MaterialCommunityIcons name="dna" size={24} color="#FFFFFF" />
            <Text style={styles.dnaTitle}>RNA</Text>
          </LinearGradient>
          <View style={styles.dnaContent}>
            <Text style={[styles.dnaFullName, { color: theme.colors.text }]}>
              {sciData.dnaRnaBasics.RNA.fullName}
            </Text>
            <View style={styles.dnaRow}>
              <Text style={[styles.dnaLabel, { color: theme.colors.textSecondary }]}>
                Structure:
              </Text>
              <Text style={[styles.dnaValue, { color: theme.colors.text }]}>
                {sciData.dnaRnaBasics.RNA.structure}
              </Text>
            </View>
            <View style={styles.dnaRow}>
              <Text style={[styles.dnaLabel, { color: theme.colors.textSecondary }]}>
                Types:
              </Text>
              <Text style={[styles.dnaValue, { color: theme.colors.text }]}>
                {sciData.dnaRnaBasics.RNA.types.join(', ')}
              </Text>
            </View>
            <Text
              style={[styles.dnaBasesLabel, { color: theme.colors.textSecondary }]}
            >
              Bases:
            </Text>
            <View style={styles.basesContainer}>
              {sciData.dnaRnaBasics.RNA.bases.map((base) => (
                <View
                  key={base}
                  style={[styles.baseBadge, { backgroundColor: '#FCE7F3' }]}
                >
                  <Text style={[styles.baseText, { color: '#EC4899' }]}>
                    {base[0]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderInventions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="bulb" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Important Inventions
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Timeline of discoveries
          </Text>
        </View>
      </View>

      <View style={styles.inventionsContainer}>
        {filterBySearch(sciData.importantInventions, searchQuery)
          .sort((a, b) => a.year - b.year)
          .map((item, index) => (
            <Animated.View
              key={item.invention}
              entering={FadeInUp.delay(index * 40)}
              style={styles.inventionRow}
            >
              {/* Timeline */}
              <View style={styles.inventionTimeline}>
                <View
                  style={[
                    styles.inventionDot,
                    { backgroundColor: theme.colors.scitech },
                  ]}
                />
                {index < sciData.importantInventions.length - 1 && (
                  <View
                    style={[
                      styles.inventionLine,
                      { backgroundColor: theme.colors.borderLight },
                    ]}
                  />
                )}
              </View>

              {/* Card */}
              <View
                style={[
                  styles.inventionCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.inventionHeader}>
                  <Text
                    style={[styles.inventionName, { color: theme.colors.text }]}
                  >
                    {item.invention}
                  </Text>
                  <View
                    style={[
                      styles.inventionYearBadge,
                      { backgroundColor: theme.colors.scitechBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.inventionYearText,
                        { color: theme.colors.scitech },
                      ]}
                    >
                      {item.year}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.inventionInventor,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.inventor} • {item.country}
                </Text>
              </View>
            </Animated.View>
          ))}
      </View>
    </View>
  );

  const renderIndianScientists = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#F59E0B', '#D97706'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Indian Scientists
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Pioneers of science
          </Text>
        </View>
      </View>

      <View style={styles.scientistsGrid}>
        {filterBySearch(sciData.indianScientists, searchQuery).map(
          (scientist, index) => (
            <Animated.View
              key={scientist.name}
              entering={FadeIn.delay(index * 60)}
              style={[
                styles.scientistCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706'] as readonly [string, string, ...string[]]}
                style={styles.scientistAvatar}
              >
                <Text style={styles.scientistInitial}>
                  {scientist.name[0]}
                </Text>
              </LinearGradient>
              <Text
                style={[styles.scientistName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {scientist.name}
              </Text>
              <View
                style={[
                  styles.scientistFieldBadge,
                  { backgroundColor: theme.colors.historyBg },
                ]}
              >
                <Text
                  style={[
                    styles.scientistFieldText,
                    { color: theme.colors.history },
                  ]}
                >
                  {scientist.field}
                </Text>
              </View>
              <Text
                style={[
                  styles.scientistAchievement,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={3}
              >
                {scientist.achievement}
              </Text>
            </Animated.View>
          )
        )}
      </View>
    </View>
  );

  const renderDefenseTech = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#64748B', '#475569'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="shield" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Defence Technology
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Indigenous systems
          </Text>
        </View>
      </View>

      <ExpandableCard
        title="Missile Systems"
        subtitle={`${sciData.defenseTechnology.missiles.length} major systems`}
        icon="flash"
        iconColor="#EF4444"
        initialExpanded
      >
        {sciData.defenseTechnology.missiles.map((missile, index) => (
          <View
            key={missile.name}
            style={[
              styles.missileItem,
              { borderBottomColor: theme.colors.borderLight },
              index === sciData.defenseTechnology.missiles.length - 1 &&
                styles.lastItem,
            ]}
          >
            <View style={styles.missileHeader}>
              <View
                style={[
                  styles.missileDot,
                  { backgroundColor: '#EF4444' },
                ]}
              />
              <Text
                style={[styles.missileName, { color: theme.colors.text }]}
              >
                {missile.name}
              </Text>
              <View
                style={[
                  styles.missileTypeBadge,
                  { backgroundColor: theme.colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.missileTypeText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {missile.type}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.missileRange,
                { color: theme.colors.textTertiary },
              ]}
            >
              Range: {missile.range}
              {missile.note && ` • ${missile.note}`}
            </Text>
          </View>
        ))}
      </ExpandableCard>

      <ExpandableCard
        title="Aircraft Systems"
        subtitle={`${sciData.defenseTechnology.aircraft.length} major platforms`}
        icon="airplane"
        iconColor="#3B82F6"
      >
        {sciData.defenseTechnology.aircraft.map((aircraft, index) => (
          <View
            key={aircraft.name}
            style={[
              styles.missileItem,
              { borderBottomColor: theme.colors.borderLight },
              index === sciData.defenseTechnology.aircraft.length - 1 &&
                styles.lastItem,
            ]}
          >
            <View style={styles.missileHeader}>
              <Ionicons name="airplane" size={16} color="#3B82F6" />
              <Text
                style={[styles.missileName, { color: theme.colors.text, marginLeft: 8 }]}
              >
                {aircraft.name}
              </Text>
            </View>
            <Text
              style={[
                styles.missileRange,
                { color: theme.colors.textTertiary },
              ]}
            >
              {aircraft.type} • {aircraft.manufacturer || aircraft.status}
            </Text>
          </View>
        ))}
      </ExpandableCard>
    </View>
  );

  const renderEmergingTech = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#06B6D4', '#0891B2'] as readonly [string, string, ...string[]]}
          style={styles.sectionIconContainer}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Emerging Technologies
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Future innovations
          </Text>
        </View>
      </View>

      <View style={styles.emergingGrid}>
        {sciData.emergingTechnologies.map((tech, index) => (
          <Animated.View
            key={tech.name}
            entering={FadeIn.delay(index * 50)}
            style={[
              styles.emergingCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <LinearGradient
              colors={['#06B6D4', '#0891B2'] as readonly [string, string, ...string[]]}
              style={styles.emergingIcon}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[styles.emergingName, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {tech.name}
            </Text>
            <Text
              style={[
                styles.emergingDesc,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {tech.description}
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchHeader
        title="Science & Technology"
        subtitle="Innovation & discovery"
        searchPlaceholder="Search missions, inventions..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onBackPress={navigation?.goBack}
        showThemeToggle
        accentColor={theme.colors.scitech}
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
          colors={theme.gradients.scitech as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="rocket" size={40} color="rgba(255,255,255,0.3)" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Science & Technology</Text>
              <Text style={styles.bannerSubtitle}>
                Space, defence, biotech & more
              </Text>
            </View>
          </View>
        </LinearGradient>

        {renderISROMissions()}
        {renderLaunchVehicles()}
        {renderDNARNA()}
        {renderInventions()}
        {renderIndianScientists()}
        {renderDefenseTech()}
        {renderEmergingTech()}
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
  swipeHint: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  missionScrollContent: {
    paddingRight: 16,
  },
  missionCard: {
    width: 160,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  missionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  missionYearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  missionYearText: {
    fontSize: 12,
    fontWeight: '700',
  },
  missionName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  missionType: {
    fontSize: 11,
    marginBottom: 6,
  },
  missionDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  vehicleContent: {
    gap: 10,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vehicleLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  vehicleValue: {
    fontSize: 12,
    flex: 1,
  },
  vehicleDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  dnaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dnaCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dnaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  dnaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dnaContent: {
    padding: 12,
  },
  dnaFullName: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 10,
  },
  dnaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dnaLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  dnaValue: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  dnaBasesLabel: {
    fontSize: 11,
    marginTop: 6,
    marginBottom: 6,
  },
  basesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  baseBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inventionsContainer: {
    marginLeft: 8,
  },
  inventionRow: {
    flexDirection: 'row',
  },
  inventionTimeline: {
    width: 20,
    alignItems: 'center',
  },
  inventionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  inventionLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  inventionCard: {
    flex: 1,
    marginLeft: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inventionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inventionName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  inventionYearBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  inventionYearText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inventionInventor: {
    fontSize: 12,
  },
  scientistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scientistCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  scientistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scientistInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scientistName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  scientistFieldBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  scientistFieldText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scientistAchievement: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  missileItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  missileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  missileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  missileName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  missileTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  missileTypeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  missileRange: {
    fontSize: 12,
    marginLeft: 18,
  },
  emergingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emergingCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emergingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emergingName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  emergingDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});

export default ScienceTechViewScreen;

