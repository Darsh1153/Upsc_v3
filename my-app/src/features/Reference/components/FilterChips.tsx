import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

interface FilterChip {
  id: string;
  label: string;
  color?: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showAllOption?: boolean;
  allLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  color?: string;
}

const Chip: React.FC<ChipProps> = ({ label, isSelected, onPress, color }) => {
  const { theme } = useTheme();
  const scaleValue = useSharedValue(1);

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const chipColor = color || theme.colors.primary;

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        animatedStyle,
        {
          backgroundColor: isSelected ? chipColor : theme.colors.surfaceSecondary,
          borderColor: isSelected ? chipColor : theme.colors.border,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
            fontWeight: isSelected ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  selectedId,
  onSelect,
  showAllOption = true,
  allLabel = 'All',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showAllOption && (
          <Chip
            label={allLabel}
            isSelected={selectedId === null}
            onPress={() => onSelect(null)}
          />
        )}
        {filters.map((filter) => (
          <Chip
            key={filter.id}
            label={filter.label}
            isSelected={selectedId === filter.id}
            onPress={() => onSelect(filter.id)}
            color={filter.color}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
  },
});

export default FilterChips;

