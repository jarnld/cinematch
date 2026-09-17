# CineMatch

CineMatch is a gamified movie concierge: answer six quick questions and get one confident recommendation instead of another infinite grid.

## What works now

- Six-question, mobile-friendly recommendation flow with six choices per question
- A dedicated welcome screen and game-like round progression
- Interactive runtime slider and visual actor selection
- Runtime, mood, pace, company, actor, and streaming-service signals
- Ranked recommendations from a small demo catalog
- A dedicated matching transition and real TMDB poster imagery
- Reroll with the existing answers, plus a full restart flow
- A six-choice bonus round that refines each reroll without discarding the original answers
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

## Production foundation

The production recommendation service is being designed in [`docs/production-foundation.md`](docs/production-foundation.md). Its API contracts live in [`schemas/`](schemas/) and separate hard constraints (runtime, region, availability, and safety) from softer taste signals (mood, pace, company, and cast).

### Run CineMatch locally

You need Node.js 20 or newer. Installing Node.js also installs the `npm` command used below. Confirm the installation in Terminal or PowerShell:

```bash
node --version
npm --version
```

For a new checkout on macOS, Windows, or Linux:

```bash
git clone --branch production-foundation https://github.com/jarnld/cinematch.git
cd cinematch
npm run dev
```

If you cloned the repository before the `production-foundation` branch was published, update the existing checkout instead:

```bash
git fetch origin
git switch production-foundation
git pull
npm run dev
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000) in a browser. Keep the Terminal or PowerShell window open while using CineMatch; press `Control-C` there to stop it.

No `npm install` step is currently required because this version has no third-party code dependencies. Run `npm test` whenever you want to check the recommendation rules.

### Easiest Windows setup

The earlier `System32` message meant Command Prompt was looking in the Windows system folder rather than in the CineMatch repository. After cloning the repository and switching to `production-foundation`, open the `cinematch` folder in File Explorer and double-click `start-cinematch.cmd`.

That launcher changes to the correct folder automatically, starts the service, and leaves a readable error message on screen if Node.js is missing. When it says CineMatch is ready, open [http://127.0.0.1:3000](http://127.0.0.1:3000). Keep the launcher window open while using the app.

Before starting a development session, you can also run this from PowerShell inside the repository:

```powershell
npm run check
npm run dev
```

`npm run check` runs the automated service and recommendation tests. If port 3000 is already being used, close the other CineMatch window or choose a different port in PowerShell:

```powershell
$env:PORT=3001
npm run dev
```

Then open `http://127.0.0.1:3001`.

The same local process serves both the interface and the API: `GET /health` reports service status and `POST /api/recommend` returns recommendations. The interface now calls this endpoint instead of ranking films in the browser.

The service uses a six-film fixture catalog to exercise real filtering and ranking behavior. Its availability records are test fixtures and must not be presented as current streaming data.

For a future hosted environment, the same server accepts `HOST` and `PORT` environment variables. Local development remains locked to this computer by default; a host can set `HOST=0.0.0.0` when we are ready to deploy.

## Build a real local movie catalog

CineMatch can now create a local catalog from TMDB. The importer retrieves real titles, release years, runtimes, posters, cast, US certifications, and regional watch-provider records. It then adds CineMatch's own deterministic mood, pace, and audience tags based on genres. Those taste tags are editorial heuristics—not facts supplied by TMDB—and live in `src/tmdb-catalog.js` so they can be reviewed and improved.

First, create a TMDB account and request an API Read Access Token from [TMDB's API settings](https://www.themoviedb.org/settings/api). Never paste the token into this repository or into browser code.

In Windows PowerShell, from the CineMatch folder:

```powershell
$secret = Read-Host "Paste your TMDB Read Access Token" -AsSecureString
$env:TMDB_READ_TOKEN = [Net.NetworkCredential]::new("", $secret).Password
npm run catalog:sync
npm run check
npm run dev
```

On macOS or Linux:

```bash
read -s TMDB_READ_TOKEN
export TMDB_READ_TOKEN
npm run catalog:sync
npm run check
npm run dev
```

By default the importer requests up to 40 popular movies with watch options in the United States and writes `data/movies.catalog.json`. That generated file is intentionally ignored by Git because provider availability changes over time. If the file is missing, CineMatch automatically falls back to the six-film fixture catalog.

You can adjust a local import with `TMDB_REGION`, `TMDB_PAGES`, and `TMDB_MAX_MOVIES`. The site reads the generated file only when the server starts, so restart `npm run dev` after syncing. Visit `/health` and look for `"catalogSource":"tmdb"` to confirm that the real catalog loaded.

TMDB watch-provider data is supplied through its JustWatch partnership and requires JustWatch attribution. The current UI must retain the TMDB notice and will need visible JustWatch attribution before a catalog-backed version is published.

## Repository setup

This folder is intentionally ready to become its own Git repository. Keep secrets in environment variables and never commit `.env` files.
