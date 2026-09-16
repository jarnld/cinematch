const questions = [
  {
    key: "runtime", eyebrow: "TONIGHT'S WINDOW", title: "How much time do you have?", help: "We’ll keep the credits inside your evening.",
    options: [
      ["quick", "Under 90 min", "Tight and efficient"], ["short", "90–105 min", "A compact feature"],
      ["standard", "105–125 min", "The sweet spot"], ["long", "125–145 min", "Room to breathe"],
      ["epic", "Over 145 min", "Make a night of it"], ["any", "Any length", "Best match wins"]
    ]
  },
  {
    key: "vibe", eyebrow: "SET THE MOOD", title: "What should it feel like?", help: "Choose the feeling you want when the credits roll.",
    options: [
      ["warm", "Warm", "Hopeful and human"], ["tense", "Tense", "Keep me guessing"],
      ["funny", "Funny", "Smart over silly"], ["wonder", "Transporting", "Take me somewhere else"],
      ["dark", "Dark", "Let it get under my skin"], ["romantic", "Romantic", "Earn the chemistry"]
    ]
  },
  {
    key: "pace", eyebrow: "PICK A RHYTHM", title: "How should tonight move?", help: "Slow burn, rocket launch, or somewhere between.",
    options: [
      ["slow", "Slow burn", "Atmosphere first"], ["meditative", "Meditative", "Quiet and absorbing"],
      ["balanced", "Steady pull", "Story with momentum"], ["fast", "Fast", "Hook me early"],
      ["relentless", "Relentless", "No time to look away"], ["surprise", "Surprise me", "Ignore the rules"]
    ]
  },
  {
    key: "company", eyebrow: "WHO'S WATCHING", title: "Who has the remote?", help: "Movie-night democracy changes the answer.",
    options: [
      ["solo", "Just me", "A personal pick"], ["date", "Date night", "Something with chemistry"],
      ["partner", "My partner", "A shared obsession"], ["friends", "Friends", "Crowd-pleasing energy"],
      ["family", "Family", "Broad appeal"], ["kids", "Kids included", "All-ages, not dull"]
    ]
  },
  {
    key: "actor", eyebrow: "CAST YOUR VOTE", title: "Who would you follow anywhere?", help: "Not binding—just a useful signal.",
    options: [
      ["amy", "Amy Adams", "Emotional precision"], ["daniel", "Daniel Craig", "Charisma with an edge"],
      ["issa", "Issa Rae", "Wit and warmth"], ["pedro", "Pedro Pascal", "Heart and humor"],
      ["andy", "Andy Samberg", "Commitment to the bit"], ["matt", "Matt Damon", "Competence under pressure"]
    ]
  },
  {
    key: "service", eyebrow: "WHERE YOU WATCH", title: "Which service comes first?", help: "We’ll connect live regional availability next.",
    options: [
      ["netflix", "Netflix", "Your first stop"], ["max", "Max", "Prestige and blockbusters"],
      ["prime", "Prime Video", "Included or rentable"], ["hulu", "Hulu", "Movies and originals"],
      ["disney", "Disney+", "Franchises and family"], ["any", "Any service", "Best match wins"]
    ]
  }
];

const movies = [
  { title: "Arrival", year: 2016, runtime: "1h 56m", genre: "Sci-fi / Drama", poster: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg", tags: ["thoughtful", "emotional", "slow burn"], fit: { runtime:"standard", vibe:"wonder", pace:"slow", company:"date", actor:"amy" }, reason: "Thoughtful without feeling like homework—big ideas, an emotional core, and exactly the slow-burn wonder you asked for." },
  { title: "Knives Out", year: 2019, runtime: "2h 10m", genre: "Mystery / Comedy", poster: "https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg", tags: ["witty", "twisty", "ensemble"], fit: { runtime:"long", vibe:"tense", pace:"balanced", company:"friends", actor:"daniel" }, reason: "A sharp, playful mystery with enough momentum for a group and enough detail to reward everyone paying attention." },
  { title: "The Mitchells vs. the Machines", year: 2021, runtime: "1h 54m", genre: "Animation / Comedy", poster: "https://image.tmdb.org/t/p/w500/mI2Di7HmskQQ34kz0iau6J1vr70.jpg", tags: ["joyful", "inventive", "family"], fit: { runtime:"standard", vibe:"funny", pace:"fast", company:"kids", actor:"issa" }, reason: "Inventive, genuinely funny, and big-hearted—a family crowd-pleaser that never feels like the safe option." },
  { title: "The Unbearable Weight of Massive Talent", year: 2022, runtime: "1h 47m", genre: "Action / Comedy", poster: "https://image.tmdb.org/t/p/w500/aqhLeieyTpTUKPOfZ3jzo2La0Mq.jpg", tags: ["self-aware", "fast", "buddy comedy"], fit: { runtime:"short", vibe:"funny", pace:"fast", company:"friends", actor:"pedro" }, reason: "A fast, charming buddy comedy with just enough action and a wonderfully game performance at its center." },
  { title: "Palm Springs", year: 2020, runtime: "1h 30m", genre: "Comedy / Romance", poster: "https://image.tmdb.org/t/p/w500/yf5IuMW6GHghu39kxA0oFx7Bxmj.jpg", tags: ["romantic", "clever", "breezy"], fit: { runtime:"short", vibe:"romantic", pace:"balanced", company:"date", actor:"andy" }, reason: "Short, clever, and sneakily sincere—the rare date-night comedy that gives you something to talk about afterward." },
  { title: "The Martian", year: 2015, runtime: "2h 24m", genre: "Sci-fi / Adventure", poster: "https://image.tmdb.org/t/p/w500/5BHuvQ6p9kfc091Z8RiFNhCwL4b.jpg", tags: ["hopeful", "smart", "adventure"], fit: { runtime:"long", vibe:"warm", pace:"balanced", company:"family", actor:"matt" }, reason: "Optimistic, funny, and satisfyingly smart—an expansive adventure powered by competence instead of cynicism." }
];

let current = 0;
let answers = {};
let shownTitles = [];
let loadingTimer;

const quizView = document.querySelector("#quizView");
const loadingView = document.querySelector("#loadingView");
const resultView = document.querySelector("#resultView");
const answerGrid = document.querySelector("#answerGrid");

function renderQuestion() {
  const q = questions[current];
  const percent = Math.round(((current + 1) / questions.length) * 100);
  document.querySelector("#questionCounter").textContent = `${String(current + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;
  document.querySelector("#progressBar").style.width = `${percent}%`;
  document.querySelector("#questionEyebrow").textContent = q.eyebrow;
  document.querySelector("#questionTitle").textContent = q.title;
  document.querySelector("#questionHelp").textContent = q.help;
  document.querySelector("#backButton").disabled = current === 0;
  answerGrid.innerHTML = q.options.map(([value, title, subtitle], index) => `
    <button class="answer-card${answers[q.key] === value ? " selected" : ""}" data-value="${value}" type="button">
      <span class="answer-number">0${index + 1}</span>
      <span class="answer-copy"><strong>${title}</strong><span>${subtitle}</span></span>
    </button>`).join("");
  answerGrid.querySelectorAll(".answer-card").forEach(button => button.addEventListener("click", () => selectAnswer(q.key, button.dataset.value)));
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
  return Object.entries(movie.fit).reduce((score, [key, value]) => {
    if (answers[key] === value) return score + (key === "actor" ? 3 : 2);
    if (answers[key] === "any" || answers[key] === "surprise") return score + 1;
    return score;
  }, 0);
}

function chooseMovie() {
  const available = movies.filter(movie => !shownTitles.includes(movie.title));
  const pool = available.length ? available : movies;
  return [...pool].sort((a, b) => scoreMovie(b) - scoreMovie(a))[0];
}

function beginMatching() {
  window.clearTimeout(loadingTimer);
  quizView.hidden = true;
  resultView.hidden = true;
  loadingView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "hidden";
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadingTimer = window.setTimeout(showResult, 1700);
}

function showResult() {
  const movie = chooseMovie();
  shownTitles.push(movie.title);
  const score = Math.min(98, 82 + scoreMovie(movie));
  document.querySelector("#movieTitle").textContent = movie.title;
  document.querySelector("#movieMeta").textContent = `${movie.year} · ${movie.runtime} · ${movie.genre}`;
  document.querySelector("#movieReason").textContent = movie.reason;
  document.querySelector("#matchScore").textContent = score;
  document.querySelector("#resultTags").innerHTML = movie.tags.map(tag => `<span>${tag}</span>`).join("");
  const poster = document.querySelector("#moviePoster");
  poster.src = movie.poster;
  poster.alt = `${movie.title} movie poster`;
  loadingView.hidden = true;
  quizView.hidden = true;
  resultView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "visible";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function restart() {
  window.clearTimeout(loadingTimer);
  current = 0;
  answers = {};
  shownTitles = [];
  loadingView.hidden = true;
  resultView.hidden = true;
  quizView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "visible";
  renderQuestion();
}

document.querySelector("#backButton").addEventListener("click", () => { if (current > 0) { current -= 1; renderQuestion(); } });
document.querySelector("#restartTop").addEventListener("click", restart);
document.querySelector("#restartResult").addEventListener("click", restart);
document.querySelector("#anotherButton").addEventListener("click", beginMatching);
document.querySelector("#watchButton").addEventListener("click", () => {
  document.querySelector("#availabilityNote").textContent = "Next: connect TMDB watch providers and attribute JustWatch for regional availability.";
});

renderQuestion();
