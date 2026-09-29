import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ANALYTICS_EVENTS = new Set([
  "session_started",
  "preference_answered",
  "recommendation_requested",
  "recommendation_returned",
  "recommendation_failed",
  "recommendation_rerolled",
  "movie_selected",
  "streaming_clicked",
  "actor_page_loaded",
  "actor_page_failed",
  "session_abandoned"
]);

const MAX_EVENTS = 10_000;
const MAX_PROPERTY_LENGTH = 160;

function cleanProperties(properties = {}) {
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return {};
  return Object.fromEntries(Object.entries(properties).slice(0, 16).flatMap(([key, value]) => {
    if (!/^[a-z][a-zA-Z0-9_]{0,39}$/.test(key)) return [];
    if (typeof value === "string") return [[key, value.slice(0, MAX_PROPERTY_LENGTH)]];
    if (typeof value === "number" && Number.isFinite(value)) return [[key, value]];
    if (typeof value === "boolean" || value === null) return [[key, value]];
    return [];
  }));
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percent(numerator, denominator) {
  return denominator ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

function firstEvent(events, name) {
  return events.find((event) => event.name === name);
}

function summarize(events) {
  const sessions = new Map();
  for (const event of events) {
    const session = sessions.get(event.sessionId) ?? [];
    session.push(event);
    sessions.set(event.sessionId, session);
  }

  const rows = [...sessions.entries()].map(([sessionId, sessionEvents]) => {
    sessionEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const started = firstEvent(sessionEvents, "session_started") ?? sessionEvents[0];
    const requested = sessionEvents.filter((event) => event.name === "recommendation_requested");
    const returned = sessionEvents.filter((event) => event.name === "recommendation_returned");
    const failed = sessionEvents.filter((event) => event.name === "recommendation_failed");
    const rerolls = sessionEvents.filter((event) => event.name === "recommendation_rerolled");
    const selected = firstEvent(sessionEvents, "movie_selected");
    const streamed = firstEvent(sessionEvents, "streaming_clicked");
    const abandoned = firstEvent(sessionEvents, "session_abandoned");
    const answered = sessionEvents.filter((event) => event.name === "preference_answered").length;
    const movieIds = returned.map((event) => event.properties.movieId).filter(Boolean);
    const repeatedMovies = movieIds.length - new Set(movieIds).size;
    const decisionMs = selected && started ? Math.max(0, Date.parse(selected.timestamp) - Date.parse(started.timestamp)) : null;
    const rerollsBeforeSelection = rerolls.filter((event) => !selected || event.timestamp <= selected.timestamp).length;
    const finalEvent = sessionEvents.at(-1);

    return {
      sessionId,
      started: sessionEvents.some((event) => event.name === "session_started"),
      startedAt: started.timestamp,
      lastSeenAt: finalEvent.timestamp,
      answered,
      requested: requested.length,
      returned: returned.length,
      failed: failed.length,
      rerolls: rerolls.length,
      rerollsBeforeSelection,
      selected: Boolean(selected),
      streamed: Boolean(streamed),
      abandoned: Boolean(abandoned),
      decisionMs,
      repeatedMovies,
      status: streamed ? "Watch intent" : selected ? "Selected" : abandoned ? "Abandoned" : returned.length ? "Considering" : failed.length ? "Failed" : "In progress"
    };
  }).sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));

  const startedRows = rows.filter((row) => row.started);
  const recommendationRows = rows.filter((row) => row.requested > 0);
  const returnedRows = rows.filter((row) => row.returned > 0);
  const selectedRows = rows.filter((row) => row.selected);
  const rerolledRows = returnedRows.filter((row) => row.rerolls > 0);
  const returnedEvents = events.filter((event) => event.name === "recommendation_returned");
  const returnedMovieIds = returnedEvents.map((event) => event.properties.movieId).filter(Boolean);
  const uniqueMovies = new Set(returnedMovieIds).size;
  const selectedRerolls = selectedRows.map((row) => row.rerollsBeforeSelection);

  return {
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
    sessionCount: rows.length,
    kpis: {
      recommendationSuccessRate: percent(returnedRows.length, recommendationRows.length),
      movieSelectionRate: percent(selectedRows.length, returnedRows.length),
      medianTimeToDecisionMs: median(selectedRows.map((row) => row.decisionMs).filter(Number.isFinite)),
      watchIntentRate: percent(selectedRows.filter((row) => row.streamed).length, selectedRows.length),
      rerollRate: percent(rerolledRows.length, returnedRows.length),
      averageRerollsBeforeSelection: selectedRerolls.length ? Math.round((selectedRerolls.reduce((sum, value) => sum + value, 0) / selectedRerolls.length) * 10) / 10 : null,
      medianRerollsBeforeSelection: median(selectedRerolls),
      recommendationUniquenessRate: percent(uniqueMovies, returnedMovieIds.length),
      recommendationRepeatRate: percent(returnedMovieIds.length - uniqueMovies, returnedMovieIds.length)
    },
    funnel: [
      { key: "started", label: "Sessions started", count: startedRows.length },
      { key: "answered", label: "Answered a preference", count: rows.filter((row) => row.answered > 0).length },
      { key: "requested", label: "Recommendation requested", count: recommendationRows.length },
      { key: "returned", label: "Recommendation returned", count: returnedRows.length },
      { key: "selected", label: "Movie selected", count: selectedRows.length },
      { key: "streamed", label: "Streaming clicked", count: rows.filter((row) => row.streamed).length }
    ],
    diagnostics: {
      recommendationsReturned: returnedMovieIds.length,
      uniqueMoviesReturned: uniqueMovies,
      withinSessionRepeats: rows.reduce((sum, row) => sum + row.repeatedMovies, 0),
      failedRecommendations: rows.reduce((sum, row) => sum + row.failed, 0),
      abandonedSessions: rows.filter((row) => row.abandoned).length
    },
    recentSessions: rows.slice(0, 25).map((row) => ({
      ...row,
      sessionId: row.sessionId.slice(0, 8)
    }))
  };
}

export class AnalyticsStore {
  constructor({ filePath = null, now = () => new Date() } = {}) {
    this.filePath = filePath instanceof URL ? fileURLToPath(filePath) : filePath;
    this.now = now;
    this.events = [];

    if (this.filePath && existsSync(this.filePath)) {
      this.events = readFileSync(this.filePath, "utf8").split("\n").filter(Boolean).flatMap((line) => {
        try { return [JSON.parse(line)]; } catch { return []; }
      }).slice(-MAX_EVENTS);
    }
  }

  record(input) {
    if (!input || !ANALYTICS_EVENTS.has(input.name)) throw new Error("Unsupported analytics event.");
    if (typeof input.sessionId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(input.sessionId)) throw new Error("A valid anonymous session ID is required.");

    const event = {
      id: globalThis.crypto.randomUUID(),
      name: input.name,
      sessionId: input.sessionId,
      timestamp: this.now().toISOString(),
      properties: cleanProperties(input.properties)
    };
    this.events.push(event);
    this.events = this.events.slice(-MAX_EVENTS);

    if (this.filePath) {
      mkdirSync(dirname(this.filePath), { recursive: true });
      appendFileSync(this.filePath, `${JSON.stringify(event)}\n`, "utf8");
    }
    return event;
  }

  summary() {
    return summarize(this.events);
  }
}

export function createAnalyticsStore(options) {
  return new AnalyticsStore(options);
}
