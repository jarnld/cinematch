# CineMatch

CineMatch is a gamified movie concierge: answer six quick questions and get one confident recommendation instead of another infinite grid.

## What works now

- Six-question, mobile-friendly recommendation flow with six choices per question
- Runtime, mood, pace, company, actor, and streaming-service signals
- Ranked recommendations from a small demo catalog
- A dedicated matching transition and real TMDB poster imagery
- “Give me another” and full restart flows
- Accessible keyboard controls and reduced-motion support

Open `dist/index.html` or serve `dist/` with any static web server.

## Recommended production architecture

Start with retrieval + ranking, not a custom-trained model:

1. Store normalized movie metadata in Postgres (genres, runtime, cast, content notes, embeddings).
2. Pull canonical metadata and `poster_path` values from TMDB. TMDB's watch-provider endpoint can supply regional availability and requires JustWatch attribution.
3. Use deterministic filters first (runtime, region, subscribed services, age limits).
4. Send the remaining candidates plus the user's answers to the OpenAI Responses API.
5. Require structured output containing the selected movie ID, confidence, short rationale, and two backups.
6. Log whether the user accepts, skips, or rates the pick. That feedback becomes the useful training data later.

The model should never invent the catalog or availability. Give it tools such as `search_movies`, `get_movie_details`, and `get_watch_options`, then let it choose among verified records.

## Suggested next build

- Next.js + TypeScript for the production app
- Server-side OpenAI call so the API key never reaches the browser
- Postgres/Supabase for catalog, users, sessions, and feedback
- TMDB for movie metadata and imagery, with TMDB attribution and the appropriate license for commercial use
- A licensed availability API for region-specific streaming data
- Anonymous sessions first; accounts only after repeat use proves valuable

## Repository setup

This folder is intentionally ready to become its own Git repository. Keep secrets in environment variables and never commit `.env` files.
