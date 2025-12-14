document.addEventListener('DOMContentLoaded', () => {
    const api = new PokeAPI();
    const ui = new UI();
    ui.setApi(api); // Pass API to UI for form-specific evolution fetching

    let allPokemon = []; // Master list of ALL Pokemon

    // Generation configuration with ranges and first/last Pokemon IDs
    const generations = [
        { name: 'Generation I', region: 'Kanto', offset: 0, limit: 151, first: 1, last: 151 },
        { name: 'Generation II', region: 'Johto', offset: 151, limit: 100, first: 152, last: 251 },
        { name: 'Generation III', region: 'Hoenn', offset: 251, limit: 135, first: 252, last: 386 },
        { name: 'Generation IV', region: 'Sinnoh', offset: 386, limit: 107, first: 387, last: 493 },
        { name: 'Generation V', region: 'Unova', offset: 493, limit: 156, first: 494, last: 649 },
        { name: 'Generation VI', region: 'Kalos', offset: 649, limit: 72, first: 650, last: 721 },
        { name: 'Generation VII', region: 'Alola', offset: 721, limit: 88, first: 722, last: 809 },
        { name: 'Generation VIII', region: 'Galar', offset: 809, limit: 96, first: 810, last: 905 },
        { name: 'Generation IX', region: 'Paldea', offset: 905, limit: 120, first: 906, last: 1025 }
    ];

    async function loadAllPokemon() {
        ui.showLoading();
        ui.clearGrid();

        try {
            // Add jump-to navigation at the top
            ui.addJumpToNav();

            // Load all generations sequentially and render as they load
            for (let i = 0; i < generations.length; i++) {
                const gen = generations[i];
                // Add generation header with anchor ID and first/last Pokemon sprites
                ui.addGenerationHeader(gen.name, gen.region, i + 1, gen.first, gen.last);

                // Fetch Pokemon for this generation
                const pokemon = await api.getPokemonList(gen.offset, gen.limit);
                allPokemon.push(...pokemon);

                // Render this generation's Pokemon
                ui.appendCards(pokemon);
            }

            console.log('Loaded all', allPokemon.length, 'Pokemon');
        } catch (err) {
            console.error("Failed to load Pokemon:", err);
            ui.grid.innerHTML = '<p style="text-align:center; color:red;">Error loading data.</p>';
        }
    }

    async function init() {
        await loadAllPokemon();
    }

    // Expandable Search Bar
    const searchContainer = document.getElementById('search-container');
    const searchToggle = document.getElementById('search-toggle');
    const searchInput = document.getElementById('search-input');
    let isSearchOpen = false;

    searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSearch();
    });

    function toggleSearch() {
        isSearchOpen = !isSearchOpen;
        if (isSearchOpen) {
            searchContainer.style.width = '300px';
            searchContainer.style.borderRadius = '25px';
            searchContainer.style.padding = '0 1rem';
            searchInput.style.width = '250px';
            searchInput.style.padding = '0.5rem';
            searchInput.style.opacity = '1';
            searchToggle.style.marginRight = '0.5rem';
            setTimeout(() => searchInput.focus(), 300);
        } else {
            searchContainer.style.width = '50px';
            searchContainer.style.borderRadius = '50%';
            searchContainer.style.padding = '0';
            searchInput.style.width = '0';
            searchInput.style.padding = '0';
            searchInput.style.opacity = '0';
            searchToggle.style.marginRight = '0';
            searchInput.blur();
        }
    }

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
        if (isSearchOpen && !searchContainer.contains(e.target)) {
            toggleSearch();
        }
    });

    // Search Logic - Filter ALL Pokemon
    let searchTimeout = null;

    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.toLowerCase().trim();

        // Clear previous timeout
        if (searchTimeout) clearTimeout(searchTimeout);

        // If query is empty, reload all Pokemon with headers
        if (!query) {
            ui.clearGrid();
            for (const gen of generations) {
                const startId = gen.offset + 1;
                const endId = gen.offset + gen.limit;
                const genPokemon = allPokemon.filter(p => p.id >= startId && p.id <= endId);
                if (genPokemon.length > 0) {
                    ui.addGenerationHeader(gen.name, gen.region);
                    ui.appendCards(genPokemon);
                }
            }
            return;
        }

        // Filter all Pokemon
        searchTimeout = setTimeout(() => {
            const filtered = allPokemon.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.id.toString().includes(query)
            );
            ui.renderCards(filtered); // No headers for search results
        }, 150);
    });

    // Handle Card Clicks (using event delegation from UI setup)
    document.addEventListener('pokemon-click', async (e) => {
        const pokemon = e.detail;

        // Show modal immediately with existing data, loading states for async content
        ui.openModal(pokemon, "Loading description...");
        ui.renderEvolutionChain([]); // Clear/show loading
        ui.renderForms([]); // Clear forms

        // Fetch flavor text, evolution chain, and alternate forms in parallel
        const [text, evoChain, forms] = await Promise.all([
            api.getFlavorText(pokemon.id),
            api.getEvolutionChain(pokemon.id),
            api.getAlternateForms(pokemon.id)
        ]);

        // Only update if modal is still open and showing the same pokemon
        const currentName = document.getElementById('modal-name').textContent.toLowerCase();
        if (currentName === pokemon.name) {
            document.getElementById('modal-desc').textContent = text;
            ui.renderEvolutionChain(evoChain);
            ui.renderForms(forms);
        }
    });

    init();
});
