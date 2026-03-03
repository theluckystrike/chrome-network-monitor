# chrome-network-monitor — Network Request Monitor

[![npm version](https://img.shields.io/npm/v/chrome-network-monitor)](https://npmjs.com/package/chrome-network-monitor)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Chrome Web Extension](https://img.shields.io/badge/Chrome-Web%20Extension-orange.svg)](https://developer.chrome.com/docs/extensions/)
[![CI Status](https://github.com/theluckystrike/chrome-network-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/theluckystrike/chrome-network-monitor/actions)
[![Discord](https://img.shields.io/badge/Discord-Zovo-blueviolet.svg?logo=discord)](https://discord.gg/zovo)
[![Website](https://img.shields.io/badge/Website-zovo.one-blue)](https://zovo.one)
[![GitHub Stars](https://img.shields.io/github/stars/theluckystrike/chrome-network-monitor?style=social)](https://github.com/theluckystrike/chrome-network-monitor)

> Track requests via webRequest API with latency, filtering by type/domain/status, stats, and export.

**chrome-network-monitor** provides network request monitoring for Chrome extensions. Track requests with latency metrics, filter by type/domain/status, get statistics, and export data.

Part of the [Zovo](https://zovo.one) developer tools family.

## Features

- ✅ **Request Tracking** - Monitor all network requests
- ✅ **Latency Metrics** - Track request duration
- ✅ **Filtering** - Filter by type, domain, status
- ✅ **Statistics** - Get network statistics
- ✅ **Export** - Export request data
- ✅ **TypeScript Support** - Full type definitions included

## Installation

```bash
npm install chrome-network-monitor
```

## Usage

```typescript
import { NetworkMonitor } from 'chrome-network-monitor';

const monitor = new NetworkMonitor().start();

// Listen for requests
monitor.onRequest((entry) => {
  console.log(`${entry.url} ${entry.duration}ms`);
});

// Get slowest requests
const slowest = monitor.getSlowest(10);

// Get statistics
const stats = monitor.getStats();
```

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/network-feature`
3. **Make** your changes
4. **Test** your changes: `npm test`
5. **Commit** your changes: `git commit -m 'Add new feature'`
6. **Push** to the branch: `git push origin feature/network-feature`
7. **Submit** a Pull Request

## See Also

### Related Zovo Repositories

- [webext-privacy-guard](https://github.com/theluckystrike/webext-privacy-guard) - Privacy utilities
- [webext-url-parser](https://github.com/theluckystrike/webext-url-parser) - URL utilities

### Zovo Chrome Extensions

- [Zovo Tab Manager](https://chrome.google.com/webstore/detail/zovo-tab-manager) - Manage tabs efficiently
- [Zovo Focus](https://chrome.google.com/webstore/detail/zovo-focus) - Block distractions

Visit [zovo.one](https://zovo.one) for more information.

## License

MIT — [Zovo](https://zovo.one)

---

*Built by developers, for developers. No compromises on privacy.*
