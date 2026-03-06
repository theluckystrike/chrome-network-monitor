# chrome-network-monitor

[![npm version](https://img.shields.io/npm/v/chrome-network-monitor)](https://npmjs.com/package/chrome-network-monitor)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![CI Status](https://github.com/theluckystrike/chrome-network-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/theluckystrike/chrome-network-monitor/actions)

Network request monitoring for Chrome extensions built on the webRequest API. Intercept requests, measure latency, filter by type or domain or status code, pull aggregate stats, and export data as JSON. Works with Manifest V3.

INSTALL

```bash
npm install chrome-network-monitor
```

QUICK START

```typescript
import { NetworkMonitor } from 'chrome-network-monitor';

const monitor = new NetworkMonitor().start();

monitor.onRequest((entry) => {
  console.log(entry.method, entry.url, entry.duration + 'ms');
});
```

The constructor accepts an optional maxEntries parameter (default 500) that caps how many requests are kept in memory. Oldest entries are dropped first.

```typescript
const monitor = new NetworkMonitor(1000).start();
```

API

NetworkMonitor class

- start() - Begin listening to chrome.webRequest events. Returns the monitor instance for chaining.
- onRequest(callback) - Register a listener that fires when a request completes. Returns an unsubscribe function.
- getEntries() - Returns a copy of all tracked RequestEntry objects.
- filterByType(type) - Filter entries by resource type (e.g. "xmlhttprequest", "script", "image").
- filterByDomain(domain) - Filter entries whose URL contains the given domain string.
- filterByStatus(min, max) - Filter entries by HTTP status code range.
- getSlowest(count) - Returns the top N slowest requests sorted by duration. Defaults to 10.
- getFailed() - Returns all entries with status >= 400 or status -1 (network error).
- getStats() - Returns an object with total request count, average latency, failure count, and a breakdown by resource type.
- clear() - Remove all stored entries.
- export() - Serialize all entries to a formatted JSON string.

RequestEntry interface

```typescript
interface RequestEntry {
  id: string;
  url: string;
  method: string;
  type: string;
  status: number;
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  initiator: string;
}
```

EXAMPLES

Filter and inspect

```typescript
// Get all failed requests
const failed = monitor.getFailed();

// Get XHR requests only
const xhrRequests = monitor.filterByType('xmlhttprequest');

// Get requests to a specific domain
const apiCalls = monitor.filterByDomain('api.example.com');

// Get requests with 5xx status codes
const serverErrors = monitor.filterByStatus(500, 599);
```

Stats and performance

```typescript
const stats = monitor.getStats();
// {
//   total: 142,
//   avgLatency: 230,
//   failed: 3,
//   byType: { xmlhttprequest: 45, script: 30, image: 67 }
// }

const slowest = monitor.getSlowest(5);
```

Subscribe and unsubscribe

```typescript
const unsubscribe = monitor.onRequest((entry) => {
  if (entry.duration > 2000) {
    console.warn('Slow request detected', entry.url);
  }
});

// Later, stop listening
unsubscribe();
```

Export data

```typescript
const json = monitor.export();
// Save to file, send to server, etc.
```

PERMISSIONS

Your Chrome extension manifest needs the webRequest permission and a host pattern.

```json
{
  "permissions": ["webRequest"],
  "host_permissions": ["<all_urls>"]
}
```

DEVELOPMENT

```bash
git clone https://github.com/theluckystrike/chrome-network-monitor.git
cd chrome-network-monitor
npm install
npm run build
```

CONTRIBUTING

See CONTRIBUTING.md for guidelines on submitting issues and pull requests.

LICENSE

MIT. See LICENSE for the full text.

---

Built by theluckystrike. Part of the zovo.one ecosystem.
