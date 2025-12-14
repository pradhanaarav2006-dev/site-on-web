class PokeAPI {
    constructor() {
        this.baseUrl = 'https://pokeapi.co/api/v2';
        this.cache = new Map();
    }

    async getPokemonList(offset = 0, limit = 151) {
        try {
            const response = await fetch(`${this.baseUrl}/pokemon?offset=${offset}&limit=${limit}`);
            const data = await response.json();

            const pokemonPromies = data.results.map((pokemon) => {
                // Extract ID from URL to pass to getPokemonDetails
                const id = parseInt(pokemon.url.split('/').filter(Boolean).pop());
                return this.getPokemonDetails(pokemon.url, id);
            });

            const results = await Promise.all(pokemonPromies);
            return results;
        } catch (error) {
            console.error("Error fetching Pokemon list:", error);
            return [];
        }
    }

    async getPokemonDetails(url, id) {
        if (this.cache.has(url)) return this.cache.get(url);

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Normalize data
            const pokemon = {
                id: data.id,
                name: data.name,
                types: data.types.map(t => t.type.name),
                stats: data.stats.map(s => ({
                    name: s.stat.name,
                    value: s.base_stat
                })),
                image: data.sprites.other['official-artwork'].front_default,
                // height: data.height,
                // weight: data.weight,
                speciesUrl: data.species.url
            };

            this.cache.set(url, pokemon);
            this.cache.set(id, pokemon); // Cache by ID too
            return pokemon;
        } catch (error) {
            console.error(`Error fetching details for ${url}:`, error);
            return null;
        }
    }

    async getFlavorText(id) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
            const data = await response.json();

            // Find English flavor text
            const entry = data.flavor_text_entries.find(entry => entry.language.name === 'en');

            // Clean up text (remove form feeds, newlines)
            return entry ? entry.flavor_text.replace(/[\f\n\r]/g, ' ') : "No description available.";
        } catch (error) {
            console.error("Error fetching flavor text:", error);
            return "Description unavailable.";
        }
    }

    async getAlternateForms(pokemonId) {
        try {
            // Get species data which contains varieties
            const speciesRes = await fetch(`${this.baseUrl}/pokemon-species/${pokemonId}/`);
            const speciesData = await speciesRes.json();

            const forms = [];

            // Fetch each variety's data
            for (const variety of speciesData.varieties) {
                try {
                    const pokemonRes = await fetch(variety.pokemon.url);
                    const pokemonData = await pokemonRes.json();

                    // Get a clean form name
                    let formName = variety.pokemon.name;
                    const baseName = speciesData.name;

                    if (formName === baseName) {
                        formName = 'Default';
                    } else {
                        // Extract form suffix (e.g., "pikachu-gmax" -> "Gmax")
                        formName = formName.replace(baseName + '-', '').split('-').map(
                            word => word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                    }

                    forms.push({
                        name: formName,
                        fullName: variety.pokemon.name,
                        isDefault: variety.is_default,
                        image: pokemonData.sprites.other['official-artwork'].front_default ||
                            pokemonData.sprites.front_default,
                        types: pokemonData.types.map(t => t.type.name),
                        stats: pokemonData.stats.map(s => ({
                            name: s.stat.name,
                            value: s.base_stat
                        }))
                    });
                } catch (e) {
                    console.warn(`Could not fetch form ${variety.pokemon.name}`);
                }
            }

            return forms;
        } catch (error) {
            console.error("Error fetching alternate forms:", error);
            return [];
        }
    }

    async getEvolutionChain(pokemonId) {
        try {
            // First get species to find evolution chain URL
            const speciesRes = await fetch(`${this.baseUrl}/pokemon-species/${pokemonId}/`);
            const speciesData = await speciesRes.json();

            // Fetch evolution chain
            const evoRes = await fetch(speciesData.evolution_chain.url);
            const evoData = await evoRes.json();

            // Parse chain into branches (array of linear paths)
            const branches = [];
            this.parseEvolutionBranches(evoData.chain, [], branches);
            return branches;
        } catch (error) {
            console.error("Error fetching evolution chain:", error);
            return [];
        }
    }

    parseEvolutionBranches(node, currentPath, allBranches) {
        // Extract Pokemon info
        const speciesId = parseInt(node.species.url.split('/').filter(Boolean).pop());

        let method = null;
        if (node.evolution_details && node.evolution_details.length > 0) {
            method = this.formatEvolutionMethod(node.evolution_details[0]);
        }

        const pokemon = {
            name: node.species.name,
            id: speciesId,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${speciesId}.png`,
            method: method
        };

        const newPath = [...currentPath, pokemon];

        // If no more evolutions, this path is complete
        if (!node.evolves_to || node.evolves_to.length === 0) {
            allBranches.push(newPath);
        } else {
            // Continue down each branch
            node.evolves_to.forEach(evo => this.parseEvolutionBranches(evo, newPath, allBranches));
        }
    }

    formatEvolutionMethod(details) {
        const trigger = details.trigger?.name || '';

        if (trigger === 'level-up') {
            if (details.min_level) return `Lv. ${details.min_level}`;
            if (details.min_happiness) return `Happiness`;
            if (details.known_move) return `Learn ${details.known_move.name}`;
            if (details.time_of_day) return `Level up (${details.time_of_day})`;
            return 'Level up';
        }
        if (trigger === 'trade') {
            if (details.held_item) return `Trade w/ ${details.held_item.name.replace('-', ' ')}`;
            return 'Trade';
        }
        if (trigger === 'use-item') {
            return details.item ? details.item.name.replace('-', ' ') : 'Use item';
        }
        if (trigger === 'shed') return 'Shedinja method';

        return trigger.replace('-', ' ') || '???';
    }
}
