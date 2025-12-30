import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@app_theme_preference';

// Color palette inspired by scholarly aesthetics
export const lightTheme = {
  mode: 'light' as const,
  colors: {
    // Primary backgrounds
    background: '#FAFBFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F7FA',
    
    // Text colors
    text: '#1A1D29',
    textSecondary: '#5C6370',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Accent colors
    primary: '#6366F1', // Indigo
    primaryLight: '#EEF2FF',
    secondary: '#8B5CF6', // Purple
    secondaryLight: '#F5F3FF',
    
    // Category colors
    ancient: '#F59E0B', // Amber
    ancientBg: '#FEF3C7',
    medieval: '#8B5CF6', // Purple
    medievalBg: '#F5F3FF',
    modern: '#3B82F6', // Blue
    modernBg: '#DBEAFE',
    prehistoric: '#78716C', // Stone
    prehistoricBg: '#F5F5F4',
    
    // Timeline colors
    timelineLine: '#E5E7EB',
    timelineDot: '#6366F1',
    timelineDotActive: '#4F46E5',
    
    // Subject theme colors
    history: '#F59E0B',
    historyBg: '#FEF3C7',
    polity: '#3B82F6',
    polityBg: '#DBEAFE',
    geography: '#10B981',
    geographyBg: '#D1FAE5',
    economy: '#F97316',
    economyBg: '#FED7AA',
    environment: '#22C55E',
    environmentBg: '#DCFCE7',
    scitech: '#6366F1',
    scitechBg: '#EEF2FF',
    
    // UI elements
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowMedium: 'rgba(0, 0, 0, 0.12)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Status colors
    success: '#10B981',
    successBg: '#D1FAE5',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    info: '#3B82F6',
    infoBg: '#DBEAFE',
    
    // Icon colors
    iconPrimary: '#4B5563',
    iconSecondary: '#9CA3AF',
    iconAccent: '#6366F1',
  },
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    header: ['#4F46E5', '#7C3AED'],
    card: ['#FFFFFF', '#F8FAFC'],
    environment: ['#22C55E', '#10B981'],
    economy: ['#F97316', '#FB923C'],
    scitech: ['#6366F1', '#A78BFA'],
  },
};

export const darkTheme = {
  mode: 'dark' as const,
  colors: {
    // Primary backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    
    // Text colors
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textInverse: '#0F172A',
    
    // Accent colors
    primary: '#818CF8', // Lighter indigo for dark mode
    primaryLight: '#312E81',
    secondary: '#A78BFA', // Lighter purple
    secondaryLight: '#4C1D95',
    
    // Category colors
    ancient: '#FBBF24',
    ancientBg: '#451A03',
    medieval: '#A78BFA',
    medievalBg: '#4C1D95',
    modern: '#60A5FA',
    modernBg: '#1E3A5F',
    prehistoric: '#A8A29E',
    prehistoricBg: '#292524',
    
    // Timeline colors
    timelineLine: '#475569',
    timelineDot: '#818CF8',
    timelineDotActive: '#A78BFA',
    
    // Subject theme colors
    history: '#FBBF24',
    historyBg: '#451A03',
    polity: '#60A5FA',
    polityBg: '#1E3A5F',
    geography: '#34D399',
    geographyBg: '#064E3B',
    economy: '#FB923C',
    economyBg: '#7C2D12',
    environment: '#4ADE80',
    environmentBg: '#14532D',
    scitech: '#818CF8',
    scitechBg: '#312E81',
    
    // UI elements
    border: '#475569',
    borderLight: '#334155',
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowMedium: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Status colors
    success: '#34D399',
    successBg: '#064E3B',
    warning: '#FBBF24',
    warningBg: '#451A03',
    error: '#F87171',
    errorBg: '#7F1D1D',
    info: '#60A5FA',
    infoBg: '#1E3A5F',
    
    // Icon colors
    iconPrimary: '#CBD5E1',
    iconSecondary: '#94A3B8',
    iconAccent: '#818CF8',
  },
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    header: ['#4338CA', '#6D28D9'],
    card: ['#1E293B', '#334155'],
    environment: ['#22C55E', '#059669'],
    economy: ['#EA580C', '#F97316'],
    scitech: ['#4F46E5', '#7C3AED'],
  },
};

export type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadThemePreference();
  }, []);

  const toggleTheme = useCallback(async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  }, [isDark]);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

