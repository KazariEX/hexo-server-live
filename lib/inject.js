module.exports = function({
    route,
    eventName,
    retry
}) {
    let es = null;
    initES();

    function initES() {
        es = new EventSource(route);
        es.addEventListener("error", () => {
            es.close();
            setTimeout(initES, retry);
        });
        es.addEventListener(eventName, (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "style") {
                const links = document.querySelectorAll("link[rel=stylesheet]");
                let fallback = false;

                do {
                    for (const link of links) {
                        const url = new URL(link.href);
                        if (url.host === location.host && (fallback || url.pathname === data.path)) {
                            const next = link.cloneNode();
                            next.href = url.pathname + "?" + Math.random().toString(36).slice(2);
                            next.onload = () => link.remove();
                            link.parentNode.insertBefore(next, link.nextSibling);
                            if (!fallback) return;
                        }
                    }
                    if (fallback) return;
                } while (fallback = true);
            }
    
            if ("pjax" in window && data.type === "other") {
                pjax.loadUrl(location.href, { history: false });
            }
            else {
                location.reload();
            }
        });
    }
}