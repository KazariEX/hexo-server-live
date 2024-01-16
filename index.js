hexo.extend.filter.register("server_middleware", async (app) => {
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
            "access-control-allow-origin": "*",
            "content-type": "text/event-stream",
            "cache-control": "no-cache"
        });
        resCollection.add(res);
    });

    const onProcessAfter = function (event) {
        if (event.type === "skip") return;
        if (resCollection.size === 0) return;

        const ext = extname(event.path);
        const output = hexo.extend.renderer.getOutput(event.path);
        let path = "/" + event.path.replace(/^source\//, "");
        let type = "other";

        switch (output) {
            case "css":
                path = path.replace(ext, ".css");
                type = "style";
                break;
            case "js":
                type = "script";
                break;
        }

        info && log.info("Reloading due to changes...");
        message = 
            `event: ${eventName}\n` +
            `data: ${JSON.stringify({
                path,
                type
            })}\n\n`;
    }

    hexo.source.on("processAfter", onProcessAfter);
    hexo.theme.on("processAfter", onProcessAfter);

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
            eventName: "${eventName}",
            retry: ${retry}
        });
    </script>`);
});