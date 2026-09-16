const questions = [
  {
    key: "runtime", eyebrow: "TONIGHT'S WINDOW", title: "How much time do you have?", help: "We’ll keep the credits inside your evening.",
    options: [
      ["quick", "⚡", "Under 90 minutes", "Tight, fast, no filler"],
      ["standard", "◷", "90–120 minutes", "The sweet spot"],
      ["epic", "◉", "Over 2 hours", "Make a night of it"],
      ["any", "∞", "Time is no object", "I’m here for the journey"]
    ]
  },
  {
    key: "vibe", eyebrow: "SET THE MOOD", title: "What should the movie feel like?", help: "Go with the mood you want—not the mood you’re in.",
    options: [
      ["warm", "☀", "Warm & hopeful", "Leave me feeling lighter"],
      ["tense", "⌁", "Tense & twisty", "Keep me guessing"],
      ["funny", "☺", "Smart & funny", "Clever beats chaotic"],
      ["wonder", "✦", "Full of wonder", "Take me somewhere else"]
    ]
  },
  {
    key: "pace", eyebrow: "PICK A RHYTHM", title: "How should tonight move?", help: "This helps us separate a slow burn from a rocket launch.",
    options: [
      ["slow", "≈", "Let it simmer", "Atmosphere over action"],
      ["balanced", "↝", "A steady pull", "Story with momentum"],
      ["fast", "»", "Hit the gas", "Hook me immediately"],
      ["surprise", "?", "Surprise me", "I trust the process"]
    ]
  },
  {
    key: "company", eyebrow: "WHO'S WATCHING", title: "Who has the remote?", help: "We’ll avoid recommending a solo art film to movie-night democracy.",
    options: [
      ["solo", "1", "Just me", "A personal pick"],
      ["date", "2", "Date night", "Something to talk about"],
      ["friends", "3+", "A group of friends", "Crowd-pleasing energy"],
      ["family", "⌂", "Family night", "Broad appeal, easy watch"]
    ]
  },
  {
    key: "actor", eyebrow: "CAST YOUR VOTE", title: "Who would you follow into a story?", help: "Not a binding choice—just a useful taste signal.",
    options: [
      ["amy", "A", "Amy Adams", "Grounded and emotionally sharp"],
      ["daniel", "D", "Daniel Craig", "Charisma with an edge"],
      ["issa", "I", "Issa Rae", "Wit and effortless warmth"],
      ["pedro", "P", "Pedro Pascal", "Heart, humor, adventure"]
    ]
  },
  {
    key: "service", eyebrow: "WHERE YOU WATCH", title: "Which screen can we send you to?", help: "Choose the service you reach for first. Live availability comes in the next build.",
    options: [
      ["netflix", "N", "Netflix", "Your first stop"],
      ["max", "M", "Max", "Prestige and blockbusters"],
      ["prime", "P", "Prime Video", "Included or rentable"],
      ["any", "＋", "Any service", "Best match wins"]
    ]
  }
];

const movies = [
  { title: "Arrival", year: 2016, runtime: "1h 56m", genre: "Sci-fi / Drama", tags: ["thoughtful", "emotional", "slow burn"], fit: { runtime:"standard", vibe:"wonder", pace:"slow", company:"date", actor:"amy" }, reason: "Thoughtful without feeling like homework—big ideas, an emotional core, and exactly the kind of slow-burn wonder you asked for." },
  { title: "Knives Out", year: 2019, runtime: "2h 10m", genre: "Mystery / Comedy", tags: ["witty", "twisty", "ensemble"], fit: { runtime:"epic", vibe:"tense", pace:"balanced", company:"friends", actor:"daniel" }, reason: "A sharp, playful mystery with enough momentum for a group and enough detail to reward everyone paying attention." },
  { title: "The Mitchells vs. the Machines", year: 2021, runtime: "1h 54m", genre: "Animation / Comedy", tags: ["joyful", "inventive", "family"], fit: { runtime:"standard", vibe:"funny", pace:"fast", company:"family", actor:"issa" }, reason: "Inventive, genuinely funny, and big-hearted—a family crowd-pleaser that never feels like the safe option." },
  { title: "The Unbearable Weight of Massive Talent", year: 2022, runtime: "1h 47m", genre: "Action / Comedy", tags: ["self-aware", "fast", "buddy comedy"], fit: { runtime:"standard", vibe:"funny", pace:"fast", company:"friends", actor:"pedro" }, reason: "A fast, charming buddy comedy with just enough action and a wonderfully game performance at its center." },
  { title: "Palm Springs", year: 2020, runtime: "1h 30m", genre: "Comedy / Romance", tags: ["romantic", "clever", "breezy"], fit: { runtime:"quick", vibe:"warm", pace:"balanced", company:"date", actor:"issa" }, reason: "Short, clever, and sneakily sincere—the rare date-night comedy that gives you something to talk about afterward." },
  { title: "The Martian", year: 2015, runtime: "2h 24m", genre: "Sci-fi / Adventure", tags: ["hopeful", "smart", "adventure"], fit: { runtime:"epic", vibe:"warm", pace:"balanced", company:"family", actor:"pedro" }, reason: "Optimistic, funny, and satisfyingly smart—an expansive adventure powered by competence instead of cynicism." }
];

let current = 0;
let answers = {};
let shownTitles = [];

const quizView = document.querySelector("#quizView");
const resultView = document.querySelector("#resultView");
const answerGrid = document.querySelector("#answerGrid");

function renderQuestion() {
  const q = questions[current];
  const percent = Math.round(((current + 1) / questions.length) * 100);
  document.querySelector("#questionCounter").textContent = `Question ${current + 1} of ${questions.length}`;
  document.querySelector("#progressPercent").textContent = `${percent}%`;
  document.querySelector("#progressBar").style.width = `${percent}%`;
  document.querySelector("#questionEyebrow").textContent = q.eyebrow;
  document.querySelector("#questionTitle").textContent = q.title;
  document.querySelector("#questionHelp").textContent = q.help;
  document.querySelector("#backButton").disabled = current === 0;
  answerGrid.innerHTML = q.options.map(([value, icon, title, subtitle]) => `
    <button class="answer-card${answers[q.key] === value ? " selected" : ""}" data-value="${value}" type="button">
      <span class="answer-icon" aria-hidden="true">${icon}</span>
      <span class="answer-copy"><strong>${title}</strong><span>${subtitle}</span></span>
    </button>`).join("");
  answerGrid.querySelectorAll(".answer-card").forEach(button => {
    button.addEventListener("click", () => selectAnswer(q.key, button.dataset.value));
  });
}

function selectAnswer(key, value) {
  answers[key] = value;
  answerGrid.querySelectorAll(".answer-card").forEach(card => card.classList.toggle("selected", card.dataset.value === value));
  window.setTimeout(() => {
    if (current < questions.length - 1) {
      current += 1;
      renderQuestion();
    } else {
      showResult();
    }
  }, 220);
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

function labelFor(key, value) {
  const q = questions.find(item => item.key === key);
  return q.options.find(option => option[0] === value)?.[2] || value;
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
  document.querySelector("#tasteReceipt").innerHTML = ["runtime", "vibe", "pace", "company", "actor", "service"].map(key => `
    <div class="receipt-item"><span>${questions.find(q => q.key === key).eyebrow}</span><strong>${labelFor(key, answers[key])}</strong></div>`).join("");
  quizView.hidden = true;
  resultView.hidden = false;
  document.querySelector("#restartTop").style.visibility = "visible";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function restart() {
  current = 0;
  answers = {};
  shownTitles = [];
  resultView.hidden = true;
  quizView.hidden = false;
  renderQuestion();
}

document.querySelector("#backButton").addEventListener("click", () => { if (current > 0) { current -= 1; renderQuestion(); } });
document.querySelector("#restartTop").addEventListener("click", restart);
document.querySelector("#restartResult").addEventListener("click", restart);
document.querySelector("#anotherButton").addEventListener("click", showResult);
document.querySelector("#watchButton").addEventListener("click", () => {
  document.querySelector("#availabilityNote").textContent = "Live provider lookup is the next integration. Your taste match is working now.";
});

renderQuestion();
