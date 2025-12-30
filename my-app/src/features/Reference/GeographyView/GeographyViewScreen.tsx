import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Dimensions,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import IconCard from '../components/IconCard';
import ExpandableCard from '../components/ExpandableCard';
import SearchHeader from '../components/SearchHeader';
import { useWebStyles } from '../../../components/WebContainer';

// Import data
import { geographyReference } from '../../../../geographyReference';
import { useVisualReference } from '../../../context/VisualReferenceContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map item type
interface MapItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  icon: string;
  color: string;
  section?: string;
  tags?: string[];
}

interface GeographyViewScreenProps {
  navigation?: any;
}

type TabType = 'maps' | 'physical' | 'rivers' | 'mountains' | 'parks' | 'world';

interface TabItem {
  id: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { id: 'maps', label: 'Maps', icon: 'map' },
  { id: 'physical', label: 'Physical', icon: 'earth' },
  { id: 'rivers', label: 'Rivers', icon: 'water' },
  { id: 'mountains', label: 'Mountains', icon: 'triangle' },
  { id: 'parks', label: 'Parks', icon: 'leaf' },
  { id: 'world', label: 'World', icon: 'globe' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GeographyViewScreen: React.FC<GeographyViewScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useWebStyles();
  const { getReferences, getMaps, isLoading } = useVisualReference();
  const [activeTab, setActiveTab] = useState<TabType>('maps');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMap, setSelectedMap] = useState<MapItem | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<{[key: string]: boolean}>({});
  const [geoData, setGeoData] = useState<any>(null);
  const [mapsData, setMapsData] = useState<{ sections: Record<string, MapItem[]>; sectionOrder: string[] } | null>(null);
  const [loadingMaps, setLoadingMaps] = useState(true);
  const [loadingGeo, setLoadingGeo] = useState(true);

  // Fetch data from API on mount
  React.useEffect(() => {
    const loadData = async () => {
      setLoadingGeo(true);
      setLoadingMaps(true);
      
      try {
        const data = await getReferences('geography');
        if (data) {
          setGeoData(data);
        }
      } finally {
        setLoadingGeo(false);
      }
      
      try {
        const maps = await getMaps();
        if (maps) {
          setMapsData(maps);
        }
      } finally {
        setLoadingMaps(false);
      }
    };
    loadData();
  }, [getReferences, getMaps]);

  // Get icon for section name
  const getSectionIcon = (section: string): keyof typeof Ionicons.glyphMap => {
    const sectionLower = section.toLowerCase();
    if (sectionLower.includes('india')) return 'flag';
    if (sectionLower.includes('world') || sectionLower.includes('global')) return 'globe';
    if (sectionLower.includes('state')) return 'location';
    if (sectionLower.includes('political')) return 'map';
    if (sectionLower.includes('physical')) return 'earth';
    if (sectionLower.includes('climate')) return 'partly-sunny';
    if (sectionLower.includes('histor')) return 'time';
    return 'map-outline';
  };

  // Get color for section name
  const getSectionColor = (section: string): string => {
    const sectionLower = section.toLowerCase();
    if (sectionLower.includes('india')) return '#FF9933';
    if (sectionLower.includes('world') || sectionLower.includes('global')) return '#3B82F6';
    if (sectionLower.includes('state')) return '#22C55E';
    if (sectionLower.includes('political')) return '#3B82F6';
    if (sectionLower.includes('physical')) return '#10B981';
    if (sectionLower.includes('climate')) return '#F59E0B';
    if (sectionLower.includes('histor')) return '#EC4899';
    return theme.colors.geography;
  };

  const openMap = (map: MapItem) => {
    setSelectedMap(map);
    setImageLoading(true);
    setImageError(false);
    setMapModalVisible(true);
  };

  const handleThumbnailError = (mapId: string) => {
    setThumbnailErrors(prev => ({ ...prev, [mapId]: true }));
  };

  // Get icon for geography items
  const getGeographyIcon = (type: string): { name: string; family: 'ionicons' | 'material' } => {
    const typeLC = type.toLowerCase();
    if (typeLC.includes('river') || typeLC.includes('water')) return { name: 'water', family: 'ionicons' };
    if (typeLC.includes('mountain') || typeLC.includes('peak') || typeLC.includes('range')) return { name: 'triangle', family: 'ionicons' };
    if (typeLC.includes('plateau')) return { name: 'layers', family: 'ionicons' };
    if (typeLC.includes('desert')) return { name: 'sunny', family: 'ionicons' };
    if (typeLC.includes('coast') || typeLC.includes('island')) return { name: 'boat', family: 'ionicons' };
    if (typeLC.includes('forest') || typeLC.includes('park')) return { name: 'leaf', family: 'ionicons' };
    if (typeLC.includes('soil')) return { name: 'grid', family: 'ionicons' };
    if (typeLC.includes('climate')) return { name: 'partly-sunny', family: 'ionicons' };
    if (typeLC.includes('strait') || typeLC.includes('channel')) return { name: 'git-branch', family: 'ionicons' };
    if (typeLC.includes('gulf')) return { name: 'water', family: 'ionicons' };
    if (typeLC.includes('pass')) return { name: 'trail-sign', family: 'ionicons' };
    return { name: 'location', family: 'ionicons' };
  };

  // Filter data based on search
  const filterItems = (items: string[], query: string): string[] => {
    if (!query.trim()) return items;
    return items.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
  };

  const renderPhysicalFeatures = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {/* Indian Physical Features */}
      <ExpandableCard
        title="Himalayas"
        subtitle="The Great Mountain Range"
        icon="triangle"
        iconColor={theme.colors.geography}
        initialExpanded
      >
        <View style={styles.chipContainer}>
          {geoData.indianPhysicalFeatures.himalayas.map((item, index) => (
            <View
              key={index}
              style={[
                styles.chip,
                { backgroundColor: theme.colors.geographyBg },
              ]}
            >
              <Text style={[styles.chipText, { color: theme.colors.geography }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      <ExpandableCard
        title="Northern Plains"
        subtitle="The Fertile Heartland"
        icon="layers"
        iconColor={theme.colors.geography}
      >
        <View style={styles.chipContainer}>
          {geoData.indianPhysicalFeatures.northernPlains.map((item, index) => (
            <View
              key={index}
              style={[
                styles.chip,
                { backgroundColor: theme.colors.geographyBg },
              ]}
            >
              <Text style={[styles.chipText, { color: theme.colors.geography }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      <ExpandableCard
        title="Peninsular Plateau"
        subtitle="The Ancient Landmass"
        icon="map"
        iconColor={theme.colors.geography}
      >
        <View style={styles.chipContainer}>
          {geoData.indianPhysicalFeatures.peninsularPlateau.map((item, index) => (
            <View
              key={index}
              style={[
                styles.chip,
                { backgroundColor: theme.colors.geographyBg },
              ]}
            >
              <Text style={[styles.chipText, { color: theme.colors.geography }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      <ExpandableCard
        title="Coastal Plains"
        subtitle="Eastern & Western Coasts"
        icon="boat"
        iconColor="#0EA5E9"
      >
        <View style={styles.chipContainer}>
          {geoData.indianPhysicalFeatures.coastalPlains.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#E0F2FE' }]}
            >
              <Text style={[styles.chipText, { color: '#0EA5E9' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      <ExpandableCard
        title="Islands"
        subtitle="Andaman, Nicobar & Lakshadweep"
        icon="compass"
        iconColor="#8B5CF6"
      >
        <View style={styles.chipContainer}>
          {geoData.indianPhysicalFeatures.islands.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#F5F3FF' }]}
            >
              <Text style={[styles.chipText, { color: '#8B5CF6' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      {/* Soil Types */}
      <View style={styles.sectionHeader}>
        <Ionicons name="grid" size={20} color={theme.colors.text} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Soil Types
        </Text>
      </View>
      <View style={styles.gridContainer}>
        {filterItems(geoData.soilTypes, searchQuery).map((soil, index) => (
          <View
            key={index}
            style={[
              styles.gridItem,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="ellipse" size={8} color={theme.colors.geography} />
            <Text style={[styles.gridItemText, { color: theme.colors.text }]}>
              {soil}
            </Text>
          </View>
        ))}
      </View>

      {/* Climate Types */}
      <View style={styles.sectionHeader}>
        <Ionicons name="partly-sunny" size={20} color={theme.colors.text} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Climate Types
        </Text>
      </View>
      <View style={styles.gridContainer}>
        {filterItems(geoData.climateTypes, searchQuery).map((climate, index) => (
          <View
            key={index}
            style={[
              styles.gridItem,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="sunny" size={12} color="#F59E0B" />
            <Text style={[styles.gridItemText, { color: theme.colors.text }]}>
              {climate}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderRivers = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {/* Himalayan Rivers */}
      <View style={styles.sectionHeader}>
        <Ionicons name="water" size={20} color="#0EA5E9" />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Himalayan Rivers
        </Text>
      </View>
      {filterItems(geoData.majorRivers.himalayanRivers, searchQuery).map(
        (river, index) => (
          <Animated.View
            key={river}
            entering={FadeIn.delay(index * 50)}
          >
            <IconCard
              title={river}
              subtitle="Perennial River"
              icon="water"
              iconColor="#0EA5E9"
              iconBgColor="#E0F2FE"
              size="medium"
            />
          </Animated.View>
        )
      )}

      {/* Peninsular Rivers */}
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <Ionicons name="water" size={20} color="#10B981" />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Peninsular Rivers
        </Text>
      </View>
      {filterItems(geoData.majorRivers.peninsularRivers, searchQuery).map(
        (river, index) => (
          <Animated.View
            key={river}
            entering={FadeIn.delay(index * 50)}
          >
            <IconCard
              title={river}
              subtitle="Seasonal River"
              icon="water"
              iconColor="#10B981"
              iconBgColor="#D1FAE5"
              size="medium"
            />
          </Animated.View>
        )
      )}
    </Animated.View>
  );

  const renderMountains = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {/* Mountain Ranges */}
      <View style={styles.sectionHeader}>
        <Ionicons name="triangle" size={20} color={theme.colors.text} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Mountain Ranges
        </Text>
      </View>
      {filterItems(geoData.mountainRanges, searchQuery).map((mountain, index) => (
        <Animated.View key={mountain} entering={FadeIn.delay(index * 50)}>
          <IconCard
            title={mountain}
            icon="triangle"
            iconColor="#8B5CF6"
            iconBgColor="#F5F3FF"
            size="medium"
          />
        </Animated.View>
      ))}

      {/* Plateaus */}
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <Ionicons name="layers" size={20} color={theme.colors.text} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Major Plateaus
        </Text>
      </View>
      {filterItems(geoData.plateaus, searchQuery).map((plateau, index) => (
        <Animated.View key={plateau} entering={FadeIn.delay(index * 50)}>
          <IconCard
            title={plateau}
            icon="layers"
            iconColor="#F59E0B"
            iconBgColor="#FEF3C7"
            size="medium"
          />
        </Animated.View>
      ))}

      {/* Straits, Channels, Gulfs, Passes */}
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <Ionicons name="git-network" size={20} color={theme.colors.text} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Straits & Passes
        </Text>
      </View>

      <ExpandableCard
        title="Straits"
        subtitle={`${geoData.importantStraitsChannelsGulfsPasses.straits.length} major straits`}
        icon="git-branch"
        iconColor="#0EA5E9"
      >
        <View style={styles.chipContainer}>
          {geoData.importantStraitsChannelsGulfsPasses.straits.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#E0F2FE' }]}
            >
              <Text style={[styles.chipText, { color: '#0EA5E9' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      <ExpandableCard
        title="Mountain Passes"
        subtitle={`${geoData.importantStraitsChannelsGulfsPasses.passes.length} important passes`}
        icon="trail-sign"
        iconColor="#8B5CF6"
      >
        <View style={styles.chipContainer}>
          {geoData.importantStraitsChannelsGulfsPasses.passes.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#F5F3FF' }]}
            >
              <Text style={[styles.chipText, { color: '#8B5CF6' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>
    </Animated.View>
  );

  const renderParks = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {/* Natural Vegetation */}
      <View style={styles.sectionHeader}>
        <Ionicons name="leaf" size={20} color={theme.colors.environment} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Natural Vegetation
        </Text>
      </View>
      <View style={styles.chipContainer}>
        {geoData.naturalVegetation.map((veg, index) => (
          <View
            key={index}
            style={[
              styles.chip,
              { backgroundColor: theme.colors.environmentBg },
            ]}
          >
            <Ionicons name="leaf" size={12} color={theme.colors.environment} />
            <Text
              style={[styles.chipText, { color: theme.colors.environment, marginLeft: 4 }]}
            >
              {veg}
            </Text>
          </View>
        ))}
      </View>

      {/* National Parks */}
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <Ionicons name="paw" size={20} color={theme.colors.environment} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          National Parks (Top 40)
        </Text>
      </View>
      <View style={styles.parksGrid}>
        {filterItems(geoData.nationalParksTop40, searchQuery).map((park, index) => (
          <Animated.View
            key={park}
            entering={FadeIn.delay(index * 30)}
            style={[
              styles.parkCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <LinearGradient
              colors={[theme.colors.environment, '#059669'] as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.parkIcon}
            >
              <Ionicons name="leaf" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[styles.parkName, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {park}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderWorld = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {/* World Mountain Ranges */}
      <ExpandableCard
        title="World Mountain Ranges"
        subtitle={`${geoData.worldMajorPhysicalFeatures.mountainRanges.length} major ranges`}
        icon="triangle"
        iconColor="#8B5CF6"
        initialExpanded
      >
        <View style={styles.chipContainer}>
          {geoData.worldMajorPhysicalFeatures.mountainRanges.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#F5F3FF' }]}
            >
              <Text style={[styles.chipText, { color: '#8B5CF6' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      {/* World Rivers */}
      <ExpandableCard
        title="World Rivers"
        subtitle={`${geoData.worldMajorPhysicalFeatures.rivers.length} major rivers`}
        icon="water"
        iconColor="#0EA5E9"
      >
        <View style={styles.chipContainer}>
          {geoData.worldMajorPhysicalFeatures.rivers.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#E0F2FE' }]}
            >
              <Text style={[styles.chipText, { color: '#0EA5E9' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      {/* World Deserts */}
      <ExpandableCard
        title="World Deserts"
        subtitle={`${geoData.worldMajorPhysicalFeatures.deserts.length} major deserts`}
        icon="sunny"
        iconColor="#F59E0B"
      >
        <View style={styles.chipContainer}>
          {geoData.worldMajorPhysicalFeatures.deserts.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#FEF3C7' }]}
            >
              <Text style={[styles.chipText, { color: '#F59E0B' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      {/* World Plateaus */}
      <ExpandableCard
        title="World Plateaus"
        subtitle={`${geoData.worldMajorPhysicalFeatures.plateaus.length} major plateaus`}
        icon="layers"
        iconColor="#10B981"
      >
        <View style={styles.chipContainer}>
          {geoData.worldMajorPhysicalFeatures.plateaus.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#D1FAE5' }]}
            >
              <Text style={[styles.chipText, { color: '#10B981' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>

      {/* Oceans */}
      <ExpandableCard
        title="Oceans"
        subtitle={`${geoData.worldMajorPhysicalFeatures.oceans.length} oceans`}
        icon="globe"
        iconColor="#3B82F6"
      >
        <View style={styles.chipContainer}>
          {geoData.worldMajorPhysicalFeatures.oceans.map((item, index) => (
            <View
              key={index}
              style={[styles.chip, { backgroundColor: '#DBEAFE' }]}
            >
              <Text style={[styles.chipText, { color: '#3B82F6' }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ExpandableCard>
    </Animated.View>
  );

  const renderMapCard = (map: MapItem, index: number, delayOffset: number = 0) => (
    <Animated.View
      key={map.id}
      entering={FadeIn.delay(index * 80 + delayOffset)}
    >
      <TouchableOpacity
        style={[
          styles.mapCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
        activeOpacity={0.8}
        onPress={() => openMap(map)}
      >
        <View style={styles.mapImageContainer}>
          {thumbnailErrors[map.id] ? (
            <View style={[styles.mapThumbnailPlaceholder, { backgroundColor: map.color + '20' }]}>
              <Ionicons name={map.icon as any} size={32} color={map.color} />
            </View>
          ) : (
            <Image
              source={{ uri: map.image }}
              style={styles.mapThumbnail}
              resizeMode="cover"
              onError={() => handleThumbnailError(map.id)}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)'] as readonly [string, string, ...string[]]}
            style={styles.mapOverlay}
          />
          <View style={[styles.mapIconBadge, { backgroundColor: map.color }]}>
            <Ionicons name={map.icon as any} size={16} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.mapInfo}>
          <Text style={[styles.mapTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {map.title}
          </Text>
          <Text style={[styles.mapSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {map.subtitle || 'No description'}
          </Text>
          {/* Tags */}
          {map.tags && map.tags.length > 0 && (
            <View style={styles.mapTagsContainer}>
              {map.tags.slice(0, 3).map((tag, i) => (
                <View key={i} style={[styles.mapTag, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <Text style={[styles.mapTagText, { color: theme.colors.textSecondary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
              {map.tags.length > 3 && (
                <Text style={[styles.mapTagMore, { color: theme.colors.textTertiary }]}>
                  +{map.tags.length - 3}
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.mapViewButton}>
          <Ionicons name="expand-outline" size={18} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderMaps = () => {
    // Show loading state
    if (loadingMaps || !mapsData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.geography} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading maps...
          </Text>
        </View>
      );
    }

    // Check if there are any maps
    const totalMaps = Object.values(mapsData.sections).flat().length;

    // Show empty state if no maps
    if (totalMaps === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No maps available
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
            Maps will appear here once added in the admin panel
          </Text>
        </View>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        {/* Render sections dynamically based on sectionOrder */}
        {mapsData.sectionOrder.map((section, sectionIndex) => {
          const sectionMaps = mapsData.sections[section] || [];
          if (sectionMaps.length === 0) return null;
          
          const sectionIcon = getSectionIcon(section);
          const sectionColor = getSectionColor(section);
          
          return (
            <View key={section} style={sectionIndex > 0 ? { marginTop: 24 } : undefined}>
              <View style={styles.sectionHeader}>
                <Ionicons name={sectionIcon} size={20} color={sectionColor} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {section}
                </Text>
                <Text style={[styles.sectionCount, { color: theme.colors.textTertiary }]}>
                  ({sectionMaps.length})
                </Text>
              </View>
              <View style={styles.mapsGrid}>
                {sectionMaps.map((map, index) => renderMapCard(map, index, sectionIndex * 200))}
              </View>
            </View>
          );
        })}

        {/* Map Tips */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE', marginTop: 24 }]}>
          <Ionicons name="information-circle" size={24} color={theme.colors.info} />
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Study Tip</Text>
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Tap on any map to view it in full screen. Pinch to zoom and drag to pan around the map for detailed study.
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'maps':
        return renderMaps();
      case 'physical':
        return renderPhysicalFeatures();
      case 'rivers':
        return renderRivers();
      case 'mountains':
        return renderMountains();
      case 'parks':
        return renderParks();
      case 'world':
        return renderWorld();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchHeader
        title="Geography"
        subtitle="Physical features & locations"
        searchPlaceholder="Search features, rivers, parks..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onBackPress={navigation?.goBack}
        showThemeToggle
        accentColor={theme.colors.geography}
      />

      {/* Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive
                      ? theme.colors.geography
                      : 'transparent',
                    borderColor: isActive
                      ? theme.colors.geography
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                      fontWeight: isActive ? '600' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20, paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {/* Map Full Screen Modal */}
      <Modal
        visible={mapModalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#0F172A' : '#000000' }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setMapModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>{selectedMap?.title}</Text>
              <Text style={styles.modalSubtitle}>{selectedMap?.subtitle}</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Map Image */}
          <ScrollView
            style={styles.mapScrollView}
            contentContainerStyle={styles.mapScrollContent}
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            centerContent
            bouncesZoom
          >
            {imageError ? (
              <View style={styles.errorContainer}>
                <Ionicons name={selectedMap?.icon as any || 'map'} size={80} color="rgba(255,255,255,0.3)" />
                <Text style={styles.errorTitle}>Map Unavailable</Text>
                <Text style={styles.errorText}>
                  Unable to load this map. Please check your internet connection and try again.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setImageError(false);
                    setImageLoading(true);
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : selectedMap && (
              <View style={styles.mapImageWrapper}>
                {/* Always render image */}
                <Image
                  source={{ uri: selectedMap.image }}
                  style={[styles.fullMapImage, { opacity: imageLoading ? 0 : 1 }]}
                  resizeMode="contain"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
                {/* Loading overlay - positioned absolutely */}
                {imageLoading && (
                  <View style={styles.mapLoadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.mapLoadingText}>Loading map...</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Zoom Hint */}
          <View style={[styles.zoomHint, { paddingBottom: insets.bottom + 16 }]}>
            <Ionicons name="scan-outline" size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.zoomHintText}>Pinch to zoom • Drag to pan</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
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
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  gridItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
  parksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  parkCard: {
    width: (SCREEN_WIDTH - 58) / 3,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  parkIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  parkName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  // Map styles
  mapsGrid: {
    gap: 12,
  },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapImageContainer: {
    width: 100,
    height: 80,
    position: 'relative',
  },
  mapThumbnail: {
    width: '100%',
    height: '100%',
  },
  mapThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  mapIconBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapInfo: {
    flex: 1,
    padding: 12,
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  mapSubtitle: {
    fontSize: 12,
  },
  mapViewButton: {
    padding: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  mapScrollView: {
    flex: 1,
  },
  mapScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullMapImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  zoomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  zoomHintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  sectionCount: {
    fontSize: 14,
    marginLeft: 4,
  },
  mapTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
    alignItems: 'center',
  },
  mapTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapTagText: {
    fontSize: 10,
  },
  mapTagMore: {
    fontSize: 10,
    marginLeft: 2,
  },
  mapImageWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  mapLoadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
});

export default GeographyViewScreen;

