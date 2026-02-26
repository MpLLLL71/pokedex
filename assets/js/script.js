const images = [
  "/assets/img/pokeball.webp",
  "/assets/img/superball.webp",
  "/assets/img/hyperball.png",
  "/assets/img/masterball.webp",
];

let index = 0;
const temps = 3000;

function changerImage() {
  const elementImage = document.getElementById("h1-image");
  const elementImage2 = document.getElementById("h1-image2");

  // Sécurité : Si les éléments n'existent pas sur cette page, on arrête la fonction
  if (!elementImage || !elementImage2) return;

  index = Math.floor(Math.random() * images.length);

  // Pas besoin du "if (index >= images.length)", Math.random() ne l'atteindra jamais
  elementImage.src = images[index];
  elementImage2.src = images[index];
}

setInterval(changerImage, temps);

const typeFrench = {
  normal: "Normal",
  fighting: "Combat",
  flying: "Vol",
  poison: "Poison",
  ground: "Sol",
  rock: "Roche",
  bug: "Insecte",
  ghost: "Spectre",
  steel: "Acier",
  fire: "Feu",
  water: "Eau",
  grass: "Plante",
  electric: "Électrik",
  psychic: "Psy",
  ice: "Glace",
  dragon: "Dragon",
  dark: "Ténèbres",
  fairy: "Fée",
};
const statFrench = {
  hp: "PV",
  attack: "Attaque",
  defense: "Défense",
  "special-attack": "Att. Spé.",
  "special-defense": "Déf. Spé.",
  speed: "Vitesse",
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function getTypeColor(type) {
  const colors = {
    normal: "#A8A77A",
    fire: "#EE8130",
    water: "#6390F0",
    electric: "#F7D02C",
    grass: "#7AC74C",
    ice: "#96D9D6",
    fighting: "#C22E28",
    poison: "#A33EA1",
    ground: "#E2BF65",
    flying: "#A98FF3",
    psychic: "#F95587",
    bug: "#A6B91A",
    rock: "#B6A136",
    ghost: "#735797",
    dragon: "#6F35FC",
    dark: "#705746",
    steel: "#B7B7CE",
    fairy: "#D685AD",
  };
  return colors[type] || "#777";
}
async function fetchNomFr(speciesUrl) {
  try {
    const res = await fetch(speciesUrl);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return (
      data.names.find((n) => n.language.name === "fr")?.name ||
      capitalize(data.name)
    );
  } catch {
    return "Erreur";
  }
}

let currentPokemonList = [];
let currentPage = 1;
let itemsPerPage = 1025;
let currentOffset = 0;
let currentLimit = 1025;
// Éléments DOM
const grid = document.getElementById("pokemon-grid");
const modalBody = document.getElementById("modal-body");
const genButtons = document.querySelectorAll(".gen-btn");
const pageInfo = document.getElementById("page-info");
const isLogged = document.getElementById("btnLogin");

// ────────────────────────────────────────────────
// GESTION CONNEXION / DÉCONNEXION
// ────────────────────────────────────────────────

const loginBtn = document.getElementById("btnLogin");

// Vérifie si déjà connecté au chargement
function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const loginBtn = document.getElementById("btnLogin"); // Assure-toi de l'ID
  const btnEquipe = document.getElementById("btnEquipe");
  const btnCombat = document.getElementById("btnCombat");

  if (!loginBtn) return; // Sécurité si le bouton login n'est pas là

  if (isLoggedIn) {
    loginBtn.textContent = "Se Déconnecter";
    loginBtn.classList.add("logged-in");
    
    // On ne change le style que si les éléments existent sur la page
    if (btnEquipe) btnEquipe.style.display = "inline-block";
    if (btnCombat) btnCombat.style.display = "inline-block";
  } else {
    loginBtn.textContent = "Se Connecter";
    loginBtn.classList.remove("logged-in");
    
    if (btnEquipe) btnEquipe.style.display = "none";
    if (btnCombat) btnCombat.style.display = "none";
  }
}

function login() {
  const userToken = "abc-123-xyz-" + Date.now(); // token fictif unique
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("authToken", userToken);
  checkLoginStatus();
  alert("Vous êtes maintenant connecté !");
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("authToken");
  checkLoginStatus();
  location.reload();
  alert("Vous êtes déconnecté !");
}

loginBtn.addEventListener("click", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
    logout();
  } else {
    login();
  }
});

// Vérifie l’état au chargement de la page
checkLoginStatus();

// ────────────────────────────────────────────────
//  CRÉATION D'UNE CARTE
// ────────────────────────────────────────────────
function createCard(p, nomFr) {
  const types = p.types.map((t) => t.type.name);
  const sprite =
    p.sprites.other?.dream_world?.front_default ||
    p.sprites.other?.home?.front_default ||
    p.sprites.front_default;
  const card = document.createElement("div");
  card.className = "pokemon-card";
  card.setAttribute("data-type1", types[0]);
  card.style.setProperty("--type1-color", getTypeColor(types[0]));
  if (types.length >= 2) {
    card.setAttribute("data-type2", types[1]);
    card.style.setProperty("--c1", getTypeColor(types[0]));
    card.style.setProperty("--c2", getTypeColor(types[1]));
  }
  card.innerHTML = `<img src="${sprite || ""}" alt="${nomFr}" class="sprite"><h3 class="pokemon-name">${nomFr}</h3><div class="types">${types.map((t) => `<span class="type ${t}">${typeFrench[t] || capitalize(t)}</span>`).join("")}</div>`;
  card.addEventListener("click", async () => {
    await showDetails(p);
  });
  grid.appendChild(card);
}

window.ajouterDepuisModal = async function(id) {
    console.log("Tentative d'ajout du Pokémon ID:", id); // Pour vérifier que le clic fonctionne

    if (localStorage.getItem('isLoggedIn') !== 'true') {
        alert("Tu dois être connecté !");
        return;
    }

    // On vérifie si la fonction existe sur window (globale)
    const foncAjout = window.ajouterPokemonALEquipe || (typeof ajouterPokemonALEquipe === 'function' ? ajouterPokemonALEquipe : null);

    if (foncAjout) {
        await foncAjout(id);
        
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'none';
        
        alert("Pokémon ajouté à ton équipe !");
    } else {
        console.error("ERREUR : La fonction ajouterPokemonALEquipe est introuvable. Vérifie que build_team.js est bien chargé sur cette page.");
        alert("Erreur technique : l'ajout est impossible pour le moment.");
    }
};

async function showDetails(p) {
  const types = p.types.map((t) => t.type.name);
  const officialArt =
    p.sprites.other?.["official-artwork"]?.front_default ||
    p.sprites.other?.dream_world?.front_default ||
    p.sprites.other?.home?.front_default ||
    p.sprites.front_default ||
    "https://via.placeholder.com/260?text=?";

  const nameFr = await fetchNomFr(p.species.url);
  const id = p.id.toString().padStart(3, "0");

  const statOrder = [
    "hp",
    "attack",
    "defense",
    "special-attack",
    "special-defense",
    "speed",
  ];
  const statLabels = statOrder.map((s) => statFrench[s] || s);
  const statValues = statOrder.map((s) => {
    const stat = p.stats.find((st) => st.stat.name === s);
    return stat ? stat.base_stat : 0;
  });

  // Vérification de la connexion pour afficher le bouton
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const addBtnHtml = isLoggedIn 
        ? `<button class="btn-add-team" onclick="ajouterDepuisModal('${p.id}')"> Ajouter à l'équipe </button>` 
        : `<p style="font-size:0.6rem; color: #666;">Connecte-toi pour ajouter ce Pokémon à l'équipe</p>`;

  modalBody.innerHTML = `
        <img src="${officialArt}" alt="${nameFr}" class="art">
        <h2>#${id} ${nameFr}</h2>
        <div class="info">
            <div>Hauteur<br>${(p.height / 10).toFixed(1)} m</div>
            <div>Poids<br>${(p.weight / 10).toFixed(1)} kg</div>
        </div>
        <div class="modal-types">
            <strong>Types :</strong>
            <div style="margin-top:0.4rem;">
                ${types.map((t) => `<span class="type ${t}">${typeFrench[t] || capitalize(t)}</span>`).join("")}
            </div>
        </div>
        <div class="stats-container">
            <canvas id="statsRadar"></canvas>
        </div>
        <div class="modal-actions">
            ${addBtnHtml}
        </div>
    `;

  modal.style.display = "flex";

  // Graphique radar (inchangé)
  setTimeout(() => {
    const ctx = document.getElementById("statsRadar").getContext("2d");
    new Chart(ctx, {
      type: "radar",
      data: {
        labels: statLabels,
        datasets: [
          {
            label: "Stats",
            data: statValues,
            backgroundColor: "rgba(238, 21, 21, 0.18)",
            borderColor: "#ee1515",
            borderWidth: 3,
            pointBackgroundColor: "#ffcb05",
            pointBorderColor: "#000",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: "rgba(255,255,255,0.15)" },
            grid: { color: "rgba(255,255,255,0.12)" },
            pointLabels: {
              color: "#ffeb3b",
              font: { size: 13, family: "'Press Start 2P', cursive" },
            },
            ticks: {
              color: "#ddd",
              backdropColor: "transparent",
              stepSize: 20,
              min: 0,
              max: 200,
            },
          },
        },
        plugins: {
          legend: { display: false },
        },
        animation: {
          duration: 1400,
          easing: "easeOutQuart",
        },
      },
    });
  }, 100);
}

// ────────────────────────────────────────────────
//  AFFICHER LA PAGE ACTUELLE
// ────────────────────────────────────────────────
function displayCurrentPage() {
    const grid = document.getElementById("pokemon-grid");
    if (!grid) return; // Sécurité si la grille n'existe pas sur la page

    grid.innerHTML = "";
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = currentPokemonList.slice(start, end);

    pageItems.forEach(({ p, nomFr }) => createCard(p, nomFr));

    // Sécurité pour la pagination : on vérifie l'existence avant de toucher au DOM
    const pageInfo = document.getElementById("page-info");
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");

    const totalPages = Math.ceil(currentPokemonList.length / itemsPerPage);
    
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = (currentPage >= totalPages || totalPages === 0);
}
// ────────────────────────────────────────────────
//  CHARGEMENT D'UNE GÉNÉRATION + STOCKAGE
// ────────────────────────────────────────────────
async function loadGeneration(offset, limit) {
  // 1. On récupère l'élément grid localement ou on vérifie la variable globale
  const grid = document.getElementById("pokemon-grid"); // Remplace par ton ID réel

  // 2. SÉCURITÉ : Si on n'est pas sur la page du Pokédex, on ne fait rien
  if (!grid) return; 

  grid.innerHTML =
    '<div class="spinner-border text-danger" role="status"><span class="visually-hidden">Chargement...</span></div>';
    
  try {
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`,
    );
    const data = await res.json();
    
    const pokemonData = await Promise.all(
      data.results.map(async (entry) => {
        const p = await fetch(entry.url).then((r) => r.json());
        const nomFr = await fetchNomFr(p.species.url);
        return { p, nomFr };
      }),
    );
    
    currentPokemonList = pokemonData;
    currentPage = 1;
    
    // Vérifie aussi si cette fonction existe avant de l'appeler
    if (typeof displayCurrentPage === "function") {
      displayCurrentPage();
    }
  } catch (err) {
    grid.innerHTML =
      '<p style="color:#c00; text-align:center; grid-column:1/-1; padding:40px 0;">Erreur de chargement</p>';
    console.error(err);
  }
}
// ────────────────────────────────────────────────
//  ÉVÈNEMENTS PAGINATION & SÉLECTEUR
// ────────────────────────────────────────────────
// On vérifie d'abord si l'élément existe avant d'ajouter l'écouteur
const perPageSelect = document.getElementById("perPageSelect"); // Assure-toi que l'ID correspond

if (perPageSelect) {
  perPageSelect.addEventListener("change", () => {
    itemsPerPage = parseInt(perPageSelect.value);
    currentPage = 1;
    displayCurrentPage();
  });
}
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// On ne branche l'écouteur que si le bouton existe sur la page
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      displayCurrentPage();
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    // Supposons que tu as une variable maxPages ou une logique de limite
    currentPage++;
    displayCurrentPage();
  });
}
// Recherche (filtre sur la liste complète)
function setupSearch() {
  // 1. On récupère l'élément et on vérifie s'il existe
  const searchInput = document.getElementById("search"); 
  const grid = document.getElementById("pokemon-grid"); // Assure-toi que c'est le bon ID

  if (!searchInput || !grid) return; // Si l'un des deux manque, on arrête tout proprement

  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    const topControls = document.querySelector(".top-controls");

    if (!term) {
      if (topControls) topControls.style.display = "flex";
      currentPage = 1;
      if (typeof displayCurrentPage === "function") displayCurrentPage();
      return;
    }

    const typeNamesFr = Object.values(typeFrench).map((t) => t.toLowerCase());
    const words = term.split(/\s+/).filter((w) => w.length > 0);

    let filtered = currentPokemonList;

    words.forEach((word) => {
      // 1. Recherche par ID
      if (/^\d+$/.test(word) || word.startsWith("#") || word.match(/^\d{3}$/)) {
        const searchId = word.replace("#", "").padStart(3, "0");
        filtered = filtered.filter(({ p }) =>
          p.id.toString().padStart(3, "0").includes(searchId),
        );
        return;
      }

      // 2. Recherche par type
      const matchedType = typeNamesFr.find(
        (t) => t.includes(word) || word.includes(t) || t.startsWith(word),
      );

      if (matchedType) {
        const typeKey = Object.keys(typeFrench).find(
          (k) => typeFrench[k].toLowerCase() === matchedType,
        );
        filtered = filtered.filter(({ p }) =>
          p.types.some((t) => t.type.name.toLowerCase() === typeKey),
        );
      } else {
        // 3. Recherche par nom
        filtered = filtered.filter(({ nomFr }) =>
          nomFr.toLowerCase().includes(word),
        );
      }
    });

    // Affichage sécurisé
    grid.innerHTML = "";
    filtered.forEach(({ p, nomFr }) => {
        if (typeof createCard === "function") createCard(p, nomFr);
    });

    if (topControls) topControls.style.display = "none";
    currentPage = 1;
  });
}
document.querySelectorAll(".ty-nav .gen-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".ty-nav .gen-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    console.log("Filtrer par type :", btn.textContent);
  });
});

// Reset pagination quand on change de génération ou quand on vide la recherche
// On récupère l'élément
const searchInput = document.getElementById("search"); // Vérifie bien que l'ID est le bon

// On ne branche l'écouteur que s'il existe sur la page actuelle
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    if (!e.target.value.trim()) {
      const topControls = document.querySelector(".top-controls");
      
      // Sécurité supplémentaire pour l'élément de contrôle
      if (topControls) {
        topControls.style.display = "flex";
      }
      
      // On ne lance la pagination que si la fonction existe (dans script.js)
      if (typeof displayCurrentPage === "function") {
        displayCurrentPage();
      }
    }
  });
}
// Événements générations (inchangés sauf reset page)
document.querySelectorAll(".gen-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".gen-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const offset = parseInt(btn.dataset.offset);
    const limit = parseInt(btn.dataset.limit);
    loadGeneration(offset, limit);
  });
});
// Fermeture modal
const modal = document.getElementById("modal");
const closeBtn = document.querySelector(".close");

// On ne définit les comportements que si le modal existe sur cette page
if (modal && closeBtn) {
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };
}
// Démarrage
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("pokemon-grid");
    if (grid) {
        loadGeneration(0, 151);
    }
    setupSearch();
    checkLoginStatus();
});
