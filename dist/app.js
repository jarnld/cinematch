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

const landingView = document.querySelector("#landingView");
const quizView = document.querySelector("#quizView");
const loadingView = document.querySelector("#loadingView");
const refineView = document.querySelector("#refineView");
const resultView = document.querySelector("#resultView");
const answerGrid = document.querySelector("#answerGrid");
const questionExtra = document.querySelector("#questionExtra");

function startQuiz() {
  current = 0;
  answers = {};
  shownMovieIds = [];
  runtimeMinutes = 115;
  lastMovie = null;
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
    region: "US",
    runtimeMaxMinutes: answers.runtime || runtimeMinutes,
    moods: [answers.vibe],
    pace: answers.pace,
    company: answers.company,
    actorIds: answers.actor ? [answers.actor] : [],
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
  return result.options.map((option) => [option.value, option.title, option.subtitle, option.image]);
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
      const options = await loadAdaptiveOptions(q.type);
      if (sequence !== renderSequence || q !== questions[current]) return;
      if (options.length > 0) {
        renderOptionCards(q, options, true);
        return;
      }
    } catch (error) {
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
    current += 1;
    answerGrid.style.display = "grid";
    renderQuestion();
  });
  updateSlider();
}

function selectAnswer(key, value) {
  answers[key] = value;
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
    showResult(result);
  } catch (error) {
    document.querySelector(".loading-note").textContent = `${error.message} Restart and try a broader set of choices.`;
    document.querySelector("#restartTop").style.visibility = "visible";
  }
}

function showResult(result) {
  const movie = result.movie;
  shownMovieIds.push(movie.id);
  document.querySelector("#movieTitle").textContent = movie.title;
  document.querySelector("#movieMeta").textContent = `${movie.year} · ${formatRuntime(movie.runtimeMinutes)} · ${movie.genres.join(" / ")}`;
  document.querySelector("#movieReason").textContent = result.reason;
  document.querySelector("#matchScore").textContent = result.matchScore;
  document.querySelector("#resultTags").innerHTML = result.matchSignals.slice(0, 3).map(tag => `<span>${tag}</span>`).join("");
  const poster = document.querySelector("#moviePoster");
  poster.src = movie.posterUrl;
  poster.alt = `${movie.title} movie poster`;
  lastMovie = movie;
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

function restart() {
  current = 0;
  answers = {};
  shownMovieIds = [];
  runtimeMinutes = 115;
  lastMovie = null;
  quizView.hidden = true;
  loadingView.hidden = true;
  refineView.hidden = true;
  resultView.hidden = true;
  landingView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "hidden";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelector("#startButton").addEventListener("click", startQuiz);
document.querySelector("#backButton").addEventListener("click", () => { if (current > 0) { current -= 1; answerGrid.style.display = "grid"; renderQuestion(); } });
document.querySelector("#restartTop").addEventListener("click", restart);
document.querySelector("#restartResult").addEventListener("click", restart);
document.querySelector("#anotherButton").addEventListener("click", showRefinement);
document.querySelector("#refineBack").addEventListener("click", () => {
  refineView.hidden = true;
  resultView.hidden = false;
});
document.querySelectorAll(".refine-card").forEach(button => button.addEventListener("click", () => {
  answers.refinement = button.dataset.refine;
  beginMatching();
}));
document.querySelector("#watchButton").addEventListener("click", () => {
  document.querySelector("#availabilityNote").textContent = "Live availability is not connected yet. Current service values are test fixtures.";
});

restart();
