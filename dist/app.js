const questions = [
  {
    key: "runtime", type: "slider", eyebrow: "ROUND 01 · TONIGHT'S WINDOW", title: "How much time do you have?", help: "Drag until the runtime fits your night."
  },
  {
    key: "vibe", eyebrow: "ROUND 02 · SET THE MOOD", title: "What should it feel like?", help: "Choose the feeling you want when the credits roll.",
    options: [
      ["warm", "Warm", "Hopeful and human"], ["tense", "Tense", "Keep me guessing"],
      ["funny", "Funny", "Smart over silly"], ["transporting", "Transporting", "Take me somewhere else"],
      ["dark", "Dark", "Let it get under my skin"], ["romantic", "Romantic", "Earn the chemistry"]
    ]
  },
  {
    key: "pace", eyebrow: "ROUND 03 · PICK A RHYTHM", title: "How should tonight move?", help: "Slow burn, rocket launch, or somewhere between.",
    options: [
      ["slow", "Slow burn", "Atmosphere first"], ["meditative", "Meditative", "Quiet and absorbing"],
      ["balanced", "Steady pull", "Story with momentum"], ["fast", "Fast", "Hook me early"],
      ["relentless", "Relentless", "No time to look away"], ["surprise", "Surprise me", "Ignore the rules"]
    ]
  },
  {
    key: "company", eyebrow: "ROUND 04 · WHO'S WATCHING", title: "Who has the remote?", help: "Movie-night democracy changes the answer.",
    options: [
      ["solo", "Just me", "A personal pick"], ["date", "Date night", "Something with chemistry"],
      ["partner", "My partner", "A shared obsession"], ["friends", "Friends", "Crowd-pleasing energy"],
      ["family", "Family", "Broad appeal"], ["kids", "Kids included", "All-ages, not dull"]
    ]
  },
  {
    key: "service", type: "services", eyebrow: "ROUND 05 · WHERE YOU WATCH", title: "Where should we look?", help: "These services are ranked from the movies still matching your night.",
    options: [
      ["netflix", "Netflix", "Your first stop"], ["max", "Max", "Prestige and blockbusters"],
      ["prime", "Prime Video", "Included or rentable"], ["hulu", "Hulu", "Movies and originals"],
      ["disney", "Disney+", "Franchises and family"], ["any", "Any service", "Best match wins"]
    ]
  },
  {
    key: "actor", type: "actors", eyebrow: "ROUND 06 · CAST YOUR VOTE", title: "Who fits this version of tonight?", help: "The cast below comes from movies matching your first five answers.",
    options: [
      ["person-amy-adams", "Amy Adams", "Emotional precision", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Amy_Adams_.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Amy_Adams_.jpg"],
      ["person-daniel-craig", "Daniel Craig", "Charisma with an edge", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Daniel_Craig_in_2021.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Daniel_Craig_in_2021.jpg"],
      ["person-issa-rae", "Issa Rae", "Wit and warmth", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Issa_Rae_(cropped).jpg?width=600", "https://commons.wikimedia.org/wiki/File:Issa_Rae_(cropped).jpg"],
      ["person-pedro-pascal", "Pedro Pascal", "Heart and humor", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Pedro_Pascal_on_street.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Pedro_Pascal_on_street.jpg"],
      ["person-andy-samberg", "Andy Samberg", "Commitment to the bit", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Andy-Samberg-David-Shankbone-2010-NYC-791x1024.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Andy-Samberg-David-Shankbone-2010-NYC-791x1024.jpg"],
      ["person-matt-damon", "Matt Damon", "Competence under pressure", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Matt_Damon-60048.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Matt_Damon-60048.jpg"]
    ]
  }
];

let current = 0;
let answers = {};
let shownMovieIds = [];
let runtimeMinutes = 115;
let lastMovie = null;
let renderSequence = 0;
let recommendationSessionId = newSessionId();
let recommendationAttempts = 0;
let rerollCount = 0;
let sessionActive = false;
let movieSelected = false;
let dashboardReturnView = null;

const recentMoviesKey = "cinematch-recent-movies";

function newSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadRecentMovieIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(recentMoviesKey) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string").slice(-20) : [];
  } catch {
    return [];
  }
}

function rememberMovie(movieId) {
  shownMovieIds = [...shownMovieIds.filter((id) => id !== movieId), movieId].slice(-20);
  try {
    localStorage.setItem(recentMoviesKey, JSON.stringify(shownMovieIds));
  } catch {
    // Recommendations still work when storage is disabled.
  }
}

function track(name, properties = {}, { beacon = false } = {}) {
  const payload = JSON.stringify({ name, sessionId: recommendationSessionId, properties });
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/events", new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => { /* Analytics must never interrupt the movie flow. */ });
}

const landingView = document.querySelector("#landingView");
const quizView = document.querySelector("#quizView");
const loadingView = document.querySelector("#loadingView");
const refineView = document.querySelector("#refineView");
const resultView = document.querySelector("#resultView");
const developerView = document.querySelector("#developerView");
const answerGrid = document.querySelector("#answerGrid");
const questionExtra = document.querySelector("#questionExtra");
const journeyViews = [landingView, quizView, loadingView, refineView, resultView];

function startQuiz() {
  current = 0;
  answers = {};
  shownMovieIds = loadRecentMovieIds();
  runtimeMinutes = 115;
  lastMovie = null;
  recommendationSessionId = newSessionId();
  recommendationAttempts = 0;
  rerollCount = 0;
  sessionActive = true;
  movieSelected = false;
  track("session_started", { entryPoint: "home" });
  landingView.hidden = true;
  loadingView.hidden = true;
  refineView.hidden = true;
  resultView.hidden = true;
  quizView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "visible";
  renderQuestion();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
  })[character]);
}

function safeImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function recommendationRequest() {
  return {
    sessionId: recommendationSessionId,
    region: "US",
    runtimeMaxMinutes: answers.runtime || runtimeMinutes,
    moods: [answers.vibe],
    pace: answers.pace,
    company: answers.company,
    actorIds: answers.actor && answers.actor !== "any" ? [answers.actor] : [],
    serviceIds: answers.service && answers.service !== "any" ? [answers.service] : [],
    kidsPresent: answers.company === "kids",
    excludedMovieIds: shownMovieIds,
    previousMovieId: lastMovie?.id,
    refinement: answers.refinement
  };
}

async function loadAdaptiveOptions(kind) {
  const response = await fetch("/api/options", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, request: recommendationRequest() })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Could not adapt this question.");
  if (kind === "actors") track("actor_page_loaded", { candidateMovieCount: result.candidateMovieCount, optionCount: result.options.length });
  return {
    candidateMovieCount: result.candidateMovieCount,
    options: result.options.map((option) => [option.value, option.title, option.subtitle, option.image])
  };
}

function renderNoAdaptiveOptions() {
  answerGrid.style.display = "block";
  answerGrid.innerHTML = `
    <div class="adaptive-empty">
      <p>No movies in the current catalog fit every answer so far.</p>
      <button class="primary-button" id="broadenSearch" type="button">Go back and broaden the search</button>
    </div>`;
  document.querySelector("#broadenSearch").addEventListener("click", () => {
    current = Math.max(0, current - 1);
    answerGrid.style.display = "grid";
    renderQuestion();
  });
}

function renderOptionCards(question, options, adaptive) {
  if (question.type === "actors") answerGrid.classList.add("actor-grid");
  answerGrid.innerHTML = options.map(([value, title, subtitle, image], index) => {
    const imageUrl = safeImageUrl(image);
    const initials = title.split(/\s+/).map((part) => part[0]).slice(0, 2).join("");
    return `
      <button class="answer-card${question.type === "actors" ? " actor-card" : ""}${answers[question.key] === value ? " selected" : ""}" data-value="${escapeHtml(value)}" type="button">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" loading="lazy" />` : question.type === "actors" ? `<span class="actor-placeholder" aria-hidden="true">${escapeHtml(initials)}</span>` : ""}
        <span class="answer-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="answer-copy"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle)}</span></span>
      </button>`;
  }).join("");
  answerGrid.querySelectorAll(".answer-card").forEach(button => button.addEventListener("click", () => selectAnswer(question.key, button.dataset.value)));

  if (question.type === "actors" && !adaptive) {
    questionExtra.innerHTML = `<details class="photo-credits"><summary>Portrait credits</summary><p>
      <a href="${question.options[0][4]}" target="_blank" rel="noreferrer">Amy Adams</a> ·
      <a href="${question.options[1][4]}" target="_blank" rel="noreferrer">Daniel Craig / Royal Navy</a> ·
      <a href="${question.options[2][4]}" target="_blank" rel="noreferrer">Issa Rae / Bam0822</a> ·
      <a href="${question.options[3][4]}" target="_blank" rel="noreferrer">Pedro Pascal / Allisonjshaw</a> ·
      <a href="${question.options[4][4]}" target="_blank" rel="noreferrer">Andy Samberg / David Shankbone</a> ·
      <a href="${question.options[5][4]}" target="_blank" rel="noreferrer">Matt Damon / Harald Krichel</a>. Wikimedia Commons; Creative Commons or OGL licenses listed at each source.
    </p></details>`;
  }
}

async function renderQuestion() {
  const sequence = ++renderSequence;
  const q = questions[current];
  const percent = Math.round(((current + 1) / questions.length) * 100);
  document.querySelector("#questionCounter").textContent = `${String(current + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;
  document.querySelector("#progressBar").style.width = `${percent}%`;
  document.querySelector("#questionEyebrow").textContent = q.eyebrow;
  document.querySelector("#questionTitle").textContent = q.title;
  document.querySelector("#questionHelp").textContent = q.help;
  document.querySelector("#backButton").disabled = current === 0;
  answerGrid.className = "answer-grid";
  questionExtra.innerHTML = "";

  if (q.type === "slider") {
    renderRuntimeSlider();
    return;
  }

  if (["services", "actors"].includes(q.type)) {
    answerGrid.innerHTML = `<p class="options-loading">Rebuilding this round from your answers…</p>`;
    try {
      const result = await loadAdaptiveOptions(q.type);
      if (sequence !== renderSequence || q !== questions[current]) return;
      if (result.candidateMovieCount === 0) {
        renderNoAdaptiveOptions();
        return;
      }
      if (result.options.length > 0) {
        renderOptionCards(q, result.options, true);
        return;
      }
    } catch (error) {
      if (q.type === "actors") track("actor_page_failed", { message: error.message });
      console.warn(error);
    }
  }

  renderOptionCards(q, q.options, false);
}

function renderRuntimeSlider() {
  answerGrid.innerHTML = `
    <div class="runtime-game">
      <div class="runtime-readout"><strong id="runtimeValue">${runtimeMinutes}</strong><span>MINUTES</span></div>
      <input class="runtime-slider" id="runtimeSlider" type="range" min="75" max="180" step="5" value="${runtimeMinutes}" aria-label="Available movie runtime in minutes" />
      <div class="runtime-scale"><span>75 MIN</span><span>180 MIN</span></div>
      <button class="primary-button runtime-confirm" id="runtimeConfirm" type="button">Lock it in →</button>
    </div>`;
  answerGrid.style.display = "block";
  const slider = document.querySelector("#runtimeSlider");
  const updateSlider = () => {
    runtimeMinutes = Number(slider.value);
    document.querySelector("#runtimeValue").textContent = runtimeMinutes;
    const progress = ((runtimeMinutes - 75) / 105) * 100;
    slider.style.setProperty("--runtime-progress", `${progress}%`);
  };
  slider.addEventListener("input", updateSlider);
  document.querySelector("#runtimeConfirm").addEventListener("click", () => {
    answers.runtime = runtimeMinutes;
    track("preference_answered", { question: "runtime", value: runtimeMinutes, step: current + 1 });
    current += 1;
    answerGrid.style.display = "grid";
    renderQuestion();
  });
  updateSlider();
}

function selectAnswer(key, value) {
  answers[key] = value;
  track("preference_answered", { question: key, value, step: current + 1 });
  answerGrid.querySelectorAll(".answer-card").forEach(card => card.classList.toggle("selected", card.dataset.value === value));
  window.setTimeout(() => {
    if (current < questions.length - 1) {
      current += 1;
      renderQuestion();
    } else {
      beginMatching();
    }
  }, 180);
}

async function beginMatching() {
  landingView.hidden = true;
  quizView.hidden = true;
  refineView.hidden = true;
  resultView.hidden = true;
  loadingView.hidden = false;
  document.querySelector(".loading-note").textContent = answers.refinement ? "Applying your new signal without losing the first six." : "Balancing time, mood, pace, and company.";
  document.querySelector("#restartTop").style.visibility = "hidden";
  window.scrollTo({ top: 0, behavior: "smooth" });

  const request = recommendationRequest();
  recommendationAttempts += 1;
  track("recommendation_requested", {
    attempt: recommendationAttempts,
    isReroll: recommendationAttempts > 1,
    rerollCount
  });

  try {
    const [response] = await Promise.all([
      fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request)
      }),
      new Promise((resolve) => window.setTimeout(resolve, 700))
    ]);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Recommendation failed.");
    track("recommendation_returned", {
      attempt: recommendationAttempts,
      movieId: result.movie?.id,
      matchScore: result.matchScore,
      isReroll: recommendationAttempts > 1
    });
    showResult(result);
  } catch (error) {
    track("recommendation_failed", { attempt: recommendationAttempts, message: error.message });
    document.querySelector(".loading-note").textContent = `${error.message} Restart and try a broader set of choices.`;
    document.querySelector("#restartTop").style.visibility = "visible";
  }
}

function showResult(result) {
  const movie = result.movie;
  rememberMovie(movie.id);
  document.querySelector("#movieTitle").textContent = movie.title;
  document.querySelector("#movieMeta").textContent = `${movie.year} · ${formatRuntime(movie.runtimeMinutes)} · ${movie.genres.join(" / ")}`;
  document.querySelector("#movieReason").textContent = result.reason;
  document.querySelector("#matchScore").textContent = result.matchScore;
  document.querySelector("#resultTags").innerHTML = result.matchSignals.slice(0, 3).map(tag => `<span>${tag}</span>`).join("");
  const poster = document.querySelector("#moviePoster");
  poster.src = movie.posterUrl;
  poster.alt = `${movie.title} movie poster`;
  lastMovie = movie;
  movieSelected = false;
  const watchButton = document.querySelector("#watchButton");
  watchButton.textContent = "Choose this movie";
  watchButton.dataset.state = "choose";
  document.querySelector("#availabilityNote").textContent = "Choose it first, then we’ll point you toward streaming.";
  loadingView.hidden = true;
  quizView.hidden = true;
  resultView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "visible";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatRuntime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function showRefinement() {
  resultView.hidden = true;
  loadingView.hidden = true;
  quizView.hidden = true;
  landingView.hidden = true;
  refineView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "visible";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return "—";
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value}%` : "—";
}

async function loadDashboard() {
  const status = document.querySelector("#dashboardStatus");
  status.hidden = false;
  status.textContent = "Loading analytics…";
  try {
    const response = await fetch("/api/analytics/summary", { cache: "no-store" });
    if (!response.ok) throw new Error("Analytics could not be loaded.");
    const data = await response.json();
    const kpis = [
      ["Recommendation success", formatPercent(data.kpis.recommendationSuccessRate), "Returned ÷ requested sessions"],
      ["Movie selection", formatPercent(data.kpis.movieSelectionRate), "Selected ÷ sessions with a result"],
      ["Median decision time", formatDuration(data.kpis.medianTimeToDecisionMs), "Start to first selection"],
      ["Watch intent", formatPercent(data.kpis.watchIntentRate), "Streaming clicks ÷ selections"],
      ["Reroll rate", formatPercent(data.kpis.rerollRate), "Sessions rerolled after a result"],
      ["Rerolls before selection", data.kpis.averageRerollsBeforeSelection ?? "—", `Average · median ${data.kpis.medianRerollsBeforeSelection ?? "—"}`],
      ["Unique recommendations", formatPercent(data.kpis.recommendationUniquenessRate), "Unique titles ÷ all results"],
      ["Repeat rate", formatPercent(data.kpis.recommendationRepeatRate), "Repeated titles across results"]
    ];
    document.querySelector("#kpiGrid").innerHTML = kpis.map(([label, value, note]) => `
      <article class="kpi-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`).join("");

    const funnelMax = Math.max(1, ...data.funnel.map((step) => step.count));
    document.querySelector("#funnel").innerHTML = data.funnel.map((step) => `
      <div class="funnel-step">
        <div><span>${escapeHtml(step.label)}</span><strong>${step.count}</strong></div>
        <i><b style="width:${Math.round((step.count / funnelMax) * 100)}%"></b></i>
      </div>`).join("");
    document.querySelector("#sessionCount").textContent = `${data.sessionCount} total sessions`;

    const diagnosticItems = [
      ["Recommendations returned", data.diagnostics.recommendationsReturned],
      ["Unique movies returned", data.diagnostics.uniqueMoviesReturned],
      ["Within-session repeats", data.diagnostics.withinSessionRepeats],
      ["Failed recommendations", data.diagnostics.failedRecommendations],
      ["Abandoned sessions", data.diagnostics.abandonedSessions],
      ["Events retained", data.eventCount]
    ];
    document.querySelector("#diagnostics").innerHTML = diagnosticItems.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`).join("");

    document.querySelector("#sessionRows").innerHTML = data.recentSessions.length ? data.recentSessions.map((session) => `
      <tr>
        <td><code>${escapeHtml(session.sessionId)}</code></td>
        <td>${escapeHtml(new Date(session.startedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}</td>
        <td><span class="status-pill status-${escapeHtml(session.status.toLowerCase().replace(/\s+/g, "-"))}">${escapeHtml(session.status)}</span></td>
        <td>${session.answered}</td><td>${session.returned}</td><td>${session.rerolls}</td><td>${formatDuration(session.decisionMs)}</td>
      </tr>`).join("") : `<tr><td colspan="7" class="empty-table">No journeys recorded yet. Complete a CineMatch session to populate this view.</td></tr>`;
    status.textContent = `Updated ${new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
  } catch (error) {
    status.textContent = error.message;
  }
}

function toggleDeveloperView() {
  const button = document.querySelector("#developerButton");
  if (!developerView.hidden) {
    developerView.hidden = true;
    (dashboardReturnView ?? landingView).hidden = false;
    dashboardReturnView = null;
    button.textContent = "Developer";
    return;
  }
  dashboardReturnView = journeyViews.find((view) => !view.hidden) ?? landingView;
  journeyViews.forEach((view) => { view.hidden = true; });
  developerView.hidden = false;
  button.textContent = "Back to CineMatch";
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadDashboard();
}

function restart() {
  if (sessionActive && !movieSelected) {
    track("session_abandoned", { reason: "restart", step: current + 1 });
  }
  current = 0;
  answers = {};
  shownMovieIds = loadRecentMovieIds();
  runtimeMinutes = 115;
  lastMovie = null;
  recommendationSessionId = newSessionId();
  recommendationAttempts = 0;
  rerollCount = 0;
  sessionActive = false;
  movieSelected = false;
  quizView.hidden = true;
  loadingView.hidden = true;
  refineView.hidden = true;
  resultView.hidden = true;
  landingView.hidden = false;
  developerView.hidden = true;
  document.querySelector("#developerButton").textContent = "Developer";
  document.querySelector("#restartTop").style.visibility = "hidden";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelector("#startButton").addEventListener("click", startQuiz);
document.querySelector("#backButton").addEventListener("click", () => { if (current > 0) { current -= 1; answerGrid.style.display = "grid"; renderQuestion(); } });
document.querySelector("#restartTop").addEventListener("click", restart);
document.querySelector("#restartResult").addEventListener("click", restart);
document.querySelector("#anotherButton").addEventListener("click", showRefinement);
document.querySelector("#developerButton").addEventListener("click", toggleDeveloperView);
document.querySelector("#refreshAnalytics").addEventListener("click", loadDashboard);
document.querySelector("#refineBack").addEventListener("click", () => {
  refineView.hidden = true;
  resultView.hidden = false;
});
document.querySelectorAll(".refine-card").forEach(button => button.addEventListener("click", () => {
  answers.refinement = button.dataset.refine;
  rerollCount += 1;
  track("recommendation_rerolled", { refinement: answers.refinement, rerollCount, previousMovieId: lastMovie?.id });
  beginMatching();
}));
document.querySelector("#watchButton").addEventListener("click", () => {
  const button = document.querySelector("#watchButton");
  if (button.dataset.state === "choose") {
    movieSelected = true;
    sessionActive = false;
    track("movie_selected", { movieId: lastMovie?.id, rerollCount });
    button.dataset.state = "watch";
    button.textContent = "Where to watch";
    document.querySelector("#availabilityNote").textContent = "Great pick. Check where it’s streaming next.";
    return;
  }
  track("streaming_clicked", { movieId: lastMovie?.id, service: answers.service ?? "any" });
  document.querySelector("#availabilityNote").textContent = "Live availability is not connected yet. Current service values are test fixtures.";
});

window.addEventListener("pagehide", () => {
  if (sessionActive && !movieSelected) {
    track("session_abandoned", { reason: "page_exit", step: current + 1 }, { beacon: true });
    sessionActive = false;
  }
});

restart();
