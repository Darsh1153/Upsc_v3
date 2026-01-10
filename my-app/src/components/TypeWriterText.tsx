import React, { useState, useEffect, useRef } from 'react';
import { Text, TextProps, StyleSheet, View } from 'react-native';

interface TypeWriterTextProps extends TextProps {
    text: string;
    speed?: number; // ms per char
    onComplete?: () => void;
}

export const TypeWriterText: React.FC<TypeWriterTextProps> = ({
    text,
    speed = 10,
    style,
    onComplete,
    ...props
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const index = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Reset
        setDisplayedText('');
        index.current = 0;

        const startTyping = () => {
            timerRef.current = setInterval(() => {
                if (index.current < text.length) {
                    setDisplayedText((prev) => prev + text.charAt(index.current));
                    index.current += 1;
                } else {
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (onComplete) onComplete();
                }
            }, speed);
        };

        if (text) {
            startTyping();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [text, speed, onComplete]);

    return (
        <Text style={style} {...props}>
            {displayedText}
            {index.current < text.length && <Text style={{ color: '#6366F1' }}>|</Text>}
        </Text>
    );
};
