const genreSlugOverrides = new Map([
  ["Science Fiction", "science-fiction"],
  ["TV Movie", "tv-movie"]
]);

const providerOverrides = new Map([
  [2, { id: "apple", name: "Apple TV" }],
  [8, { id: "netflix", name: "Netflix" }],
  [9, { id: "prime", name: "Prime Video" }],
  [10, { id: "prime", name: "Amazon Video" }],
  [15, { id: "hulu", name: "Hulu" }],
  [337, { id: "disney", name: "Disney+" }],
  [350, { id: "apple", name: "Apple TV+" }],
  [1899, { id: "max", name: "Max" }]
]);

const castIdOverrides = new Map([
  ["Amy Adams", "person-amy-adams"],
  ["Daniel Craig", "person-daniel-craig"],
  ["Issa Rae", "person-issa-rae"],
  ["Pedro Pascal", "person-pedro-pascal"],
  ["Andy Samberg", "person-andy-samberg"],
  ["Matt Damon", "person-matt-damon"]
]);

const monetizationTypes = [
  ["flatrate", "subscription"],
  ["free", "free"],
  ["ads", "ads"],
  ["rent", "rent"],
  ["buy", "buy"]
];

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function unique(values) {
  return [...new Set(values)];
}

export function deriveTasteTags(genres) {
  const genreSet = new Set(genres);
  const moods = [];

  if (genreSet.has("comedy")) moods.push("funny", "warm");
  if (genreSet.has("romance")) moods.push("romantic", "warm");
  if (["thriller", "mystery", "crime", "action", "war"].some((genre) => genreSet.has(genre))) moods.push("tense");
  if (["horror", "crime", "thriller"].some((genre) => genreSet.has(genre))) moods.push("dark");
  if (["adventure", "fantasy", "science-fiction", "animation", "history", "documentary", "western"].some((genre) => genreSet.has(genre))) moods.push("transporting");
  if (["family", "animation"].some((genre) => genreSet.has(genre))) moods.push("warm");
  if (moods.length === 0) moods.push("warm");

  let pace = "balanced";
  if (["action", "adventure", "thriller", "horror"].some((genre) => genreSet.has(genre))) pace = "fast";
  if (["documentary", "history"].some((genre) => genreSet.has(genre))) pace = "slow";

  return { moods: unique(moods).slice(0, 3), pace };
}

function findCertification(releaseDates, region) {
  const releases = releaseDates?.results?.find((entry) => entry.iso_3166_1 === region)?.release_dates ?? [];
  const preferredTypes = [3, 4, 6, 2, 5, 1];

  for (const type of preferredTypes) {
    const certification = releases.find((release) => release.type === type && release.certification)?.certification;
    if (certification) return certification;
  }
  return "NR";
}

function deriveAudiences(genres, kidsSafe) {
  const genreSet = new Set(genres);
  const audiences = ["solo", "partner"];
  if (["romance", "drama", "comedy"].some((genre) => genreSet.has(genre))) audiences.push("date");
  if (["action", "adventure", "comedy", "horror", "thriller"].some((genre) => genreSet.has(genre))) audiences.push("friends");
  if (kidsSafe && ["family", "animation", "adventure", "comedy"].some((genre) => genreSet.has(genre))) audiences.push("family", "kids");
  return unique(audiences);
}

function normalizeAvailability(watchProviders, region, checkedAt) {
  const regional = watchProviders?.results?.[region];
  if (!regional) return [];

  const availability = [];
  for (const [tmdbType, monetizationType] of monetizationTypes) {
    for (const provider of regional[tmdbType] ?? []) {
      const override = providerOverrides.get(provider.provider_id);
      availability.push({
        region,
        providerId: override?.id ?? `tmdb-provider-${provider.provider_id}`,
        providerName: override?.name ?? provider.provider_name,
        monetizationType,
        ...(regional.link ? { watchUrl: regional.link } : {}),
        checkedAt
      });
    }
  }

  return availability.filter((entry, index, entries) =>
    entries.findIndex((candidate) => candidate.providerId === entry.providerId && candidate.monetizationType === entry.monetizationType) === index
  );
}

export function normalizeTmdbMovie(details, { region = "US", checkedAt = new Date().toISOString() } = {}) {
  const year = Number.parseInt(details.release_date?.slice(0, 4), 10);
  const genres = unique((details.genres ?? []).map((genre) => genreSlugOverrides.get(genre.name) ?? slugify(genre.name)).filter(Boolean));
  const availability = normalizeAvailability(details["watch/providers"], region, checkedAt);

  if (!details.id || !details.title || !Number.isInteger(year) || !Number.isInteger(details.runtime) || details.runtime < 1 || genres.length === 0 || !details.poster_path || availability.length === 0) {
    return null;
  }

  const certification = findCertification(details.release_dates, region);
  const kidsSafe = ["G", "PG"].includes(certification);
  const taste = deriveTasteTags(genres);

  return {
    id: `tmdb-movie-${details.id}`,
    title: details.title,
    year,
    runtimeMinutes: details.runtime,
    overview: details.overview ?? "",
    posterUrl: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
    genres,
    moods: taste.moods,
    pace: taste.pace,
    audiences: deriveAudiences(genres, kidsSafe),
    cast: (details.credits?.cast ?? []).slice(0, 10).map((person) => ({
      id: castIdOverrides.get(person.name) ?? `tmdb-person-${person.id}`,
      name: person.name
    })),
    content: { certification, kidsSafe },
    availability,
    source: { provider: "tmdb", externalId: String(details.id) }
  };
}
