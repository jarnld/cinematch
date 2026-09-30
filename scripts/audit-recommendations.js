import { movies } from "../src/catalog.js";
import { filterMovies, recommend, validateRequest } from "../src/recommendation-engine.js";

const broadRequest = {
  region: "US",
  runtimeMaxMinutes: 180,
  genres: [],
  moods: ["warm"],
  pace: "surprise",
  company: "partner",
  actorIds: [],
  serviceIds: [],
  excludedMovieIds: []
};

const eligible = filterMovies(validateRequest(broadRequest), movies);
const coverageWinners = new Set();
for (let index = 0; index < 50_000; index += 1) {
  coverageWinners.add(recommend({ ...broadRequest, sessionId: `coverage-${index}` }, movies).movieId);
}

const genres = ["comedy", "drama", "action-adventure", "thriller-mystery", "science-fiction-fantasy", "horror", "romance", "family-animation", "documentary"];
const moods = ["warm", "tense", "funny", "transporting", "dark", "romantic"];
const paces = ["slow", "balanced", "fast", "surprise"];
const companies = ["solo", "date", "partner", "friends", "family", "kids"];
const winnerCounts = new Map();
let cases = 0;

for (const genre of genres) {
  for (const mood of moods) {
    for (const pace of paces) {
      for (const company of companies) {
        const result = recommend({
          ...broadRequest,
          sessionId: `audit-${cases}`,
          genres: [genre],
          moods: [mood],
          pace,
          company,
          kidsPresent: company === "kids"
        }, movies);
        winnerCounts.set(result.movie.title, (winnerCounts.get(result.movie.title) ?? 0) + 1);
        cases += 1;
      }
    }
  }
}

const rankedWinners = [...winnerCounts].sort((a, b) => b[1] - a[1]);
const topTenShare = rankedWinners.slice(0, 10).reduce((sum, [, count]) => sum + count, 0) / cases;
const missing = eligible.filter((movie) => !coverageWinners.has(movie.id));
const report = {
  rankingVersion: recommend({ ...broadRequest, sessionId: "audit-version" }, movies).rankingVersion,
  catalogSize: movies.length,
  eligibleMovies: eligible.length,
  eligibleMoviesSelected: coverageWinners.size,
  preferenceCombinations: cases,
  uniqueWinners: winnerCounts.size,
  topTenShare: `${(topTenShare * 100).toFixed(1)}%`,
  mostFrequentWinners: rankedWinners.slice(0, 10).map(([title, wins]) => ({ title, wins })),
  missingEligibleMovies: missing.map((movie) => movie.title)
};

console.log(JSON.stringify(report, null, 2));

if (missing.length > 0 || topTenShare > 0.25) {
  console.error("Recommendation audit failed its coverage or concentration threshold.");
  process.exitCode = 1;
}
