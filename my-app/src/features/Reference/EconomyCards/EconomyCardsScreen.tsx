import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import InfoCard from '../components/InfoCard';
import ExpandableCard from '../components/ExpandableCard';
import SearchHeader from '../components/SearchHeader';
import { useWebStyles } from '../../../components/WebContainer';
import { useVisualReference } from '../../../context/VisualReferenceContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EconomyCardsScreenProps {
  navigation?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Economic Cycle Diagram Component
const EconomicCycleDiagram: React.FC<{ theme: any; data: any }> = ({ theme, data }) => {
  const cycles = data || [];
  const width = SCREEN_WIDTH - 64;
  const height = 140;
  const padding = 30;

  const createWavePath = () => {
    const points = [
      { x: 0, y: 0.5 },
      { x: 0.2, y: 0.1 },
      { x: 0.4, y: 0.5 },
      { x: 0.6, y: 0.9 },
      { x: 0.8, y: 0.5 },
      { x: 1, y: 0.3 },
    ];

    const pathWidth = width - padding * 2;
    const pathHeight = height - padding * 2;

    let path = `M ${padding + points[0].x * pathWidth} ${padding + points[0].y * pathHeight}`;

    for (let i = 1; i < points.length; i++) {
      const x = padding + points[i].x * pathWidth;
      const y = padding + points[i].y * pathHeight;
      const prevX = padding + points[i - 1].x * pathWidth;
      const prevY = padding + points[i - 1].y * pathHeight;
      const cx1 = prevX + (x - prevX) / 3;
      const cx2 = prevX + (2 * (x - prevX)) / 3;
      path += ` C ${cx1} ${prevY} ${cx2} ${y} ${x} ${y}`;
    }

    return path;
  };

  const cyclePositions = [
    { x: 0.1, y: 0.5, label: cycles[0] || 'Expansion' },
    { x: 0.2, y: 0.15, label: cycles[1] || 'Peak' },
    { x: 0.4, y: 0.5, label: cycles[2] || 'Recession' },
    { x: 0.6, y: 0.85, label: cycles[3] || 'Trough' },
    { x: 0.85, y: 0.35, label: cycles[4] || 'Recovery' },
  ];

  return (
    <View style={[styles.diagramContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
      <Svg width={width} height={height}>
        <Line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke={theme.colors.border}
          strokeDasharray="4,4"
        />
        <Path
          d={createWavePath()}
          fill="none"
          stroke={theme.colors.economy}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {cyclePositions.map((pos, index) => {
          const x = padding + pos.x * (width - padding * 2);
          const y = padding + pos.y * (height - padding * 2);
          return (
            <G key={pos.label}>
              <Circle
                cx={x}
                cy={y}
                r={6}
                fill={theme.colors.economy}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              <SvgText
                x={x}
                y={y + (pos.y < 0.5 ? -12 : 18)}
                fontSize={10}
                fontWeight="600"
                fill={theme.colors.text}
                textAnchor="middle"
              >
                {pos.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// Generic List Section (for arrays of strings)
const ListSection: React.FC<{ theme: any; data: string[]; title: string; icon: string }> = ({ theme, data, title, icon }) => {
  const scrollRef = useRef<ScrollView>(null);

  const getItemColor = (index: number): string => {
    const colors = ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6', '#EC4899'];
    return colors[index % colors.length];
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      snapToInterval={SCREEN_WIDTH - 64}
      decelerationRate="fast"
      contentContainerStyle={styles.horizontalScrollContent}
    >
      {data.map((item, index) => (
        <Animated.View
          key={`${item}-${index}`}
          entering={FadeInRight.delay(index * 100)}
          style={[
            styles.inflationCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <LinearGradient
            colors={[getItemColor(index), `${getItemColor(index)}CC`] as readonly [string, string, ...string[]]}
            style={styles.inflationIconContainer}
          >
            <Ionicons
              name={icon as any}
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
          <Text
            style={[styles.inflationTitle, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {item}
          </Text>
          <View
            style={[
              styles.inflationBadge,
              { backgroundColor: `${getItemColor(index)}15` },
            ]}
          >
            <Text style={[styles.inflationBadgeText, { color: getItemColor(index) }]}>
              #{index + 1}
            </Text>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

// Generic Key-Value Section (for objects with string values)
const KeyValueSection: React.FC<{ theme: any; data: Record<string, string>; title: string }> = ({ theme, data }) => {
  const entries = Object.entries(data);
  
  return (
    <View style={styles.gdpContainer}>
      {entries.map(([key, value], index) => (
        <View
          key={key}
          style={[
            styles.gdpCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.gdpBadge,
              { backgroundColor: theme.colors.economyBg || `${theme.colors.economy}15` },
            ]}
          >
            <Text style={[styles.gdpBadgeText, { color: theme.colors.economy }]}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </Text>
          </View>
          <Text
            style={[styles.gdpDescription, { color: theme.colors.textSecondary }]}
            numberOfLines={4}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Plans Section (for arrays of {plan, focus} objects)
const PlansSection: React.FC<{ theme: any; data: Array<{plan: string; focus: string}> }> = ({ theme, data }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.plansScrollContent}
    >
      {data.map((plan, index) => (
        <Animated.View
          key={`${plan.plan}-${index}`}
          entering={FadeInRight.delay(index * 50)}
          style={[
            styles.planCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.planNumber,
              { backgroundColor: theme.colors.economyBg || `${theme.colors.economy}15` },
            ]}
          >
            <Text style={[styles.planNumberText, { color: theme.colors.economy }]}>
              {index + 1}
            </Text>
          </View>
          <Text style={[styles.planTitle, { color: theme.colors.text }]}>
            {plan.plan}
          </Text>
          <Text
            style={[styles.planFocus, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {plan.focus}
          </Text>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

// Missions Section (for arrays of mission objects)
const MissionsSection: React.FC<{ theme: any; data: Array<{name: string; year: number; type: string; description: string}> }> = ({ theme, data }) => {
  return (
    <View style={styles.missionsContainer}>
      {data.map((mission, index) => (
        <Animated.View
          key={`${mission.name}-${index}`}
          entering={FadeIn.delay(index * 50)}
          style={[
            styles.missionCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.missionHeader}>
            <Text style={[styles.missionName, { color: theme.colors.text }]}>{mission.name}</Text>
            <View style={[styles.missionYearBadge, { backgroundColor: `${theme.colors.economy}15` }]}>
              <Text style={[styles.missionYear, { color: theme.colors.economy }]}>{mission.year}</Text>
            </View>
          </View>
          <Text style={[styles.missionType, { color: theme.colors.economy }]}>{mission.type}</Text>
          <Text style={[styles.missionDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {mission.description}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
};

// Scientists/People Section
const PeopleSection: React.FC<{ theme: any; data: Array<{name: string; field: string; achievement: string}> }> = ({ theme, data }) => {
  return (
    <View style={styles.peopleContainer}>
      {data.map((person, index) => (
        <Animated.View
          key={`${person.name}-${index}`}
          entering={FadeIn.delay(index * 50)}
          style={[
            styles.personCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.personAvatar, { backgroundColor: theme.colors.economy }]}>
            <Text style={styles.personInitial}>{person.name?.[0] || '?'}</Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={[styles.personName, { color: theme.colors.text }]}>{person.name}</Text>
            <Text style={[styles.personField, { color: theme.colors.economy }]}>{person.field}</Text>
            <Text style={[styles.personAchievement, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {person.achievement}
            </Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// Technologies Section
const TechnologiesSection: React.FC<{ theme: any; data: Array<{name: string; description: string}> }> = ({ theme, data }) => {
  return (
    <View style={styles.techContainer}>
      {data.map((tech, index) => (
        <Animated.View
          key={`${tech.name}-${index}`}
          entering={FadeIn.delay(index * 50)}
          style={[
            styles.techCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.techName, { color: theme.colors.text }]}>{tech.name}</Text>
          <Text style={[styles.techDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {tech.description}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
};

// Budget Structure Section
const BudgetStructureSection: React.FC<{ theme: any; data: any }> = ({ theme, data }) => {
  if (!data?.revenueBudget && !data?.capitalBudget) return null;
  
  return (
    <View style={styles.budgetContainer}>
      {data.revenueBudget && (
        <View style={styles.budgetColumn}>
          <LinearGradient
            colors={['#10B981', '#059669'] as readonly [string, string, ...string[]]}
            style={styles.budgetHeader}
          >
            <Ionicons name="trending-up" size={20} color="#FFFFFF" />
            <Text style={styles.budgetHeaderText}>Revenue Budget</Text>
          </LinearGradient>
          <View style={[styles.budgetContent, { backgroundColor: theme.colors.surface }]}>
            {data.revenueBudget.revenueReceipts && (
              <>
                <Text style={[styles.budgetSubtitle, { color: theme.colors.text }]}>Receipts</Text>
                {data.revenueBudget.revenueReceipts.map((item: string, idx: number) => (
                  <View key={idx} style={styles.budgetItem}>
                    <Ionicons name="add-circle" size={14} color="#10B981" />
                    <Text style={[styles.budgetItemText, { color: theme.colors.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </>
            )}
            {data.revenueBudget.revenueExpenditure && (
              <>
                <Text style={[styles.budgetSubtitle, { color: theme.colors.text, marginTop: 12 }]}>Expenditure</Text>
                {data.revenueBudget.revenueExpenditure.map((item: string, idx: number) => (
                  <View key={idx} style={styles.budgetItem}>
                    <Ionicons name="remove-circle" size={14} color="#EF4444" />
                    <Text style={[styles.budgetItemText, { color: theme.colors.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      )}

      {data.capitalBudget && (
        <View style={styles.budgetColumn}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5'] as readonly [string, string, ...string[]]}
            style={styles.budgetHeader}
          >
            <Ionicons name="business" size={20} color="#FFFFFF" />
            <Text style={styles.budgetHeaderText}>Capital Budget</Text>
          </LinearGradient>
          <View style={[styles.budgetContent, { backgroundColor: theme.colors.surface }]}>
            {data.capitalBudget.capitalReceipts && (
              <>
                <Text style={[styles.budgetSubtitle, { color: theme.colors.text }]}>Receipts</Text>
                {data.capitalBudget.capitalReceipts.map((item: string, idx: number) => (
                  <View key={idx} style={styles.budgetItem}>
                    <Ionicons name="add-circle" size={14} color="#6366F1" />
                    <Text style={[styles.budgetItemText, { color: theme.colors.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </>
            )}
            {data.capitalBudget.capitalExpenditure && (
              <>
                <Text style={[styles.budgetSubtitle, { color: theme.colors.text, marginTop: 12 }]}>Expenditure</Text>
                {data.capitalBudget.capitalExpenditure.map((item: string, idx: number) => (
                  <View key={idx} style={styles.budgetItem}>
                    <Ionicons name="remove-circle" size={14} color="#EF4444" />
                    <Text style={[styles.budgetItemText, { color: theme.colors.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// Tax Structure Section
const TaxStructureSection: React.FC<{ theme: any; data: any }> = ({ theme, data }) => {
  if (!data?.directTaxes && !data?.indirectTaxes) return null;
  
  return (
    <View style={styles.taxContainer}>
      {data.directTaxes && data.directTaxes.length > 0 && (
        <View style={[styles.taxColumn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.taxTitle, { color: theme.colors.economy }]}>Direct Taxes</Text>
          {data.directTaxes.map((tax: string, idx: number) => (
            <View key={idx} style={styles.taxItem}>
              <View style={[styles.taxDot, { backgroundColor: theme.colors.economy }]} />
              <Text style={[styles.taxText, { color: theme.colors.textSecondary }]}>{tax}</Text>
            </View>
          ))}
        </View>
      )}
      {data.indirectTaxes && data.indirectTaxes.length > 0 && (
        <View style={[styles.taxColumn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.taxTitle, { color: '#6366F1' }]}>Indirect Taxes</Text>
          {data.indirectTaxes.map((tax: string, idx: number) => (
            <View key={idx} style={styles.taxItem}>
              <View style={[styles.taxDot, { backgroundColor: '#6366F1' }]} />
              <Text style={[styles.taxText, { color: theme.colors.textSecondary }]}>{tax}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Determine section type and icon
const getSectionConfig = (key: string, data: any): { type: string; icon: string; title: string } => {
  const formattedTitle = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();

  // Detect type based on data structure
  if (Array.isArray(data)) {
    if (data.length === 0) return { type: 'list', icon: 'list', title: formattedTitle };
    const first = data[0];
    if (typeof first === 'string') return { type: 'list', icon: 'list', title: formattedTitle };
    if (first.plan && first.focus) return { type: 'plans', icon: 'calendar', title: formattedTitle };
    if (first.year && first.type && first.description) return { type: 'missions', icon: 'rocket', title: formattedTitle };
    if (first.field && first.achievement) return { type: 'people', icon: 'people', title: formattedTitle };
    if (first.name && first.description && !first.year) return { type: 'technologies', icon: 'bulb', title: formattedTitle };
    return { type: 'list', icon: 'list', title: formattedTitle };
  }
  
  if (typeof data === 'object' && data !== null) {
    if (data.revenueBudget || data.capitalBudget) return { type: 'budget', icon: 'wallet', title: formattedTitle };
    if (data.directTaxes || data.indirectTaxes) return { type: 'tax', icon: 'receipt', title: formattedTitle };
    // Check if it's a key-value object with string values
    const values = Object.values(data);
    if (values.length > 0 && typeof values[0] === 'string') return { type: 'keyvalue', icon: 'book', title: formattedTitle };
    return { type: 'nested', icon: 'folder', title: formattedTitle };
  }
  
  return { type: 'unknown', icon: 'help-circle', title: formattedTitle };
};

// Render a dynamic section based on its type
const DynamicSection: React.FC<{ theme: any; sectionKey: string; data: any }> = ({ theme, sectionKey, data }) => {
  const config = getSectionConfig(sectionKey, data);
  
  // Skip empty data
  if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return null;
  }

  const renderContent = () => {
    switch (config.type) {
      case 'list':
        return <ListSection theme={theme} data={data} title={config.title} icon={config.icon} />;
      case 'keyvalue':
        return <KeyValueSection theme={theme} data={data} title={config.title} />;
      case 'plans':
        return <PlansSection theme={theme} data={data} />;
      case 'missions':
        return <MissionsSection theme={theme} data={data} />;
      case 'people':
        return <PeopleSection theme={theme} data={data} />;
      case 'technologies':
        return <TechnologiesSection theme={theme} data={data} />;
      case 'budget':
        return <BudgetStructureSection theme={theme} data={data} />;
      case 'tax':
        return <TaxStructureSection theme={theme} data={data} />;
      default:
        // For nested or unknown types, try to render as key-value if possible
        if (typeof data === 'object' && !Array.isArray(data)) {
          const stringified: Record<string, string> = {};
          Object.entries(data).forEach(([k, v]) => {
            stringified[k] = typeof v === 'string' ? v : JSON.stringify(v);
          });
          return <KeyValueSection theme={theme} data={stringified} title={config.title} />;
        }
        return null;
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={config.icon as any} size={20} color={theme.colors.economy} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {config.title}
        </Text>
        {config.type === 'list' && (
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            Swipe →
          </Text>
        )}
      </View>
      {renderContent()}
    </View>
  );
};

const EconomyCardsScreen: React.FC<EconomyCardsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useWebStyles();
  const { getReferences, fallbackData, isLoading } = useVisualReference();
  const [searchQuery, setSearchQuery] = useState('');
  const [ecoData, setEcoData] = useState<any>(fallbackData.economy || {});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getReferences('economy');
        if (data && Object.keys(data).length > 0) {
          setEcoData(data);
        }
      } catch (error) {
        console.error('Error loading economy data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [getReferences]);

  // Get all section keys from the data
  const sectionKeys = Object.keys(ecoData);

  // Filter sections based on search
  const filteredSections = searchQuery
    ? sectionKeys.filter(key => {
        const config = getSectionConfig(key, ecoData[key]);
        return config.title.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : sectionKeys;

  // Define preferred order for known sections
  const preferredOrder = [
    'economicCycle',
    'typesOfInflation',
    'typesOfDeficits',
    'budgetStructure',
    'monetaryPolicyTools',
    'fiveYearPlanSummary',
    'taxStructure',
    'GDP_GNP_NNP_Definitions',
  ];

  // Sort sections: known sections first in preferred order, then new sections alphabetically
  const sortedSections = [...filteredSections].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.economy} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading economy data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchHeader
        title="Economy"
        subtitle={`${sectionKeys.length} sections available`}
        searchPlaceholder="Search economic terms..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onBackPress={navigation?.goBack}
        showThemeToggle
        accentColor={theme.colors.economy}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20, paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Special handling for Economic Cycle (with diagram) */}
        {ecoData.economicCycle && filteredSections.includes('economicCycle') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pulse" size={20} color={theme.colors.economy} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Economic Cycle
              </Text>
            </View>
            <EconomicCycleDiagram theme={theme} data={ecoData.economicCycle} />
          </View>
        )}

        {/* Render all other sections dynamically */}
        {sortedSections
          .filter(key => key !== 'economicCycle') // Skip economic cycle as it's handled above
          .map(key => (
            <DynamicSection
              key={key}
              theme={theme}
              sectionKey={key}
              data={ecoData[key]}
            />
          ))}

        {filteredSections.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No sections found matching "{searchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
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
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  diagramContainer: {
    borderRadius: 16,
    padding: 8,
    overflow: 'hidden',
  },
  horizontalScrollContent: {
    paddingRight: 16,
  },
  inflationCard: {
    width: SCREEN_WIDTH - 80,
    marginRight: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  inflationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  inflationTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  inflationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inflationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gdpContainer: {
    gap: 10,
  },
  gdpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  gdpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  gdpBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gdpDescription: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  plansScrollContent: {
    paddingRight: 16,
  },
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
  budgetContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetColumn: {
    flex: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  budgetHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  budgetContent: {
    borderRadius: 12,
    padding: 12,
  },
  budgetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  budgetItemText: {
    fontSize: 11,
    flex: 1,
  },
  taxContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  taxColumn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  taxTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  taxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  taxDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taxText: {
    fontSize: 12,
    flex: 1,
  },
  missionsContainer: {
    gap: 10,
  },
  missionCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  missionName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  missionYearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  missionYear: {
    fontSize: 12,
    fontWeight: '600',
  },
  missionType: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  missionDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  peopleContainer: {
    gap: 10,
  },
  personCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
  },
  personField: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  personAchievement: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  techContainer: {
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
  techName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  techDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EconomyCardsScreen;
