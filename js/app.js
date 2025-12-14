document.addEventListener('DOMContentLoaded', () => {
    const api = new PokeAPI();
    const ui = new UI();
    ui.setApi(api); // Pass API to UI for form-specific evolution fetching

    let allPokemon = []; // Master list
    let currentGen = localStorage.getItem('pokedex-gen') || 'gen1';

    async function fetchPokemonByGen(gen) {
        ui.showLoading();
        ui.clearGrid(); // Ensure grid is clear before fetching

        // Generation ranges (National Dex IDs):
        // Gen 1: 1-151 (151), Gen 2: 152-251 (100), Gen 3: 252-386 (135),
        // Gen 4: 387-493 (107), Gen 5: 494-649 (156), Gen 6: 650-721 (72),
        // Gen 7: 722-809 (88), Gen 8: 810-905 (96), Gen 9: 906-1025 (120)
        const genConfig = {
            gen1: { offset: 0, limit: 151, label: '1' },
            gen2: { offset: 151, limit: 100, label: '2' },
            gen3: { offset: 251, limit: 135, label: '3' },
            gen4: { offset: 386, limit: 107, label: '4' },
            gen5: { offset: 493, limit: 156, label: '5' },
            gen6: { offset: 649, limit: 72, label: '6' },
            gen7: { offset: 721, limit: 88, label: '7' },
            gen8: { offset: 809, limit: 96, label: '8' },
            gen9: { offset: 905, limit: 120, label: '9' }
        };

        try {
            const config = genConfig[gen];
            if (config) {
                allPokemon = await api.getPokemonList(config.offset, config.limit);
            }
            ui.renderCards(allPokemon);
        } catch (err) {
            console.error("Failed to load gen:", err);
            ui.grid.innerHTML = '<p style="text-align:center; color:red;">Error loading data.</p>';
        }
    }

    async function init() {
        // Restore saved generation
        const savedGen = localStorage.getItem('pokedex-gen') || 'gen1';
        currentGen = savedGen;

        const genSelect = document.getElementById('gen-select');
        if (genSelect) {
            genSelect.value = currentGen; // Set dropdown to saved value

            genSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val !== currentGen) {
                    currentGen = val;
                    localStorage.setItem('pokedex-gen', currentGen); // Save to localStorage
                    // Clear search when switching gen
                    document.getElementById('search-input').value = '';
                    fetchPokemonByGen(currentGen);
                }
            });
        }

        await fetchPokemonByGen(currentGen);
    }

    // Search Logic
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        const filtered = allPokemon.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.id.toString().includes(query)
        );

        ui.renderCards(filtered);
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
