import { randomUUID } from "node:crypto";
import { movies as defaultCatalog, findMovie } from "./catalog.js";

export const RANKING_VERSION = "relevance-exploration-v3";

const allowedMoods = new Set(["warm", "tense", "funny", "transporting", "dark", "romantic"]);
const allowedGenres = new Set(["comedy", "drama", "action-adventure", "thriller-mystery", "science-fiction-fantasy", "horror", "romance", "family-animation", "documentary"]);
const allowedPaces = new Set(["slow", "meditative", "balanced", "fast", "relentless", "surprise"]);
const allowedCompanies = new Set(["solo", "date", "partner", "friends", "family", "kids"]);
const allowedRefinements = new Set(["lighter", "tenser", "faster", "slower", "shorter", "wildcard"]);
const genreGroups = new Map([
  ["comedy", new Set(["comedy"])],
  ["drama", new Set(["drama", "history", "war"])],
  ["action-adventure", new Set(["action", "adventure", "war", "western"])],
  ["thriller-mystery", new Set(["thriller", "mystery", "crime"])],
  ["science-fiction-fantasy", new Set(["science-fiction", "fantasy"])],
  ["horror", new Set(["horror"])],
  ["romance", new Set(["romance"])],
  ["family-animation", new Set(["family", "animation"])],
  ["documentary", new Set(["documentary"])]
]);
const genreLabels = new Map([
  ["action-adventure", "action or adventure"],
  ["thriller-mystery", "thriller or mystery"],
  ["science-fiction-fantasy", "sci-fi or fantasy"],
  ["family-animation", "family or animation"]
]);

export class RecommendationError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.name = "RecommendationError";
    this.code = code;
    this.status = status;
  }
}

export function validateRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new RecommendationError("Request body must be an object.", "INVALID_REQUEST");
  }

  if (!/^[A-Z]{2}$/.test(input.region ?? "")) {
    throw new RecommendationError("region must be a two-letter country code.", "INVALID_REGION");
  }

  if (!Number.isInteger(input.runtimeMaxMinutes) || input.runtimeMaxMinutes < 60 || input.runtimeMaxMinutes > 300) {
    throw new RecommendationError("runtimeMaxMinutes must be an integer from 60 to 300.", "INVALID_RUNTIME");
  }

  if (!Array.isArray(input.moods) || input.moods.length < 1 || input.moods.length > 3 || input.moods.some((mood) => !allowedMoods.has(mood))) {
    throw new RecommendationError("moods must contain one to three supported values.", "INVALID_MOODS");
  }

  if (input.genres !== undefined && (!Array.isArray(input.genres) || input.genres.length > 2 || input.genres.some((genre) => !allowedGenres.has(genre)))) {
    throw new RecommendationError("genres must contain up to two supported values.", "INVALID_GENRES");
  }

  if (!allowedPaces.has(input.pace)) {
    throw new RecommendationError("pace is not supported.", "INVALID_PACE");
  }

  if (!allowedCompanies.has(input.company)) {
    throw new RecommendationError("company is not supported.", "INVALID_COMPANY");
  }

  if (input.sessionId !== undefined && (typeof input.sessionId !== "string" || input.sessionId.length === 0)) {
    throw new RecommendationError("sessionId must be a non-empty string.", "INVALID_SESSION");
  }

  for (const field of ["serviceIds", "actorIds", "excludedMovieIds"]) {
    if (input[field] !== undefined && (!Array.isArray(input[field]) || input[field].some((value) => typeof value !== "string" || value.length === 0))) {
      throw new RecommendationError(`${field} must be an array of IDs.`, "INVALID_ID_LIST");
    }
  }

  if (!Array.isArray(input.serviceIds)) {
    throw new RecommendationError("serviceIds is required.", "INVALID_SERVICES");
  }

  if (input.refinement !== undefined && !allowedRefinements.has(input.refinement)) {
    throw new RecommendationError("refinement is not supported.", "INVALID_REFINEMENT");
  }

  return {
    ...input,
    genres: input.genres ?? [],
    actorIds: input.actorIds ?? [],
    excludedMovieIds: input.excludedMovieIds ?? [],
    kidsPresent: input.kidsPresent ?? input.company === "kids"
  };
}

function matchedGenreGroups(movie, request) {
  const movieGenres = new Set(movie.genres);
  return request.genres.filter((preference) => [...genreGroups.get(preference)].some((genre) => movieGenres.has(genre)));
}

export function filterMovies(request, catalog = defaultCatalog) {
  const previousMovie = request.previousMovieId ? findMovie(request.previousMovieId, catalog) : null;
  const excludedIds = new Set([...request.excludedMovieIds, request.previousMovieId].filter(Boolean));

  return catalog.filter((movie) => {
    if (excludedIds.has(movie.id)) return false;
    if (movie.runtimeMinutes > request.runtimeMaxMinutes) return false;
    if (request.kidsPresent && movie.content?.kidsSafe !== true) return false;
    if (request.refinement === "shorter" && previousMovie && movie.runtimeMinutes >= previousMovie.runtimeMinutes) return false;

    const regionalAvailability = movie.availability.filter((option) => option.region === request.region);
    if (regionalAvailability.length === 0) return false;

    if (request.serviceIds.length > 0) {
      const requestedServices = new Set(request.serviceIds);
      if (!regionalAvailability.some((option) => requestedServices.has(option.providerId))) return false;
    }

    if (request.actorIds.length > 0) {
      const requestedActors = new Set(request.actorIds);
      if (!movie.cast.some((person) => requestedActors.has(person.id))) return false;
    }

    return true;
  });
}

function refinementScore(movie, request) {
  if (request.refinement === "lighter" && movie.moods.some((mood) => ["warm", "funny", "romantic"].includes(mood))) return 12;
  if (request.refinement === "tenser" && movie.moods.some((mood) => ["tense", "dark"].includes(mood))) return 12;
  if (request.refinement === "faster" && ["fast", "relentless"].includes(movie.pace)) return 12;
  if (request.refinement === "slower" && ["slow", "meditative"].includes(movie.pace)) return 12;
  if (request.refinement === "wildcard" && !movie.moods.some((mood) => request.moods.includes(mood))) return 12;
  return 0;
}

export function scoreMovie(movie, request) {
  const genreMatches = matchedGenreGroups(movie, request).length;
  const moodMatches = movie.moods.filter((mood) => request.moods.includes(mood)).length;
  const actorMatches = movie.cast.filter((person) => request.actorIds.includes(person.id)).length;
  const paceMatches = request.pace === "surprise" || movie.pace === request.pace;
  const companyMatches = movie.audiences.includes(request.company);
  const runtimeHeadroom = request.runtimeMaxMinutes - movie.runtimeMinutes;
  const runtimeScore = Math.max(0, 8 - Math.floor(runtimeHeadroom / 20));
  const serviceScore = request.serviceIds.length > 0 ? 5 : 2;

  const breakdown = {
    genre: genreMatches ? 24 + ((genreMatches - 1) * 10) : 0,
    mood: Math.min(24, moodMatches * 16),
    pace: paceMatches ? 14 : 0,
    company: companyMatches ? 8 : 0,
    actor: Math.min(14, actorMatches * 14),
    runtime: runtimeScore,
    availability: serviceScore,
    refinement: refinementScore(movie, request)
  };

  return {
    total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown
  };
}

function describeMatch(movie, request, breakdown) {
  const signals = [];
  if (breakdown.genre > 0) {
    const genre = matchedGenreGroups(movie, request)[0];
    signals.push(genreLabels.get(genre) ?? genre);
  }
  if (breakdown.mood > 0) signals.push(`${movie.moods.find((mood) => request.moods.includes(mood))} mood`);
  if (breakdown.pace > 0 && request.pace !== "surprise") signals.push(`${movie.pace} pace`);
  if (breakdown.company > 0) signals.push(`works for ${request.company}`);
  if (breakdown.actor > 0) signals.push("preferred cast");
  signals.push(`${movie.runtimeMinutes} minutes`);

  const topSignals = signals.slice(0, 4);
  return {
    signals: topSignals,
    reason: `${movie.title} fits tonight because it offers ${topSignals.join(", ")}.`
  };
}

function normalizedMatchScore(total) {
  return Math.max(40, Math.min(98, Math.round((total / 117) * 100)));
}

function stableVarietyScore(sessionId, movieId) {
  let hash = 2166136261;
  for (const character of `${sessionId}:${movieId}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 5;
}

function stableUnitInterval(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_296;
}

function selectWithExploration(candidates, sessionId) {
  if (candidates.length === 1) return candidates[0];
  const highest = Math.max(...candidates.map((candidate) => candidate.total));
  const relevanceWeights = candidates.map((candidate) => Math.exp((candidate.total - highest) / 11));
  const relevanceTotal = relevanceWeights.reduce((sum, weight) => sum + weight, 0);
  const explorationShare = 0.08;
  const probabilities = relevanceWeights.map((weight) =>
    ((1 - explorationShare) * (weight / relevanceTotal)) + (explorationShare / candidates.length)
  );
  const draw = stableUnitInterval(`${sessionId}:recommendation-v3`);
  let cumulative = 0;
  for (let index = 0; index < candidates.length; index += 1) {
    cumulative += probabilities[index];
    if (draw < cumulative) return { ...candidates[index], selectionProbability: probabilities[index] };
  }
  return { ...candidates.at(-1), selectionProbability: probabilities.at(-1) };
}

function franchiseKey(title) {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:part|chapter|episode|volume|vol)\s+(?:\d+|[ivxlcdm]+)\b/g, " ")
    .replace(/(?:\s|:|-)+(?:\d+|[ivxlcdm]+)$/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function diversityPenalty(movie, recentMovies) {
  const movieCast = new Set(movie.cast.map((person) => person.id));
  const family = franchiseKey(movie.title);
  let penalty = 0;

  for (const recent of recentMovies) {
    if (family.length >= 4 && family === franchiseKey(recent.title)) penalty = Math.max(penalty, 24);
    const sharedCast = recent.cast.filter((person) => movieCast.has(person.id)).length;
    if (sharedCast >= 3) penalty = Math.max(penalty, Math.min(18, 8 + sharedCast * 2));
  }

  return penalty;
}

function summarizeMovie(movie) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    runtimeMinutes: movie.runtimeMinutes,
    genres: movie.genres,
    posterUrl: movie.posterUrl
  };
}

export function recommend(input, catalog = defaultCatalog) {
  const request = validateRequest(input);
  const sessionId = request.sessionId ?? randomUUID();
  const eligibleMovies = filterMovies(request, catalog);

  if (eligibleMovies.length === 0) {
    throw new RecommendationError(
      "No movies satisfy all of the selected constraints.",
      "NO_ELIGIBLE_MOVIES",
      422
    );
  }

  const recentIds = new Set([...request.excludedMovieIds, request.previousMovieId].filter(Boolean));
  const recentMovies = catalog.filter((movie) => recentIds.has(movie.id));
  const ranked = eligibleMovies
    .map((movie) => {
      const scored = scoreMovie(movie, request);
      const variety = stableVarietyScore(sessionId, movie.id);
      const diversity = diversityPenalty(movie, recentMovies);
      return {
        movie,
        total: scored.total + variety - diversity,
        breakdown: { ...scored.breakdown, variety, diversity: -diversity }
      };
    })
    .sort((a, b) => b.total - a.total || a.movie.title.localeCompare(b.movie.title));

  const winner = selectWithExploration(ranked, sessionId);
  const explanation = describeMatch(winner.movie, request, winner.breakdown);

  return {
    sessionId,
    rankingVersion: RANKING_VERSION,
    movieId: winner.movie.id,
    movie: summarizeMovie(winner.movie),
    matchScore: normalizedMatchScore(winner.total),
    reason: explanation.reason,
    matchSignals: explanation.signals,
    backups: ranked.filter(({ movie }) => movie.id !== winner.movie.id).slice(0, 2).map(({ movie, breakdown }) => ({
      movieId: movie.id,
      reason: describeMatch(movie, request, breakdown).reason
    }))
  };
}
