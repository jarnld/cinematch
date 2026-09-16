const questions = [
  {
    key: "runtime", type: "slider", eyebrow: "ROUND 01 · TONIGHT'S WINDOW", title: "How much time do you have?", help: "Drag until the runtime fits your night."
  },
  {
    key: "vibe", eyebrow: "ROUND 02 · SET THE MOOD", title: "What should it feel like?", help: "Choose the feeling you want when the credits roll.",
    options: [
      ["warm", "Warm", "Hopeful and human"], ["tense", "Tense", "Keep me guessing"],
      ["funny", "Funny", "Smart over silly"], ["wonder", "Transporting", "Take me somewhere else"],
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
    key: "actor", type: "actors", eyebrow: "ROUND 05 · CAST YOUR VOTE", title: "Who would you follow anywhere?", help: "Pick a face. We’ll read between the lines.",
    options: [
      ["amy", "Amy Adams", "Emotional precision", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Amy_Adams_.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Amy_Adams_.jpg"],
      ["daniel", "Daniel Craig", "Charisma with an edge", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Daniel_Craig_in_2021.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Daniel_Craig_in_2021.jpg"],
      ["issa", "Issa Rae", "Wit and warmth", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Issa_Rae_(cropped).jpg?width=600", "https://commons.wikimedia.org/wiki/File:Issa_Rae_(cropped).jpg"],
      ["pedro", "Pedro Pascal", "Heart and humor", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Pedro_Pascal_on_street.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Pedro_Pascal_on_street.jpg"],
      ["andy", "Andy Samberg", "Commitment to the bit", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Andy-Samberg-David-Shankbone-2010-NYC-791x1024.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Andy-Samberg-David-Shankbone-2010-NYC-791x1024.jpg"],
      ["matt", "Matt Damon", "Competence under pressure", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Matt_Damon-60048.jpg?width=600", "https://commons.wikimedia.org/wiki/File:Matt_Damon-60048.jpg"]
    ]
  },
  {
    key: "service", eyebrow: "ROUND 06 · WHERE YOU WATCH", title: "Which service comes first?", help: "We’ll connect live regional availability next.",
    options: [
      ["netflix", "Netflix", "Your first stop"], ["max", "Max", "Prestige and blockbusters"],
      ["prime", "Prime Video", "Included or rentable"], ["hulu", "Hulu", "Movies and originals"],
      ["disney", "Disney+", "Franchises and family"], ["any", "Any service", "Best match wins"]
    ]
  }
];

const movies = [
  { title: "Arrival", year: 2016, minutes: 116, runtime: "1h 56m", genre: "Sci-fi / Drama", poster: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg", tags: ["thoughtful", "emotional", "slow burn"], fit: { vibe:"wonder", pace:"slow", company:"date", actor:"amy" }, reason: "Thoughtful without feeling like homework—big ideas, an emotional core, and exactly the slow-burn wonder you asked for." },
  { title: "Knives Out", year: 2019, minutes: 130, runtime: "2h 10m", genre: "Mystery / Comedy", poster: "https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg", tags: ["witty", "twisty", "ensemble"], fit: { vibe:"tense", pace:"balanced", company:"friends", actor:"daniel" }, reason: "A sharp, playful mystery with enough momentum for a group and enough detail to reward everyone paying attention." },
  { title: "The Mitchells vs. the Machines", year: 2021, minutes: 114, runtime: "1h 54m", genre: "Animation / Comedy", poster: "https://image.tmdb.org/t/p/w500/mI2Di7HmskQQ34kz0iau6J1vr70.jpg", tags: ["joyful", "inventive", "family"], fit: { vibe:"funny", pace:"fast", company:"kids", actor:"issa" }, reason: "Inventive, genuinely funny, and big-hearted—a family crowd-pleaser that never feels like the safe option." },
  { title: "The Unbearable Weight of Massive Talent", year: 2022, minutes: 107, runtime: "1h 47m", genre: "Action / Comedy", poster: "https://image.tmdb.org/t/p/w500/aqhLeieyTpTUKPOfZ3jzo2La0Mq.jpg", tags: ["self-aware", "fast", "buddy comedy"], fit: { vibe:"funny", pace:"fast", company:"friends", actor:"pedro" }, reason: "A fast, charming buddy comedy with just enough action and a wonderfully game performance at its center." },
  { title: "Palm Springs", year: 2020, minutes: 90, runtime: "1h 30m", genre: "Comedy / Romance", poster: "https://image.tmdb.org/t/p/w500/yf5IuMW6GHghu39kxA0oFx7Bxmj.jpg", tags: ["romantic", "clever", "breezy"], fit: { vibe:"romantic", pace:"balanced", company:"date", actor:"andy" }, reason: "Short, clever, and sneakily sincere—the rare date-night comedy that gives you something to talk about afterward." },
  { title: "The Martian", year: 2015, minutes: 144, runtime: "2h 24m", genre: "Sci-fi / Adventure", poster: "https://image.tmdb.org/t/p/w500/5BHuvQ6p9kfc091Z8RiFNhCwL4b.jpg", tags: ["hopeful", "smart", "adventure"], fit: { vibe:"warm", pace:"balanced", company:"family", actor:"matt" }, reason: "Optimistic, funny, and satisfyingly smart—an expansive adventure powered by competence instead of cynicism." }
];

let current = 0;
let answers = {};
let shownTitles = [];
let runtimeMinutes = 115;
let loadingTimer;
let lastMovie = null;

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
  shownTitles = [];
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

function renderQuestion() {
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

  if (q.type === "actors") answerGrid.classList.add("actor-grid");
  answerGrid.innerHTML = q.options.map(([value, title, subtitle, image], index) => `
    <button class="answer-card${q.type === "actors" ? " actor-card" : ""}${answers[q.key] === value ? " selected" : ""}" data-value="${value}" type="button">
      ${image ? `<img src="${image}" alt="${title}" loading="lazy" />` : ""}
      <span class="answer-number">0${index + 1}</span>
      <span class="answer-copy"><strong>${title}</strong><span>${subtitle}</span></span>
    </button>`).join("");
  answerGrid.querySelectorAll(".answer-card").forEach(button => button.addEventListener("click", () => selectAnswer(q.key, button.dataset.value)));

  if (q.type === "actors") {
    questionExtra.innerHTML = `<details class="photo-credits"><summary>Portrait credits</summary><p>
      <a href="${q.options[0][4]}" target="_blank" rel="noreferrer">Amy Adams</a> ·
      <a href="${q.options[1][4]}" target="_blank" rel="noreferrer">Daniel Craig / Royal Navy</a> ·
      <a href="${q.options[2][4]}" target="_blank" rel="noreferrer">Issa Rae / Bam0822</a> ·
      <a href="${q.options[3][4]}" target="_blank" rel="noreferrer">Pedro Pascal / Allisonjshaw</a> ·
      <a href="${q.options[4][4]}" target="_blank" rel="noreferrer">Andy Samberg / David Shankbone</a> ·
      <a href="${q.options[5][4]}" target="_blank" rel="noreferrer">Matt Damon / Harald Krichel</a>. Wikimedia Commons; Creative Commons or OGL licenses listed at each source.
    </p></details>`;
  }
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

function scoreMovie(movie) {
  const runtimeDifference = Math.abs((answers.runtime || 115) - movie.minutes);
  let score = runtimeDifference <= 10 ? 3 : runtimeDifference <= 25 ? 1 : -2;
  for (const [key, value] of Object.entries(movie.fit)) {
    if (answers[key] === value) score += key === "actor" ? 3 : 2;
    if (answers[key] === "any" || answers[key] === "surprise") score += 1;
  }
  const refinement = answers.refinement;
  if (refinement === "lighter" && (["warm", "funny", "romantic"].includes(movie.fit.vibe) || movie.tags.some(tag => ["joyful", "hopeful", "breezy"].includes(tag)))) score += 5;
  if (refinement === "tenser" && (movie.fit.vibe === "tense" || movie.tags.some(tag => ["twisty", "dark"].includes(tag)))) score += 5;
  if (refinement === "faster" && (movie.fit.pace === "fast" || movie.minutes <= 110)) score += 5;
  if (refinement === "slower" && (movie.fit.pace === "slow" || movie.fit.pace === "meditative" || movie.tags.includes("thoughtful"))) score += 5;
  if (refinement === "shorter" && lastMovie && movie.minutes < lastMovie.minutes) score += Math.min(6, Math.ceil((lastMovie.minutes - movie.minutes) / 10));
  if (refinement === "wildcard" && movie.fit.actor !== answers.actor && movie.fit.vibe !== answers.vibe) score += 5;
  return score;
}

function chooseMovie() {
  const available = movies.filter(movie => !shownTitles.includes(movie.title));
  const pool = available.length ? available : movies;
  if (!available.length) shownTitles = [];
  return [...pool].sort((a, b) => scoreMovie(b) - scoreMovie(a))[0];
}

function beginMatching() {
  window.clearTimeout(loadingTimer);
  landingView.hidden = true;
  quizView.hidden = true;
  refineView.hidden = true;
  resultView.hidden = true;
  loadingView.hidden = false;
  document.querySelector(".loading-note").textContent = answers.refinement ? "Applying your new signal without losing the first six." : "Balancing time, mood, pace, and company.";
  document.querySelector("#restartTop").style.visibility = "hidden";
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadingTimer = window.setTimeout(showResult, 1450);
}

function showResult() {
  const movie = chooseMovie();
  shownTitles.push(movie.title);
  const score = Math.max(79, Math.min(98, 86 + scoreMovie(movie)));
  document.querySelector("#movieTitle").textContent = movie.title;
  document.querySelector("#movieMeta").textContent = `${movie.year} · ${movie.runtime} · ${movie.genre}`;
  document.querySelector("#movieReason").textContent = movie.reason;
  document.querySelector("#matchScore").textContent = score;
  document.querySelector("#resultTags").innerHTML = movie.tags.map(tag => `<span>${tag}</span>`).join("");
  const poster = document.querySelector("#moviePoster");
  poster.src = movie.poster;
  poster.alt = `${movie.title} movie poster`;
  lastMovie = movie;
  loadingView.hidden = true;
  quizView.hidden = true;
  resultView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "visible";
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  window.clearTimeout(loadingTimer);
  current = 0;
  answers = {};
  shownTitles = [];
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
  document.querySelector("#availabilityNote").textContent = "Next: connect TMDB watch providers and attribute JustWatch for regional availability.";
});

restart();
