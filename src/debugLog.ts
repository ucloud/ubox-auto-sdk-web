import { noop } from './utils';

const createDebugLogger = (debug?: boolean, id: string = '') => {
    if (!debug) return noop;
    return (msg: string, ...args: any[]) => {
        console.warn(`[UBOX-SDK${id}]`, msg, ...args);
    };
};
export { createDebugLogger };
