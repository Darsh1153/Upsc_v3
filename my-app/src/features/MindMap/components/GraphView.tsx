import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MindMapNode, MindMapConnection } from '../types';

// Conditionally import WebView
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export interface GraphViewRef {
  fitView: () => void;
  focusNode: (nodeId: string) => void;
  search: (query: string) => void;
  setGraphMode: (mode: 'global' | 'local', nodeId?: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  border: string;
  borderLight: string;
  error: string;
  success: string;
}

interface GraphViewProps {
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeDoubleTap: (nodeId: string) => void;
  onAddNode: (x: number, y: number) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onLongPress?: (nodeId: string, x: number, y: number) => void;
  graphMode?: 'global' | 'local';
  localGraphDepth?: number;
  themeColors: ThemeColors;
  isDark: boolean;
}

const GraphView = forwardRef<GraphViewRef, GraphViewProps>(({
  nodes,
  connections,
  selectedNodeId,
  onNodeSelect,
  onNodeDoubleTap,
  onAddNode,
  onNodeMove,
  onConnect,
  onLongPress,
  graphMode = 'global',
  localGraphDepth = 2,
  themeColors,
  isDark,
}, ref) => {
  const webViewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);
  
  useImperativeHandle(ref, () => ({
    fitView: () => sendToWebView('fit', {}),
    focusNode: (nodeId: string) => sendToWebView('focus', { nodeId }),
    search: (query: string) => sendToWebView('search', { query }),
    setGraphMode: (mode: 'global' | 'local', nodeId?: string) => 
      sendToWebView('setMode', { mode, nodeId, depth: localGraphDepth }),
    zoomIn: () => sendToWebView('zoom', { direction: 'in' }),
    zoomOut: () => sendToWebView('zoom', { direction: 'out' }),
    resetView: () => sendToWebView('reset', {}),
  }));

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !webViewReady) {
        setError('Graph library failed to load.');
        setIsLoading(false);
      }
    }, 12000);
    return () => clearTimeout(timeout);
  }, [isLoading, webViewReady]);

  const getGraphData = useCallback(() => {
    const visNodes = nodes.map(node => ({
      id: node.id,
      label: node.label,
      x: node.x,
      y: node.y,
      color: node.color,
      fontSize: node.fontSize || 14,
      shape: node.shape === 'circle' ? 'dot' : 'box',
    }));

    const visEdges = connections.map(conn => ({
      id: conn.id,
      from: conn.sourceNodeId,
      to: conn.targetNodeId,
      label: conn.label || '',
      color: conn.color || (isDark ? '#475569' : '#CBD5E1'),
      width: conn.strokeWidth || 1.5,
      dashes: conn.style === 'dashed' ? [8, 4] : conn.style === 'dotted' ? [2, 4] : false,
    }));

    return { nodes: visNodes, edges: visEdges };
  }, [nodes, connections, isDark]);

  // Generate theme-aware HTML
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.6/dist/vis-network.min.js"></script>
  <style>
    * { 
      margin: 0; padding: 0; box-sizing: border-box; 
      -webkit-tap-highlight-color: transparent;
      -webkit-user-select: none;
      user-select: none;
    }
    html, body {
      width: 100%; height: 100%; overflow: hidden;
      background: ${themeColors.background};
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
      touch-action: none;
    }
    #graph { width: 100%; height: 100%; }
    
    .vis-tooltip {
      background: ${themeColors.surface} !important;
      color: ${themeColors.text} !important;
      border: 1px solid ${themeColors.border} !important;
      border-radius: 12px !important;
      padding: 10px 14px !important;
      font-size: 13px !important;
      box-shadow: 0 4px 20px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'} !important;
    }
    
    #loading {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      color: ${themeColors.textSecondary}; font-size: 14px;
      z-index: 100;
    }
    #loading.hidden { opacity: 0; pointer-events: none; transition: opacity 0.3s; }
    
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid ${themeColors.border};
      border-top-color: ${themeColors.primary};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    #mode-badge {
      position: absolute; top: 12px; left: 12px;
      background: ${isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.1)'};
      color: ${themeColors.primary};
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: none;
      z-index: 50;
      backdrop-filter: blur(8px);
      border: 1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(99, 102, 241, 0.15)'};
    }
    #mode-badge.visible { display: block; }
  </style>
</head>
<body>
  <div id="graph"></div>
  <div id="loading">
    <div class="spinner"></div>
    <span>Loading graph...</span>
  </div>
  <div id="mode-badge">Local View</div>
  
  <script>
    const THEME = {
      isDark: ${isDark},
      bg: '${themeColors.background}',
      surface: '${themeColors.surface}',
      text: '${themeColors.text}',
      textSecondary: '${themeColors.textSecondary}',
      primary: '${themeColors.primary}',
      border: '${themeColors.border}',
    };
    
    let network = null;
    let nodesDataset = null;
    let edgesDataset = null;
    let selectedNodeId = null;
    let isFocusing = false;
    
    const touch = { startX: 0, startY: 0, startTime: 0, lastTapTime: 0, isDragging: false, longPressTimer: null };
    const DOUBLE_TAP_DELAY = 300;
    const LONG_PRESS_DELAY = 450;
    const DRAG_THRESHOLD = 12;
    
    const PHYSICS = {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        theta: 0.5,
        gravitationalConstant: -55,
        centralGravity: 0.008,
        springLength: 140,
        springConstant: 0.055,
        damping: 0.65,
        avoidOverlap: 0.7,
      },
      maxVelocity: 18,
      minVelocity: 0.75,
      timestep: 0.4,
      stabilization: { enabled: true, iterations: 180, updateInterval: 25, fit: true },
    };
    
    function initGraph(data) {
      const container = document.getElementById('graph');
      const loading = document.getElementById('loading');
      
      nodesDataset = new vis.DataSet(data.nodes.map(n => ({
        id: n.id,
        label: n.label,
        x: n.x,
        y: n.y,
        color: {
          background: n.color,
          border: n.color,
          highlight: { background: n.color, border: THEME.isDark ? '#FFFFFF' : '#1F2937' },
          hover: { background: n.color, border: THEME.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)' },
        },
        font: { color: '#FFFFFF', size: n.fontSize || 14 },
        shape: n.shape,
        size: n.shape === 'dot' ? 22 : undefined,
      })));
      
      edgesDataset = new vis.DataSet(data.edges.map(e => ({
        id: e.id,
        from: e.from,
        to: e.to,
        label: e.label,
        color: { color: e.color, highlight: THEME.primary, hover: THEME.textSecondary },
        width: e.width,
        dashes: e.dashes,
      })));
      
      const options = {
        nodes: {
          shape: 'box',
          margin: { top: 10, right: 14, bottom: 10, left: 14 },
          borderWidth: 0,
          borderWidthSelected: 2,
          font: { size: 14, color: '#FFFFFF', face: '-apple-system, BlinkMacSystemFont, sans-serif' },
          shadow: {
            enabled: true,
            color: THEME.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)',
            size: 8, x: 0, y: 3,
          },
          chosen: {
            node: function(values, id, selected, hovering) {
              if (selected) {
                values.borderWidth = 2;
                values.borderColor = THEME.isDark ? '#FFFFFF' : '#1F2937';
                values.shadowColor = THEME.isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(99, 102, 241, 0.3)';
                values.shadowSize = 16;
              } else if (hovering) {
                values.shadowColor = THEME.isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(99, 102, 241, 0.15)';
                values.shadowSize = 12;
              }
            }
          }
        },
        edges: {
          smooth: { type: 'continuous', roundness: 0.25 },
          color: { inherit: false, opacity: 0.8 },
          width: 1.5,
          selectionWidth: 2,
          arrows: { to: { enabled: true, scaleFactor: 0.35 } },
        },
        physics: PHYSICS,
        interaction: {
          hover: true,
          hoverConnectedEdges: true,
          selectConnectedEdges: false,
          dragNodes: true,
          dragView: true,
          zoomView: true,
          zoomSpeed: 1,
          tooltipDelay: 200,
        },
        layout: { improvedLayout: true, randomSeed: 42 },
      };
      
      network = new vis.Network(container, { nodes: nodesDataset, edges: edgesDataset }, options);
      
      network.on('stabilizationProgress', p => {
        loading.querySelector('span').textContent = 'Stabilizing ' + Math.round(p.iterations / p.total * 100) + '%';
      });
      
      network.on('stabilized', () => {
        loading.classList.add('hidden');
        scaleNodesByDegree();
      });
      
      network.on('click', params => {
        if (isFocusing) return;
        if (params.nodes.length > 0) {
          selectedNodeId = params.nodes[0];
          sendMessage('nodeSelect', { nodeId: selectedNodeId });
          applyDepthFading(selectedNodeId);
        } else {
          selectedNodeId = null;
          sendMessage('nodeSelect', { nodeId: null });
          resetAppearance();
        }
      });
      
      network.on('doubleClick', params => {
        if (isFocusing) return;
        if (params.nodes.length > 0) {
          sendMessage('nodeDoubleTap', { nodeId: params.nodes[0] });
        } else {
          sendMessage('addNode', { x: params.pointer.canvas.x, y: params.pointer.canvas.y });
        }
      });
      
      network.on('dragEnd', params => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const pos = network.getPositions([nodeId])[nodeId];
          sendMessage('nodeMove', { nodeId, x: Math.round(pos.x), y: Math.round(pos.y) });
        }
      });
      
      network.on('hoverNode', () => { document.body.style.cursor = 'pointer'; });
      network.on('blurNode', () => { document.body.style.cursor = 'default'; });
      
      setupTouchHandlers(container);
    }
    
    function scaleNodesByDegree() {
      if (!nodesDataset || !edgesDataset) return;
      const degrees = {};
      edgesDataset.forEach(e => {
        degrees[e.from] = (degrees[e.from] || 0) + 1;
        degrees[e.to] = (degrees[e.to] || 0) + 1;
      });
      const maxDeg = Math.max(...Object.values(degrees), 1);
      nodesDataset.forEach(node => {
        const deg = degrees[node.id] || 0;
        const scale = 0.9 + (deg / maxDeg) * 0.2;
        nodesDataset.update({ id: node.id, font: { size: Math.round(14 * scale), color: '#FFFFFF' } });
      });
    }
    
    function applyDepthFading(selectedId) {
      if (!selectedId) return;
      const distances = bfsDistance(selectedId);
      
      nodesDataset.forEach(node => {
        const dist = distances[node.id];
        let opacity = dist === undefined ? 0.15 : dist === 0 ? 1 : dist === 1 ? 0.85 : dist === 2 ? 0.55 : 0.3;
        nodesDataset.update({ id: node.id, opacity, font: { color: dist === undefined ? 'rgba(255,255,255,0.3)' : '#FFFFFF' } });
      });
      
      edgesDataset.forEach(edge => {
        const isConnected = edge.from === selectedId || edge.to === selectedId;
        edgesDataset.update({
          id: edge.id,
          color: { color: isConnected ? THEME.primary : THEME.border, opacity: isConnected ? 1 : 0.2 },
          width: isConnected ? 2.5 : 1,
        });
      });
    }
    
    function resetAppearance() {
      nodesDataset?.forEach(node => {
        nodesDataset.update({ id: node.id, opacity: 1, font: { color: '#FFFFFF' } });
      });
      edgesDataset?.forEach(edge => {
        edgesDataset.update({ id: edge.id, color: { color: THEME.border, opacity: 0.8 }, width: 1.5 });
      });
    }
    
    function bfsDistance(startId) {
      const dist = { [startId]: 0 };
      const queue = [startId];
      while (queue.length) {
        const cur = queue.shift();
        edgesDataset.forEach(e => {
          let neighbor = e.from === cur ? e.to : (e.to === cur ? e.from : null);
          if (neighbor && dist[neighbor] === undefined) {
            dist[neighbor] = dist[cur] + 1;
            queue.push(neighbor);
          }
        });
      }
      return dist;
    }
    
    function setGraphMode(mode, focusNodeId, depth) {
      const badge = document.getElementById('mode-badge');
      if (mode === 'global') {
        badge.classList.remove('visible');
        nodesDataset?.forEach(n => nodesDataset.update({ id: n.id, hidden: false }));
        edgesDataset?.forEach(e => edgesDataset.update({ id: e.id, hidden: false }));
        resetAppearance();
        network?.fit({ animation: { duration: 300, easingFunction: 'easeOutQuad' } });
      } else if (mode === 'local' && focusNodeId) {
        badge.classList.add('visible');
        const visible = getNodesWithinDepth(focusNodeId, depth || 2);
        nodesDataset?.forEach(n => nodesDataset.update({ id: n.id, hidden: !visible.has(n.id) }));
        edgesDataset?.forEach(e => edgesDataset.update({ id: e.id, hidden: !(visible.has(e.from) && visible.has(e.to)) }));
        focusNode(focusNodeId);
        applyDepthFading(focusNodeId);
      }
    }
    
    function getNodesWithinDepth(startId, maxDepth) {
      const visited = new Set([startId]);
      let frontier = [startId];
      for (let d = 0; d < maxDepth; d++) {
        const next = [];
        for (const nodeId of frontier) {
          edgesDataset.forEach(e => {
            let neighbor = e.from === nodeId ? e.to : (e.to === nodeId ? e.from : null);
            if (neighbor && !visited.has(neighbor)) { visited.add(neighbor); next.push(neighbor); }
          });
        }
        frontier = next;
      }
      return visited;
    }
    
    function searchNodes(query) {
      if (!query || query.length < 2) { resetAppearance(); return; }
      const lowerQuery = query.toLowerCase();
      const matches = [];
      nodesDataset?.forEach(node => {
        const isMatch = (node.label || '').toLowerCase().includes(lowerQuery);
        if (isMatch) {
          matches.push(node);
          nodesDataset.update({ id: node.id, opacity: 1, borderWidth: 2, color: { ...node.color, border: '#FBBF24' } });
        } else {
          nodesDataset.update({ id: node.id, opacity: 0.15, borderWidth: 0 });
        }
      });
      if (matches.length > 0) focusNode(matches[0].id);
    }
    
    function handleZoom(direction) {
      if (!network) return;
      const scale = network.getScale();
      const newScale = Math.max(0.15, Math.min(3.5, scale * (direction === 'in' ? 1.4 : 0.7)));
      network.moveTo({ scale: newScale, animation: { duration: 200, easingFunction: 'easeOutQuad' } });
    }
    
    function focusNode(nodeId) {
      if (!network || !nodeId || isFocusing) return;
      isFocusing = true;
      network.focus(nodeId, { scale: Math.max(1, Math.min(network.getScale(), 1.5)), animation: { duration: 300, easingFunction: 'easeOutQuad' } });
      setTimeout(() => { isFocusing = false; }, 350);
    }
    
    function updateGraph(data) {
      if (!nodesDataset || !edgesDataset) return;
      nodesDataset.clear();
      edgesDataset.clear();
      nodesDataset.add(data.nodes.map(n => ({
        id: n.id, label: n.label, x: n.x, y: n.y,
        color: { background: n.color, border: n.color, highlight: { background: n.color, border: THEME.isDark ? '#FFFFFF' : '#1F2937' }, hover: { background: n.color, border: THEME.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)' } },
        font: { color: '#FFFFFF', size: n.fontSize || 14 }, shape: n.shape,
      })));
      edgesDataset.add(data.edges.map(e => ({
        id: e.id, from: e.from, to: e.to, label: e.label,
        color: { color: e.color, highlight: THEME.primary, hover: THEME.textSecondary },
        width: e.width, dashes: e.dashes,
      })));
      scaleNodesByDegree();
    }
    
    function selectNode(nodeId) {
      if (!network) return;
      selectedNodeId = nodeId;
      if (nodeId) { network.selectNodes([nodeId]); applyDepthFading(nodeId); }
      else { network.unselectAll(); resetAppearance(); }
    }
    
    function fitView() { network?.fit({ animation: { duration: 300, easingFunction: 'easeOutQuad' } }); }
    function resetView() {
      document.getElementById('mode-badge').classList.remove('visible');
      nodesDataset?.forEach(n => nodesDataset.update({ id: n.id, hidden: false }));
      edgesDataset?.forEach(e => edgesDataset.update({ id: e.id, hidden: false }));
      resetAppearance();
      fitView();
    }
    
    function setupTouchHandlers(container) {
      container.addEventListener('touchstart', e => {
        if (e.touches.length > 1) return;
        const t = e.touches[0];
        touch.startX = t.clientX; touch.startY = t.clientY; touch.startTime = Date.now(); touch.isDragging = false;
        touch.longPressTimer = setTimeout(() => {
          if (!touch.isDragging) {
            const rect = container.getBoundingClientRect();
            const nodeId = network.getNodeAt({ x: t.clientX - rect.left, y: t.clientY - rect.top });
            if (nodeId) { sendMessage('longPress', { nodeId, x: t.clientX, y: t.clientY }); if (navigator.vibrate) navigator.vibrate(25); }
          }
        }, LONG_PRESS_DELAY);
      }, { passive: true });
      
      container.addEventListener('touchmove', e => {
        clearTimeout(touch.longPressTimer);
        if (e.touches.length === 1) {
          const t = e.touches[0];
          if (Math.sqrt(Math.pow(t.clientX - touch.startX, 2) + Math.pow(t.clientY - touch.startY, 2)) > DRAG_THRESHOLD) touch.isDragging = true;
        }
      }, { passive: true });
      
      container.addEventListener('touchend', () => {
        clearTimeout(touch.longPressTimer);
        const now = Date.now();
        if (!touch.isDragging && now - touch.startTime < 280) {
          if (now - touch.lastTapTime < DOUBLE_TAP_DELAY) {
            const rect = container.getBoundingClientRect();
            const domPos = { x: touch.startX - rect.left, y: touch.startY - rect.top };
            const nodeId = network.getNodeAt(domPos);
            if (nodeId) sendMessage('nodeDoubleTap', { nodeId });
            else sendMessage('addNode', network.DOMtoCanvas(domPos));
            touch.lastTapTime = 0;
          } else touch.lastTapTime = now;
        }
        touch.isDragging = false;
      }, { passive: true });
    }
    
    function sendMessage(type, data) {
      const msg = JSON.stringify({ type, data });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
      else if (window.parent !== window) window.parent.postMessage(msg, '*');
    }
    
    window.addEventListener('message', e => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'init': initGraph(msg.data); break;
          case 'update': updateGraph(msg.data); break;
          case 'select': selectNode(msg.data.nodeId); break;
          case 'addNode': if (nodesDataset) { nodesDataset.add(msg.data); scaleNodesByDegree(); } break;
          case 'updateNode': nodesDataset?.update(msg.data); break;
          case 'removeNode': nodesDataset?.remove(msg.data.nodeId); break;
          case 'addEdge': if (edgesDataset) { edgesDataset.add(msg.data); scaleNodesByDegree(); } break;
          case 'removeEdge': edgesDataset?.remove(msg.data.edgeId); break;
          case 'fit': fitView(); break;
          case 'focus': focusNode(msg.data.nodeId); break;
          case 'search': searchNodes(msg.data.query); break;
          case 'setMode': setGraphMode(msg.data.mode, msg.data.nodeId, msg.data.depth); break;
          case 'zoom': handleZoom(msg.data.direction); break;
          case 'reset': resetView(); break;
        }
      } catch (err) {}
    });
    
    document.addEventListener('message', e => window.dispatchEvent(new MessageEvent('message', { data: e.data })));
    
    window.onload = () => {
      if (typeof vis === 'undefined') {
        document.getElementById('loading').innerHTML = '<span style="color:#EF4444;">Failed to load</span>';
        sendMessage('error', { message: 'vis-network not loaded' });
        return;
      }
      sendMessage('ready', { status: 'loaded' });
    };
    
    setTimeout(() => { if (typeof vis !== 'undefined' && !network) sendMessage('ready', { status: 'delayed' }); }, 2500);
  </script>
</body>
</html>
  `;

  const sendToWebView = useCallback((type: string, data: any) => {
    const message = JSON.stringify({ type, data });
    if (Platform.OS === 'web') {
      (webViewRef.current as HTMLIFrameElement | null)?.contentWindow?.postMessage(message, '*');
    } else {
      webViewRef.current?.postMessage(message);
    }
  }, []);

  useEffect(() => {
    if (webViewReady && !isLoading) {
      sendToWebView('update', getGraphData());
    }
  }, [nodes, connections, isLoading, webViewReady, getGraphData, sendToWebView]);

  useEffect(() => {
    if (webViewReady && !isLoading) {
      sendToWebView('select', { nodeId: selectedNodeId });
    }
  }, [selectedNodeId, isLoading, webViewReady, sendToWebView]);

  useEffect(() => {
    if (webViewReady && !isLoading) {
      sendToWebView('setMode', { mode: graphMode, nodeId: selectedNodeId, depth: localGraphDepth });
    }
  }, [graphMode, localGraphDepth, webViewReady, isLoading, sendToWebView, selectedNodeId]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = event.nativeEvent?.data || event.data;
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'ready':
          setWebViewReady(true);
          setError(null);
          setTimeout(() => {
            sendToWebView('init', getGraphData());
            setIsLoading(false);
          }, 150);
          break;
        case 'error':
          setError(message.data.message);
          setIsLoading(false);
          break;
        case 'nodeSelect': onNodeSelect(message.data.nodeId); break;
        case 'nodeDoubleTap': onNodeDoubleTap(message.data.nodeId); break;
        case 'addNode': onAddNode(message.data.x, message.data.y); break;
        case 'nodeMove': onNodeMove(message.data.nodeId, message.data.x, message.data.y); break;
        case 'longPress': onLongPress?.(message.data.nodeId, message.data.x, message.data.y); break;
      }
    } catch (e) {}
  }, [onNodeSelect, onNodeDoubleTap, onAddNode, onNodeMove, onLongPress, getGraphData, sendToWebView]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handler = (event: MessageEvent) => {
        if (typeof event.data === 'string') handleMessage({ nativeEvent: { data: event.data } });
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }
  }, [handleMessage]);

  const containerStyle = [styles.container, { backgroundColor: themeColors.background }];

  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        <iframe
          ref={webViewRef as any}
          srcDoc={htmlContent}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: themeColors.background }}
        />
        {isLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: themeColors.background }]}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading graph...</Text>
          </View>
        )}
        {error && (
          <View style={[styles.errorOverlay, { backgroundColor: themeColors.background }]}>
            <Ionicons name="warning-outline" size={44} color={themeColors.error} />
            <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: themeColors.primary }]} onPress={() => { setError(null); setIsLoading(true); setWebViewReady(false); }}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {WebView && (
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={handleMessage}
          onError={(e: any) => { setError(e.nativeEvent?.description || 'Failed'); setIsLoading(false); }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          originWhitelist={['*']}
          cacheEnabled
        />
      )}
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading graph...</Text>
        </View>
      )}
      {error && (
        <View style={[styles.errorOverlay, { backgroundColor: themeColors.background }]}>
          <Ionicons name="warning-outline" size={44} color={themeColors.error} />
          <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: themeColors.primary }]} onPress={() => { setError(null); setIsLoading(true); setWebViewReady(false); }}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 14, fontSize: 14 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 14, fontSize: 14, textAlign: 'center' },
  retryButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginTop: 20, gap: 6 },
  retryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});

GraphView.displayName = 'GraphView';
export default GraphView;
