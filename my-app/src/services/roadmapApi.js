import { getMobileApiEndpoint } from '../config/api';

/**
 * Fetch all roadmap topics from the admin panel API
 */
export const fetchRoadmapTopics = async (paper = null) => {
  try {
    let url = getMobileApiEndpoint('/roadmap');
    if (paper && paper !== 'all') {
      url += `?paper=${encodeURIComponent(paper)}`;
    }
    
    console.log('[RoadmapAPI] Fetching topics from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[RoadmapAPI] Fetched topics:', data.topics?.length || 0);
    
    // Transform API response to match expected format
    const topics = (data.topics || []).map(topic => ({
      id: topic.topicId || topic.id,
      name: topic.name,
      paper: topic.paper,
      icon: topic.icon || '📚',
      estimatedHours: topic.estimatedHours || 0,
      difficulty: topic.difficulty || 'Moderate',
      priority: topic.priority || 'Medium',
      subtopics: (topic.subtopics || []).map(st => ({
        id: st.id || st.subtopicId,
        name: st.name,
        estimatedHours: st.estimatedHours || 0,
      })),
      sources: (topic.sources || []).map(src => ({
        type: src.type || 'Custom',
        name: src.name,
        link: src.link || '',
      })),
    }));

    return { success: true, topics };
  } catch (error) {
    console.error('[RoadmapAPI] Error fetching topics:', error);
    return { success: false, error: error.message, topics: [] };
  }
};

/**
 * Fetch a single topic by ID
 */
export const fetchTopicById = async (topicId) => {
  try {
    const { success, topics, error } = await fetchRoadmapTopics();
    
    if (!success) {
      return { success: false, error, topic: null };
    }
    
    const topic = topics.find(t => t.id === topicId);
    
    if (!topic) {
      return { success: false, error: 'Topic not found', topic: null };
    }
    
    return { success: true, topic };
  } catch (error) {
    console.error('[RoadmapAPI] Error fetching topic:', error);
    return { success: false, error: error.message, topic: null };
  }
};

export default {
  fetchRoadmapTopics,
  fetchTopicById,
};

