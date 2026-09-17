import { readFileSync } from "node:fs";

const catalogUrl = new URL("../data/movies.fixture.json", import.meta.url);

export const movies = JSON.parse(readFileSync(catalogUrl, "utf8"));

export function findMovie(movieId, catalog = movies) {
  return catalog.find((movie) => movie.id === movieId) ?? null;
}
