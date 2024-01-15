hexo.extend.filter.register("server_middleware", async (app) => {
    const { basename, extname } = require("path");
    const log = require("hexo-log").default({
        debug: false,
        silent: false
    });

    const route = "/live-reload";
    const eventName = "change";
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

    const onProcessAfter = function(event) {
        if (event.type === "skip") return;

        const ext = extname(event.path);
        const output = hexo.extend.renderer.getOutput(event.path);
        let path = "/" + event.path.replace(/^source\//, "");
        let type = "other";

        if (output === "css") {
            path = path.replace(ext, ".css");
            type = "style";
        }

        log.info("Reloading due to changes...");
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
    }

    hexo.source.on("processAfter", onProcessAfter);

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