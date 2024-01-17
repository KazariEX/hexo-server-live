# hexo-server-live

[![NPM version](https://badge.fury.io/js/hexo-server-live.svg)](https://www.npmjs.com/package/hexo-server-live)
[![NPM download](https://img.shields.io/npm/dt/hexo-server-live)](https://www.npmjs.com/package/hexo-server-live)

Live reload when source files change for [Hexo]. Support PJAX and Hot-reloading CSS.

## Installation

```bash
$ npm i -D hexo-server-live
```

## Usage

```bash
$ hexo server
```

## Options

```yaml
live_reload:
    delay: 0
    info: true
    retry: 3000
```

- **delay**: Reload delay after file updates
- **info**: Whether to print information when file updates
- **retry**: Delay for retrying to connect SSE

## License

MIT

[hexo]: https://hexo.io