hexo.env.cmd === "server" && (async () => {
    const express = require("express");
    const fs = require("hexo-fs");
    const pkg = require("./package.json");
    const portfinder = require("portfinder");
    const { underline } = require("picocolors");

    const log = require("hexo-log").default({
        debug: false,
        silent: false
    });

    const host = "localhost";
    const route = "/auto-refresh";
    const eventName = "change";
    const {
        port: default_port = 7070,
        delay = 150
    } = hexo.config.auto_refresh ?? {};

    const app = express();
    const resSet = new Set();

    app.get(route, (req, res) => {
        res.writeHead(200, {
            "access-control-allow-origin": "*",
            "content-type": "text/event-stream",
            "cache-control": "no-cache"
        });
        resSet.add(res);
    });

    const port = await portfinder.getPortPromise({
        port: default_port
    });

    app.listen(port, host, () => {
        log.info(`${pkg.name} is running at %s`, underline(`http://${host}:${port}/`));
    });

    hexo.source.on("processAfter", (event) => {
        setTimeout(() => {
            for (const res of resSet) {
                if (res.closed) {
                    resSet.delete(res);
                }
                else {
                    res.write(`event: ${eventName}\n`);
                    res.write("data: \n\n");
                }
            }
        }, delay);
    });

    hexo.extend.injector.register("body_end", () => {
        return /*HTML*/`
        <script type="module">
            const es = new EventSource("http://${host}:${port}${route}");
            es.addEventListener("${eventName}", (event) => {
                if ("pjax" in window) {
                    pjax.loadUrl(location.href);
                }
                else {
                    location.reload();
                }
            });
        </script>
    `;});
})();