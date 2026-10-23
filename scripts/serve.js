
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const publicDirectory = path.join(__dirname, "..", "dist");
const port = Number(process.env.PORT) || 3000;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  let pathname;

  try {
    pathname = decodeURIComponent(new URL(
      request.url,
      `http://${request.headers.host || "localhost"}`
    ).pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(publicDirectory, `.${requestedPath}`);
  const relativePath = path.relative(publicDirectory, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      response.end(error.code === "ENOENT" ? "File not found" : "Server error");
      return;
    }

    const contentType =
      contentTypes[path.extname(filePath)] || "application/octet-stream";

    response.writeHead(200, { "Content-Type": contentType });
    response.end(request.method === "HEAD" ? undefined : content);
  });
});

server.listen(port, () => {
  console.log(`Student Management System running at http://localhost:${port}`);
});
