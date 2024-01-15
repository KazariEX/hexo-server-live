hexo.extend.filter.register("server_middleware", async (app) => {
    const { basename, extname } = require("path");
    const log = require("hexo-log").default({
        debug: false,
        silent: false
    });

    const route = "/live-reload";
    const eventName = "change";
    const styleExts = [
        "css",
        "less",
        "sass",
        "scss",
        "styl"
    ];
    const {
        delay = 150
    } = hexo.config.live_reload ?? {};

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

        const ext = extname(event.path);
        let path = "/" + event.path;
        let type = "other";

        if (styleExts.includes(ext.slice(1))) {
            path = path.replace(new RegExp(`${ext}$`), ".css");
            type = "style";
        }

        log.info("Refreshing browser due to changes...");
        setTimeout(() => {
            for (const res of resCollection) {
                if (res.closed) {
                    resCollection.delete(res);
                }
                else {
                    res.write(`event: ${eventName}\n`);
                    res.write(`data: ${JSON.stringify({
                        path,
                        type
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

            if (data.type === "style") {
                const links = document.querySelectorAll("link");
                for (const link of links) {
                    const url = new URL(link.href);
                    if (url.host === location.host && url.pathname === data.path) {
                        const next = link.cloneNode();
                        next.href = data.path + "?" + Math.random().toString(36).slice(2);
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
    </script>`);
});