import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ExpandableCard from './ExpandableCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Detect section type from data
export const detectSectionType = (key: string, data: any): string => {
  if (Array.isArray(data)) {
    if (data.length === 0) return 'simpleList';
    const first = data[0];
    if (typeof first === 'string') return 'simpleList';
    if (first.plan && first.focus) return 'plansList';
    if (first.year && first.type && first.description) return 'missionsList';
    if (first.field && first.achievement) return 'scientistsList';
    if (first.name && first.description && !first.year) return 'technologyList';
    return 'objectList';
  }
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 0) return 'keyValue';
    const firstVal = data[keys[0]];
    if (typeof firstVal === 'string') return 'keyValue';
    if (Array.isArray(firstVal) && (firstVal.length === 0 || typeof firstVal[0] === 'string')) return 'nestedLists';
    if (firstVal?.fullName !== undefined) return 'vehiclesList';
    if (data.missiles) return 'missilesList';
    return 'nestedObject';
  }
  return 'unknown';
};

// Format key to readable title
export const formatKeyToTitle = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
};

// Get accent color based on category
export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'economy': return '#10B981';
    case 'polity': return '#3B82F6';
    case 'geography': return '#F59E0B';
    case 'environment': return '#22C55E';
    case 'scienceTech': return '#8B5CF6';
    default: return '#6366F1';
  }
};

interface DynamicSectionProps {
  sectionKey: string;
  data: any;
  theme: any;
  accentColor?: string;
  searchQuery?: string;
}

// Simple List Renderer
const SimpleListSection: React.FC<{ data: string[]; theme: any; accentColor: string; title: string }> = ({
  data,
  theme,
  accentColor,
  title,
}) => {
  const getItemColor = (index: number): string => {
    const colors = ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="list" size={20} color={accentColor} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.swipeHint, { color: theme.colors.textTertiary }]}>Swipe →</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {data.map((item, index) => (
          <Animated.View
            key={`${item}-${index}`}
            entering={FadeInRight.delay(index * 60)}
            style={[styles.listCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <LinearGradient
              colors={[getItemColor(index), `${getItemColor(index)}CC`] as readonly [string, string, ...string[]]}
              style={styles.listIconContainer}
            >
              <Text style={styles.listIconText}>{index + 1}</Text>
            </LinearGradient>
            <Text style={[styles.listItemText, { color: theme.colors.text }]} numberOfLines={2}>
              {item}
            </Text>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

// Key-Value Renderer
const KeyValueSection: React.FC<{ data: Record<string, string>; theme: any; accentColor: string; title: string }> = ({
  data,
  theme,
  accentColor,
  title,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name="book" size={20} color={accentColor} />
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
    <View style={styles.kvContainer}>
      {Object.entries(data).map(([key, value], index) => (
        <Animated.View
          key={key}
          entering={FadeIn.delay(index * 50)}
          style={[styles.kvCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={[styles.kvBadge, { backgroundColor: `${accentColor}15` }]}>
            <Text style={[styles.kvBadgeText, { color: accentColor }]}>
              {formatKeyToTitle(key)}
            </Text>
          </View>
          <Text style={[styles.kvValue, { color: theme.colors.textSecondary }]} numberOfLines={4}>
            {value}
          </Text>
        </Animated.View>
      ))}
    </View>
  </View>
);

// Plans List Renderer
const PlansSection: React.FC<{ data: Array<{plan: string; focus: string}>; theme: any; accentColor: string; title: string }> = ({
  data,
  theme,
  accentColor,
  title,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name="calendar" size={20} color={accentColor} />
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.swipeHint, { color: theme.colors.textTertiary }]}>Swipe →</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
      {data.map((plan, index) => (
        <Animated.View
          key={`${plan.plan}-${index}`}
          entering={FadeInRight.delay(index * 50)}
          style={[styles.planCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={[styles.planNumber, { backgroundColor: `${accentColor}15` }]}>
            <Text style={[styles.planNumberText, { color: accentColor }]}>{index + 1}</Text>
          </View>
          <Text style={[styles.planTitle, { color: theme.colors.text }]}>{plan.plan}</Text>
          <Text style={[styles.planFocus, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {plan.focus}
          </Text>
        </Animated.View>
      ))}
    </ScrollView>
  </View>
);

// Missions List Renderer
const MissionsSection: React.FC<{ data: Array<{name: string; year: number; type: string; description: string}>; theme: any; accentColor: string; title: string }> = ({
  data,
  theme,
  accentColor,
  title,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name="rocket" size={20} color={accentColor} />
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.swipeHint, { color: theme.colors.textTertiary }]}>Swipe →</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
      {data.map((mission, index) => (
        <Animated.View
          key={`${mission.name}-${index}`}
          entering={FadeInRight.delay(index * 60)}
          style={[styles.missionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <LinearGradient
            colors={[accentColor, `${accentColor}CC`] as readonly [string, string, ...string[]]}
            style={styles.missionIconContainer}
          >
            <Ionicons name="rocket" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={[styles.missionYearBadge, { backgroundColor: `${accentColor}15` }]}>
            <Text style={[styles.missionYearText, { color: accentColor }]}>{mission.year}</Text>
          </View>
          <Text style={[styles.missionName, { color: theme.colors.text }]} numberOfLines={2}>
            {mission.name}
          </Text>
          <Text style={[styles.missionType, { color: theme.colors.textSecondary }]}>{mission.type}</Text>
          <Text style={[styles.missionDesc, { color: theme.colors.textTertiary }]} numberOfLines={2}>
            {mission.description}
          </Text>
        </Animated.View>
      ))}
    </ScrollView>
  </View>
);

// Scientists/People List Renderer
const ScientistsSection: React.FC<{ data: Array<{name: string; field: string; achievement: string}>; theme: any; accentColor: string; title: string }> = ({
  data,
  theme,
  accentColor,
  title,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name="people" size={20} color={accentColor} />
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
    <View style={styles.scientistsGrid}>
      {data.map((scientist, index) => (
        <Animated.View
          key={`${scientist.name}-${index}`}
          entering={FadeIn.delay(index * 60)}
          style={[styles.scientistCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <LinearGradient
            colors={[accentColor, `${accentColor}CC`] as readonly [string, string, ...string[]]}
            style={styles.scientistAvatar}
          >
            <Text style={styles.scientistInitial}>{scientist.name[0]}</Text>
          </LinearGradient>
          <Text style={[styles.scientistName, { color: theme.colors.text }]} numberOfLines={1}>
            {scientist.name}
          </Text>
          <View style={[styles.scientistFieldBadge, { backgroundColor: `${accentColor}15` }]}>
            <Text style={[styles.scientistFieldText, { color: accentColor }]}>{scientist.field}</Text>
          </View>
          <Text style={[styles.scientistAchievement, { color: theme.colors.textSecondary }]} numberOfLines={3}>
            {scientist.achievement}
          </Text>
        </Animated.View>
      ))}
    </View>
  </View>
);

// Technologies List Renderer
const TechnologiesSection: React.FC<{ data: Array<{name: string; description: string}>; theme: any; accentColor: string; title: string }> = ({
  data,
  theme,
  accentColor,
  title,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name="bulb" size={20} color={accentColor} />
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
    <View style={styles.techGrid}>
      {data.map((tech, index) => (
        <Animated.View
          key={`${tech.name}-${index}`}
          entering={FadeIn.delay(index * 50)}
          style={[styles.techCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <LinearGradient
            colors={[accentColor, `${accentColor}CC`] as readonly [string, string, ...string[]]}
            style={styles.techIcon}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.techName, { color: theme.colors.text }]} numberOfLines={2}>{tech.name}</Text>
          <Text style={[styles.techDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>{tech.description}</Text>
        </Animated.View>
      ))}
    </View>
  </View>
);

// Nested Lists Renderer (categories with arrays)
const NestedListsSection: React.FC<{ data: Record<string, string[]>; theme: any; accentColor: string; title: string }> = ({
  data,
  theme,
  accentColor,
  title,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name="folder" size={20} color={accentColor} />
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
    {Object.entries(data).map(([category, items], index) => (
      <ExpandableCard
        key={category}
        title={formatKeyToTitle(category)}
        subtitle={`${items.length} items`}
        icon="list"
        iconColor={accentColor}
        initialExpanded={index === 0}
      >
        <View style={styles.chipContainer}>
          {items.map((item, idx) => (
            <View key={`${item}-${idx}`} style={[styles.chip, { backgroundColor: `${accentColor}15` }]}>
              <Text style={[styles.chipText, { color: accentColor }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>
    ))}
  </View>
);

// Main Dynamic Section Renderer
export const DynamicSection: React.FC<DynamicSectionProps> = ({
  sectionKey,
  data,
  theme,
  accentColor = '#6366F1',
  searchQuery = '',
}) => {
  const title = formatKeyToTitle(sectionKey);
  const type = detectSectionType(sectionKey, data);

  // Filter data if search query provided
  const filterData = <T extends any>(items: T[]): T[] => {
    if (!searchQuery.trim()) return items;
    return items.filter((item: any) => {
      const searchable = typeof item === 'string' ? item : JSON.stringify(item);
      return searchable.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  // Skip empty data
  if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return null;
  }

  switch (type) {
    case 'simpleList':
      return <SimpleListSection data={filterData(data)} theme={theme} accentColor={accentColor} title={title} />;
    case 'keyValue':
      return <KeyValueSection data={data} theme={theme} accentColor={accentColor} title={title} />;
    case 'plansList':
      return <PlansSection data={filterData(data)} theme={theme} accentColor={accentColor} title={title} />;
    case 'missionsList':
      return <MissionsSection data={filterData(data)} theme={theme} accentColor={accentColor} title={title} />;
    case 'scientistsList':
      return <ScientistsSection data={filterData(data)} theme={theme} accentColor={accentColor} title={title} />;
    case 'technologyList':
      return <TechnologiesSection data={filterData(data)} theme={theme} accentColor={accentColor} title={title} />;
    case 'nestedLists':
      return <NestedListsSection data={data} theme={theme} accentColor={accentColor} title={title} />;
    default:
      // For unknown types, try to render as expandable JSON
      return (
        <View style={styles.section}>
          <ExpandableCard title={title} subtitle="Complex data" icon="code" iconColor={accentColor}>
            <Text style={[styles.jsonText, { color: theme.colors.textSecondary }]}>
              {JSON.stringify(data, null, 2)}
            </Text>
          </ExpandableCard>
        </View>
      );
  }
};

// Render all sections dynamically
export const renderAllSections = (
  data: Record<string, any>,
  theme: any,
  accentColor: string,
  searchQuery: string = '',
  preferredOrder: string[] = []
): React.ReactNode[] => {
  const keys = Object.keys(data);
  
  // Sort keys: preferred order first, then alphabetically
  const sortedKeys = [...keys].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  return sortedKeys.map(key => (
    <DynamicSection
      key={key}
      sectionKey={key}
      data={data[key]}
      theme={theme}
      accentColor={accentColor}
      searchQuery={searchQuery}
    />
  ));
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  swipeHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  horizontalScrollContent: {
    paddingRight: 16,
  },
  // List card styles
  listCard: {
    width: 160,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  listIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  listIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  listItemText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Key-value styles
  kvContainer: {
    gap: 10,
  },
  kvCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  kvBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
  },
  kvBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kvValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  // Plan card styles
  planCard: {
    width: 140,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  planNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  planNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  planTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  planFocus: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  // Mission card styles
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
  // Scientist card styles
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
  // Tech card styles
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  techCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  techIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  techName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  techDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  // Chip styles
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // JSON fallback
  jsonText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

export default DynamicSection;

