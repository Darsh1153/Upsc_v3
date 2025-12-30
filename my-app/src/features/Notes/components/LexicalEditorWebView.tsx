import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Platform,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { LexicalRoot, EMPTY_LEXICAL_STATE } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LexicalEditorWebViewProps {
    initialState?: LexicalRoot | null;
    onChange?: (state: LexicalRoot) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    editable?: boolean;
    minHeight?: number;
    maxHeight?: number;
    theme?: 'light' | 'dark';
}

// The HTML content for the Lexical editor
const getEditorHTML = (
    initialState: string,
    placeholder: string,
    editable: boolean,
    theme: 'light' | 'dark'
) => {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1a1a2e' : '#ffffff';
    const textColor = isDark ? '#e0e0e0' : '#1a1a1a';
    const placeholderColor = isDark ? '#666' : '#999';
    const borderColor = isDark ? '#333' : '#e0e0e0';
    const headingColor = isDark ? '#fff' : '#111';
    const linkColor = isDark ? '#6366f1' : '#4f46e5';
    const codeBlockBg = isDark ? '#0d0d1a' : '#f5f5f5';
    const blockquoteBorder = isDark ? '#6366f1' : '#4f46e5';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script src="https://unpkg.com/lexical@0.12.5/Lexical.umd.js"></script>
    <script src="https://unpkg.com/@lexical/rich-text@0.12.5/LexicalRichText.umd.js"></script>
    <script src="https://unpkg.com/@lexical/selection@0.12.5/LexicalSelection.umd.js"></script>
    <script src="https://unpkg.com/@lexical/utils@0.12.5/LexicalUtils.umd.js"></script>
    <script src="https://unpkg.com/@lexical/list@0.12.5/LexicalList.umd.js"></script>
    <script src="https://unpkg.com/@lexical/link@0.12.5/LexicalLink.umd.js"></script>
    <script src="https://unpkg.com/@lexical/code@0.12.5/LexicalCode.umd.js"></script>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        html, body {
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            background-color: ${bgColor};
            color: ${textColor};
            -webkit-text-size-adjust: none;
            -webkit-tap-highlight-color: transparent;
        }
        #editor-container {
            position: relative;
            min-height: 100%;
            padding: 12px 16px;
        }
        #editor {
            outline: none;
            min-height: 200px;
        }
        #placeholder {
            position: absolute;
            top: 12px;
            left: 16px;
            color: ${placeholderColor};
            pointer-events: none;
            user-select: none;
        }
        
        /* Typography */
        .editor-paragraph {
            margin: 0 0 8px 0;
        }
        .editor-heading-h1 {
            font-size: 28px;
            font-weight: 700;
            color: ${headingColor};
            margin: 20px 0 12px 0;
        }
        .editor-heading-h2 {
            font-size: 22px;
            font-weight: 600;
            color: ${headingColor};
            margin: 16px 0 10px 0;
        }
        .editor-heading-h3 {
            font-size: 18px;
            font-weight: 600;
            color: ${headingColor};
            margin: 14px 0 8px 0;
        }
        .editor-quote {
            margin: 12px 0;
            padding-left: 16px;
            border-left: 4px solid ${blockquoteBorder};
            font-style: italic;
            color: ${isDark ? '#aaa' : '#555'};
        }
        .editor-list-ol {
            margin: 8px 0;
            padding-left: 24px;
        }
        .editor-list-ul {
            margin: 8px 0;
            padding-left: 24px;
        }
        .editor-listitem {
            margin: 4px 0;
        }
        .editor-nested-listitem {
            list-style-type: none;
        }
        .editor-link {
            color: ${linkColor};
            text-decoration: underline;
        }
        .editor-text-bold {
            font-weight: 700;
        }
        .editor-text-italic {
            font-style: italic;
        }
        .editor-text-underline {
            text-decoration: underline;
        }
        .editor-text-strikethrough {
            text-decoration: line-through;
        }
        .editor-text-code {
            background-color: ${codeBlockBg};
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
            font-size: 14px;
        }
        .editor-code {
            background-color: ${codeBlockBg};
            padding: 12px 16px;
            border-radius: 8px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
            font-size: 14px;
            line-height: 1.5;
            overflow-x: auto;
            margin: 12px 0;
        }
        
        /* Custom nodes */
        .editor-callout {
            background-color: ${isDark ? '#1e1e3f' : '#f0f4ff'};
            border-left: 4px solid ${linkColor};
            padding: 12px 16px;
            margin: 12px 0;
            border-radius: 0 8px 8px 0;
        }
        .editor-divider {
            height: 2px;
            background: ${borderColor};
            margin: 16px 0;
            border: none;
        }
        .editor-todo {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin: 8px 0;
        }
        .editor-todo-checkbox {
            width: 18px;
            height: 18px;
            margin-top: 3px;
            accent-color: ${linkColor};
        }
        .editor-todo-checked {
            text-decoration: line-through;
            opacity: 0.6;
        }
        
        /* Toolbar */
        #toolbar {
            position: sticky;
            top: 0;
            background: ${bgColor};
            border-bottom: 1px solid ${borderColor};
            padding: 8px 12px;
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            z-index: 10;
        }
        .toolbar-btn {
            padding: 6px 10px;
            border: 1px solid ${borderColor};
            border-radius: 6px;
            background: ${isDark ? '#252540' : '#fff'};
            color: ${textColor};
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .toolbar-btn:active, .toolbar-btn.active {
            background: ${linkColor};
            color: white;
            border-color: ${linkColor};
        }
        .toolbar-divider {
            width: 1px;
            background: ${borderColor};
            margin: 0 4px;
        }
    </style>
</head>
<body>
    <div id="toolbar">
        <button class="toolbar-btn" data-format="bold"><b>B</b></button>
        <button class="toolbar-btn" data-format="italic"><i>I</i></button>
        <button class="toolbar-btn" data-format="underline"><u>U</u></button>
        <button class="toolbar-btn" data-format="strikethrough"><s>S</s></button>
        <div class="toolbar-divider"></div>
        <button class="toolbar-btn" data-format="h1">H1</button>
        <button class="toolbar-btn" data-format="h2">H2</button>
        <button class="toolbar-btn" data-format="h3">H3</button>
        <div class="toolbar-divider"></div>
        <button class="toolbar-btn" data-format="bullet">• List</button>
        <button class="toolbar-btn" data-format="number">1. List</button>
        <button class="toolbar-btn" data-format="quote">"</button>
        <button class="toolbar-btn" data-format="code">&lt;/&gt;</button>
    </div>
    <div id="editor-container">
        <div id="placeholder">${placeholder}</div>
        <div id="editor" contenteditable="${editable}"></div>
    </div>
    
    <script>
        const { createEditor, $getRoot, $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection } = lexical;
        const { registerRichText, HeadingNode, QuoteNode } = LexicalRichText;
        const { ListNode, ListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } = LexicalList;
        const { LinkNode } = LexicalLink;
        const { CodeNode, CodeHighlightNode } = LexicalCode;
        
        const initialEditorState = ${initialState};
        
        // Theme configuration
        const theme = {
            paragraph: 'editor-paragraph',
            heading: {
                h1: 'editor-heading-h1',
                h2: 'editor-heading-h2',
                h3: 'editor-heading-h3',
            },
            list: {
                nested: {
                    listitem: 'editor-nested-listitem',
                },
                ol: 'editor-list-ol',
                ul: 'editor-list-ul',
                listitem: 'editor-listitem',
            },
            quote: 'editor-quote',
            link: 'editor-link',
            text: {
                bold: 'editor-text-bold',
                italic: 'editor-text-italic',
                underline: 'editor-text-underline',
                strikethrough: 'editor-text-strikethrough',
                code: 'editor-text-code',
            },
            code: 'editor-code',
        };
        
        // Create editor with nodes
        const config = {
            namespace: 'NotesEditor',
            theme,
            nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode, CodeHighlightNode],
            editable: ${editable},
            onError: (error) => {
                console.error('Lexical Error:', error);
                sendMessage('error', { message: error.message });
            },
        };
        
        const editor = createEditor(config);
        editor.setRootElement(document.getElementById('editor'));
        
        // Register rich text
        registerRichText(editor);
        
        // Initialize state
        if (initialEditorState && initialEditorState.root) {
            const editorState = editor.parseEditorState(JSON.stringify(initialEditorState));
            editor.setEditorState(editorState);
        }
        
        // Placeholder logic
        const placeholder = document.getElementById('placeholder');
        function updatePlaceholder() {
            editor.getEditorState().read(() => {
                const root = $getRoot();
                const isEmpty = root.getChildrenSize() === 0 || 
                    (root.getChildrenSize() === 1 && root.getFirstChild()?.getTextContent() === '');
                placeholder.style.display = isEmpty ? 'block' : 'none';
            });
        }
        updatePlaceholder();
        
        // Send messages to React Native
        function sendMessage(type, data) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
            }
        }
        
        // Listen for state changes
        let changeTimeout;
        editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
            updatePlaceholder();
            
            // Debounce state updates - only send after 500ms of no changes
            clearTimeout(changeTimeout);
            changeTimeout = setTimeout(() => {
                const json = editorState.toJSON();
                sendMessage('change', json);
            }, 500);
        });
        
        // Focus/blur events
        const editorElement = document.getElementById('editor');
        editorElement.addEventListener('focus', () => sendMessage('focus', {}));
        editorElement.addEventListener('blur', () => sendMessage('blur', {}));
        
        // Toolbar actions
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const format = btn.dataset.format;
                
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    
                    switch (format) {
                        case 'bold':
                            selection.formatText('bold');
                            break;
                        case 'italic':
                            selection.formatText('italic');
                            break;
                        case 'underline':
                            selection.formatText('underline');
                            break;
                        case 'strikethrough':
                            selection.formatText('strikethrough');
                            break;
                        case 'h1':
                        case 'h2':
                        case 'h3':
                            // Would need more complex heading handling
                            break;
                        case 'bullet':
                            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                            break;
                        case 'number':
                            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                            break;
                        case 'code':
                            selection.formatText('code');
                            break;
                    }
                });
                
                editorElement.focus();
            });
        });
        
        // Receive messages from React Native
        window.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                
                switch (message.type) {
                    case 'setState':
                        if (message.data) {
                            const editorState = editor.parseEditorState(JSON.stringify(message.data));
                            editor.setEditorState(editorState);
                        }
                        break;
                    case 'focus':
                        editorElement.focus();
                        break;
                    case 'blur':
                        editorElement.blur();
                        break;
                    case 'setEditable':
                        editor.setEditable(message.data);
                        break;
                }
            } catch (e) {
                console.error('Message parse error:', e);
            }
        });
        
        // Notify ready
        sendMessage('ready', {});
    </script>
</body>
</html>
`;
};

export const LexicalEditorWebView: React.FC<LexicalEditorWebViewProps> = ({
    initialState = null,
    onChange,
    onFocus,
    onBlur,
    placeholder = 'Start typing...',
    editable = true,
    minHeight = 300,
    maxHeight = 600,
    theme = 'light',
}) => {
    const webViewRef = useRef<WebView>(null);
    const [isReady, setIsReady] = useState(false);
    const [webViewHeight, setWebViewHeight] = useState(minHeight);

    const stateToUse = initialState || EMPTY_LEXICAL_STATE;
    const htmlContent = getEditorHTML(
        JSON.stringify(stateToUse),
        placeholder,
        editable,
        theme
    );

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);

            switch (message.type) {
                case 'ready':
                    setIsReady(true);
                    break;
                case 'change':
                    if (onChange && message.data) {
                        onChange(message.data as LexicalRoot);
                    }
                    break;
                case 'focus':
                    onFocus?.();
                    break;
                case 'blur':
                    onBlur?.();
                    Keyboard.dismiss();
                    break;
                case 'error':
                    console.error('[LexicalEditor] Error:', message.data);
                    break;
            }
        } catch (e) {
            console.error('[LexicalEditor] Message parse error:', e);
        }
    }, [onChange, onFocus, onBlur]);

    const sendMessage = useCallback((type: string, data?: any) => {
        if (webViewRef.current && isReady) {
            webViewRef.current.postMessage(JSON.stringify({ type, data }));
        }
    }, [isReady]);

    // Update state from parent
    useEffect(() => {
        if (isReady && initialState) {
            sendMessage('setState', initialState);
        }
    }, [initialState, isReady, sendMessage]);

    // Update editable state
    useEffect(() => {
        sendMessage('setEditable', editable);
    }, [editable, sendMessage]);

    return (
        <View style={[styles.container, { minHeight, maxHeight }]}>
            {!isReady && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            )}
            <WebView
                ref={webViewRef}
                source={{ html: htmlContent }}
                onMessage={handleMessage}
                style={[
                    styles.webView,
                    { opacity: isReady ? 1 : 0 },
                ]}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardDisplayRequiresUserAction={false}
                hideKeyboardAccessoryView={false}
                automaticallyAdjustContentInsets={false}
                contentInsetAdjustmentBehavior="never"
                mixedContentMode="always"
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                startInLoadingState={false}
                scalesPageToFit={false}
                overScrollMode="never"
                textZoom={100}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        zIndex: 10,
    },
});

export default LexicalEditorWebView;

