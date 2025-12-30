/**
 * Mermaid Mind Map Renderer
 * Renders Mermaid diagrams using WebView for cross-platform support
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface MermaidRendererProps {
  code: string;
  isDark?: boolean;
  onError?: (error: string) => void;
  style?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  code,
  isDark = false,
  onError,
  style,
}) => {
  // Generate HTML content with Mermaid
  const htmlContent = useMemo(() => {
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const nodeColor = isDark ? '#334155' : '#f1f5f9';
    const borderColor = isDark ? '#475569' : '#cbd5e1';

    // Escape the code for safe embedding
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      background-color: ${bgColor};
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 20px;
      min-height: 100vh;
    }
    #container {
      width: 100%;
      min-width: 300px;
      display: flex;
      justify-content: center;
    }
    #mermaid-diagram {
      width: 100%;
      overflow: visible;
    }
    #mermaid-diagram svg {
      max-width: 100%;
      height: auto;
    }
    .error {
      color: #ef4444;
      padding: 20px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .loading {
      color: ${textColor};
      padding: 40px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    /* Mind map specific styles */
    .mindmap-node rect,
    .mindmap-node circle,
    .mindmap-node polygon,
    .mindmap-node path {
      fill: ${nodeColor} !important;
      stroke: ${borderColor} !important;
    }
    .mindmap-node .nodeLabel {
      color: ${textColor} !important;
      fill: ${textColor} !important;
    }
    .edge path {
      stroke: ${borderColor} !important;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="mermaid-diagram" class="loading">Loading diagram...</div>
  </div>
  <script>
    // Initialize mermaid with theme
    mermaid.initialize({
      startOnLoad: false,
      theme: '${isDark ? 'dark' : 'default'}',
      themeVariables: {
        primaryColor: '${isDark ? '#6366f1' : '#818cf8'}',
        primaryTextColor: '${textColor}',
        primaryBorderColor: '${borderColor}',
        lineColor: '${borderColor}',
        secondaryColor: '${nodeColor}',
        tertiaryColor: '${bgColor}',
        background: '${bgColor}',
        mainBkg: '${nodeColor}',
        nodeBkg: '${nodeColor}',
        nodeBorder: '${borderColor}',
        clusterBkg: '${bgColor}',
        titleColor: '${textColor}',
        edgeLabelBackground: '${bgColor}',
      },
      mindmap: {
        useMaxWidth: false,
        padding: 20,
      },
      securityLevel: 'loose',
    });

    const diagram = document.getElementById('mermaid-diagram');
    const code = \`${escapedCode}\`;

    async function renderDiagram() {
      try {
        if (!code.trim()) {
          diagram.innerHTML = '<div class="loading">No diagram to display</div>';
          return;
        }
        
        const { svg } = await mermaid.render('mindmap-svg', code);
        diagram.innerHTML = svg;
        diagram.classList.remove('loading');
        
        // Notify success
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success' }));
        }
      } catch (error) {
        console.error('Mermaid error:', error);
        diagram.innerHTML = '<div class="error">Error rendering diagram: ' + error.message + '</div>';
        
        // Notify error
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'error', 
            message: error.message 
          }));
        }
      }
    }

    // Render on load
    document.addEventListener('DOMContentLoaded', renderDiagram);
    renderDiagram();
  </script>
</body>
</html>
    `.trim();
  }, [code, isDark]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'error' && onError) {
        onError(data.message);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [onError]);

  if (!code.trim()) {
    return (
      <View style={[styles.container, styles.empty, style]}>
        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
          No mind map to display
        </Text>
        <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
          Start a conversation to create your mind map
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={true}
        bounces={true}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <ActivityIndicator size="large" color={isDark ? '#818cf8' : '#6366f1'} />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Rendering mind map...
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  loadingTextDark: {
    color: '#94a3b8',
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#94a3b8',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtextDark: {
    color: '#64748b',
  },
});

export default MermaidRenderer;

