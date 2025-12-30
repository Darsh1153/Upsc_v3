import React, { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
// @ts-ignore
import { useAutoDismissKeyboard } from '../hooks/useAutoDismissKeyboard';

export interface InputProps extends TextInputProps {
    delay?: number;
}

/**
 * Universal Input Component
 * 
 * Automatically dismisses the keyboard 1.25 seconds after typing stops.
 * Use this component instead of the standard TextInput for consistency across the app.
 */
export const Input = forwardRef<TextInput, InputProps>(({ onChangeText, delay = 1250, ...props }, ref) => {
    const handleChange = useAutoDismissKeyboard(onChangeText, delay) as (text: string) => void;

    return (
        <TextInput
            ref={ref}
            {...props}
            onChangeText={handleChange}
        />
    );
});
