hexo.extend.filter.register("server_middleware", (app) => {
    const { basename, extname } = require("path");
    const pkg = require("./package.json");

    const createLog = ((fn) => {
        return (typeof fn === "function") ? fn : fn.default;
    })(require("hexo-log"));

    const log = createLog({
        name: pkg.name,
        debug: false,
        silent: false
    });

    const route = "/live-reload";
    const eventName = "change";
    const {
        delay = 0,
        info = true,
        retry = 3000
    } = hexo.config.live_reload ?? {};

    const resCollection = new Set();
    let message = "";

    app.use(route, (req, res) => {
        res.writeHead(200, {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            "connection": "keep-alive"
        });
        resCollection.add(res);
    });

    hexo.source.on("processAfter", (event) => onProcessAfter(event, "source"));
    hexo.theme.on("processAfter", (event) => onProcessAfter(event, "theme"));

    hexo.on("generateAfter", () => {
        setTimeout(() => resCollection.forEach((res) => {
            if (res.closed) {
                resCollection.delete(res);
            }
            else {
                res.write(message);
            }
        }), delay);
    });

    hexo.extend.injector.register("body_end", `<script type="module">
        (${
            require("./lib/inject").toString()
        })({
            route: "${route}",
            eventName: "${eventName}"
        });
    </script>`);

    function onProcessAfter(event, box) {
        if (event.type === "skip") return;
        if (resCollection.size === 0) return;

        const base = basename(event.path);
        const ext = extname(event.path);
        let { path } = event;
        let type;

        switch (box) {
            case "theme": {
                if (path === "_config.yml") {
                    type = "config";
                    break;
                }
                else if (!path.includes("/") || path.startsWith("scripts/")) {
                    type = null;
                    break;
                }
                else if (!path.startsWith("source/")) {
                    type = "other";
                    break;
                }
            }
            case "source": {
                const output = hexo.extend.renderer.getOutput(path);
                path = "/" + path.replace(ext, `.${output}`);
                type = {
                    css: "style",
                    js: "script"
                }[output] || "other";
                break;
            }
        }

        info && log.info("Reloading due to changes...");
        message =
            `event: ${eventName}\n` +
            `retry: ${retry}\n` +
            `data: ${JSON.stringify({ path, type })}\n\n`;
    }
});