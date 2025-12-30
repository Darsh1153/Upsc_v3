import React, { createContext, useContext } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../features/Reference/theme/ThemeContext';

// Context to provide web padding values to all screens
const WebPaddingContext = createContext({ horizontalPadding: 16 });

export const useWebPadding = () => useContext(WebPaddingContext);

/**
 * WebLayout - Wraps the entire app content for web-specific styling
 * Provides horizontal padding on web to prevent content from edge-to-edge
 */
export function WebLayout({ children }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  
  if (!isWeb) {
    return (
      <WebPaddingContext.Provider value={{ horizontalPadding: 0, isWeb: false }}>
        {children}
      </WebPaddingContext.Provider>
    );
  }
  
  // Calculate responsive horizontal padding for web
  // Small screens: 16px, Medium: 40px, Large: 80px, XL: 120px
  let horizontalPadding = 16;
  if (width > 1400) {
    horizontalPadding = 160;
  } else if (width > 1200) {
    horizontalPadding = 120;
  } else if (width > 992) {
    horizontalPadding = 80;
  } else if (width > 768) {
    horizontalPadding = 48;
  }
  
  return (
    <WebPaddingContext.Provider value={{ horizontalPadding, isWeb: true }}>
      <View style={styles.webLayoutOuter}>
        {children}
      </View>
    </WebPaddingContext.Provider>
  );
}

/**
 * useWebStyles - Hook to get web-specific style values
 * Returns padding and layout values that screens can use
 */
export function useWebStyles() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  
  // Calculate responsive horizontal padding for web
  let horizontalPadding = 16;
  if (isWeb) {
    if (width > 1400) {
      horizontalPadding = 160;
    } else if (width > 1200) {
      horizontalPadding = 120;
    } else if (width > 992) {
      horizontalPadding = 80;
    } else if (width > 768) {
      horizontalPadding = 48;
    }
  }
  
  return {
    isWeb,
    horizontalPadding,
    // Content max-width for readability (optional use)
    contentMaxWidth: 1200,
  };
}

// Legacy export for backward compatibility
export function WebContainer({ children }) {
  return <>{children}</>;
}

export default WebContainer;

const styles = StyleSheet.create({
  webLayoutOuter: {
    flex: 1,
  },
});

