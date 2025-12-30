import { getMobileApiEndpoint } from '../config/api';

/**
 * Fetch visual references from the admin panel API
 * @param {string} category - Category to fetch (economy, polity, geography, environment, scienceTech, history_timeline)
 */
export const fetchVisualReferences = async (category = null) => {
  try {
    let url = getMobileApiEndpoint('/references');
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    
    console.log('[ReferenceAPI] Fetching references from:', url);
    
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
    console.log('[ReferenceAPI] Fetched references for:', category || 'all');
    
    return { success: true, references: data.references, type: data.type };
  } catch (error) {
    console.error('[ReferenceAPI] Error fetching references:', error);
    return { success: false, error: error.message, references: null };
  }
};

/**
 * Fetch history timeline events from the admin panel API
 * @param {string} historyType - 'indian' or 'world'
 */
export const fetchHistoryTimeline = async (historyType = 'indian') => {
  try {
    const url = getMobileApiEndpoint('/references?category=history_timeline');
    
    console.log('[ReferenceAPI] Fetching history timeline from:', url);
    
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
    
    // Filter by history type (indian_ or world_ prefix in category)
    const prefix = historyType === 'indian' ? 'indian_' : 'world_';
    const events = (data.references || []).filter(e => 
      e.category && e.category.toLowerCase().startsWith(prefix)
    ).map(e => ({
      ...e,
      category: e.category.replace(prefix, '').replace(/_/g, ' '),
    }));
    
    console.log('[ReferenceAPI] Fetched', events.length, historyType, 'history events');
    
    return { success: true, events, type: 'timeline' };
  } catch (error) {
    console.error('[ReferenceAPI] Error fetching history timeline:', error);
    return { success: false, error: error.message, events: [] };
  }
};

/**
 * Fetch maps from the admin panel API
 * @param {string} section - Optional section filter
 */
export const fetchMaps = async (section = null) => {
  try {
    let url = getMobileApiEndpoint('/maps');
    if (section) {
      url += `?section=${encodeURIComponent(section)}`;
    }
    
    console.log('[ReferenceAPI] Fetching maps from:', url);
    
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
    const totalMaps = Object.values(data.sections || {}).flat().length;
    console.log('[ReferenceAPI] Fetched maps:', totalMaps, 'maps in', Object.keys(data.sections || {}).length, 'sections');
    
    return { 
      success: true, 
      sections: data.sections || {}, 
      sectionOrder: data.sectionOrder || [] 
    };
  } catch (error) {
    console.error('[ReferenceAPI] Error fetching maps:', error);
    return { success: false, error: error.message, sections: {}, sectionOrder: [] };
  }
};

export default {
  fetchVisualReferences,
  fetchHistoryTimeline,
  fetchMaps,
};

