import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createRecommendationServer } from "../src/server.js";
import { fixtureMovies } from "../src/catalog.js";
import { createAnalyticsStore } from "../src/analytics-store.js";

async function withServer(run, options = {}) {
  const server = createRecommendationServer({ catalog: fixtureMovies, source: "fixture", ...options });
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
    assert.equal(body.catalogSource, "fixture");
    assert.equal(body.castProfiles, 6);
  });
});

test("serves the CineMatch interface", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(baseUrl);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(body, /CineMatch/);
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
    assert.equal(body.rankingVersion, "personalized-diversity-v2");
    assert.equal(typeof body.movieId, "string");
    assert.equal(body.movie.id, body.movieId);
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

test("builds adaptive actor choices from earlier answers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/options`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "actors",
        request: {
          region: "US",
          runtimeMaxMinutes: 150,
          moods: ["tense"],
          pace: "balanced",
          company: "friends",
          actorIds: [],
          serviceIds: ["netflix"]
        }
      })
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.kind, "actors");
    assert.ok(body.candidateMovieCount > 0);
    assert.ok(body.options.some((option) => option.value === "person-daniel-craig"));
    assert.ok(body.options.filter((option) => option.value !== "any").every((option) => option.image?.startsWith("https://")));
    assert.equal(body.options.at(-1).value, "any");
  });
});

test("accepts anonymous journey events and serves the developer summary", async () => {
  const analytics = createAnalyticsStore();
  await withServer(async (baseUrl) => {
    const eventResponse = await fetch(`${baseUrl}/api/analytics/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "session_started", sessionId: "session-test", properties: { entryPoint: "home" } })
    });
    assert.equal(eventResponse.status, 202);

    const response = await fetch(`${baseUrl}/api/analytics/summary`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.sessionCount, 1);
    assert.equal(body.funnel[0].count, 1);
    assert.equal(body.recentSessions[0].sessionId, "session-");
  }, { analytics });
});
