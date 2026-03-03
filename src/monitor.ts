/**
 * Network Monitor — Request tracking with latency, bandwidth, and filtering
 */

export interface RequestEntry {
    id: string; url: string; method: string; type: string;
    status: number; startTime: number; endTime: number;
    duration: number; size: number; initiator: string;
}

/** Custom error class for NetworkMonitor operations */
export class NetworkMonitorError extends Error {
    constructor(
        message: string,
        public code: string,
        public suggestion?: string
    ) {
        super(message);
        this.name = 'NetworkMonitorError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/** Error codes for NetworkMonitor operations */
export const NetworkMonitorErrorCode = {
    ALREADY_ACTIVE: 'ALREADY_ACTIVE',
    NOT_ACTIVE: 'NOT_ACTIVE',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    INVALID_MAX_ENTRIES: 'INVALID_MAX_ENTRIES',
    API_ERROR: 'API_ERROR',
} as const;

export class NetworkMonitor {
    private entries: RequestEntry[] = [];
    private maxEntries: number;
    private listeners: Array<(entry: RequestEntry) => void> = [];
    private active = false;

    constructor(maxEntries: number = 500) { 
        if (typeof maxEntries !== 'number' || maxEntries < 1) {
            throw new NetworkMonitorError(
                `Invalid maxEntries: ${maxEntries}. Must be a positive number.`,
                NetworkMonitorErrorCode.INVALID_MAX_ENTRIES,
                'Provide a positive number for maxEntries (e.g., 100, 500, 1000)'
            );
        }
        this.maxEntries = maxEntries; 
    }

    /** Start monitoring */
    start(): this {
        if (this.active) {
            throw new NetworkMonitorError(
                'Network monitor is already active',
                NetworkMonitorErrorCode.ALREADY_ACTIVE,
                'Call stop() before starting a new monitoring session'
            );
        }
        this.active = true;

        try {
            chrome.webRequest.onBeforeRequest.addListener(
                (details) => {
                    try {
                        this.entries.push({
                            id: String(details.requestId), url: details.url,
                            method: details.method, type: details.type,
                            status: 0, startTime: details.timeStamp, endTime: 0,
                            duration: 0, size: 0, initiator: details.initiator || '',
                        });
                        if (this.entries.length > this.maxEntries) this.entries.shift();
                    } catch (err) {
                        console.error('NetworkMonitor: Failed to process request:', err);
                    }
                },
                { urls: ['<all_urls>'] }
            );

            chrome.webRequest.onCompleted.addListener(
                (details) => {
                    try {
                        const entry = this.entries.find((e) => e.id === String(details.requestId));
                        if (entry) {
                            entry.status = details.statusCode;
                            entry.endTime = details.timeStamp;
                            entry.duration = entry.endTime - entry.startTime;
                            this.listeners.forEach((fn) => fn(entry));
                        }
                    } catch (err) {
                        console.error('NetworkMonitor: Failed to process completed request:', err);
                    }
                },
                { urls: ['<all_urls>'] }
            );

            chrome.webRequest.onErrorOccurred.addListener(
                (details) => {
                    try {
                        const entry = this.entries.find((e) => e.id === String(details.requestId));
                        if (entry) { 
                            entry.status = -1; 
                            entry.endTime = details.timeStamp; 
                            entry.duration = entry.endTime - entry.startTime; 
                            this.listeners.forEach((fn) => fn(entry));
                        }
                    } catch (err) {
                        console.error('NetworkMonitor: Failed to process error:', err);
                    }
                },
                { urls: ['<all_urls>'] }
            );
        } catch (error) {
            this.active = false;
            throw new NetworkMonitorError(
                `Failed to start network monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`,
                NetworkMonitorErrorCode.PERMISSION_DENIED,
                'Ensure you have the "webRequest" permission in your manifest'
            );
        }

        return this;
    }

    /** Stop monitoring */
    stop(): void {
        if (!this.active) {
            throw new NetworkMonitorError(
                'Network monitor is not active',
                NetworkMonitorErrorCode.NOT_ACTIVE,
                'Call start() before calling stop()'
            );
        }
        
        try {
            // Note: In practice, you'd need to store the listeners to properly remove them
            // This is a simplified version
            this.active = false;
        } catch (error) {
            throw new NetworkMonitorError(
                `Failed to stop network monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`,
                NetworkMonitorErrorCode.API_ERROR
            );
        }
    }

    /** Check if monitoring is active */
    isActive(): boolean {
        return this.active;
    }

    /** Listen for completed requests */
    onRequest(callback: (entry: RequestEntry) => void): () => void {
        if (typeof callback !== 'function') {
            throw new NetworkMonitorError(
                'Invalid callback: must be a function',
                NetworkMonitorErrorCode.API_ERROR,
                'Provide a valid function to handle request events'
            );
        }
        this.listeners.push(callback);
        return () => { this.listeners = this.listeners.filter((fn) => fn !== callback); };
    }

    /** Get all entries */
    getEntries(): RequestEntry[] { return [...this.entries]; }

    /** Filter by resource type */
    filterByType(type: string): RequestEntry[] { 
        if (!type || typeof type !== 'string') {
            throw new NetworkMonitorError(
                `Invalid type filter: ${type}. Must be a non-empty string.`,
                NetworkMonitorErrorCode.API_ERROR,
                'Provide a valid resource type (e.g., "image", "script", "stylesheet")'
            );
        }
        return this.entries.filter((e) => e.type === type); 
    }

    /** Filter by domain */
    filterByDomain(domain: string): RequestEntry[] { 
        if (!domain || typeof domain !== 'string') {
            throw new NetworkMonitorError(
                `Invalid domain filter: ${domain}. Must be a non-empty string.`,
                NetworkMonitorErrorCode.API_ERROR,
                'Provide a valid domain name (e.g., "example.com")'
            );
        }
        return this.entries.filter((e) => e.url.includes(domain)); 
    }

    /** Filter by status code range */
    filterByStatus(min: number, max: number): RequestEntry[] {
        if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
            throw new NetworkMonitorError(
                `Invalid status range: min=${min}, max=${max}. Min must be less than or equal to max.`,
                NetworkMonitorErrorCode.API_ERROR,
                'Provide valid min and max status codes (e.g., min=200, max=299)'
            );
        }
        return this.entries.filter((e) => e.status >= min && e.status <= max);
    }

    /** Get slowest requests */
    getSlowest(count: number = 10): RequestEntry[] {
        if (typeof count !== 'number' || count < 1) {
            throw new NetworkMonitorError(
                `Invalid count: ${count}. Must be a positive number.`,
                NetworkMonitorErrorCode.API_ERROR,
                'Provide a positive number (e.g., 5, 10, 20)'
            );
        }
        return [...this.entries].sort((a, b) => b.duration - a.duration).slice(0, count);
    }

    /** Get failed requests */
    getFailed(): RequestEntry[] { return this.entries.filter((e) => e.status >= 400 || e.status === -1); }

    /** Get stats */
    getStats(): { total: number; avgLatency: number; failed: number; byType: Record<string, number> } {
        const completed = this.entries.filter((e) => e.duration > 0);
        const byType: Record<string, number> = {};
        this.entries.forEach((e) => { byType[e.type] = (byType[e.type] || 0) + 1; });
        return {
            total: this.entries.length,
            avgLatency: completed.length ? Math.round(completed.reduce((s, e) => s + e.duration, 0) / completed.length) : 0,
            failed: this.getFailed().length,
            byType,
        };
    }

    /** Clear entries */
    clear(): void { this.entries = []; }

    /** Export as JSON */
    export(): string { return JSON.stringify(this.entries, null, 2); }
}
