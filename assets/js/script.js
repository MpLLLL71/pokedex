const typeFrench = {
                normal: 'Normal', fighting: 'Combat', flying: 'Vol', poison: 'Poison',
                ground: 'Sol', rock: 'Roche', bug: 'Insecte', ghost: 'Spectre',
                steel: 'Acier', fire: 'Feu', water: 'Eau', grass: 'Plante',
                electric: 'Électrik', psychic: 'Psy', ice: 'Glace', dragon: 'Dragon',
                dark: 'Ténèbres', fairy: 'Fée'
            };
            const statFrench = {
                hp: 'PV', attack: 'Attaque', defense: 'Défense', 'special-attack': 'Att. Spé.', 'special-defense': 'Déf. Spé.', speed: 'Vitesse'
            };

                function capitalize(str) {
                    return str.charAt(0).toUpperCase() + str.slice(1);
                }
                function getTypeColor(type) {
                    const colors = {
                        normal: '#A8A77A', fire: '#EE8130', water: '#6390F0',
                        electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6',
                        fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65',
                        flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
                        rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
                        dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD'
                    };
                    return colors[type] || '#777';
                }
                async function fetchNomFr(speciesUrl) {
                    try {
                        const res = await fetch(speciesUrl);
                        if (!res.ok) throw new Error();
                        const data = await res.json();
                        return data.names.find(n => n.language.name === "fr")?.name || capitalize(data.name);
                    } catch {
                        return "Erreur";
                    }
                }


        let currentPokemonList = []; // tous les Pokémon chargés de la génération
        let currentPage = 1;
        let itemsPerPage = 1025;
        let currentOffset = 0;
        let currentLimit = 1025;
        // Éléments DOM
        const grid = document.getElementById('pokemon-grid');
        const searchInput = document.getElementById('search');
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const closeBtn = document.querySelector('.close');
        const genButtons = document.querySelectorAll('.gen-btn');
        const perPageSelect = document.getElementById('per-page-select');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        const isLogged = document.getElementById('btnLogin')

            // ────────────────────────────────────────────────
            // GESTION CONNEXION / DÉCONNEXION
            // ────────────────────────────────────────────────

            const loginBtn = document.getElementById('btnLogin');

            // Vérifie si déjà connecté au chargement
            function checkLoginStatus() {
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                if (isLoggedIn) {
                    loginBtn.textContent = 'Se Déconnecter';
                    loginBtn.classList.add('logged-in');
                    document.getElementById('btnEquipe').style.display = 'inline-block';
                    document.getElementById('btnCombat').style.display = 'inline-block';

                } else {
                    loginBtn.textContent = 'Se Connecter';
                    loginBtn.classList.remove('logged-in');
                    document.getElementById('btnEquipe').style.display = 'none';
                    document.getElementById('btnCombat').style.display = 'none';
                }
            }

                // Fonction login (simulée)
                function login() {
                    const userToken = "abc-123-xyz-" + Date.now(); // token fictif unique
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('authToken', userToken);
                    checkLoginStatus();
                    alert("Vous êtes maintenant connecté ! (simulation)");
                }

                // Fonction logout
                function logout() {
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('authToken');
                    checkLoginStatus();
                    alert("Vous êtes déconnecté !");
                }

            // Événement clic sur le bouton
            loginBtn.addEventListener('click', () => {
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                if (isLoggedIn) {
                    logout();
                } else {
                    login();
                }
            });

            // Vérifie l’état au chargement de la page
            checkLoginStatus();
        // ────────────────────────────────────────────────
        //  CRÉATION D'UNE CARTE (inchangée)
        // ────────────────────────────────────────────────
        function createCard(p, nomFr) {
            const types = p.types.map(t => t.type.name);
            const sprite = p.sprites.other?.dream_world?.front_default ||
                p.sprites.other?.home?.front_default ||
                p.sprites.front_default;
            const card = document.createElement('div');
            card.className = 'pokemon-card';
            card.setAttribute('data-type1', types[0]);
            card.style.setProperty('--type1-color', getTypeColor(types[0]));
            if (types.length >= 2) {
                card.setAttribute('data-type2', types[1]);
                card.style.setProperty('--c1', getTypeColor(types[0]));
                card.style.setProperty('--c2', getTypeColor(types[1]));
            }
            card.innerHTML = `<img src="${sprite || ''}" alt="${nomFr}" class="sprite"><h3 class="pokemon-name">${nomFr}</h3><div class="types">${types.map(t => `<span class="type ${t}">${typeFrench[t] || capitalize(t)}</span>`).join('')}</div>`;
            card.addEventListener('click', async () => {
                await showDetails(p);
            });
            grid.appendChild(card);
        }

        async function showDetails(p) {
    const types = p.types.map(t => t.type.name);

    // Correction : fallback robuste pour l'image
    const officialArt = p.sprites.other?.['official-artwork']?.front_default ||
                        p.sprites.other?.dream_world?.front_default ||
                        p.sprites.other?.home?.front_default ||
                        p.sprites.front_default ||
                        'https://via.placeholder.com/260?text=?'; // image de secours si tout échoue

    const nameFr = await fetchNomFr(p.species.url);
    const id = p.id.toString().padStart(3, '0');

    // Ordre classique des stats pour le radar
    const statOrder = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
    const statLabels = statOrder.map(s => statFrench[s] || s);
    const statValues = statOrder.map(s => {
        const stat = p.stats.find(st => st.stat.name === s);
        return stat ? stat.base_stat : 0;
    });

    modalBody.innerHTML = `
        <img src="${officialArt}" alt="${nameFr}" class="art">
        <h2>#${id} ${nameFr}</h2>
        <div class="info">
            <div>Hauteur<br>${(p.height / 10).toFixed(1)} m</div>
            <div>Poids<br>${(p.weight / 10).toFixed(1)} kg</div>
        </div>
        <div class="modal-types">
            <strong>Types :</strong>
            <div style="margin-top:0.6rem;">
                ${types.map(t => `<span class="type ${t}">${typeFrench[t] || capitalize(t)}</span>`).join('')}
            </div>
        </div>
        <div class="stats-container">
            <canvas id="statsRadar"></canvas>
        </div>
    `;

    modal.style.display = 'flex';

    // Graphique radar (inchangé)
    setTimeout(() => {
        const ctx = document.getElementById('statsRadar').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: statLabels,
                datasets: [{
                    label: 'Stats',
                    data: statValues,
                    backgroundColor: 'rgba(238, 21, 21, 0.18)',
                    borderColor: '#ee1515',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffcb05',
                    pointBorderColor: '#000',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.15)' },
                        grid: { color: 'rgba(255,255,255,0.12)' },
                        pointLabels: {
                            color: '#ffeb3b',
                            font: { size: 13, family: "'Press Start 2P', cursive" }
                        },
                        ticks: {
                            color: '#ddd',
                            backdropColor: 'transparent',
                            stepSize: 20,
                            min: 0,
                            max: 200
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                animation: {
                    duration: 1400,
                    easing: 'easeOutQuart'
                }
            }
        });
    }, 100);
}

        // ────────────────────────────────────────────────
        //  AFFICHER LA PAGE ACTUELLE
        // ────────────────────────────────────────────────
            function displayCurrentPage() {
                grid.innerHTML = '';
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const pageItems = currentPokemonList.slice(start, end);

                // Correction ici : dépacketer l'objet
                pageItems.forEach(({ p, nomFr }) => createCard(p, nomFr));

                const totalPages = Math.ceil(currentPokemonList.length / itemsPerPage);
                pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
                prevBtn.disabled = currentPage === 1;
                nextBtn.disabled = currentPage >= totalPages;
            }
        // ────────────────────────────────────────────────
        //  CHARGEMENT D'UNE GÉNÉRATION + STOCKAGE
        // ────────────────────────────────────────────────
        async function loadGeneration(offset, limit) {
            grid.innerHTML = '<div class="spinner-border text-danger" role="status"><span class="visually-hidden">Chargement...</span></div>';
            try {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
                const data = await res.json();
                const pokemonData = await Promise.all(
                    data.results.map(async entry => {
                        const p = await fetch(entry.url).then(r => r.json());
                        const nomFr = await fetchNomFr(p.species.url);
                        return { p, nomFr };
                    })
                );
                currentPokemonList = pokemonData;
                currentPage = 1;
                displayCurrentPage();
            } catch (err) {
                grid.innerHTML = '<p style="color:#c00; text-align:center; grid-column:1/-1; padding:40px 0;">Erreur de chargement</p>';
                console.error(err);
            }
        }
        // ────────────────────────────────────────────────
        //  ÉVÈNEMENTS PAGINATION & SÉLECTEUR
        // ────────────────────────────────────────────────
        perPageSelect.addEventListener('change', () => {
            itemsPerPage = parseInt(perPageSelect.value);
            currentPage = 1;
            displayCurrentPage();
        });
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayCurrentPage();
            }
        });
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(currentPokemonList.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayCurrentPage();
            }
        });
        // Recherche (filtre sur la liste complète)
        function setupSearch() {
                searchInput.addEventListener('input', e => {
                    const term = e.target.value.toLowerCase().trim();

                    if (!term) {
                        // Recherche vide → retour à la liste complète avec pagination
                        document.querySelector('.top-controls').style.display = 'flex';
                        currentPage = 1;
                        displayCurrentPage();
                        return;
                    }

                    // Liste des noms de types en minuscule pour comparaison rapide
                    const typeNamesFr = Object.values(typeFrench).map(t => t.toLowerCase());

                    // On découpe en mots (séparés par espace)
                    const words = term.split(/\s+/).filter(w => w.length > 0);

                    let filtered = currentPokemonList;

                    words.forEach(word => {
                        // 1. Recherche par ID (si c'est un nombre ou commence par # ou 00X)
                        if (/^\d+$/.test(word) || word.startsWith('#') || word.match(/^\d{3}$/)) {
                            const searchId = word.replace('#', '').padStart(3, '0');
                            filtered = filtered.filter(({ p }) =>
                                p.id.toString().padStart(3, '0').includes(searchId)
                            );
                            return;
                        }

                        // 2. Est-ce que ce mot ressemble à un type ?
                        const matchedType = typeNamesFr.find(t =>
                            t.includes(word) || word.includes(t) || t.startsWith(word)
                        );

                        if (matchedType) {
                            // Filtre par type (un Pokémon est gardé s'il a AU MOINS ce type)
                            const typeKey = Object.keys(typeFrench).find(k =>
                                typeFrench[k].toLowerCase() === matchedType
                            );
                            filtered = filtered.filter(({ p }) =>
                                p.types.some(t => t.type.name.toLowerCase() === typeKey)
                            );
                        } else {
                            // Sinon → filtre par nom de Pokémon
                            filtered = filtered.filter(({ nomFr }) =>
                                nomFr.toLowerCase().includes(word)
                            );
                        }
                    });

        // Affichage
        grid.innerHTML = '';
        filtered.forEach(({ p, nomFr }) => createCard(p, nomFr));

        // Masquer la pagination quand on filtre activement
        document.querySelector('.top-controls').style.display = 'none';

        // Réinitialiser à la page 1
        currentPage = 1;
    });
}
            document.querySelectorAll('.ty-nav .gen-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.ty-nav .gen-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    console.log("Filtrer par type :", btn.textContent);
                });
            });

        // Reset pagination quand on change de génération ou quand on vide la recherche
        searchInput.addEventListener('input', e => {
            if (!e.target.value.trim()) {
                document.querySelector('.top-controls').style.display = 'flex';
                displayCurrentPage();
            }
        });
        // Événements générations (inchangés sauf reset page)
        document.querySelectorAll('.gen-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.gen-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const offset = parseInt(btn.dataset.offset);
                const limit = parseInt(btn.dataset.limit);
                loadGeneration(offset, limit);
            });
        });
        // Fermeture modal
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
        // Démarrage
        loadGeneration(0, 151);
        setupSearch();
