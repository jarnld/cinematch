import test from "node:test";
import assert from "node:assert/strict";
import { filterMovies, recommend, RecommendationError } from "../src/recommendation-engine.js";
import { fixtureMovies } from "../src/catalog.js";

const baseRequest = {
  sessionId: "test-session",
  region: "US",
  runtimeMaxMinutes: 120,
  moods: ["funny"],
  pace: "fast",
  company: "friends",
  actorIds: [],
  serviceIds: [],
  excludedMovieIds: []
};

test("returns a deterministic recommendation with backups", () => {
  const result = recommend(baseRequest, fixtureMovies);

  assert.equal(result.sessionId, "test-session");
  assert.equal(result.rankingVersion, "deterministic-v1");
  assert.equal(result.movieId, "mitchells-vs-machines-2021");
  assert.equal(result.movie.id, result.movieId);
  assert.equal(result.movie.title, "The Mitchells vs. the Machines");
  assert.ok(result.matchScore >= 0 && result.matchScore <= 100);
  assert.ok(result.backups.length <= 2);
});

test("treats runtime as a hard maximum", () => {
  const eligible = filterMovies({ ...baseRequest, runtimeMaxMinutes: 100 }, fixtureMovies);

  assert.ok(eligible.every((movie) => movie.runtimeMinutes <= 100));
  assert.deepEqual(eligible.map((movie) => movie.id), ["palm-springs-2020"]);
});

test("requires selected streaming service availability", () => {
  const eligible = filterMovies({ ...baseRequest, serviceIds: ["hulu"] }, fixtureMovies);

  assert.deepEqual(
    eligible.map((movie) => movie.id).sort(),
    ["palm-springs-2020", "unbearable-weight-2022"]
  );
});

test("requires selected actors to appear in the recommended movie", () => {
  const eligible = filterMovies({ ...baseRequest, actorIds: ["person-pedro-pascal"] }, fixtureMovies);

  assert.deepEqual(eligible.map((movie) => movie.id), ["unbearable-weight-2022"]);
  assert.ok(eligible[0].cast.some((person) => person.id === "person-pedro-pascal"));
});

test("keeps only kid-safe movies when children are present", () => {
  const eligible = filterMovies({ ...baseRequest, kidsPresent: true }, fixtureMovies);

  assert.deepEqual(eligible.map((movie) => movie.id), ["mitchells-vs-machines-2021"]);
});

test("shorter refinement enforces a shorter runtime than the previous result", () => {
  const eligible = filterMovies({
    ...baseRequest,
    runtimeMaxMinutes: 180,
    previousMovieId: "unbearable-weight-2022",
    refinement: "shorter"
  }, fixtureMovies);

  assert.ok(eligible.length > 0);
  assert.ok(eligible.every((movie) => movie.runtimeMinutes < 107));
  assert.deepEqual(eligible.map((movie) => movie.id), ["palm-springs-2020"]);
});

test("never recommends an excluded movie", () => {
  const result = recommend({ ...baseRequest, excludedMovieIds: ["mitchells-vs-machines-2021"] }, fixtureMovies);

  assert.notEqual(result.movieId, "mitchells-vs-machines-2021");
});

test("returns a clear error when constraints remove every movie", () => {
  assert.throws(
    () => recommend({ ...baseRequest, region: "GB" }, fixtureMovies),
    (error) => error instanceof RecommendationError && error.code === "NO_ELIGIBLE_MOVIES" && error.status === 422
  );
});

test("rejects malformed recommendation requests", () => {
  assert.throws(
    () => recommend({ ...baseRequest, runtimeMaxMinutes: "two hours" }, fixtureMovies),
    (error) => error instanceof RecommendationError && error.code === "INVALID_RUNTIME"
  );
});
