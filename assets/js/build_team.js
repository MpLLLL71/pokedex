const MAX_TEAM_SIZE = 6;

// Initialise l'équipe avec 6 slots vides (null) si elle n'existe pas
function initTeam() {
    if (!localStorage.getItem('pokemonTeam')) {
        localStorage.setItem('pokemonTeam', JSON.stringify(new Array(MAX_TEAM_SIZE).fill(null)));
    }
}

// Affiche les 6 slots sur la page squad.html
async function renderTeam() {
    const teamContainer = document.getElementById('team-container');
    if (!teamContainer) return; // Sécurité pour index.html

    const rawData = JSON.parse(localStorage.getItem('pokemonTeam')) || [];
    // On garantit un tableau de 6 éléments
    const storedTeam = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => rawData[i] || null);

    teamContainer.innerHTML = ''; 

    storedTeam.forEach((pokemon, index) => {
        const slot = document.createElement('div');
        if (pokemon === null) {
            slot.className = 'slot empty';
            slot.innerHTML = `<div class="slot-add">+</div>`;
            slot.onclick = () => window.location.href = 'index.html'; 
        } else {
            slot.className = 'slot';
            slot.innerHTML = `
                <img src="${pokemon.sprite}" alt="${pokemon.nomFr}" class="team-sprite">
                <div class="team-info">
                    <span class="team-name">${pokemon.nomFr}</span>
                    <span class="team-level">N. 50</span>
                </div>`;
            slot.onclick = () => showDetailsInPanel(pokemon, index);
        }
        teamContainer.appendChild(slot);
    });
}

// Fonction globale pour ajouter un Pokémon (appelée par le modal du Pokédex)
window.ajouterPokemonALEquipe = async function(pokemonIdOrName) {
    let team = JSON.parse(localStorage.getItem('pokemonTeam')) || new Array(MAX_TEAM_SIZE).fill(null);
    
    // 1. Vérification doublon
    const isAlreadyInTeam = team.some(p => p && (p.id == pokemonIdOrName || p.name == pokemonIdOrName));
    if (isAlreadyInTeam) {
        alert("Ce Pokémon est déjà dans ton équipe !");
        return false;
    }

    // 2. Vérification place libre
    const emptyIndex = team.findIndex(slot => slot === null);
    if (emptyIndex === -1) {
        alert("Ton équipe est complète (6 Pokémon maximum) !");
        return false;
    }

    try {
        // 3. Récupération des données API
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonIdOrName}`);
        const p = await res.json();
        
        // On tente de récupérer le nom français via la fonction globale si elle existe
        let nomFr = p.name;
        if (typeof window.fetchNomFr === "function") {
            nomFr = await window.fetchNomFr(p.species.url);
        } else if (typeof fetchNomFr === "function") {
            nomFr = await fetchNomFr(p.species.url);
        }

        // 4. Préparation de l'objet
        const newPokemon = {
            id: p.id,
            name: p.name,
            nomFr: nomFr,
            sprite: p.sprites.other['official-artwork'].front_default || p.sprites.front_default,
            types: p.types.map(t => t.type.name),
            stats: p.stats.map(s => s.base_stat)
        };

        // 5. Sauvegarde
        team[emptyIndex] = newPokemon;
        localStorage.setItem('pokemonTeam', JSON.stringify(team));
        
        return true; 
    } catch (err) {
        console.error("Erreur lors de l'ajout :", err);
        return false;
    }
};

// Affiche les stats dans le panneau de droite sur squad.html
function showDetailsInPanel(pokemon, index) {
    const detailsDiv = document.getElementById('pokemon-details'); 
    if (!detailsDiv) return;

    detailsDiv.innerHTML = `
        <div class="details-header">
            <h2 class="pixel-text">${pokemon.nomFr.toUpperCase()}</h2>
            <span class="level-badge">N. 50</span>
        </div>
        
        <img src="${pokemon.sprite}" alt="${pokemon.nomFr}" class="big-sprite">
        
        <div class="chart-container">
            <canvas id="statsChart"></canvas>
        </div>

        <button class="btn-remove" onclick="window.supprimerDuSlot(${index})">
            RELACHER LE POKÉMON
        </button>
    `;

    // Initialisation du graphique Radar
    const ctx = document.getElementById('statsChart').getContext('2d');
    
    // On détruit l'ancien graphique s'il existe pour éviter les bugs de survol
    if (window.currentChart) window.currentChart.destroy();

    window.currentChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['PV', 'ATK', 'DEF', 'ASp', 'DSp', 'VIT'],
            datasets: [{
                label: 'Stats de base',
                data: pokemon.stats,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.2)' },
                    grid: { color: 'rgba(255,255,255,0.2)' },
                    pointLabels: { color: 'white', font: { size: 12 } },
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 150
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Supprime un Pokémon d'un slot spécifique
window.supprimerDuSlot = function(index) {
    let team = JSON.parse(localStorage.getItem('pokemonTeam'));
    if (!team || !team[index]) return;

    if (confirm(`Voulez-vous vraiment relâcher ${team[index].nomFr} ?`)) {
        team[index] = null; 
        localStorage.setItem('pokemonTeam', JSON.stringify(team));
        
        const detailsDiv = document.getElementById('pokemon-details');
        if (detailsDiv) detailsDiv.innerHTML = '<p class="placeholder-text">Sélectionne un Pokémon pour voir ses stats</p>';
        
        renderTeam(); 
    }
};

// Initialisation au chargement
initTeam();
renderTeam();