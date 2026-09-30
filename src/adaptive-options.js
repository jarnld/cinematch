import { filterMovies, scoreMovie, validateRequest } from "./recommendation-engine.js";

const subscriptionTypes = new Set(["subscription", "free", "ads"]);

function normalizedRequest(input, overrides = {}) {
  return validateRequest({
    ...input,
    actorIds: [],
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
  const request = normalizedRequest(input);
  const candidates = rankedCandidates(request, catalog);
  const strongestScore = candidates[0]?.score ?? 0;
  const relevantCandidates = candidates.filter(({ score }) => score >= strongestScore - 10).slice(0, 60);
  const people = new Map();

  for (const { movie, score } of relevantCandidates) {
    movie.cast.slice(0, 10).forEach((person, billingIndex) => {
      const existing = people.get(person.id) ?? {
        value: person.id,
        title: person.name,
        image: person.profileUrl,
        scores: [],
        bestBilling: 10,
        movies: [],
        movieIds: new Set()
      };
      existing.scores.push(score);
      existing.bestBilling = Math.min(existing.bestBilling, billingIndex);
      if (!existing.image && person.profileUrl) existing.image = person.profileUrl;
      if (!existing.movieIds.has(movie.id)) {
        existing.movieIds.add(movie.id);
        existing.movies.push(movie.title);
      }
      people.set(person.id, existing);
    });
  }

  const rankedPeople = [...people.values()].map((person) => {
    const topScores = person.scores.sort((a, b) => b - a).slice(0, 3);
    const averageTopScore = topScores.reduce((sum, score) => sum + score, 0) / topScores.length;
    return {
      ...person,
      score: averageTopScore + Math.min(6, Math.log2(person.movies.length + 1) * 2) + Math.max(0, 5 - person.bestBilling)
    };
  }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const selected = [];
  while (selected.length < Math.max(0, limit - 1) && selected.length < rankedPeople.length) {
    const remaining = rankedPeople.filter((person) => !selected.includes(person));
    remaining.sort((a, b) => {
      const overlapPenalty = (person) => selected.reduce((highest, chosen) => {
        const shared = [...person.movieIds].filter((movieId) => chosen.movieIds.has(movieId)).length;
        const union = new Set([...person.movieIds, ...chosen.movieIds]).size;
        return Math.max(highest, union ? (shared / union) * 30 : 0);
      }, 0);
      return (b.score - overlapPenalty(b)) - (a.score - overlapPenalty(a)) || a.title.localeCompare(b.title);
    });
    selected.push(remaining[0]);
  }

  const options = selected
    .map(({ value, title, image, movies }) => ({
      value,
      title,
      subtitle: `${movies.length} ${movies.length === 1 ? "match" : "matches"} · ${movies.slice(0, 2).join(" / ")}`,
      ...(image ? { image } : {})
    }));

  options.push({
    value: "any",
    title: "Any cast",
    subtitle: `${candidates.length} matching movies · keep the field open`
  });

  return { candidateMovieCount: candidates.length, options };
}
