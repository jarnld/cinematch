import test from "node:test";
import assert from "node:assert/strict";
import { deriveTasteTags, normalizeTmdbMovie } from "../src/tmdb-catalog.js";

const tmdbMovie = {
  id: 545611,
  title: "Everything Everywhere All at Once",
  release_date: "2022-03-24",
  runtime: 140,
  overview: "A family adventure across the multiverse.",
  poster_path: "/poster.jpg",
  genres: [
    { id: 28, name: "Action" },
    { id: 878, name: "Science Fiction" },
    { id: 35, name: "Comedy" }
  ],
  credits: { cast: [{ id: 1625558, name: "Stephanie Hsu", profile_path: "/person.jpg" }] },
  release_dates: {
    results: [{ iso_3166_1: "US", release_dates: [{ type: 3, certification: "R" }] }]
  },
  "watch/providers": {
    results: {
      US: {
        link: "https://www.themoviedb.org/movie/545611/watch",
        flatrate: [{ provider_id: 1899, provider_name: "Max" }],
        rent: [{ provider_id: 10, provider_name: "Amazon Video" }]
      }
    }
  }
};

test("normalizes TMDB facts into the CineMatch catalog contract", () => {
  const movie = normalizeTmdbMovie(tmdbMovie, { region: "US", checkedAt: "2026-09-17T00:00:00.000Z" });

  assert.equal(movie.id, "tmdb-movie-545611");
  assert.equal(movie.runtimeMinutes, 140);
  assert.equal(movie.posterUrl, "https://image.tmdb.org/t/p/w500/poster.jpg");
  assert.deepEqual(movie.genres, ["action", "science-fiction", "comedy"]);
  assert.equal(movie.pace, "fast");
  assert.equal(movie.content.kidsSafe, false);
  assert.deepEqual(movie.availability.map((entry) => entry.providerId), ["max", "prime"]);
  assert.equal(movie.cast[0].profileUrl, "https://image.tmdb.org/t/p/w500/person.jpg");
  assert.equal(movie.source.provider, "tmdb");
});

test("keeps taste enrichment deterministic and inspectable", () => {
  assert.deepEqual(deriveTasteTags(["comedy", "romance"]), {
    moods: ["funny", "warm", "romantic"],
    pace: "balanced"
  });
});

test("rejects incomplete or unwatchable TMDB records", () => {
  assert.equal(normalizeTmdbMovie({ ...tmdbMovie, "watch/providers": { results: {} } }), null);
  assert.equal(normalizeTmdbMovie({ ...tmdbMovie, runtime: 0 }), null);
});
