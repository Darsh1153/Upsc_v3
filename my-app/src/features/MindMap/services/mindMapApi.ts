import { getMobileApiEndpoint } from '../../../config/api';
import { MindMapNode, MindMapConnection } from '../types';

export interface MindMapData {
  id: number;
  userId: number;
  title: string;
  description?: string;
  thumbnail?: string;
  isPublic: boolean;
  canvasState?: { zoom: number; offsetX: number; offsetY: number };
  tags: string[];
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  createdAt: string;
  updatedAt: string;
}

export interface MindMapListItem {
  id: number;
  userId: number;
  title: string;
  description?: string;
  thumbnail?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================== MIND MAPS ====================

export const fetchUserMindMaps = async (userId: number): Promise<MindMapListItem[]> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps?userId=${userId}`);
    console.log('[MindMapAPI] Fetching mind maps for user:', userId);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch mind maps');
    }
    
    return data.mindMaps;
  } catch (error) {
    console.error('[MindMapAPI] Error fetching mind maps:', error);
    throw error;
  }
};

export const fetchMindMap = async (mindMapId: number): Promise<MindMapData> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}`);
    console.log('[MindMapAPI] Fetching mind map:', mindMapId);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('[MindMapAPI] Raw response:', JSON.stringify(data, null, 2));
    console.log('[MindMapAPI] Connections from API:', data.mindMap?.connections);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch mind map');
    }
    
    // Transform nodes from DB format to app format
    // Handle both camelCase (Drizzle) and snake_case (raw DB) field names
    const nodes: MindMapNode[] = data.mindMap.nodes.map((n: any) => ({
      id: n.nodeId || n.node_id,
      dbId: n.id,
      label: n.label,
      x: n.x,
      y: n.y,
      width: n.width || 100,
      height: n.height || 40,
      color: n.color || '#3B82F6',
      shape: n.shape || 'rounded',
      fontSize: n.fontSize || n.font_size || 14,
      noteId: n.noteId || n.note_id,
      referenceType: n.referenceType || n.reference_type,
      referenceId: n.referenceId || n.reference_id,
      metadata: n.metadata,
    }));
    
    // Transform connections from DB format to app format
    // Handle both camelCase (Drizzle) and snake_case (raw DB) field names
    console.log('[MindMapAPI] Raw connections array:', data.mindMap.connections);
    console.log('[MindMapAPI] Connections array length:', data.mindMap.connections?.length);
    
    const connections: MindMapConnection[] = (data.mindMap.connections || []).map((c: any) => {
      console.log('[MindMapAPI] Processing single connection - raw:', JSON.stringify(c));
      const transformed = {
        id: c.connectionId || c.connection_id,
        dbId: c.id,
        sourceNodeId: c.sourceNodeId || c.source_node_id,
        targetNodeId: c.targetNodeId || c.target_node_id,
        label: c.label,
        color: c.color || '#475569',
        strokeWidth: c.strokeWidth || c.stroke_width || 1.5,
        style: c.style || 'solid',
        animated: c.animated || false,
      };
      console.log('[MindMapAPI] Transformed connection:', JSON.stringify(transformed));
      return transformed;
    });
    
    console.log('[MindMapAPI] Final connections array:', connections);
    
    return {
      ...data.mindMap,
      nodes,
      connections,
    };
  } catch (error) {
    console.error('[MindMapAPI] Error fetching mind map:', error);
    throw error;
  }
};

export const createMindMap = async (userId: number, title: string, description?: string): Promise<MindMapData> => {
  try {
    const url = getMobileApiEndpoint('/mindmaps');
    console.log('[MindMapAPI] Creating mind map:', title);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, description }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create mind map');
    }
    
    return { ...data.mindMap, nodes: [], connections: [] };
  } catch (error) {
    console.error('[MindMapAPI] Error creating mind map:', error);
    throw error;
  }
};

export const updateMindMap = async (
  mindMapId: number,
  updates: { title?: string; description?: string; canvasState?: any; tags?: string[] }
): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update mind map');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error updating mind map:', error);
    throw error;
  }
};

export const deleteMindMap = async (mindMapId: number): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}`);
    
    const response = await fetch(url, { method: 'DELETE' });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete mind map');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error deleting mind map:', error);
    throw error;
  }
};

// ==================== NODES ====================

export const createNode = async (mindMapId: number, node: MindMapNode): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}/nodes`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: node.id,
        label: node.label,
        x: node.x,
        y: node.y,
        color: node.color,
        shape: node.shape,
        referenceType: node.referenceType,
        referenceId: node.referenceId,
        metadata: node.metadata,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create node');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error creating node:', error);
    throw error;
  }
};

export const updateNode = async (
  mindMapId: number,
  nodeId: string,
  updates: Partial<MindMapNode>
): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}/nodes`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, ...updates }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update node');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error updating node:', error);
    throw error;
  }
};

export const deleteNode = async (mindMapId: number, nodeId: string): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}/nodes?nodeId=${nodeId}`);
    
    const response = await fetch(url, { method: 'DELETE' });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete node');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error deleting node:', error);
    throw error;
  }
};

export const batchUpdateNodePositions = async (
  mindMapId: number,
  nodes: { nodeId: string; x: number; y: number }[]
): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}/nodes`);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update node positions');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error batch updating nodes:', error);
    throw error;
  }
};

// ==================== CONNECTIONS ====================

export const createConnection = async (mindMapId: number, connection: MindMapConnection): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}/connections`);
    
    const payload = {
      connectionId: connection.id,
      sourceNodeId: connection.sourceNodeId,
      targetNodeId: connection.targetNodeId,
      label: connection.label,
      color: connection.color,
      strokeWidth: connection.strokeWidth,
      style: connection.style,
      animated: connection.animated,
    };
    
    console.log('[MindMapAPI] Creating connection with payload:', payload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    console.log('[MindMapAPI] Create connection response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create connection');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error creating connection:', error);
    throw error;
  }
};

export const deleteConnection = async (mindMapId: number, connectionId: string): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}/connections?connectionId=${connectionId}`);
    
    const response = await fetch(url, { method: 'DELETE' });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete connection');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error deleting connection:', error);
    throw error;
  }
};

export const deleteNodeConnections = async (mindMapId: number, nodeId: string): Promise<void> => {
  try {
    const url = getMobileApiEndpoint(`/mindmaps/${mindMapId}/connections`);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete node connections');
    }
  } catch (error) {
    console.error('[MindMapAPI] Error deleting node connections:', error);
    throw error;
  }
};

