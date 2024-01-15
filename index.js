hexo.extend.filter.register("server_middleware", async (app) => {
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
        for (const res of resCollection) {
            if (res.closed) {
                resCollection.delete(res);
            }
            else {
                res.write(`event: ${eventName}\n`);
                res.write("data: \n\n");
            }
        }
    });

    hexo.extend.injector.register("body_end", () => {
        return /*HTML*/`
        <script type="module">
            const es = new EventSource("${route}");
            es.addEventListener("${eventName}", () => {
                setTimeout(() => {
                    if ("pjax" in window) {
                        pjax.loadUrl(location.href);
                    }
                    else {
                        location.reload();
                    }
                }, ${delay});
            });
        </script>
    `;});
});