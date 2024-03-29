## v0.2.12 (2024-01-21)

- Improvement: add retry field on response.

## v0.2.11 (2024-01-20)

- Fix: return other type in source.

## v0.2.10 (2024-01-18)

- Refactor: handle source and theme box separately.

## v0.2.9 (2024-01-17)

- Improvement: handle theme config correctly.

## v0.2.8 (2024-01-16)

- Improvement: replace all stylesheets when the path does not match.

## v0.2.7 (2024-01-16)

- Pref: capture the timing accurately using the ``generateAfter`` hook.

## v0.2.6 (2024-01-16)

- Fix: close SSE when onerror.

## v0.2.5 (2024-01-16)

- Fix: require hexo-log.
- Refactor: move the injection script into a separate file.

## v0.2.4 (2024-01-16)

- Fix: auto reconnect SSE when server disconnects ([#1](https://github.com/KazariEX/hexo-server-live/pull/1)).

## v0.2.3 (2024-01-16)

- Feature: expose the option of whether to print reload info.
- Fix: disable pjax for script type.

## v0.2.2 (2024-01-16)

- Feature: listen to the theme folder.
- Improvement: check styles output extname by hexo renderer.
- Pref: do nothing when the files are first created.

## v0.2.1 (2024-01-16)

- Feature: support CSS preprocessor.

## v0.2.0 (2024-01-16)

- Feature: hot-reloading for CSS.
- Chore: rename to hexo-server-live.

## v0.1.1 (2024-01-16)

- Fix: no history with pjax.

## v0.1.0 (2024-01-16)

- Improvement: use filter ``server_middleware`` provided by hexo-server, instead of custom server.

## v0.0.3 (2024-01-16)

- Feature: support pjax.

## v0.0.2 (2024-01-16)

- Docs: init README.md.

## v0.0.1 (2024-01-16)

- Feature: support refresh browser while source file changed (base on hexo-server).