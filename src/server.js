import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { movies } from "./catalog.js";
import { recommend, RecommendationError, RANKING_VERSION } from "./recommendation-engine.js";

const MAX_BODY_BYTES = 100_000;
const staticAssets = new Map([
  ["/", { contentType: "text/html; charset=utf-8", body: readFileSync(new URL("../dist/index.html", import.meta.url)) }],
  ["/index.html", { contentType: "text/html; charset=utf-8", body: readFileSync(new URL("../dist/index.html", import.meta.url)) }],
  ["/app.js", { contentType: "text/javascript; charset=utf-8", body: readFileSync(new URL("../dist/app.js", import.meta.url)) }],
  ["/styles.css", { contentType: "text/css; charset=utf-8", body: readFileSync(new URL("../dist/styles.css", import.meta.url)) }],
  ["/assets/cinematic-night.png", { contentType: "image/png", body: readFileSync(new URL("../dist/assets/cinematic-night.png", import.meta.url)) }]
]);

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function sendStatic(response, asset) {
  response.writeHead(200, {
    "content-type": asset.contentType,
    "cache-control": "no-store"
  });
  response.end(asset.body);
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      throw new RecommendationError("Request body is too large.", "REQUEST_TOO_LARGE", 413);
    }
  }

  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new RecommendationError("Request body must be valid JSON.", "INVALID_JSON");
  }
}

export function createRecommendationServer() {
  return createServer(async (request, response) => {
    if (request.method === "GET" && staticAssets.has(request.url)) {
      sendStatic(response, staticAssets.get(request.url));
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, {
        service: "cinematch-recommendation-service",
        status: "ok",
        rankingVersion: RANKING_VERSION,
        catalogSize: movies.length
      });
      return;
    }

    if (request.method === "POST" && request.url === "/api/recommend") {
      try {
        sendJson(response, 200, recommend(await readJson(request)));
      } catch (error) {
        if (error instanceof RecommendationError) {
          sendJson(response, error.status, { error: { code: error.code, message: error.message } });
          return;
        }
        sendJson(response, 500, { error: { code: "INTERNAL_ERROR", message: "Recommendation failed." } });
      }
      return;
    }

    sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Route not found." } });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  createRecommendationServer().listen(port, "127.0.0.1", () => {
    console.log(`CineMatch is running at http://127.0.0.1:${port}`);
  });
}
