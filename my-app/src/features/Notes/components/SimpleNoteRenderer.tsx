import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native';

interface SimpleNoteRendererProps {
    content: string;
    theme?: 'light' | 'dark';
    fontSize?: number;
}

export const SimpleNoteRenderer: React.FC<SimpleNoteRendererProps> = ({
    content,
    theme = 'light',
    fontSize = 16,
}) => {
    const isDark = theme === 'dark';

    const colors = {
        text: isDark ? '#e0e0e0' : '#1a1a1a',
        heading: isDark ? '#ffffff' : '#111111',
        quote: isDark ? '#9ca3af' : '#6b7280',
        quoteBorder: isDark ? '#6366f1' : '#4f46e5',
        codeBg: isDark ? '#1e1e2e' : '#f3f4f6',
        codeText: isDark ? '#e0e0e0' : '#374151',
        divider: isDark ? '#374151' : '#e5e7eb',
        bullet: isDark ? '#9ca3af' : '#6b7280',
        checkbox: isDark ? '#6366f1' : '#4f46e5',
        checkboxUnchecked: isDark ? '#4b5563' : '#d1d5db',
    };

    if (!content) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.bullet }]}>
                    No content
                </Text>
            </View>
        );
    }

    const lines = content.split('\n');

    const renderLine = (line: string, index: number) => {
        const key = `line-${index}`;

        // Heading 1
        if (line.startsWith('# ')) {
            return (
                <Text key={key} style={[styles.h1, { color: colors.heading, fontSize: fontSize + 12 }]}>
                    {line.substring(2)}
                </Text>
            );
        }

        // Heading 2
        if (line.startsWith('## ')) {
            return (
                <Text key={key} style={[styles.h2, { color: colors.heading, fontSize: fontSize + 6 }]}>
                    {line.substring(3)}
                </Text>
            );
        }

        // Heading 3
        if (line.startsWith('### ')) {
            return (
                <Text key={key} style={[styles.h3, { color: colors.heading, fontSize: fontSize + 2 }]}>
                    {line.substring(4)}
                </Text>
            );
        }

        // Divider
        if (line.trim() === '---') {
            return <View key={key} style={[styles.divider, { backgroundColor: colors.divider }]} />;
        }

        // Bullet point
        if (line.startsWith('• ')) {
            return (
                <View key={key} style={styles.bulletItem}>
                    <Text style={[styles.bulletPoint, { color: colors.bullet }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.text, fontSize }]}>
                        {line.substring(2)}
                    </Text>
                </View>
            );
        }

        // Numbered list (matches "1. ", "2. ", etc.)
        const numberMatch = line.match(/^(\d+)\.\s/);
        if (numberMatch) {
            return (
                <View key={key} style={styles.bulletItem}>
                    <Text style={[styles.numberPoint, { color: colors.bullet }]}>{numberMatch[1]}.</Text>
                    <Text style={[styles.bulletText, { color: colors.text, fontSize }]}>
                        {line.substring(numberMatch[0].length)}
                    </Text>
                </View>
            );
        }

        // Checkbox unchecked
        if (line.startsWith('☐ ')) {
            return (
                <View key={key} style={styles.todoItem}>
                    <View style={[styles.checkbox, { borderColor: colors.checkboxUnchecked }]} />
                    <Text style={[styles.todoText, { color: colors.text, fontSize }]}>
                        {line.substring(2)}
                    </Text>
                </View>
            );
        }

        // Checkbox checked
        if (line.startsWith('☑ ') || line.startsWith('✓ ')) {
            return (
                <View key={key} style={styles.todoItem}>
                    <View style={[styles.checkbox, styles.checkboxChecked, { backgroundColor: colors.checkbox, borderColor: colors.checkbox }]}>
                        <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text style={[styles.todoText, styles.todoChecked, { color: colors.text, fontSize }]}>
                        {line.substring(2)}
                    </Text>
                </View>
            );
        }

        // Quote
        if (line.startsWith('> ')) {
            return (
                <View key={key} style={[styles.quote, { borderLeftColor: colors.quoteBorder }]}>
                    <Text style={[styles.quoteText, { color: colors.quote, fontSize }]}>
                        {line.substring(2)}
                    </Text>
                </View>
            );
        }

        // Code block start/end
        if (line.trim() === '```') {
            return null; // We'll handle multi-line code blocks differently
        }

        // Inline code (text between backticks)
        if (line.includes('`')) {
            const parts = line.split(/(`[^`]+`)/g);
            return (
                <Text key={key} style={[styles.paragraph, { color: colors.text, fontSize }]}>
                    {parts.map((part, i) => {
                        if (part.startsWith('`') && part.endsWith('`')) {
                            return (
                                <Text key={i} style={[styles.inlineCode, { backgroundColor: colors.codeBg, color: colors.codeText }]}>
                                    {part.slice(1, -1)}
                                </Text>
                            );
                        }
                        return part;
                    })}
                </Text>
            );
        }

        // Empty line
        if (line.trim() === '') {
            return <View key={key} style={styles.emptyLine} />;
        }

        // Regular paragraph
        return (
            <Text key={key} style={[styles.paragraph, { color: colors.text, fontSize }]}>
                {line}
            </Text>
        );
    };

    // Handle code blocks
    const processedContent: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];

    lines.forEach((line, index) => {
        if (line.trim() === '```') {
            if (inCodeBlock) {
                // End of code block
                processedContent.push(
                    <View key={`code-${index}`} style={[styles.codeBlock, { backgroundColor: colors.codeBg }]}>
                        <Text style={[styles.codeText, { color: colors.codeText }]}>
                            {codeBlockLines.join('\n')}
                        </Text>
                    </View>
                );
                codeBlockLines = [];
            }
            inCodeBlock = !inCodeBlock;
        } else if (inCodeBlock) {
            codeBlockLines.push(line);
        } else {
            const rendered = renderLine(line, index);
            if (rendered) {
                processedContent.push(rendered);
            }
        }
    });

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>{processedContent}</View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
    paragraph: {
        marginBottom: 8,
        lineHeight: 24,
    },
    h1: {
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 12,
        lineHeight: 36,
    },
    h2: {
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 10,
        lineHeight: 30,
    },
    h3: {
        fontWeight: '600',
        marginTop: 14,
        marginBottom: 8,
        lineHeight: 26,
    },
    divider: {
        height: 2,
        marginVertical: 16,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingRight: 16,
    },
    bulletPoint: {
        width: 20,
        fontSize: 16,
    },
    numberPoint: {
        width: 24,
        fontSize: 14,
    },
    bulletText: {
        flex: 1,
        lineHeight: 22,
    },
    todoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#6366f1',
    },
    checkmark: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    todoText: {
        flex: 1,
        lineHeight: 22,
    },
    todoChecked: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    quote: {
        marginVertical: 8,
        paddingLeft: 16,
        borderLeftWidth: 4,
    },
    quoteText: {
        fontStyle: 'italic',
        lineHeight: 22,
    },
    codeBlock: {
        padding: 16,
        borderRadius: 8,
        marginVertical: 12,
    },
    codeText: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
        lineHeight: 20,
    },
    inlineCode: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    emptyLine: {
        height: 12,
    },
});

export default SimpleNoteRenderer;

