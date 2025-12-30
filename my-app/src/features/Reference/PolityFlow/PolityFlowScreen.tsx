import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import FlowNode, { FlowNodeData } from '../components/FlowNode';
import SearchHeader from '../components/SearchHeader';
import { useWebStyles } from '../../../components/WebContainer';
import { useVisualReference } from '../../../context/VisualReferenceContext';

// Import fallback data
import { polityHeirarchy } from '../../../../polityHeirarchyReference';

interface PolityFlowScreenProps {
  navigation?: any;
}

// Transform polity data into tree structure
const transformPolityData = (data: typeof polityHeirarchy): FlowNodeData[] => {
  const polity = data.polity;

  const nodes: FlowNodeData[] = [
    {
      id: 'constitution',
      title: 'Constitution of India',
      subtitle: `${polity.constitution.introduction.parts} Parts • ${polity.constitution.introduction.articles} Articles • ${polity.constitution.introduction.schedules} Schedules`,
      icon: 'document-text',
      children: [
        {
          id: 'preamble',
          title: 'Preamble',
          subtitle: 'Soul of the Constitution',
          icon: 'star',
          children: [
            {
              id: 'preamble-keywords',
              title: 'Key Concepts',
              description: polity.constitution.introduction.preamble.keywords.join(' • '),
              icon: 'key',
            },
            {
              id: 'preamble-objectives',
              title: 'Objectives',
              description: polity.constitution.introduction.preamble.objectives.join(' • '),
              icon: 'flag',
            },
          ],
        },
        {
          id: 'parts',
          title: 'Parts of Constitution',
          subtitle: '25 Parts',
          icon: 'layers',
          children: Object.entries(polity.constitution.partsDetail).map(([key, value]) => ({
            id: key,
            title: key.replace('part', 'Part ').replace('A', 'A ').replace('B', 'B '),
            description: value,
            icon: 'document',
          })),
        },
      ],
    },
    {
      id: 'union-govt',
      title: 'Union Government',
      subtitle: 'Executive, Legislative & Judicial',
      icon: 'business',
      children: [
        {
          id: 'president',
          title: 'President of India',
          subtitle: polity.unionGovernment.president.article,
          icon: 'person',
          children: [
            {
              id: 'president-election',
              title: 'Election',
              description: polity.unionGovernment.president.election,
              icon: 'checkbox',
            },
            {
              id: 'president-term',
              title: 'Term',
              description: polity.unionGovernment.president.term,
              icon: 'calendar',
            },
            {
              id: 'president-executive-powers',
              title: 'Executive Powers',
              description: polity.unionGovernment.president.powers.executive.join(' • '),
              icon: 'briefcase',
            },
            {
              id: 'president-legislative-powers',
              title: 'Legislative Powers',
              description: polity.unionGovernment.president.powers.legislative.join(' • '),
              icon: 'document-text',
            },
            {
              id: 'president-judicial-powers',
              title: 'Judicial Powers',
              description: polity.unionGovernment.president.powers.judicial.join(' • '),
              icon: 'hammer',
            },
            {
              id: 'president-emergency-powers',
              title: 'Emergency Powers',
              description: polity.unionGovernment.president.powers.emergency.join(' • '),
              icon: 'alert-circle',
            },
          ],
        },
        {
          id: 'vice-president',
          title: 'Vice President',
          subtitle: polity.unionGovernment.vicePresident.article,
          icon: 'people',
          children: [
            {
              id: 'vp-role',
              title: 'Role',
              description: polity.unionGovernment.vicePresident.role,
              icon: 'information-circle',
            },
            {
              id: 'vp-election',
              title: 'Election',
              description: polity.unionGovernment.vicePresident.election,
              icon: 'checkbox',
            },
          ],
        },
        {
          id: 'prime-minister',
          title: 'Prime Minister',
          subtitle: 'Head of Government',
          icon: 'ribbon',
          children: [
            {
              id: 'pm-appointment',
              title: 'Appointment',
              description: polity.unionGovernment.primeMinister.appointment,
              icon: 'person-add',
            },
            {
              id: 'pm-powers',
              title: 'Powers & Functions',
              description: polity.unionGovernment.primeMinister.powers.join(' • '),
              icon: 'flash',
            },
          ],
        },
        {
          id: 'council-ministers',
          title: 'Council of Ministers',
          subtitle: `Headed by ${polity.unionGovernment.councilOfMinisters.headedBy}`,
          icon: 'people-circle',
          children: [
            {
              id: 'com-responsibility',
              title: 'Responsibility',
              description: polity.unionGovernment.councilOfMinisters.responsibility,
              icon: 'hand-left',
            },
            {
              id: 'com-limit',
              title: 'Size Limit',
              description: polity.unionGovernment.councilOfMinisters.limit,
              icon: 'calculator',
            },
          ],
        },
      ],
    },
    {
      id: 'parliament',
      title: 'Parliament',
      subtitle: polity.parliament.lokSabha.article,
      icon: 'library',
      children: [
        {
          id: 'lok-sabha',
          title: 'Lok Sabha',
          subtitle: `Max ${polity.parliament.lokSabha.strength.maximum} members • Current: ${polity.parliament.lokSabha.strength.current}`,
          icon: 'people',
          children: [
            {
              id: 'ls-term',
              title: 'Term',
              description: polity.parliament.lokSabha.term,
              icon: 'calendar',
            },
            {
              id: 'ls-speaker',
              title: 'Speaker',
              description: `${polity.parliament.lokSabha.speaker.role}\n\nPowers: ${polity.parliament.lokSabha.speaker.powers.join(' • ')}`,
              icon: 'mic',
            },
            {
              id: 'ls-special-powers',
              title: 'Special Powers',
              description: polity.parliament.lokSabha.specialPowers.join(' • '),
              icon: 'star',
            },
          ],
        },
        {
          id: 'rajya-sabha',
          title: 'Rajya Sabha',
          subtitle: `Max ${polity.parliament.rajyaSabha.strength.maximum} members • Current: ${polity.parliament.rajyaSabha.strength.current}`,
          icon: 'home',
          children: [
            {
              id: 'rs-permanent',
              title: 'Permanent Body',
              description: `Yes - ${polity.parliament.rajyaSabha.retirement}`,
              icon: 'infinite',
            },
            {
              id: 'rs-chairman',
              title: 'Chairman',
              description: `${polity.parliament.rajyaSabha.chairman.exOfficio}\n\n${polity.parliament.rajyaSabha.chairman.role}\n\nPowers: ${polity.parliament.rajyaSabha.chairman.powers.join(' • ')}`,
              icon: 'person-circle',
            },
            {
              id: 'rs-legislative-powers',
              title: 'Legislative Powers',
              description: polity.parliament.rajyaSabha.powers.legislative.join(' • '),
              icon: 'document-text',
            },
            {
              id: 'rs-federal-powers',
              title: 'Federal Powers',
              description: polity.parliament.rajyaSabha.powers.federal.join(' • '),
              icon: 'git-network',
            },
          ],
        },
      ],
    },
    {
      id: 'judiciary',
      title: 'Judiciary',
      subtitle: 'Guardian of the Constitution',
      icon: 'scale',
      children: [
        {
          id: 'supreme-court',
          title: 'Supreme Court',
          subtitle: `${polity.judiciary.supremeCourt.articles} • Est. ${polity.judiciary.supremeCourt.established}`,
          icon: 'shield-checkmark',
          children: [
            {
              id: 'sc-composition',
              title: 'Composition',
              description: `${polity.judiciary.supremeCourt.composition.chiefJustice} + ${polity.judiciary.supremeCourt.composition.maxJudges} judges`,
              icon: 'people',
            },
            {
              id: 'sc-original-jurisdiction',
              title: 'Original Jurisdiction',
              description: polity.judiciary.supremeCourt.jurisdiction.original.join(' • '),
              icon: 'flag',
            },
            {
              id: 'sc-appellate-jurisdiction',
              title: 'Appellate Jurisdiction',
              description: polity.judiciary.supremeCourt.jurisdiction.appellate.join(' • '),
              icon: 'arrow-up-circle',
            },
            {
              id: 'sc-writs',
              title: 'Writs',
              description: polity.judiciary.supremeCourt.jurisdiction.writs.join(' • '),
              icon: 'document',
            },
          ],
        },
        {
          id: 'high-court',
          title: 'High Courts',
          subtitle: polity.judiciary.highCourt.articles,
          icon: 'business',
          children: [
            {
              id: 'hc-jurisdiction',
              title: 'Jurisdiction',
              description: polity.judiciary.highCourt.jurisdiction.join(' • '),
              icon: 'map',
            },
          ],
        },
        {
          id: 'subordinate-courts',
          title: 'Subordinate Courts',
          subtitle: `Controlled by ${polity.judiciary.subordinateCourts.controlledBy}`,
          icon: 'git-branch',
          children: [
            {
              id: 'sub-types',
              title: 'Types',
              description: polity.judiciary.subordinateCourts.types.join(' • '),
              icon: 'list',
            },
          ],
        },
      ],
    },
    {
      id: 'state-govt',
      title: 'State Government',
      subtitle: 'Federal Structure',
      icon: 'map',
      children: [
        {
          id: 'governor',
          title: 'Governor',
          subtitle: polity.stateGovernment.governor.articles,
          icon: 'person',
          children: [
            {
              id: 'gov-appointment',
              title: 'Appointment',
              description: polity.stateGovernment.governor.appointment,
              icon: 'person-add',
            },
            {
              id: 'gov-term',
              title: 'Term',
              description: polity.stateGovernment.governor.term,
              icon: 'calendar',
            },
            {
              id: 'gov-executive-powers',
              title: 'Executive Powers',
              description: polity.stateGovernment.governor.powers.executive.join(' • '),
              icon: 'briefcase',
            },
            {
              id: 'gov-legislative-powers',
              title: 'Legislative Powers',
              description: polity.stateGovernment.governor.powers.legislative.join(' • '),
              icon: 'document-text',
            },
          ],
        },
        {
          id: 'chief-minister',
          title: 'Chief Minister',
          subtitle: polity.stateGovernment.chiefMinister.role,
          icon: 'ribbon',
          children: [
            {
              id: 'cm-appointment',
              title: 'Appointment',
              description: polity.stateGovernment.chiefMinister.appointment,
              icon: 'person-add',
            },
          ],
        },
        {
          id: 'state-legislature',
          title: 'State Legislature',
          subtitle: polity.stateGovernment.stateLegislature.types.join(' / '),
          icon: 'library',
          children: [
            {
              id: 'vidhan-sabha',
              title: 'Vidhan Sabha',
              description: `Term: ${polity.stateGovernment.stateLegislature.vidhanSabha.term}\n\nSpecial Powers: ${polity.stateGovernment.stateLegislature.vidhanSabha.specialPowers.join(' • ')}`,
              icon: 'people',
            },
            {
              id: 'vidhan-parishad',
              title: 'Vidhan Parishad',
              description: `Permanent: ${polity.stateGovernment.stateLegislature.vidhanParishad.permanent ? 'Yes' : 'No'}\n\n${polity.stateGovernment.stateLegislature.vidhanParishad.retirement}`,
              icon: 'home',
            },
          ],
        },
      ],
    },
    {
      id: 'local-govt',
      title: 'Local Government',
      subtitle: 'Grassroots Democracy',
      icon: 'location',
      children: [
        {
          id: 'panchayati-raj',
          title: 'Panchayati Raj',
          subtitle: polity.localGovernment.panchayatiRaj.amendment,
          icon: 'home',
          children: [
            {
              id: 'pr-levels',
              title: 'Three-Tier Structure',
              description: polity.localGovernment.panchayatiRaj.levels.join(' → '),
              icon: 'git-network',
            },
            {
              id: 'pr-reservations',
              title: 'Reservations',
              description: polity.localGovernment.panchayatiRaj.reservations.join(' • '),
              icon: 'people',
            },
            {
              id: 'pr-term',
              title: 'Term',
              description: polity.localGovernment.panchayatiRaj.term,
              icon: 'calendar',
            },
          ],
        },
        {
          id: 'municipalities',
          title: 'Municipalities',
          subtitle: polity.localGovernment.municipalities.amendment,
          icon: 'business',
          children: [
            {
              id: 'mun-types',
              title: 'Types',
              description: polity.localGovernment.municipalities.types.join(' • '),
              icon: 'list',
            },
            {
              id: 'mun-heads',
              title: 'Leadership',
              description: `Mayor: ${polity.localGovernment.municipalities.heads.mayor}\n\nCommissioner: ${polity.localGovernment.municipalities.heads.commissioner}`,
              icon: 'person',
            },
          ],
        },
      ],
    },
  ];

  return nodes;
};

const PolityFlowScreen: React.FC<PolityFlowScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useWebStyles();
  const { getReferences, fallbackData } = useVisualReference();
  const [searchQuery, setSearchQuery] = useState('');
  const [polityData, setPolityData] = useState(fallbackData.polity);

  // Fetch data from API on mount
  React.useEffect(() => {
    const loadData = async () => {
      const data = await getReferences('polity');
      if (data) {
        setPolityData(data);
      }
    };
    loadData();
  }, [getReferences]);

  const polityTree = useMemo(() => transformPolityData({ polity: polityData }), [polityData]);

  // Filter nodes based on search
  const filterNodes = (nodes: FlowNodeData[], query: string): FlowNodeData[] => {
    if (!query.trim()) return nodes;

    const lowerQuery = query.toLowerCase();

    return nodes.reduce<FlowNodeData[]>((acc, node) => {
      const matchesTitle = node.title.toLowerCase().includes(lowerQuery);
      const matchesSubtitle = node.subtitle?.toLowerCase().includes(lowerQuery);
      const matchesDescription = node.description?.toLowerCase().includes(lowerQuery);
      const hasMatchingChildren =
        node.children && filterNodes(node.children, query).length > 0;

      if (matchesTitle || matchesSubtitle || matchesDescription || hasMatchingChildren) {
        acc.push({
          ...node,
          children: node.children ? filterNodes(node.children, query) : undefined,
        });
      }

      return acc;
    }, []);
  };

  const filteredTree = useMemo(
    () => filterNodes(polityTree, searchQuery),
    [polityTree, searchQuery]
  );

  const handleNodePress = (node: FlowNodeData) => {
    // Could navigate to detail screen or show modal
    console.log('Node pressed:', node.title);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchHeader
        title="Polity Hierarchy"
        subtitle="Indian Constitution & Governance"
        searchPlaceholder="Search articles, bodies, terms..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onBackPress={navigation?.goBack}
        showThemeToggle
        accentColor={theme.colors.polity}
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
          colors={['#3B82F6', '#1D4ED8'] as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerIcon}>
            <Ionicons name="library" size={36} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Indian Polity</Text>
            <Text style={styles.bannerSubtitle}>
              Tap nodes to expand • Explore the structure
            </Text>
          </View>
        </LinearGradient>

        {/* Flow Tree */}
        {filteredTree.length > 0 ? (
          filteredTree.map((node) => (
            <FlowNode
              key={node.id}
              node={node}
              onPress={handleNodePress}
              initialExpanded={searchQuery.length > 0}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={48}
              color={theme.colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
              No results found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
              Try searching for articles, bodies, or terms
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: 'rgba(255,255,255,0.85)',
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
    textAlign: 'center',
  },
});

export default PolityFlowScreen;

