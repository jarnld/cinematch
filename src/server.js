import { createServer } from "node:http";
import { movies } from "./catalog.js";
import { recommend, RecommendationError, RANKING_VERSION } from "./recommendation-engine.js";

const MAX_BODY_BYTES = 100_000;

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
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
    console.log(`CineMatch recommendation service listening on http://127.0.0.1:${port}`);
  });
}
