/**
 * Network Monitor — Request tracking with latency, bandwidth, and filtering
 */
export interface RequestEntry {
    id: string; url: string; method: string; type: string;
    status: number; startTime: number; endTime: number;
    duration: number; size: number; initiator: string;
}

export class NetworkMonitor {
    private entries: RequestEntry[] = [];
    private maxEntries: number;
    private listeners: Array<(entry: RequestEntry) => void> = [];
    private active = false;

    constructor(maxEntries: number = 500) { this.maxEntries = maxEntries; }

    /** Start monitoring */
    start(): this {
        if (this.active) return this;
        this.active = true;

        chrome.webRequest.onBeforeRequest.addListener(
            (details) => {
                this.entries.push({
                    id: String(details.requestId), url: details.url,
                    method: details.method, type: details.type,
                    status: 0, startTime: details.timeStamp, endTime: 0,
                    duration: 0, size: 0, initiator: details.initiator || '',
                });
                if (this.entries.length > this.maxEntries) this.entries.shift();
            },
            { urls: ['<all_urls>'] }
        );

        chrome.webRequest.onCompleted.addListener(
            (details) => {
                const entry = this.entries.find((e) => e.id === String(details.requestId));
                if (entry) {
                    entry.status = details.statusCode;
                    entry.endTime = details.timeStamp;
                    entry.duration = entry.endTime - entry.startTime;
                    this.listeners.forEach((fn) => fn(entry));
                }
            },
            { urls: ['<all_urls>'] }
        );

        chrome.webRequest.onErrorOccurred.addListener(
            (details) => {
                const entry = this.entries.find((e) => e.id === String(details.requestId));
                if (entry) { entry.status = -1; entry.endTime = details.timeStamp; entry.duration = entry.endTime - entry.startTime; }
            },
            { urls: ['<all_urls>'] }
        );

        return this;
    }

    /** Listen for completed requests */
    onRequest(callback: (entry: RequestEntry) => void): () => void {
        this.listeners.push(callback);
        return () => { this.listeners = this.listeners.filter((fn) => fn !== callback); };
    }

    /** Get all entries */
    getEntries(): RequestEntry[] { return [...this.entries]; }

    /** Filter by resource type */
    filterByType(type: string): RequestEntry[] { return this.entries.filter((e) => e.type === type); }

    /** Filter by domain */
    filterByDomain(domain: string): RequestEntry[] { return this.entries.filter((e) => e.url.includes(domain)); }

    /** Filter by status code range */
    filterByStatus(min: number, max: number): RequestEntry[] {
        return this.entries.filter((e) => e.status >= min && e.status <= max);
    }

    /** Get slowest requests */
    getSlowest(count: number = 10): RequestEntry[] {
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
