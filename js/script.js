// ======================== Config Firebase ========================
const firebaseConfig = {
  apiKey: "AIzaSyBe_Az2ZAVr5EUPkXqegy8WnEPMNCr-mnM",
  authDomain: "pokeparty-9c8ec.firebaseapp.com",
  databaseURL: "https://pokeparty-9c8ec-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pokeparty-9c8ec",
  storageBucket: "pokeparty-9c8ec.firebasestorage.app",
  messagingSenderId: "575765234276",
  appId: "1:575765234276:web:91f9a13597e44407819571"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ======================== Variables ========================
let data = null;
let currentLang = "en";
const QUESTION_TIME = 12; // secondes par question (remplace l'ancien timer continu de 150s)

const IMAGE_PATH = "pictures/pokemon/icons/";

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const progressEl = document.getElementById("progress");

const welcomeScreen = document.getElementById("welcome-screen");
const lobbyScreen = document.getElementById("lobby-screen");
const quizScreen = document.getElementById("quiz-screen");
const boardScreen = document.getElementById("board-screen");
const languageSelect = document.getElementById("language-select");

// Nouveaux éléments (connexion / salon / classement)
const hostNameInput = document.getElementById("host-name-input");
const createRoomBtn = document.getElementById("create-room-btn");
const playerNameInput = document.getElementById("player-name-input");
const joinCodeInput = document.getElementById("join-code-input");
const joinRoomBtn = document.getElementById("join-room-btn");

const roomCodeDisplay = document.getElementById("room-code-display");
const lobbyTitle = document.getElementById("lobby-title");
const playerListEl = document.getElementById("player-list");
const loadingHint = document.getElementById("loading-hint");
const startQuizBtn = document.getElementById("start-quiz-btn");
const lobbyWaiting = document.getElementById("lobby-waiting");

const boardTitleEl = document.getElementById("board-title");
const boardListEl = document.getElementById("board-list");
const restartBtn = document.getElementById("restart-btn");

// ======================== Texte multilingue ========================
const texts = {
    welcomeTitle: { en: "Welcome to PokéParty!", fr: "Bienvenue sur PokéParty !", es: "¡Bienvenido a PokéParty!" },
    welcomeText: { en: "Test your knowledge of Pokémon with friends, live.", fr: "Teste tes connaissances Pokémon avec tes amis, en direct.", es: "Pon a prueba tus conocimientos de Pokémon con tus amigos, en vivo." },
    createTitle: { en: "Create a game", fr: "Créer une partie", es: "Crear una partida" },
    namePlaceholder: { en: "Your name", fr: "Ton pseudo", es: "Tu nombre" },
    createBtn: { en: "Create", fr: "Créer", es: "Crear" },
    joinTitle: { en: "Join a game", fr: "Rejoindre une partie", es: "Unirse a una partida" },
    codePlaceholder: { en: "Code", fr: "Code", es: "Código" },
    joinBtn: { en: "Join", fr: "Rejoindre", es: "Unirse" },
    regionsHint: {
        en: "Selected regions above (top menu) will be used for everyone in the game you create. Only Kanto and Johto have data ready for now.",
        fr: "Les régions sélectionnées dans le menu du haut seront utilisées pour tous les joueurs de la partie que tu crées. Seules Kanto et Johto ont des données prêtes pour l'instant.",
        es: "Las regiones seleccionadas arriba se usarán para todos los jugadores de la partida que crees. Por ahora solo Kanto y Johto tienen datos listos."
    },
    lobbyTitleGuest: { en: "Waiting room", fr: "Salon d'attente", es: "Sala de espera" },
    lobbyTitleHost: { en: "Waiting room — you are the host", fr: "Salon d'attente — tu es l'hôte", es: "Sala de espera — eres el anfitrión" },
    loadingHint: { en: "Loading Pokémon data…", fr: "Chargement des données Pokémon…", es: "Cargando datos de Pokémon…" },
    startQuizBtn: { en: "Start Quiz", fr: "Démarrer le quiz", es: "Iniciar quiz" },
    lobbyWaiting: { en: "Waiting for the host to start…", fr: "En attente que l'hôte démarre…", es: "Esperando a que el anfitrión empiece…" },
    you: { en: "(you)", fr: "(toi)", es: "(tú)" },
    question: { en: "Question", fr: "Question", es: "Pregunta" },
    boardTitle: { en: "Leaderboard", fr: "Classement", es: "Clasificación" },
    boardTitleFinal: { en: "🏆 Final leaderboard", fr: "🏆 Classement final", es: "🏆 Clasificación final" },
    restartBtn: { en: "New game", fr: "Nouvelle partie", es: "Nueva partida" },
    invalidCode: { en: "Invalid code (4 letters)", fr: "Code invalide (4 lettres)", es: "Código no válido (4 letras)" },
    footer: {
        en: "Pokémon © Nintendo / Game Freak / The Pokémon Company. This is an unofficial fan-made website, not affiliated with or endorsed by Nintendo, Game Freak, or The Pokémon Company.",
        fr: "Pokémon © Nintendo / Game Freak / The Pokémon Company. Ceci est un site de fan non officiel, non affilié à Nintendo, Game Freak ou The Pokémon Company.",
        es: "Pokémon © Nintendo / Game Freak / The Pokémon Company. Este es un sitio web de fans no oficial, no afiliado ni respaldado por Nintendo, Game Freak o The Pokémon Company."
    },
    score: { en: "Score", fr: "Score", es: "Puntos" },
    timer: { en: "Time left", fr: "Temps restant", es: "Tiempo restante" }
};

// ======================== Utils ========================
function getRandomItem(array) { return array[Math.floor(Math.random() * array.length)]; }
function shuffle(array) { return [...array].sort(() => Math.random() - 0.5); }
function genCode() {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let c = "";
    for (let i = 0; i < 4; i++) c += letters[Math.floor(Math.random() * letters.length)];
    return c;
}
function showScreen(el) {
    [welcomeScreen, lobbyScreen, quizScreen, boardScreen].forEach(s => {
        s.style.display = (s === el) ? "block" : "none";
    });
}

// ======================== Charger JSON (logique inchangée) ========================
async function loadGameData(regions = []) {
    const regionFetches = [];

    if (regions.length === 0) {
        regionFetches.push(
            fetch("data/region/kanto.json").then(r => r.json()),
            fetch("data/region/johto.json").then(r => r.json())
            // tu ajouteras Hoenn, Sinnoh, etc ici
        );
    } else {
        regions.forEach(region => {
            regionFetches.push(
                fetch(`data/region/${region}.json`).then(r => r.json())
            );
        });
    }

    const [regionsData, typesData, trainersData] = await Promise.all([
        Promise.all(regionFetches),
        fetch("data/types/types.json").then(r => r.json()),
        fetch("data/trainers/trainers.json").then(r => r.json())
    ]);

    data = {
        Pokemons: regionsData.flatMap(r => r.Pokemons),
        Places: regionsData.flatMap(r => r.Places || []),
        Types: typesData.types,
        Trainers: trainersData.Trainers
    };
}

// ======================== Menu burger (mobile) ========================
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("navbar-links");
if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        menuToggle.textContent = isOpen ? "✕" : "☰";
    });
}

// ======================== Sélection région (logique inchangée) ========================
let selectedRegions = [];

document.querySelectorAll("a[data-region]").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const region = link.dataset.region;
        if (selectedRegions.includes(region)) {
            selectedRegions = selectedRegions.filter(r => r !== region);
            link.classList.remove("active");
        } else {
            selectedRegions.push(region);
            link.classList.add("active");
        }
        // La sélection de régions n'est utilisée que par l'hôte, au moment de créer une partie.

        if (menuToggle && navLinks && navLinks.classList.contains("open")) {
            navLinks.classList.remove("open");
            menuToggle.textContent = "☰";
            menuToggle.setAttribute("aria-expanded", "false");
        }
    });
});

// ======================== Menu langue ========================
languageSelect.onchange = () => {
    currentLang = languageSelect.value;
    updateAllTexts();
};

function updateAllTexts() {
    updateWelcomeScreen();

    document.getElementById("create-title").textContent = texts.createTitle[currentLang];
    hostNameInput.placeholder = texts.namePlaceholder[currentLang];
    createRoomBtn.textContent = texts.createBtn[currentLang];

    document.getElementById("join-title").textContent = texts.joinTitle[currentLang];
    playerNameInput.placeholder = texts.namePlaceholder[currentLang];
    joinCodeInput.placeholder = texts.codePlaceholder[currentLang];
    joinRoomBtn.textContent = texts.joinBtn[currentLang];

    document.getElementById("regions-hint").textContent = texts.regionsHint[currentLang];

    lobbyTitle.textContent = room.isHost ? texts.lobbyTitleHost[currentLang] : texts.lobbyTitleGuest[currentLang];
    loadingHint.textContent = texts.loadingHint[currentLang];
    startQuizBtn.textContent = texts.startQuizBtn[currentLang];
    lobbyWaiting.textContent = texts.lobbyWaiting[currentLang];
    if (room.players && room.players.length) renderPlayerList();

    if (quizState.recipe) {
        progressEl.textContent = `${texts.question[currentLang]} ${quizState.index + 1}/${quizState.total}`;
    }
    updateScoreDisplay();
    if (quizScreen.style.display !== "none" && quizState.recipe) {
        renderQuestion(quizState.index, quizState.recipe);
    }

    if (boardScreen.style.display !== "none") {
        renderBoard(quizState.index + 1 >= quizState.total);
    }
    restartBtn.textContent = texts.restartBtn[currentLang];

    const footerText = document.getElementById("footer-text");
    if (footerText) footerText.textContent = texts.footer[currentLang];
}

function updateWelcomeScreen() {
    document.getElementById("welcome-title").textContent = texts.welcomeTitle[currentLang];
    document.getElementById("welcome-text").textContent = texts.welcomeText[currentLang];
}

function updateScoreDisplay() {
    const myScore = (room.scores && room.myName) ? (room.scores[room.myName] || 0) : 0;
    scoreEl.textContent = `${texts.score[currentLang]}: ${myScore}`;
}

// ======================== État de la partie (multijoueur) ========================
let room = { code: null, isHost: false, myName: null, players: [], scores: {}, regions: [], rounds: 10 };
let quizState = { index: -1, total: 10, answered: false, startTime: 0, timerInt: null, recipe: null, answersThisRound: {} };
let colorMap = {};
const PALETTE = ["#667eea", "#e67e22", "#27ae60", "#e74c3c", "#8e44ad", "#16a085", "#2980b9", "#d35400"];
function colorFor(name) {
    if (!colorMap[name]) colorMap[name] = PALETTE[Object.keys(colorMap).length % PALETTE.length];
    return colorMap[name];
}

// ======================== Connexion Firebase ========================
let roomRef = null, eventsRef = null, cursorsRef = null, sessionStartTs = 0;

function connectRoom(code, isCreator) {
    roomRef = db.ref("rooms/" + code);
    eventsRef = roomRef.child("events");
    cursorsRef = roomRef.child("cursors");

    const afterAttach = () => {
        sessionStartTs = Date.now();
        eventsRef.on("child_added", (snap) => {
            const msg = snap.val();
            if (!msg || msg._ts < sessionStartTs) return;
            handleMessage(msg);
        });
        cursorsRef.on("value", (snap) => {
            const all = snap.val() || {};
            Object.entries(all).forEach(([name, pos]) => {
                if (name !== room.myName) renderCursor(name, pos.x, pos.y);
            });
        });
    };

    if (isCreator) {
        roomRef.remove().then(afterAttach);
    } else {
        afterAttach();
    }
}

function broadcast(msg) {
    if (msg.type === "cursor") {
        cursorsRef.child(sanitizeKey(msg.name)).set({ x: msg.x, y: msg.y });
        return;
    }
    eventsRef.push({ ...msg, _ts: Date.now() });
}

function sanitizeKey(name) {
    return name.replace(/[.#$\[\]]/g, "_");
}

// ======================== Créer / rejoindre une partie ========================
createRoomBtn.onclick = async () => {
    const name = hostNameInput.value.trim() || "Host";
    room.code = genCode();
    room.isHost = true;
    room.myName = name;
    room.players = [name];
    room.scores = { [name]: 0 };
    room.regions = [...selectedRegions];

    connectRoom(room.code, true);
    colorFor(name);
    renderPlayerList();

    roomCodeDisplay.textContent = room.code;
    lobbyTitle.textContent = texts.lobbyTitleHost[currentLang];
    startQuizBtn.style.display = "inline-block";
    startQuizBtn.disabled = true;
    lobbyWaiting.style.display = "none";
    loadingHint.style.display = "block";

    showScreen(lobbyScreen);
    initCursorTracking();

    await loadGameData(room.regions);
    loadingHint.style.display = "none";
    startQuizBtn.disabled = false;
};

joinRoomBtn.onclick = () => {
    const name = playerNameInput.value.trim() || "Player";
    const code = joinCodeInput.value.trim().toUpperCase();
    if (code.length !== 4) { alert(texts.invalidCode[currentLang]); return; }

    room.code = code;
    room.isHost = false;
    room.myName = name;

    connectRoom(code, false);
    colorFor(name);
    broadcast({ type: "join", name });

    roomCodeDisplay.textContent = code;
    lobbyTitle.textContent = texts.lobbyTitleGuest[currentLang];
    lobbyWaiting.style.display = "block";
    loadingHint.style.display = "block";

    showScreen(lobbyScreen);
    initCursorTracking();
};

function renderPlayerList() {
    playerListEl.innerHTML = "";
    room.players.forEach(p => {
        const li = document.createElement("li");
        const dot = document.createElement("span");
        dot.className = "player-dot";
        dot.style.background = colorFor(p);
        li.appendChild(dot);
        const nameSpan = document.createElement("span");
        nameSpan.textContent = p + (p === room.myName ? " " + texts.you[currentLang] : "");
        li.appendChild(nameSpan);
        playerListEl.appendChild(li);
    });
}

// ======================== Messages reçus ========================
function handleMessage(msg) {
    switch (msg.type) {
        case "join":
            if (room.isHost) {
                if (!room.players.includes(msg.name)) {
                    room.players.push(msg.name);
                    room.scores[msg.name] = 0;
                }
                broadcast({ type: "players", players: room.players, regions: room.regions, rounds: room.rounds });
                renderPlayerList();
            }
            break;

        case "players":
            room.players = msg.players;
            room.regions = msg.regions || [];
            room.rounds = msg.rounds || 10;
            quizState.total = room.rounds;
            msg.players.forEach(p => { if (!(p in room.scores)) room.scores[p] = 0; });
            renderPlayerList();
            if (!room.isHost && !data) {
                loadGameData(room.regions).then(() => { loadingHint.style.display = "none"; });
            }
            break;

        case "start":
            showScreen(quizScreen);
            renderQuestion(0, msg.recipe);
            break;

        case "question":
            renderQuestion(msg.index, msg.recipe);
            break;

        case "answer":
            if (room.isHost) recordAnswer(msg.name, msg.choiceId, msg.elapsed);
            break;

        case "reveal":
            room.scores = msg.scores;
            showReveal(msg.correctId, msg.answers);
            updateScoreDisplay();
            if (room.isHost) {
                setTimeout(() => hostAdvance(), 2500);
            }
            break;

        case "board":
            room.scores = msg.scores;
            renderBoard(msg.final);
            break;
    }
}

// ======================== Génération de questions (même logique que l'original, sous forme de "recettes") ========================
function pickTypeRecipe() {
    const type = getRandomItem(data.Types);
    const matching = data.Pokemons.filter(p => p.type.includes(type.id));
    const wrongPool = data.Pokemons.filter(p => !p.type.includes(type.id));
    if (matching.length < 1 || wrongPool.length < 3) return pickRouteRecipe();
    const correct = getRandomItem(matching);
    const wrong = shuffle(wrongPool).slice(0, 3);
    const answerIds = shuffle([correct, ...wrong]).map(p => p.id);
    return { kind: "type", typeName: type.name, correctId: correct.id, answerIds };
}

function pickRouteRecipe() {
    const routes = (data.Places || []).filter(r => Array.isArray(r.pokemonIds) && r.pokemonIds.length > 0);
    if (!routes.length) return pickTypeRecipe();
    const route = getRandomItem(routes);
    const routePokemons = data.Pokemons.filter(p => route.pokemonIds.includes(p.id));
    const wrongPool = data.Pokemons.filter(p => !route.pokemonIds.includes(p.id));
    if (!routePokemons.length || wrongPool.length < 3) return pickTypeRecipe();
    const correct = getRandomItem(routePokemons);
    const wrong = shuffle(wrongPool).slice(0, 3);
    const answerIds = shuffle([correct, ...wrong]).map(p => p.id);
    return { kind: "route", routeName: route.name, correctId: correct.id, answerIds };
}

function pickTrainerRecipe() {
    if (!data.Trainers || !data.Trainers.length) return pickTypeRecipe();
    const trainer = getRandomItem(data.Trainers);
    const trainerPokemons = data.Pokemons.filter(p => trainer.Pokemons.includes(p.id));
    if (!trainerPokemons.length) return pickTypeRecipe();
    const correct = getRandomItem(trainerPokemons);
    const wrongPool = data.Pokemons.filter(p => !trainer.Pokemons.includes(p.id) && p.id !== correct.id);
    if (wrongPool.length < 3) return pickTypeRecipe();
    const wrong = shuffle(wrongPool).slice(0, 3);
    const answerIds = shuffle([correct, ...wrong]).map(p => p.id);
    return { kind: "trainer", trainerName: trainer.name, correctId: correct.id, answerIds };
}

const STATS_LIST = [
    { key: "hp", fr: "PV", en: "HP", es: "PS" },
    { key: "attack", fr: "attaque", en: "attack", es: "el ataque" },
    { key: "defense", fr: "défense", en: "defense", es: "la defensa" },
    { key: "specialAttack", fr: "attaque spéciale", en: "special attack", es: "el ataque especial" },
    { key: "specialDefense", fr: "défense spéciale", en: "special defense", es: "la defensa especial" },
    { key: "speed", fr: "vitesse", en: "speed", es: "la velocidad" }
];

function pickStatRecipe() {
    const stat = getRandomItem(STATS_LIST);
    const pool = data.Pokemons.filter(p => p.baseStats && p.baseStats[stat.key] !== undefined);
    if (pool.length < 4) return pickTypeRecipe();
    const chosen = shuffle(pool).slice(0, 4);
    const isHighest = Math.random() < 0.5;
    const sorted = [...chosen].sort((a, b) =>
        isHighest ? b.baseStats[stat.key] - a.baseStats[stat.key] : a.baseStats[stat.key] - b.baseStats[stat.key]
    );
    const answerIds = shuffle(chosen).map(p => p.id);
    return { kind: "stat", statKey: stat.key, isHighest, correctId: sorted[0].id, answerIds };
}

function pickDescriptionRecipe() {
    const valid = data.Pokemons.filter(p => p.description && p.description[currentLang]);
    if (valid.length < 4) return pickTypeRecipe();
    const correct = getRandomItem(valid);
    const wrong = shuffle(valid.filter(p => p.id !== correct.id)).slice(0, 3);
    const answerIds = shuffle([correct, ...wrong]).map(p => p.id);
    return { kind: "description", correctId: correct.id, answerIds };
}

const RECIPE_GENERATORS = [pickTypeRecipe, pickRouteRecipe, pickTrainerRecipe, pickStatRecipe, pickDescriptionRecipe];
function pickRandomRecipe() { return getRandomItem(RECIPE_GENERATORS)(); }

// ======================== Lancement et déroulé du quiz ========================
startQuizBtn.onclick = () => {
    const recipe = pickRandomRecipe();
    quizState.total = room.rounds;
    broadcast({ type: "start", recipe });
};

function hostAdvance() {
    const next = quizState.index + 1;
    if (next >= quizState.total) {
        broadcast({ type: "board", scores: room.scores, final: true });
    } else {
        const recipe = pickRandomRecipe();
        broadcast({ type: "question", index: next, recipe });
    }
}

// ======================== Affichage d'une question ========================
function renderQuestion(index, recipe) {
    quizState.index = index;
    quizState.recipe = recipe;
    quizState.answered = false;
    quizState.answersThisRound = {};
    quizState.revealed = false;

    progressEl.textContent = `${texts.question[currentLang]} ${index + 1}/${quizState.total}`;
    optionsEl.innerHTML = "";

    let questionText = "";
    if (recipe.kind === "type") {
        const label = recipe.typeName[currentLang] || recipe.typeName.en;
        questionText = currentLang === "fr" ? `Quel Pokémon appartient au type ${label} ?` :
                        currentLang === "es" ? `¿Qué Pokémon pertenece al tipo ${label}?` :
                        `Which Pokémon belongs to the ${label} type?`;
    } else if (recipe.kind === "route") {
        const label = recipe.routeName[currentLang] || recipe.routeName.en;
        questionText = currentLang === "fr" ? `Quel Pokémon apparaît sur ${label} ?` :
                        currentLang === "es" ? `¿Qué Pokémon aparece en ${label}?` :
                        `Which Pokémon appears on ${label}?`;
    } else if (recipe.kind === "trainer") {
        const n = recipe.trainerName;
        const label = (n && (n[currentLang] || n.en)) || n;
        questionText = currentLang === "fr" ? `Quel Pokémon appartient à ${label} ?` :
                        currentLang === "es" ? `¿Qué Pokémon pertenece a ${label}?` :
                        `Which Pokémon belongs to ${label}?`;
    } else if (recipe.kind === "stat") {
        const stat = STATS_LIST.find(s => s.key === recipe.statKey);
        questionText = currentLang === "fr"
            ? (recipe.isHighest ? `Lequel de ces Pokémon a le plus de ${stat.fr} ?` : `Lequel de ces Pokémon a le moins de ${stat.fr} ?`)
            : currentLang === "es"
            ? (recipe.isHighest ? `¿Cuál de estos Pokémon tiene más ${stat.es}?` : `¿Cuál de estos Pokémon tiene menos ${stat.es}?`)
            : (recipe.isHighest ? `Which of these Pokémon has the highest ${stat.en}?` : `Which of these Pokémon has the lowest ${stat.en}?`);
    } else if (recipe.kind === "description") {
        questionText = currentLang === "fr" ? `Quel est ce Pokémon ?` :
                        currentLang === "es" ? `¿Qué Pokémon es este?` :
                        `Which Pokémon is this?`;
    }

    questionEl.textContent = questionText;

    if (recipe.kind === "description") {
        const correctPokemon = data.Pokemons.find(p => p.id === recipe.correctId);
        if (correctPokemon && correctPokemon.description) {
            const desc = document.createElement("p");
            desc.className = "pokemon-description";
            desc.textContent = correctPokemon.description[currentLang] || correctPokemon.description.en;
            questionEl.appendChild(desc);
        }
    }

    recipe.answerIds.forEach(id => {
        const pokemon = data.Pokemons.find(p => p.id === id);
        if (pokemon) createOption(pokemon, id);
    });

    updateScoreDisplay();
    quizState.startTime = Date.now();
    runTimer();
}

// ======================== Créer une option (logique inchangée) ========================
function createOption(pokemon, choiceId) {
    const div = document.createElement("div");
    div.className = "option";

    const img = document.createElement("img");
    img.src = IMAGE_PATH + pokemon.icon;
    img.alt = (pokemon.name && (pokemon.name[currentLang] || pokemon.name.en)) || "";
    div.appendChild(img);

    div.onclick = () => selectAnswer(choiceId, div);

    optionsEl.appendChild(div);
}

// ======================== Timer par question ========================
function runTimer() {
    clearInterval(quizState.timerInt);
    quizState.timerInt = setInterval(() => {
        const elapsed = (Date.now() - quizState.startTime) / 1000;
        const remaining = Math.max(0, Math.ceil(QUESTION_TIME - elapsed));
        timerEl.textContent = `${texts.timer[currentLang]}: ${remaining}s`;
        if (remaining <= 0) {
            clearInterval(quizState.timerInt);
            if (!quizState.answered) lockOptions();
            if (room.isHost && !quizState.revealed) {
                quizState.revealed = true;
                broadcast({
                    type: "reveal",
                    correctId: quizState.recipe.correctId,
                    scores: room.scores,
                    answers: quizState.answersThisRound
                });
            }
        }
    }, 100);
}

function lockOptions() {
    Array.from(optionsEl.children).forEach(opt => opt.style.pointerEvents = "none");
}

// ======================== Gestion réponse ========================
function selectAnswer(choiceId, div) {
    if (quizState.answered) return;
    quizState.answered = true;
    const elapsed = (Date.now() - quizState.startTime) / 1000;
    lockOptions();
    div.style.borderColor = "#764ba2";

    broadcast({ type: "answer", name: room.myName, choiceId, elapsed });
    if (room.isHost) recordAnswer(room.myName, choiceId, elapsed);
}

function recordAnswer(name, choiceId, elapsed) {
    if (quizState.answersThisRound[name] !== undefined) return;
    quizState.answersThisRound[name] = choiceId;

    const correctId = quizState.recipe.correctId;
    if (choiceId === correctId) {
        const speedBonus = Math.max(0, Math.round((QUESTION_TIME - elapsed) * 5));
        room.scores[name] = (room.scores[name] || 0) + 100 + speedBonus;
    }

    const answeredCount = Object.keys(quizState.answersThisRound).length;
    if (answeredCount >= room.players.length && !quizState.revealed) {
        quizState.revealed = true;
        clearInterval(quizState.timerInt);
        broadcast({ type: "reveal", correctId, scores: room.scores, answers: quizState.answersThisRound });
    }
}

function showReveal(correctId, answers) {
    lockOptions();
    const recipe = quizState.recipe;
    Array.from(optionsEl.children).forEach((div, idx) => {
        const id = recipe.answerIds[idx];
        if (id === correctId) {
            div.style.borderColor = "green";
        } else if (div.style.borderColor === "rgb(118, 75, 162)") {
            div.style.borderColor = "red";
        }

        // Qui a répondu quoi — visible seulement maintenant, à la révélation
        const votersRow = document.createElement("div");
        votersRow.className = "voters-row";
        Object.entries(answers || {}).forEach(([name, pickedId]) => {
            if (pickedId === id) {
                const dot = document.createElement("span");
                dot.className = "voter-dot";
                dot.title = name;
                dot.style.background = colorFor(name);
                dot.textContent = name.charAt(0).toUpperCase();
                votersRow.appendChild(dot);
            }
        });
        div.appendChild(votersRow);
    });
}

// ======================== Classement ========================
function renderBoard(final) {
    showScreen(boardScreen);
    boardTitleEl.textContent = final ? texts.boardTitleFinal[currentLang] : texts.boardTitle[currentLang];
    boardListEl.innerHTML = "";

    const sorted = Object.entries(room.scores).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([name, sc], i) => {
        const li = document.createElement("li");
        if (i === 0) li.classList.add("top1");

        const rank = document.createElement("span");
        rank.className = "rank";
        rank.textContent = `#${i + 1}`;

        const dot = document.createElement("span");
        dot.className = "player-dot";
        dot.style.background = colorFor(name);

        const pname = document.createElement("span");
        pname.className = "pname";
        pname.textContent = name;

        const scoreSpan = document.createElement("span");
        scoreSpan.textContent = `${sc} pts`;

        li.appendChild(rank);
        li.appendChild(dot);
        li.appendChild(pname);
        li.appendChild(scoreSpan);
        boardListEl.appendChild(li);
    });

    restartBtn.style.display = room.isHost ? "inline-block" : "none";
}

restartBtn.onclick = () => location.reload();

// ======================== Curseurs en direct ========================
let cursorEls = {};
function initCursorTracking() {
    let lastSent = 0;
    function sendPos(x, y) {
        const now = Date.now();
        if (now - lastSent < 40) return;
        lastSent = now;
        broadcast({ type: "cursor", name: room.myName, x, y });
    }
    window.addEventListener("mousemove", (e) => {
        sendPos(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    });
    window.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches[0]) {
            const t = e.touches[0];
            sendPos(t.clientX / window.innerWidth, t.clientY / window.innerHeight);
        }
    }, { passive: true });
}

function renderCursor(name, x, y) {
    if (name === room.myName) return;
    let el = cursorEls[name];
    if (!el) {
        el = document.createElement("div");
        el.className = "cursor";
        const color = colorFor(name);
        el.innerHTML = `
            <svg class="arrow" width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5.5 3.2 L19 10.6 L12.6 12.4 L10.4 19 Z" fill="${color}" stroke="white" stroke-width="1.6" stroke-linejoin="round"/>
            </svg>
            <span class="label" style="background:${color}">${name}</span>`;
        document.body.appendChild(el);
        cursorEls[name] = el;
    }
    el.style.left = (x * window.innerWidth) + "px";
    el.style.top = (y * window.innerHeight) + "px";
}

// ======================== Initialisation ========================
document.addEventListener("DOMContentLoaded", () => {
    languageSelect.value = currentLang;
    updateAllTexts();
    showScreen(welcomeScreen);
});
