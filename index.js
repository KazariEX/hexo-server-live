hexo.extend.filter.register("server_middleware", async (app) => {
    const path = require("path");
    const pkg = require("./package.json");
    const log = require("hexo-log").default({
        debug: false,
        silent: false
    });

    const route = "/auto-refresh";
    const eventName = "change";
    const {
        delay = 150
    } = hexo.config.auto_refresh ?? {};

    const resCollection = new Set();

    app.use(route, (req, res) => {
        res.writeHead(200, {
            "access-control-allow-origin": "*",
            "content-type": "text/event-stream",
            "cache-control": "no-cache"
        });
        resCollection.add(res);
    });

    hexo.source.on("processAfter", (event) => {
        if (event.type === "skip") return;

        log.info("Refreshing browser due to changes...");
        setTimeout(() => {
            for (const res of resCollection) {
                if (res.closed) {
                    resCollection.delete(res);
                }
                else {
                    res.write(`event: ${eventName}\n`);
                    res.write(`data: ${JSON.stringify({
                        ext: path.extname(event.path),
                        path: event.path
                    })}\n\n`);
                }
            }
        }, delay);
    });

    hexo.extend.injector.register("body_end", /*HTML*/`
        <script type="module">
            const es = new EventSource("${route}");
            es.addEventListener("${eventName}", (event) => {
                const data = JSON.parse(event.data);
                const path = "/" + data.path;

                if (data.ext === ".css") {
                    const links = document.querySelectorAll("link");
                    for (const link of links) {
                        const url = new URL(link.href);
                        if (url.host === location.host && url.pathname === path) {
                            const next = link.cloneNode();
                            next.href = path + "?" + Math.random().toString(36).slice(2);
                            next.onload = () => link.remove();
                            link.parentNode.insertBefore(next, link.nextSibling);
                            return;
                        }
                    }
                }
                
                if ("pjax" in window) {
                    pjax.loadUrl(location.href, { history: false });
                }
                else {
                    location.reload();
                }
            });
        </script>
    `);
});