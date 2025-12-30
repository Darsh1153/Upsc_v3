import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchVisualReferences, fetchHistoryTimeline, fetchMaps } from '../services/referenceApi';

// Import fallback hardcoded data
import { economyReference } from '../../economyReference';
import { polityHeirarchy } from '../../polityHeirarchyReference';
import { geographyReference } from '../../geographyReference';
import { environmentReference } from '../../environmentReference';
import { scienceTechReference } from '../../scienceTechReference';
import { indianHistoryTimeline } from '../../indianHistoryTimelineReference';
import { worldHistoryTimeline } from '../../worldHistoryTimelineReference';

// Empty initial state for maps - data comes only from API
const EMPTY_MAPS_DATA = {
  sections: {},
  sectionOrder: [],
};

const VisualReferenceContext = createContext(null);

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

export const VisualReferenceProvider = ({ children }) => {
  // Cache for different reference categories
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  // Get fallback data for a category
  const getFallbackData = useCallback((category) => {
    switch (category) {
      case 'economy':
        return economyReference.economyReference;
      case 'polity':
        return polityHeirarchy.polity;
      case 'geography':
        return geographyReference.geographyReference;
      case 'environment':
        return environmentReference.environmentReference;
      case 'scienceTech':
        return scienceTechReference.scienceTechReference;
      case 'indianHistory':
        return indianHistoryTimeline;
      case 'worldHistory':
        return worldHistoryTimeline;
      default:
        return null;
    }
  }, []);

  // Fetch references for a specific category
  const getReferences = useCallback(async (category, forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && cache[category]) {
      const cached = cache[category];
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[VisualReferenceContext] Using cached data for:', category);
        return cached.data;
      }
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [category]: true }));
    setErrors(prev => ({ ...prev, [category]: null }));

    try {
      const result = await fetchVisualReferences(category);
      
      if (result.success && result.references) {
        // Update cache
        setCache(prev => ({
          ...prev,
          [category]: {
            data: result.references,
            timestamp: Date.now(),
          },
        }));
        setLoading(prev => ({ ...prev, [category]: false }));
        return result.references;
      } else {
        throw new Error(result.error || 'Failed to fetch references');
      }
    } catch (error) {
      console.error('[VisualReferenceContext] Error fetching', category, ':', error);
      setErrors(prev => ({ ...prev, [category]: error.message }));
      setLoading(prev => ({ ...prev, [category]: false }));
      
      // Return fallback data
      const fallback = getFallbackData(category);
      console.log('[VisualReferenceContext] Using fallback data for:', category);
      return fallback;
    }
  }, [cache, getFallbackData]);

  // Fetch history timeline
  const getHistoryTimeline = useCallback(async (historyType = 'indian', forceRefresh = false) => {
    const cacheKey = `${historyType}History`;
    
    // Check cache first
    if (!forceRefresh && cache[cacheKey]) {
      const cached = cache[cacheKey];
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[VisualReferenceContext] Using cached timeline for:', historyType);
        return cached.data;
      }
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [cacheKey]: true }));
    setErrors(prev => ({ ...prev, [cacheKey]: null }));

    try {
      const result = await fetchHistoryTimeline(historyType);
      
      if (result.success && result.events && result.events.length > 0) {
        // Update cache
        setCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: result.events,
            timestamp: Date.now(),
          },
        }));
        setLoading(prev => ({ ...prev, [cacheKey]: false }));
        return result.events;
      } else {
        throw new Error(result.error || 'No events found');
      }
    } catch (error) {
      console.error('[VisualReferenceContext] Error fetching timeline:', error);
      setErrors(prev => ({ ...prev, [cacheKey]: error.message }));
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
      
      // Return fallback data
      const fallback = historyType === 'indian' ? indianHistoryTimeline : worldHistoryTimeline;
      console.log('[VisualReferenceContext] Using fallback timeline for:', historyType);
      return fallback;
    }
  }, [cache]);

  // Fetch maps
  const getMaps = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'maps';
    
    // Check cache first
    if (!forceRefresh && cache[cacheKey]) {
      const cached = cache[cacheKey];
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[VisualReferenceContext] Using cached maps');
        return cached.data;
      }
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [cacheKey]: true }));
    setErrors(prev => ({ ...prev, [cacheKey]: null }));

    try {
      const result = await fetchMaps();
      
      if (result.success) {
        // Use API data directly - sections format
        const apiMaps = {
          sections: result.sections || {},
          sectionOrder: result.sectionOrder || [],
        };
        
        // Update cache
        setCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: apiMaps,
            timestamp: Date.now(),
          },
        }));
        setLoading(prev => ({ ...prev, [cacheKey]: false }));
        return apiMaps;
      } else {
        throw new Error(result.error || 'Failed to fetch maps');
      }
    } catch (error) {
      console.error('[VisualReferenceContext] Error fetching maps:', error);
      setErrors(prev => ({ ...prev, [cacheKey]: error.message }));
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
      
      // Return empty data on error - no fallback
      console.log('[VisualReferenceContext] Error fetching maps, returning empty');
      return EMPTY_MAPS_DATA;
    }
  }, [cache]);

  // Clear cache for a category or all
  const clearCache = useCallback((category = null) => {
    if (category) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[category];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  // Check if category is loading
  const isLoading = useCallback((category) => {
    return loading[category] || false;
  }, [loading]);

  // Get error for category
  const getError = useCallback((category) => {
    return errors[category] || null;
  }, [errors]);

  const value = {
    // Methods
    getReferences,
    getHistoryTimeline,
    getMaps,
    clearCache,
    isLoading,
    getError,
    
    // Initial empty data (no fallbacks - everything from API)
    fallbackData: {
      economy: null,
      polity: null,
      geography: null,
      environment: null,
      scienceTech: null,
      indianHistory: null,
      worldHistory: null,
      maps: EMPTY_MAPS_DATA,
    },
  };

  return (
    <VisualReferenceContext.Provider value={value}>
      {children}
    </VisualReferenceContext.Provider>
  );
};

export const useVisualReference = () => {
  const context = useContext(VisualReferenceContext);
  if (!context) {
    throw new Error('useVisualReference must be used within a VisualReferenceProvider');
  }
  return context;
};

export default VisualReferenceContext;

