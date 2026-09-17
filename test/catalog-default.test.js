import test from "node:test";
import assert from "node:assert/strict";
import { catalogSource, movies } from "../src/catalog.js";

test("ships with the real 200-movie catalog as the default", () => {
  assert.equal(catalogSource, "tmdb");
  assert.equal(movies.length, 200);
  assert.ok(movies.every((movie) => movie.source?.provider === "tmdb"));
  assert.ok(movies.every((movie) => movie.cast.some((person) => person.profileUrl)));
  assert.ok(movies.every((movie) => movie.availability.length > 0));
});
