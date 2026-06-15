"""Single-port server: serves the exported web app + proxies API calls."""
import http.server
import json
import os
import urllib.request
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8082
BACKEND = "http://localhost:8000"
DIST = os.path.join(os.path.dirname(__file__), "dist")


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = super().translate_path(path)
        root = os.path.abspath(DIST)
        if not path.startswith(root):
            path = root + path[len(os.path.commonpath([root, path])):]
        return path

    def proxy_request(self, method):
        url = f"{BACKEND}{self.path}"
        try:
            body = self.rfile.read(int(self.headers.get("Content-Length", 0))) if self.headers.get("Content-Length") else None
            req = urllib.request.Request(url, data=body, method=method)
            for k, v in self.headers.items():
                if k.lower() in ("host", "content-length", "transfer-encoding"):
                    continue
                req.add_header(k, v)
            with urllib.request.urlopen(req) as resp:
                self.send_response(resp.status)
                for k, v in resp.getheaders():
                    if k.lower() in ("transfer-encoding", "content-encoding"):
                        continue
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(resp.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_error(502, f"Proxy error: {e}")

    do_GET = lambda self: self.proxy_request("GET")
    do_POST = lambda self: self.proxy_request("POST")
    do_OPTIONS = lambda self: (
        self.send_response(204),
        self.send_header("Access-Control-Allow-Origin", "*"),
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
        self.send_header("Access-Control-Allow-Headers", "Content-Type"),
        self.end_headers(),
    )


if __name__ == "__main__":
    os.chdir(DIST)
    server = http.server.HTTPServer(("0.0.0.0", PORT), ProxyHandler)
    print(f"Eventoon on http://0.0.0.0:{PORT}  (API proxied to {BACKEND})")
    server.serve_forever()
