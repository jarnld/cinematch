# CineMatch production foundation

## Product promise

CineMatch asks a small number of questions and returns one movie the user can actually watch tonight, plus two backups. The recommendation must satisfy factual constraints before subjective taste is considered.

## First release scope

- Movies only
- United States availability only
- Anonymous sessions
- One recommendation and up to two backups
- A curated initial catalog before adding a licensed catalog provider
- No custom-trained model
- No social features, accounts, voice interface, or TV series

## Recommendation pipeline

1. Validate the request against `schemas/recommendation-request.schema.json`.
2. Query catalog records shaped like `schemas/movie.schema.json`.
3. Apply hard constraints.
4. Score the remaining candidates using soft preferences.
5. Keep the highest-scoring 10–20 candidates.
6. Optionally ask an AI model to rerank only those candidate IDs.
7. Validate the result against `schemas/recommendation-response.schema.json`.
8. Save the request, candidate set, result, and subsequent user action.

The service must always be able to return the deterministic top result when the AI step is unavailable.

## Hard constraints

These rules remove a movie from consideration:

- The movie exceeds `runtimeMaxMinutes`.
- The movie is not available in the requested region.
- The user selected services and the movie is unavailable on all of them.
- The user excluded the movie or has already rejected it during the session.
- Children are present and the movie fails the configured content-safety policy.

A refinement such as `shorter` must also become a constraint relative to the previous result, not merely a scoring bonus.

## Soft ranking signals

These preferences affect score but do not automatically disqualify a movie:

- Mood
- Pace
- Viewing company
- Preferred actors
- Genre affinities
- Novelty versus familiarity
- Prior likes and dislikes

The first scoring system should be a visible weighted formula. We should log each component so a recommendation can be explained and debugged.

## AI boundary

The AI receives only:

- Validated user preferences
- A small set of eligible candidate records
- Stable candidate IDs
- The required response schema

It may choose and explain a candidate. It may not invent a movie, alter availability, override a hard constraint, or return an ID outside the candidate set.

## Initial data model

The database will eventually need these primary tables:

- `movies`: canonical movie facts and editorial taste tags
- `people`: actors and other credited people
- `movie_cast`: movie-to-person relationships
- `availability`: provider, region, monetization type, and freshness timestamp
- `recommendation_sessions`: anonymous session and questionnaire answers
- `recommendation_events`: shown, accepted, rerolled, watched, and rated actions

The JSON schemas in this repository define the boundary between the interface, recommendation service, and future database.

## Quality rules

- Never expose provider or OpenAI API keys to the browser.
- Never use an unlicensed data source in production.
- Every recommendation must be reproducible from stored inputs and a ranking version.
- Availability must show when it was last verified.
- An AI failure must not prevent a recommendation.
- Confidence is a product score, not a statistical probability, unless it is later calibrated from real outcomes.

## First implementation milestone

Build a server endpoint that accepts the request schema, filters a small local catalog, applies a versioned scoring function, and returns the response schema. Connect the current six-question interface only after the endpoint passes its own tests.
