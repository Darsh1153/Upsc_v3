/**
 * Cross-platform Mermaid Canvas
 * Uses iframe for web, WebView for mobile
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';

export type RenderType = 'mindmap' | 'flowchart';

interface MermaidCanvasProps {
  code: string;
  isDark: boolean;
  colors: any;
  renderType?: RenderType;
}

// Convert mindmap mermaid code to flowchart format
const convertToFlowchart = (code: string): string => {
  // Check if it's already a flowchart
  if (code.trim().startsWith('flowchart') || code.trim().startsWith('graph')) {
    return code;
  }

  // Check if it's a mindmap
  if (!code.trim().startsWith('mindmap')) {
    return code; // Return as is for other diagram types
  }

  try {
    const lines = code.split('\n');
    const nodes: { id: string; label: string; level: number; parentId: string | null }[] = [];
    let nodeCounter = 0;
    const levelStack: { level: number; id: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Count leading spaces/tabs to determine level
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      const level = Math.floor(indent / 2);

      // Extract label (remove special chars used in mindmap)
      let label = line.trim()
        .replace(/^\(\(/, '').replace(/\)\)$/, '')  // (( ))
        .replace(/^\(/, '').replace(/\)$/, '')      // ( )
        .replace(/^\[/, '').replace(/\]$/, '')      // [ ]
        .replace(/^\{/, '').replace(/\}$/, '')      // { }
        .replace(/^{{/, '').replace(/}}$/, '');     // {{ }}

      if (!label) continue;

      const nodeId = `node${nodeCounter++}`;

      // Find parent
      while (levelStack.length > 0 && levelStack[levelStack.length - 1].level >= level) {
        levelStack.pop();
      }

      const parentId = levelStack.length > 0 ? levelStack[levelStack.length - 1].id : null;

      nodes.push({ id: nodeId, label, level, parentId });
      levelStack.push({ level, id: nodeId });
    }

    // Generate flowchart
    let flowchart = 'flowchart TD\n';

    // Add node definitions
    nodes.forEach(node => {
      flowchart += `    ${node.id}["${node.label}"]\n`;
    });

    flowchart += '\n';

    // Add edges
    nodes.forEach(node => {
      if (node.parentId) {
        flowchart += `    ${node.parentId} --> ${node.id}\n`;
      }
    });

    return flowchart;
  } catch (e) {
    console.error('Failed to convert to flowchart:', e);
    return code;
  }
};

const MermaidCanvas: React.FC<MermaidCanvasProps> = ({ code, isDark, colors, renderType = 'mindmap' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';

  // Convert code based on render type
  const displayCode = renderType === 'flowchart' ? convertToFlowchart(code) : code;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: ${bgColor};
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    #diagram {
      width: 100%;
      text-align: center;
    }
    #diagram svg {
      max-width: 100%;
      height: auto;
    }
    .loading {
      color: ${textColor};
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    }
    .error {
      color: #ef4444;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="diagram"><p class="loading">Rendering diagram...</p></div>
  <script>
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: '${isDark ? 'dark' : 'default'}',
      securityLevel: 'loose',
      mindmap: {
        useMaxWidth: false,
        padding: 20
      }
    });
    
    async function render() {
      try {
        const code = ${JSON.stringify(displayCode)};
        if (!code) {
          document.getElementById('diagram').innerHTML = '<p class="loading">No diagram to display</p>';
          return;
        }
        const { svg } = await mermaid.render('mermaid-svg', code);
        document.getElementById('diagram').innerHTML = svg;
        window.parent.postMessage({ type: 'rendered' }, '*');
      } catch (e) {
        document.getElementById('diagram').innerHTML = '<div class="error">Error: ' + e.message + '</div>';
        window.parent.postMessage({ type: 'error', message: e.message }, '*');
      }
    }
    render();
  </script>
</body>
</html>`;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'rendered') {
          setLoading(false);
          setError(null);
        } else if (event.data?.type === 'error') {
          setLoading(false);
          setError(event.data.message);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [code]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: bgColor }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Rendering diagram...
            </Text>
          </View>
        )}
        <iframe
          ref={iframeRef}
          srcDoc={html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: bgColor,
          }}
          sandbox="allow-scripts"
          onLoad={() => setLoading(false)}
        />
      </View>
    );
  }

  // For mobile, use WebView (imported dynamically to avoid web errors)
  const WebView = require('react-native-webview').WebView;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={[styles.webview, { backgroundColor: bgColor }]}
        scrollEnabled={true}
        bounces={true}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        scalesPageToFit={true}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: bgColor }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});

export default MermaidCanvas;

