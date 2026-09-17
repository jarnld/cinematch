import { randomUUID } from "node:crypto";
import { movies as defaultCatalog, findMovie } from "./catalog.js";

export const RANKING_VERSION = "deterministic-v1";

const allowedMoods = new Set(["warm", "tense", "funny", "transporting", "dark", "romantic"]);
const allowedPaces = new Set(["slow", "meditative", "balanced", "fast", "relentless", "surprise"]);
const allowedCompanies = new Set(["solo", "date", "partner", "friends", "family", "kids"]);
const allowedRefinements = new Set(["lighter", "tenser", "faster", "slower", "shorter", "wildcard"]);

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

  if (!allowedPaces.has(input.pace)) {
    throw new RecommendationError("pace is not supported.", "INVALID_PACE");
  }

  if (!allowedCompanies.has(input.company)) {
    throw new RecommendationError("company is not supported.", "INVALID_COMPANY");
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
    actorIds: input.actorIds ?? [],
    excludedMovieIds: input.excludedMovieIds ?? [],
    kidsPresent: input.kidsPresent ?? input.company === "kids"
  };
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
  const moodMatches = movie.moods.filter((mood) => request.moods.includes(mood)).length;
  const actorMatches = movie.cast.filter((person) => request.actorIds.includes(person.id)).length;
  const paceMatches = request.pace === "surprise" || movie.pace === request.pace;
  const companyMatches = movie.audiences.includes(request.company);
  const runtimeHeadroom = request.runtimeMaxMinutes - movie.runtimeMinutes;
  const runtimeScore = Math.max(0, 15 - Math.floor(runtimeHeadroom / 10));
  const serviceScore = request.serviceIds.length > 0 ? 10 : 5;

  const breakdown = {
    mood: Math.min(25, moodMatches * 15),
    pace: paceMatches ? 18 : 0,
    company: companyMatches ? 14 : 0,
    actor: Math.min(12, actorMatches * 12),
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
  return Math.max(45, Math.min(98, Math.round((total / 106) * 100)));
}

export function recommend(input, catalog = defaultCatalog) {
  const request = validateRequest(input);
  const eligibleMovies = filterMovies(request, catalog);

  if (eligibleMovies.length === 0) {
    throw new RecommendationError(
      "No movies satisfy all of the selected constraints.",
      "NO_ELIGIBLE_MOVIES",
      422
    );
  }

  const ranked = eligibleMovies
    .map((movie) => ({ movie, ...scoreMovie(movie, request) }))
    .sort((a, b) => b.total - a.total || a.movie.title.localeCompare(b.movie.title));

  const winner = ranked[0];
  const explanation = describeMatch(winner.movie, request, winner.breakdown);

  return {
    sessionId: request.sessionId ?? randomUUID(),
    rankingVersion: RANKING_VERSION,
    movieId: winner.movie.id,
    matchScore: normalizedMatchScore(winner.total),
    reason: explanation.reason,
    matchSignals: explanation.signals,
    backups: ranked.slice(1, 3).map(({ movie, breakdown }) => ({
      movieId: movie.id,
      reason: describeMatch(movie, request, breakdown).reason
    }))
  };
}
