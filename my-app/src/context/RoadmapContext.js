import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchRoadmapTopics } from '../services/roadmapApi';
import { PAPER_CATEGORIES, AVAILABLE_OPTIONALS } from '../data/roadmapData';

const RoadmapContext = createContext(null);

export const RoadmapProvider = ({ children }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const loadTopics = useCallback(async (forceRefresh = false) => {
    // Skip if we have cached data and it's still fresh
    if (!forceRefresh && topics.length > 0 && lastFetched) {
      const now = Date.now();
      if (now - lastFetched < CACHE_DURATION) {
        console.log('[RoadmapContext] Using cached topics');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchRoadmapTopics();
      
      if (result.success) {
        setTopics(result.topics);
        setLastFetched(Date.now());
        console.log('[RoadmapContext] Loaded', result.topics.length, 'topics');
      } else {
        setError(result.error || 'Failed to load roadmap data');
        console.error('[RoadmapContext] Error:', result.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('[RoadmapContext] Exception:', err);
    } finally {
      setLoading(false);
    }
  }, [topics.length, lastFetched]);

  // Load topics on mount
  useEffect(() => {
    loadTopics();
  }, []);

  // Get topic by ID
  const getTopicById = useCallback((topicId) => {
    return topics.find(t => t.id === topicId) || null;
  }, [topics]);

  // Get topics by paper
  const getTopicsByPaper = useCallback((paper) => {
    if (!paper || paper === 'all') {
      return topics;
    }
    return topics.filter(t => t.paper === paper);
  }, [topics]);

  // Refresh topics from API
  const refreshTopics = useCallback(async () => {
    await loadTopics(true);
  }, [loadTopics]);

  const value = {
    // Data
    topics,
    loading,
    error,
    
    // Static data
    paperCategories: PAPER_CATEGORIES,
    availableOptionals: AVAILABLE_OPTIONALS,
    
    // Methods
    getTopicById,
    getTopicsByPaper,
    refreshTopics,
    loadTopics,
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
};

export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};

export default RoadmapContext;

