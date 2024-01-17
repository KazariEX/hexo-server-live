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

        const data = transformProcessedInfo(event.path);

        info && log.info("Reloading due to changes...");
        message =
            `event: ${eventName}\n` +
            `data: ${JSON.stringify(data)}\n\n`;
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

    function transformProcessedInfo(path) {
        const base = basename(path);
        const ext = extname(path);
        let type = "other";

        const config_regex = /^_(multiconfig|config(\..+)?)\.yml/;
        if (config_regex.test(base)) {
            type = "config";
        }
        else {
            const output = hexo.extend.renderer.getOutput(path);
            path = "/" + path.replace(/^source\//, "").replace(ext, `.${output}`);
            type = {
                css: "style",
                js: "script"
            }[output];
        }
        return {
            path,
            type
        };
    }
});