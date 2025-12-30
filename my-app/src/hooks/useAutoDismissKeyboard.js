import { useRef, useCallback } from 'react';
import { Keyboard } from 'react-native';

/**
 * Custom hook to auto-dismiss the keyboard after a typing pause.
 * @param {Function} callback - The state setter or function to call on text change.
 * @param {number} delay - The delay in milliseconds before dismissing keyboard (default 1250ms).
 * @returns {Function} - The enhanced onChangeText handler.
 */
export const useAutoDismissKeyboard = (callback, delay = 1250) => {
    const timeoutRef = useRef(null);

    const handleChange = useCallback((text) => {
        // Execute original callback if provided
        if (callback) {
            callback(text);
        }

        // Reset timer
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timer
        timeoutRef.current = setTimeout(() => {
            console.log('AutoDismissKeyboard: Dismissing keyboard now...');
            Keyboard.dismiss();
        }, delay);
    }, [callback, delay]);

    return handleChange;
};
