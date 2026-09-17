import { rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { normalizeTmdbMovie } from "../src/tmdb-catalog.js";

const API_ROOT = "https://api.themoviedb.org/3";
const outputUrl = new URL("../data/movies.catalog.json", import.meta.url);
const outputPath = fileURLToPath(outputUrl);
const temporaryPath = `${outputPath}.tmp-${process.pid}`;
const token = process.env.TMDB_READ_TOKEN;
const region = (process.env.TMDB_REGION ?? "US").toUpperCase();
const pages = parsePositiveInteger(process.env.TMDB_PAGES, 2, "TMDB_PAGES");
const maxMovies = parsePositiveInteger(process.env.TMDB_MAX_MOVIES, 40, "TMDB_MAX_MOVIES");

function parsePositiveInteger(value, fallback, name) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive whole number.`);
  return parsed;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function tmdbRequest(path, query = {}) {
  const url = new URL(`${API_ROOT}${path}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` }
    });

    if (response.ok) return response.json();
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      const retrySeconds = Math.min(Number(response.headers.get("retry-after") ?? 1), 5);
      await wait(retrySeconds * 1_000);
      continue;
    }

    throw new Error(`TMDB request failed (${response.status}) for ${url.pathname}.`);
  }
}

async function discoverMovieIds() {
  const ids = [];
  for (let page = 1; page <= pages; page += 1) {
    const response = await tmdbRequest("/discover/movie", {
      include_adult: false,
      include_video: false,
      language: "en-US",
      page,
      region,
      sort_by: "popularity.desc",
      "vote_count.gte": 250,
      watch_region: region,
      with_watch_monetization_types: "flatrate|free|ads|rent|buy"
    });
    ids.push(...response.results.map((movie) => movie.id));
  }
  return [...new Set(ids)].slice(0, maxMovies);
}

async function loadMovie(movieId, checkedAt) {
  try {
    const details = await tmdbRequest(`/movie/${movieId}`, {
      append_to_response: "credits,release_dates,watch/providers",
      language: "en-US"
    });
    return normalizeTmdbMovie(details, { region, checkedAt });
  } catch (error) {
    console.warn(`Skipping TMDB movie ${movieId}: ${error.message}`);
    return null;
  }
}

async function loadInBatches(movieIds, checkedAt) {
  const movies = [];
  const batchSize = 5;
  for (let index = 0; index < movieIds.length; index += batchSize) {
    const batch = movieIds.slice(index, index + batchSize);
    movies.push(...await Promise.all(batch.map((movieId) => loadMovie(movieId, checkedAt))));
    console.log(`Fetched ${Math.min(index + batch.length, movieIds.length)} of ${movieIds.length} movies.`);
  }
  return movies.filter(Boolean);
}

async function main() {
  if (!token) {
    throw new Error("TMDB_READ_TOKEN is missing. Add it to this terminal session before syncing the catalog.");
  }
  if (!/^[A-Z]{2}$/.test(region)) throw new Error("TMDB_REGION must be a two-letter country code.");

  console.log(`Discovering up to ${maxMovies} movies available in ${region}...`);
  const checkedAt = new Date().toISOString();
  const movieIds = await discoverMovieIds();
  const catalog = await loadInBatches(movieIds, checkedAt);

  if (catalog.length === 0) throw new Error("TMDB returned no usable movies. The existing catalog was not changed.");

  catalog.sort((a, b) => a.title.localeCompare(b.title));
  await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await rename(temporaryPath, outputPath);
  console.log(`Saved ${catalog.length} real movie records to data/movies.catalog.json.`);
  console.log("Run npm run check, then npm run dev. The health endpoint will report catalogSource: tmdb.");
}

main().catch((error) => {
  console.error(`Catalog sync failed: ${error.message}`);
  process.exitCode = 1;
});
