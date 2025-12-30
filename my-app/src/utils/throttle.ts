/**
 * Creates a throttled function that only invokes the provided function at most once per every wait milliseconds.
 * 
 * @param fn - The function to throttle
 * @param wait - The number of milliseconds to wait between invocations
 * @param options - Options for leading/trailing edge execution
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    wait: number = 500,
    options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
    const { leading = true, trailing = true } = options;
    let timeoutId: NodeJS.Timeout | null = null;
    let lastCallTime: number | null = null;
    let lastArgs: Parameters<T> | null = null;

    return function throttled(...args: Parameters<T>) {
        const now = Date.now();
        
        // First call or enough time has passed
        if (lastCallTime === null && !leading) {
            lastCallTime = now;
        }

        const remaining = lastCallTime !== null ? wait - (now - lastCallTime) : 0;

        if (remaining <= 0 || remaining > wait) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            lastCallTime = now;
            fn(...args);
        } else if (!timeoutId && trailing) {
            lastArgs = args;
            timeoutId = setTimeout(() => {
                lastCallTime = leading ? Date.now() : null;
                timeoutId = null;
                if (lastArgs) {
                    fn(...lastArgs);
                    lastArgs = null;
                }
            }, remaining);
        }
    };
}

/**
 * Creates a debounced function that delays invoking the provided function until after wait milliseconds have elapsed since the last time it was invoked.
 * 
 * @param fn - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    wait: number = 300
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return function debounced(...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, wait);
    };
}

export default { throttle, debounce };

