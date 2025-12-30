import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    icon: '📚',
    title: 'Master UPSC',
    subtitle: 'Your Ultimate Companion',
    description: 'Comprehensive preparation tools designed specifically for UPSC aspirants. Practice, learn, and succeed.',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: 2,
    icon: '🎯',
    title: 'Smart Practice',
    subtitle: 'AI-Powered MCQs',
    description: 'Generate unlimited practice questions on any topic. Track your progress and improve weak areas.',
    gradient: ['#11998e', '#38ef7d'],
  },
  {
    id: 3,
    icon: '📊',
    title: 'Track Progress',
    subtitle: 'Analytics & Insights',
    description: 'Detailed performance analytics, daily streaks, and personalized study recommendations.',
    gradient: ['#eb3349', '#f45c43'],
  },
  {
    id: 4,
    icon: '🚀',
    title: 'Ready to Begin?',
    subtitle: 'Start Your Journey',
    description: 'Join thousands of successful aspirants. Your UPSC dream starts here.',
    gradient: ['#4776E6', '#8E54E9'],
  },
];

export default function WelcomeScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  const scrollToIndex = (index) => {
    slidesRef.current?.scrollToIndex({ index });
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Text style={styles.icon}>{item.icon}</Text>
          </LinearGradient>
        </Animated.View>
        
        <Animated.View style={[styles.textContainer, { opacity }]}>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 30, 10],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <TouchableOpacity key={index} onPress={() => scrollToIndex(index)}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: currentIndex === index ? '#4776E6' : '#C5CAE9',
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Skip Button */}
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <View style={styles.slidesContainer}>
        <Animated.FlatList
          ref={slidesRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={32}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Paginator />

        <TouchableOpacity onPress={scrollToNext} activeOpacity={0.8}>
          <LinearGradient
            colors={['#4776E6', '#8E54E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? "Let's Get Started" : 'Continue'}
            </Text>
            <Text style={styles.nextButtonIcon}>
              {currentIndex === onboardingData.length - 1 ? '🚀' : '→'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Decorative Background Elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  slidesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4776E6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  icon: {
    fontSize: 70,
  },
  textContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E54E9',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  paginatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    minWidth: 220,
    shadowColor: '#4776E6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
  nextButtonIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(71, 118, 230, 0.05)',
    zIndex: -1,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(142, 84, 233, 0.05)',
    zIndex: -1,
  },
});

