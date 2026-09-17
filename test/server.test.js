import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createRecommendationServer } from "../src/server.js";

async function withServer(run) {
  const server = createRecommendationServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("reports service health", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(body.catalogSize, 6);
  });
});

test("serves a recommendation through the API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/recommend`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        region: "US",
        runtimeMaxMinutes: 120,
        moods: ["funny"],
        pace: "fast",
        company: "friends",
        actorIds: ["person-pedro-pascal"],
        serviceIds: []
      })
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.rankingVersion, "deterministic-v1");
    assert.equal(typeof body.movieId, "string");
  });
});

test("returns structured validation errors", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/recommend`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ region: "USA" })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "INVALID_REGION");
  });
});
