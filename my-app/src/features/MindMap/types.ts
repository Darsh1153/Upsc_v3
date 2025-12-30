// ==================== MIND MAP TYPES ====================

export interface MindMapNode {
  id: string; // Client-generated UUID (nodeId)
  dbId?: number; // Database ID
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: 'rounded' | 'rectangle' | 'circle' | 'diamond';
  fontSize: number;
  // Links
  noteId?: number;
  referenceType?: 'roadmap_topic' | 'timeline_event' | 'article' | 'note';
  referenceId?: number;
  metadata?: Record<string, any>;
}

export interface MindMapConnection {
  id: string; // Client-generated UUID (connectionId)
  dbId?: number; // Database ID
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  color: string;
  strokeWidth: number;
  style: 'solid' | 'dashed' | 'dotted';
  animated: boolean;
}

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface MindMap {
  id: number;
  userId: number;
  title: string;
  description?: string;
  thumbnail?: string;
  isPublic: boolean;
  canvasState: CanvasState;
  tags: string[];
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  createdAt: string;
  updatedAt: string;
}

// ==================== ACTION TYPES ====================

export type NodeAction = 
  | 'edit'
  | 'delete'
  | 'connect'
  | 'color'
  | 'attachNote'
  | 'linkReference';

export interface ContextMenuPosition {
  x: number;
  y: number;
  visible: boolean;
  nodeId?: string;
}

// ==================== GESTURE TYPES ====================

export interface GestureState {
  isDragging: boolean;
  isPanning: boolean;
  isPinching: boolean;
  isConnecting: boolean;
  selectedNodeId: string | null;
  connectingFromNodeId: string | null;
  multiSelectedNodeIds: string[];
}

// ==================== GRAPH VIEW TYPES ====================

export type GraphMode = 'global' | 'local';

export interface GraphViewState {
  mode: GraphMode;
  localDepth: number;
  focusNodeId: string | null;
  searchQuery: string;
  searchResults: string[];
  zoom: number;
  isPhysicsEnabled: boolean;
}

export interface GraphViewConfig {
  physics: {
    gravitationalConstant: number;
    centralGravity: number;
    springLength: number;
    springConstant: number;
    damping: number;
    avoidOverlap: number;
  };
  interaction: {
    hoverEnabled: boolean;
    dragNodes: boolean;
    dragView: boolean;
    zoomView: boolean;
    multiselect: boolean;
  };
  rendering: {
    depthFadingEnabled: boolean;
    nodeScalingEnabled: boolean;
    showMinimap: boolean;
    showZoomControls: boolean;
  };
}

export interface SearchResult {
  nodeId: string;
  label: string;
  matchScore: number;
}

export interface DepthInfo {
  nodeId: string;
  depth: number;
  opacity: number;
}

// ==================== COLORS ====================

export const NODE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export const CONNECTION_COLORS = [
  '#94A3B8', // Slate (default)
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
];

