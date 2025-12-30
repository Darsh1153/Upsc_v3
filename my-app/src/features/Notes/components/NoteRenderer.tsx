import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Linking,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LexicalRoot, LexicalNode } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NoteRendererProps {
    content: LexicalRoot | null;
    theme?: 'light' | 'dark';
    fontSize?: number;
    showScrollView?: boolean;
}

interface TextStyle {
    fontWeight?: 'bold' | 'normal' | '700';
    fontStyle?: 'italic' | 'normal';
    textDecorationLine?: 'underline' | 'line-through' | 'underline line-through' | 'none';
    fontFamily?: string;
    backgroundColor?: string;
}

// Format flags from Lexical
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;
const IS_SUBSCRIPT = 1 << 5;
const IS_SUPERSCRIPT = 1 << 6;

const getTextStyles = (format: number = 0, isDark: boolean): TextStyle => {
    const styles: TextStyle = {};

    if (format & IS_BOLD) {
        styles.fontWeight = '700';
    }
    if (format & IS_ITALIC) {
        styles.fontStyle = 'italic';
    }
    if (format & IS_UNDERLINE) {
        styles.textDecorationLine = 'underline';
    }
    if (format & IS_STRIKETHROUGH) {
        if (styles.textDecorationLine === 'underline') {
            styles.textDecorationLine = 'underline line-through';
        } else {
            styles.textDecorationLine = 'line-through';
        }
    }
    if (format & IS_CODE) {
        styles.fontFamily = 'monospace';
        styles.backgroundColor = isDark ? '#1e1e2e' : '#f3f4f6';
    }

    return styles;
};

export const NoteRenderer: React.FC<NoteRendererProps> = ({
    content,
    theme = 'light',
    fontSize = 16,
    showScrollView = true,
}) => {
    const isDark = theme === 'dark';

    const colors = {
        text: isDark ? '#e0e0e0' : '#1a1a1a',
        heading: isDark ? '#ffffff' : '#111111',
        link: isDark ? '#818cf8' : '#4f46e5',
        quote: isDark ? '#9ca3af' : '#6b7280',
        quoteBorder: isDark ? '#6366f1' : '#4f46e5',
        codeBg: isDark ? '#1e1e2e' : '#f3f4f6',
        codeText: isDark ? '#e0e0e0' : '#374151',
        calloutBg: isDark ? '#1e1e3f' : '#eef2ff',
        divider: isDark ? '#374151' : '#e5e7eb',
        listMarker: isDark ? '#9ca3af' : '#6b7280',
        todoUnchecked: isDark ? '#4b5563' : '#d1d5db',
        todoChecked: isDark ? '#6366f1' : '#4f46e5',
    };

    const renderTextNode = (node: LexicalNode, key: string): React.ReactNode => {
        if (!node.text) return null;

        const textStyles = getTextStyles(node.format, isDark);

        return (
            <Text
                key={key}
                style={[
                    { color: colors.text, fontSize },
                    textStyles,
                    textStyles.backgroundColor && {
                        paddingHorizontal: 4,
                        borderRadius: 4,
                    },
                ]}
            >
                {node.text}
            </Text>
        );
    };

    const renderLinkNode = (node: LexicalNode, key: string): React.ReactNode => {
        const url = (node as any).url || '';
        const children = node.children || [];

        return (
            <TouchableOpacity
                key={key}
                onPress={() => url && Linking.openURL(url)}
            >
                <Text style={[styles.link, { color: colors.link, fontSize }]}>
                    {children.map((child, i) =>
                        child.text ? child.text : ''
                    ).join('')}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderChildren = (children: LexicalNode[] = [], keyPrefix: string): React.ReactNode => {
        return children.map((child, index) => {
            const key = `${keyPrefix}-${index}`;

            if (child.type === 'text') {
                return renderTextNode(child, key);
            }

            if (child.type === 'link') {
                return renderLinkNode(child, key);
            }

            if (child.type === 'linebreak') {
                return <Text key={key}>{'\n'}</Text>;
            }

            // Recursively render children for other node types
            if (child.children) {
                return renderChildren(child.children, key);
            }

            return null;
        });
    };

    const renderNode = (node: LexicalNode, key: string): React.ReactNode => {
        switch (node.type) {
            case 'root':
                return (
                    <View key={key}>
                        {node.children?.map((child, i) => renderNode(child, `${key}-${i}`))}
                    </View>
                );

            case 'paragraph':
                return (
                    <Text key={key} style={[styles.paragraph, { color: colors.text, fontSize }]}>
                        {renderChildren(node.children, key)}
                    </Text>
                );

            case 'heading': {
                const tag = (node as any).tag || 'h1';
                const headingSizes = { h1: 28, h2: 22, h3: 18, h4: 16, h5: 14, h6: 12 };
                const headingSize = headingSizes[tag as keyof typeof headingSizes] || 18;

                return (
                    <Text
                        key={key}
                        style={[
                            styles.heading,
                            {
                                fontSize: headingSize,
                                color: colors.heading,
                            },
                        ]}
                    >
                        {renderChildren(node.children, key)}
                    </Text>
                );
            }

            case 'quote':
                return (
                    <View
                        key={key}
                        style={[
                            styles.quote,
                            {
                                borderLeftColor: colors.quoteBorder,
                            },
                        ]}
                    >
                        <Text style={[{ color: colors.quote, fontSize, fontStyle: 'italic' }]}>
                            {renderChildren(node.children, key)}
                        </Text>
                    </View>
                );

            case 'code':
                return (
                    <View
                        key={key}
                        style={[styles.codeBlock, { backgroundColor: colors.codeBg }]}
                    >
                        <Text
                            style={[
                                styles.codeText,
                                { color: colors.codeText, fontSize: fontSize - 2 },
                            ]}
                        >
                            {renderChildren(node.children, key)}
                        </Text>
                    </View>
                );

            case 'list': {
                const listType = (node as any).listType;
                const isOrdered = listType === 'number';
                const start = (node as any).start || 1;

                return (
                    <View key={key} style={styles.list}>
                        {node.children?.map((item, i) => (
                            <View key={`${key}-item-${i}`} style={styles.listItem}>
                                <Text
                                    style={[
                                        styles.listMarker,
                                        { color: colors.listMarker, fontSize },
                                    ]}
                                >
                                    {isOrdered ? `${start + i}.` : '•'}
                                </Text>
                                <View style={styles.listItemContent}>
                                    <Text style={{ color: colors.text, fontSize }}>
                                        {renderChildren(item.children, `${key}-item-${i}`)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                );
            }

            case 'listitem':
                return (
                    <Text key={key} style={{ color: colors.text, fontSize }}>
                        {renderChildren(node.children, key)}
                    </Text>
                );

            // Custom nodes
            case 'callout':
                return (
                    <View
                        key={key}
                        style={[styles.callout, { backgroundColor: colors.calloutBg }]}
                    >
                        <Text style={{ color: colors.text, fontSize }}>
                            {renderChildren(node.children, key)}
                        </Text>
                    </View>
                );

            case 'divider':
            case 'horizontalrule':
                return (
                    <View
                        key={key}
                        style={[styles.divider, { backgroundColor: colors.divider }]}
                    />
                );

            case 'todo':
            case 'checklist': {
                const isChecked = (node as any).checked || false;
                return (
                    <View key={key} style={styles.todo}>
                        <View
                            style={[
                                styles.todoCheckbox,
                                {
                                    backgroundColor: isChecked
                                        ? colors.todoChecked
                                        : 'transparent',
                                    borderColor: isChecked
                                        ? colors.todoChecked
                                        : colors.todoUnchecked,
                                },
                            ]}
                        >
                            {isChecked && (
                                <Text style={styles.todoCheck}>✓</Text>
                            )}
                        </View>
                        <Text
                            style={[
                                { color: colors.text, fontSize, flex: 1 },
                                isChecked && styles.todoCheckedText,
                            ]}
                        >
                            {renderChildren(node.children, key)}
                        </Text>
                    </View>
                );
            }

            case 'text':
                return renderTextNode(node, key);

            case 'link':
                return renderLinkNode(node, key);

            default:
                // For unknown types, try to render children
                if (node.children) {
                    return (
                        <View key={key}>
                            {node.children.map((child, i) => renderNode(child, `${key}-${i}`))}
                        </View>
                    );
                }
                return null;
        }
    };

    if (!content || !content.root) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.listMarker }]}>
                    No content
                </Text>
            </View>
        );
    }

    const rendered = renderNode(content.root, 'root');

    if (showScrollView) {
        return (
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {rendered}
            </ScrollView>
        );
    }

    return <View style={styles.container}>{rendered}</View>;
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    paragraph: {
        marginBottom: 12,
        lineHeight: 24,
    },
    heading: {
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 12,
    },
    quote: {
        marginVertical: 12,
        paddingLeft: 16,
        borderLeftWidth: 4,
    },
    codeBlock: {
        padding: 16,
        borderRadius: 8,
        marginVertical: 12,
    },
    codeText: {
        fontFamily: 'monospace',
        lineHeight: 20,
    },
    list: {
        marginVertical: 8,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    listMarker: {
        width: 24,
        textAlign: 'center',
    },
    listItemContent: {
        flex: 1,
    },
    link: {
        textDecorationLine: 'underline',
    },
    callout: {
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#6366f1',
        marginVertical: 12,
    },
    divider: {
        height: 2,
        marginVertical: 16,
    },
    todo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 6,
        gap: 10,
    },
    todoCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    todoCheck: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    todoCheckedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
});

export default NoteRenderer;

