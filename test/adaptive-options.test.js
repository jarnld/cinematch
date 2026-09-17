import test from "node:test";
import assert from "node:assert/strict";
import { rankActorOptions, rankServiceOptions } from "../src/adaptive-options.js";
import { fixtureMovies } from "../src/catalog.js";

const request = {
  region: "US",
  runtimeMaxMinutes: 180,
  moods: ["dark"],
  pace: "balanced",
  company: "solo",
  actorIds: [],
  serviceIds: [],
  excludedMovieIds: []
};

const darkMovie = {
  ...fixtureMovies[0],
  id: "dark-film",
  title: "Dark Film",
  moods: ["dark"],
  pace: "balanced",
  audiences: ["solo"],
  cast: [{ id: "dark-actor", name: "Dark Actor" }]
};

const brightMovie = {
  ...fixtureMovies[0],
  id: "bright-film",
  title: "Bright Film",
  moods: ["funny"],
  pace: "balanced",
  audiences: ["solo"],
  cast: [{ id: "comic-actor", name: "Comic Actor" }]
};

test("actor choices are ranked from the answers already given", () => {
  const result = rankActorOptions(request, [brightMovie, darkMovie]);

  assert.equal(result.candidateMovieCount, 2);
  assert.equal(result.options[0].value, "dark-actor");
  assert.equal(result.options[0].subtitle, "1 matching movie · dark mood");
  assert.doesNotMatch(result.options[0].subtitle, /Dark Film/);
});

test("actor choices preserve catalog profile images", () => {
  const result = rankActorOptions(
    { ...request, moods: ["funny"], pace: "fast", company: "friends" },
    fixtureMovies
  );

  assert.ok(result.options.length > 0);
  assert.ok(result.options.every((option) => option.image?.startsWith("https://")));
});

test("service choices expose only services with matching candidates", () => {
  const result = rankServiceOptions({ ...request, moods: ["funny"], pace: "fast", company: "friends" }, fixtureMovies);

  assert.ok(result.options.some((option) => option.value === "netflix"));
  assert.equal(result.options.at(-1).value, "any");
  assert.ok(result.candidateMovieCount > 0);
});
