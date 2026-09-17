import { existsSync, readFileSync } from "node:fs";

const fixtureCatalogUrl = new URL("../data/movies.fixture.json", import.meta.url);
const generatedCatalogUrl = new URL("../data/movies.catalog.json", import.meta.url);

function readCatalog(catalogUrl) {
  const catalog = JSON.parse(readFileSync(catalogUrl, "utf8"));
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error(`Movie catalog at ${catalogUrl.pathname} must be a non-empty array.`);
  }
  return catalog;
}

export const fixtureMovies = readCatalog(fixtureCatalogUrl);
export const catalogSource = existsSync(generatedCatalogUrl) ? "tmdb" : "fixture";
export const movies = catalogSource === "tmdb" ? readCatalog(generatedCatalogUrl) : fixtureMovies;

export function findMovie(movieId, catalog = movies) {
  return catalog.find((movie) => movie.id === movieId) ?? null;
}
