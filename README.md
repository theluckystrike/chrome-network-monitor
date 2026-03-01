# chrome-network-monitor — Network Request Monitor
> **Built by [Zovo](https://zovo.one)** | `npm i chrome-network-monitor`

Track requests via webRequest API with latency, filtering by type/domain/status, stats, and export.

```typescript
import { NetworkMonitor } from 'chrome-network-monitor';
const monitor = new NetworkMonitor().start();
monitor.onRequest((entry) => console.log(`${entry.url} ${entry.duration}ms`));
const slowest = monitor.getSlowest(10);
const stats = monitor.getStats();
```
MIT License
