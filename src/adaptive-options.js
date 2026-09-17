import { filterMovies, scoreMovie, validateRequest } from "./recommendation-engine.js";

const subscriptionTypes = new Set(["subscription", "free", "ads"]);

function normalizedRequest(input, overrides = {}) {
  return validateRequest({
    ...input,
    actorIds: [],
    excludedMovieIds: [],
    ...overrides
  });
}

function rankedCandidates(input, catalog, overrides = {}) {
  const request = normalizedRequest(input, overrides);
  return filterMovies(request, catalog)
    .map((movie) => ({ movie, score: scoreMovie(movie, request).total }))
    .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title));
}

export function rankServiceOptions(input, catalog, limit = 5) {
  const candidates = rankedCandidates(input, catalog, { serviceIds: [] });
  const providers = new Map();

  for (const { movie, score } of candidates) {
    const seenForMovie = new Set();
    for (const option of movie.availability) {
      if (option.region !== input.region || !subscriptionTypes.has(option.monetizationType) || seenForMovie.has(option.providerId)) continue;
      seenForMovie.add(option.providerId);

      const provider = providers.get(option.providerId) ?? {
        value: option.providerId,
        title: option.providerName,
        matchingMovieCount: 0,
        score: 0
      };
      provider.matchingMovieCount += 1;
      provider.score += score;
      providers.set(option.providerId, provider);
    }
  }

  const options = [...providers.values()]
    .sort((a, b) => b.score - a.score || b.matchingMovieCount - a.matchingMovieCount || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ value, title, matchingMovieCount }) => ({
      value,
      title,
      subtitle: `${matchingMovieCount} ${matchingMovieCount === 1 ? "match" : "matches"} for your night`
    }));

  options.push({ value: "any", title: "Any service", subtitle: `${candidates.length} possible matches` });
  return { candidateMovieCount: candidates.length, options };
}

export function rankActorOptions(input, catalog, limit = 6) {
  const candidates = rankedCandidates(input, catalog);
  const people = new Map();

  for (const { movie, score } of candidates) {
    movie.cast.slice(0, 10).forEach((person, billingIndex) => {
      const existing = people.get(person.id) ?? {
        value: person.id,
        title: person.name,
        image: person.profileUrl,
        score: 0,
        movies: []
      };
      existing.score += score + Math.max(0, 10 - billingIndex);
      if (!existing.image && person.profileUrl) existing.image = person.profileUrl;
      if (!existing.movies.includes(movie.title)) existing.movies.push(movie.title);
      people.set(person.id, existing);
    });
  }

  const options = [...people.values()]
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ value, title, image, movies }) => ({
      value,
      title,
      subtitle: movies.slice(0, 2).join(" · "),
      ...(image ? { image } : {})
    }));

  return { candidateMovieCount: candidates.length, options };
}
