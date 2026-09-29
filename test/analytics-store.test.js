import test from "node:test";
import assert from "node:assert/strict";
import { createAnalyticsStore } from "../src/analytics-store.js";

function timedStore() {
  let seconds = 0;
  return createAnalyticsStore({ now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds++ * 10)) });
}

function event(store, sessionId, name, properties = {}) {
  store.record({ sessionId, name, properties });
}

test("calculates OECs, rerolls, funnel, and recommendation uniqueness", () => {
  const store = timedStore();
  event(store, "session-a", "session_started");
  event(store, "session-a", "preference_answered", { question: "vibe", value: "warm" });
  event(store, "session-a", "recommendation_requested");
  event(store, "session-a", "recommendation_returned", { movieId: "movie-1" });
  event(store, "session-a", "recommendation_rerolled");
  event(store, "session-a", "recommendation_requested");
  event(store, "session-a", "recommendation_returned", { movieId: "movie-1" });
  event(store, "session-a", "movie_selected", { movieId: "movie-1" });
  event(store, "session-a", "streaming_clicked", { movieId: "movie-1" });

  event(store, "session-b", "session_started");
  event(store, "session-b", "recommendation_requested");
  event(store, "session-b", "recommendation_failed");
  event(store, "session-b", "session_abandoned");

  const summary = store.summary();
  assert.equal(summary.sessionCount, 2);
  assert.equal(summary.kpis.recommendationSuccessRate, 50);
  assert.equal(summary.kpis.movieSelectionRate, 100);
  assert.equal(summary.kpis.watchIntentRate, 100);
  assert.equal(summary.kpis.rerollRate, 100);
  assert.equal(summary.kpis.averageRerollsBeforeSelection, 1);
  assert.equal(summary.kpis.medianRerollsBeforeSelection, 1);
  assert.equal(summary.kpis.recommendationUniquenessRate, 50);
  assert.equal(summary.kpis.recommendationRepeatRate, 50);
  assert.equal(summary.diagnostics.withinSessionRepeats, 1);
  assert.equal(summary.diagnostics.failedRecommendations, 1);
  assert.deepEqual(summary.funnel.map((step) => step.count), [2, 1, 2, 1, 1, 1]);
});

test("rejects unsupported events and strips complex properties", () => {
  const store = timedStore();
  assert.throws(() => event(store, "session-a", "user_identified"), /Unsupported/);
  store.record({
    sessionId: "session-a",
    name: "session_started",
    properties: { entryPoint: "home", nested: { email: "private@example.com" }, list: ["private"] }
  });
  assert.deepEqual(store.events[0].properties, { entryPoint: "home" });
});
