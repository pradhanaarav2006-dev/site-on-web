class PokeAPI {
    constructor() {
        this.baseUrl = 'https://pokeapi.co/api/v2';
        this.cache = new Map();

        // Regional evolution method overrides (key: "speciesName-region", value: evolution method)
        this.regionalEvolutionMethods = {
            // Alolan forms
            'ninetales-alola': 'Ice Stone',
            'sandslash-alola': 'Ice Stone',
            'persian-alola': 'Happiness',
            'golem-alola': 'Trade',
            'exeggutor-alola': 'Leaf Stone',
            'marowak-alola': 'Lv. 28 (night)',
            'raichu-alola': 'Thunder Stone',
            // Galarian forms
            'rapidash-galar': 'Lv. 40',
            'slowbro-galar': 'Galarica Cuff',
            'slowking-galar': 'Galarica Wreath',
            'weezing-galar': 'Lv. 35',
            'mr-rime-galar': 'Lv. 42',
            'cursola-galar': 'Lv. 38',
            'sirfetchd-galar': '3 Critical Hits',
            'runerigus-galar': '49+ damage near Dusty Bowl',
            'obstagoon-galar': 'Lv. 35 (night)',
            'perrserker-galar': 'Lv. 28',
            'darmanitan-galar': 'Ice Stone',
            // Hisuian forms
            'arcanine-hisui': 'Fire Stone',
            'electrode-hisui': 'Leaf Stone',
            'typhlosion-hisui': 'Lv. 36',
            'samurott-hisui': 'Lv. 36',
            'lilligant-hisui': 'Sun Stone',
            'braviary-hisui': 'Lv. 54',
            'goodra-hisui': 'Lv. 50 (rain)',
            'avalugg-hisui': 'Lv. 37',
            'decidueye-hisui': 'Lv. 36',
            'zoroark-hisui': 'Lv. 30',
            'overqwil-hisui': 'Strong Style Barb Barrage 20x'
        };

        // Custom evolution method overrides for specific Pokemon (key: species name)
        this.customEvolutionMethods = {
            'leafeon': 'Near Mossy Rock',
            'glaceon': 'Near Icy Rock',
            'sylveon': 'Affection + Fairy move',
            'milotic': 'Max Beauty / Prism Scale Trade',
            'shedinja': 'Empty slot + Pokéball',
            'malamar': 'Lv. 30 (upside down)',
            'runerigus': '49+ damage near Dusty Bowl',
            'sirfetchd': '3 Critical Hits in battle',
            'alcremie': 'Spin with Sweet item',
            'clodsire': 'Lv. 20',
            'sneasler': 'Razor Claw (day)',
            'overqwil': 'Strong Style Barb Barrage 20x',
            'wyrdeer': 'Psyshield Bash 20x',
            'kleavor': 'Black Augurite',
            'ursaluna': 'Peat Block (full moon)',
            'basculegion': 'Recoil damage 294+'
        };

        // Pokemon with exclusive regional pre-evolutions (key: species name, value: {region, preEvo})
        // These Pokemon ONLY evolve from their regional form, not the base form
        this.regionalExclusiveEvolutions = {
            'clodsire': { region: 'paldea', preEvo: 'wooper', method: 'Lv. 20' },
            'sneasler': { region: 'hisui', preEvo: 'sneasel', method: 'Razor Claw (day)' },
            'overqwil': { region: 'hisui', preEvo: 'qwilfish', method: 'Strong Style Barb Barrage 20x' },
            'perrserker': { region: 'galar', preEvo: 'meowth', method: 'Lv. 28' },
            'sirfetchd': { region: 'galar', preEvo: 'farfetchd', method: '3 Critical Hits' },
            'mr-rime': { region: 'galar', preEvo: 'mr-mime', method: 'Lv. 42' },
            'cursola': { region: 'galar', preEvo: 'corsola', method: 'Lv. 38' },
            'obstagoon': { region: 'galar', preEvo: 'linoone', method: 'Lv. 35 (night)' },
            'runerigus': { region: 'galar', preEvo: 'yamask', method: '49+ damage near Dusty Bowl' }
        };

        // Form name overrides (key: variety.pokemon.name, value: display name)
        this.formNameOverrides = {
            'greninja-ash': 'Battle Bond',
            'pikachu-starter': 'Partner',
            'eevee-starter': 'Partner'
        };

        // Forms to exclude from display
        this.excludedForms = [
            'greninja-battle-bond',  // Exclude "Battle Bond" since we rename Ash-Greninja to Battle Bond
            // Cap Pikachu forms
            'pikachu-original-cap',
            'pikachu-hoenn-cap',
            'pikachu-sinnoh-cap',
            'pikachu-unova-cap',
            'pikachu-kalos-cap',
            'pikachu-alola-cap',
            'pikachu-partner-cap',
            'pikachu-world-cap',
            // Cosplay Pikachu forms
            'pikachu-cosplay',
            'pikachu-rock-star',
            'pikachu-belle',
            'pikachu-pop-star',
            'pikachu-phd',
            'pikachu-libre'
        ];
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
            const seenFormNames = new Set();

            // Fetch each variety's data
            for (const variety of speciesData.varieties) {
                // Skip excluded forms
                if (this.excludedForms.includes(variety.pokemon.name)) {
                    continue;
                }

                try {
                    const pokemonRes = await fetch(variety.pokemon.url);
                    const pokemonData = await pokemonRes.json();

                    // Get a clean form name
                    let formName = variety.pokemon.name;
                    const baseName = speciesData.name;

                    // Check for name override first
                    if (this.formNameOverrides[variety.pokemon.name]) {
                        formName = this.formNameOverrides[variety.pokemon.name];
                    } else if (formName === baseName) {
                        formName = 'Default';
                    } else {
                        // Extract form suffix (e.g., "pikachu-gmax" -> "Gmax")
                        formName = formName.replace(baseName + '-', '').split('-').map(
                            word => word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                    }

                    const pokemonIdVal = parseInt(variety.pokemon.url.split('/').filter(Boolean).pop());
                    seenFormNames.add(variety.pokemon.name);

                    forms.push({
                        name: formName,
                        fullName: variety.pokemon.name,
                        pokemonId: pokemonIdVal,
                        isDefault: variety.is_default,
                        image: pokemonData.sprites.other['official-artwork'].front_default ||
                            pokemonData.sprites.front_default,
                        types: pokemonData.types.map(t => t.type.name),
                        stats: pokemonData.stats.map(s => ({
                            name: s.stat.name,
                            value: s.base_stat
                        }))
                    });

                    // Check for visual form variants (like Shellos East/West Sea)
                    // These are stored in pokemonData.forms with different IDs
                    if (pokemonData.forms && pokemonData.forms.length > 1) {
                        for (const form of pokemonData.forms) {
                            if (seenFormNames.has(form.name)) continue;
                            seenFormNames.add(form.name);

                            try {
                                const formRes = await fetch(form.url);
                                const formData = await formRes.json();

                                // Get form-specific image
                                let formImage = formData.sprites?.front_default;
                                // Try getting official artwork if available
                                if (formData.sprites?.other?.['official-artwork']?.front_default) {
                                    formImage = formData.sprites.other['official-artwork'].front_default;
                                }
                                // Fallback: try constructing URL from form ID
                                if (!formImage) {
                                    const formId = parseInt(form.url.split('/').filter(Boolean).pop());
                                    formImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${formId}.png`;
                                }

                                // Extract form name
                                let visualFormName = form.name.replace(speciesData.name + '-', '').split('-').map(
                                    word => word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ');

                                forms.push({
                                    name: visualFormName,
                                    fullName: form.name,
                                    pokemonId: pokemonIdVal, // Same species/stats
                                    isDefault: false,
                                    image: formImage || pokemonData.sprites.front_default,
                                    types: pokemonData.types.map(t => t.type.name),
                                    stats: pokemonData.stats.map(s => ({
                                        name: s.stat.name,
                                        value: s.base_stat
                                    }))
                                });
                            } catch (e) {
                                console.warn(`Could not fetch visual form ${form.name}`);
                            }
                        }
                    }
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

    async getEvolutionChain(pokemonId, region = null) {
        try {
            let speciesUrl;
            let speciesName = null;

            // For form Pokemon (IDs 10000+), we need to fetch the Pokemon first to get species URL
            if (pokemonId >= 10000) {
                const pokemonRes = await fetch(`${this.baseUrl}/pokemon/${pokemonId}/`);
                const pokemonData = await pokemonRes.json();
                speciesUrl = pokemonData.species.url;
                speciesName = pokemonData.species.name;
            } else {
                speciesUrl = `${this.baseUrl}/pokemon-species/${pokemonId}/`;
            }

            // Get species data to find evolution chain URL
            const speciesRes = await fetch(speciesUrl);
            const speciesData = await speciesRes.json();
            speciesName = speciesData.name;

            // Check for regional-exclusive evolutions
            // These Pokemon only evolve from their regional form
            if (this.regionalExclusiveEvolutions[speciesName]) {
                const exclusive = this.regionalExclusiveEvolutions[speciesName];

                // Fetch the regional pre-evolution Pokemon data
                const preEvoName = `${exclusive.preEvo}-${exclusive.region}`;
                try {
                    const preEvoRes = await fetch(`${this.baseUrl}/pokemon/${preEvoName}/`);
                    const preEvoData = await preEvoRes.json();

                    // Fetch the current Pokemon data
                    const currentRes = await fetch(`${this.baseUrl}/pokemon/${speciesName}/`);
                    const currentData = await currentRes.json();

                    // Build custom evolution chain
                    const regionCapitalized = exclusive.region.charAt(0).toUpperCase() + exclusive.region.slice(1);
                    const preEvoDisplayName = `${regionCapitalized} ${exclusive.preEvo.charAt(0).toUpperCase() + exclusive.preEvo.slice(1)}`;

                    const customChain = [[
                        {
                            name: preEvoDisplayName,
                            id: preEvoData.id,
                            image: preEvoData.sprites.other['official-artwork'].front_default ||
                                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${preEvoData.id}.png`,
                            method: null
                        },
                        {
                            name: speciesData.name.charAt(0).toUpperCase() + speciesData.name.slice(1),
                            id: currentData.id,
                            image: currentData.sprites.other['official-artwork'].front_default ||
                                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentData.id}.png`,
                            method: exclusive.method
                        }
                    ]];

                    return customChain;
                } catch (e) {
                    console.warn(`Could not build regional exclusive chain for ${speciesName}:`, e);
                    // Fall through to normal chain if regional lookup fails
                }
            }

            // Fetch evolution chain
            const evoRes = await fetch(speciesData.evolution_chain.url);
            const evoData = await evoRes.json();

            // Parse chain into branches (array of linear paths)
            const branches = [];
            await this.parseEvolutionBranches(evoData.chain, [], branches, region);
            return branches;
        } catch (error) {
            console.error("Error fetching evolution chain:", error);
            return [];
        }
    }

    async parseEvolutionBranches(node, currentPath, allBranches, region = null) {
        // Extract Pokemon info
        const speciesId = parseInt(node.species.url.split('/').filter(Boolean).pop());
        const speciesName = node.species.name;

        let method = null;
        if (node.evolution_details && node.evolution_details.length > 0) {
            method = this.formatEvolutionMethod(node.evolution_details[0]);
        }

        // Check for custom evolution method override
        if (this.customEvolutionMethods[speciesName]) {
            method = this.customEvolutionMethods[speciesName];
        }

        // Try to get regional variant if region is specified
        let pokemonId = speciesId;
        let image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${speciesId}.png`;
        let displayName = speciesName;

        if (region) {
            try {
                // Try to fetch regional variant (e.g., "darumaka-galar")
                const regionalName = `${speciesName}-${region}`;
                const regionalRes = await fetch(`${this.baseUrl}/pokemon/${regionalName}/`);
                if (regionalRes.ok) {
                    const regionalData = await regionalRes.json();
                    pokemonId = regionalData.id;
                    image = regionalData.sprites.other['official-artwork'].front_default ||
                        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
                    displayName = `${region.charAt(0).toUpperCase() + region.slice(1)} ${speciesName}`;

                    // Check for regional evolution method override
                    const regionalKey = `${speciesName}-${region}`;
                    if (this.regionalEvolutionMethods[regionalKey]) {
                        method = this.regionalEvolutionMethods[regionalKey];
                    }
                }
            } catch (e) {
                // Regional variant doesn't exist, use base form
            }
        }

        const pokemon = {
            name: displayName,
            id: pokemonId,
            image: image,
            method: method
        };

        const newPath = [...currentPath, pokemon];

        // If no more evolutions, this path is complete
        if (!node.evolves_to || node.evolves_to.length === 0) {
            allBranches.push(newPath);
        } else {
            // Continue down each branch
            for (const evo of node.evolves_to) {
                await this.parseEvolutionBranches(evo, newPath, allBranches, region);
            }
        }
    }

    formatEvolutionMethod(details) {
        const trigger = details.trigger?.name || '';

        if (trigger === 'level-up') {
            const conditions = [];

            // Check for level requirement
            if (details.min_level) conditions.push(`Lv. ${details.min_level}`);

            // Check for happiness/friendship
            if (details.min_happiness) conditions.push('Happiness');

            // Check for affection (Sylveon in older games)
            if (details.min_affection) conditions.push('Affection');

            // Check for known move
            if (details.known_move) conditions.push(`Know ${details.known_move.name.replace('-', ' ')}`);

            // Check for known move type (Sylveon - knowing Fairy move)
            if (details.known_move_type) conditions.push(`Know ${details.known_move_type.name} move`);

            // Check for time of day
            if (details.time_of_day) {
                if (details.time_of_day === 'day') conditions.push('(day)');
                else if (details.time_of_day === 'night') conditions.push('(night)');
                else conditions.push(`(${details.time_of_day})`);
            }

            // Check for location
            if (details.location) conditions.push(`at ${details.location.name.replace('-', ' ')}`);

            // Check for held item while leveling
            if (details.held_item) conditions.push(`hold ${details.held_item.name.replace('-', ' ')}`);

            // Check for specific gender
            if (details.gender === 1) conditions.push('(female)');
            else if (details.gender === 2) conditions.push('(male)');

            // Check for weather/rain
            if (details.needs_overworld_rain) conditions.push('(rain)');

            // Check for upside down
            if (details.turn_upside_down) conditions.push('(upside down)');

            return conditions.length > 0 ? conditions.join(' ') : 'Level up';
        }
        if (trigger === 'trade') {
            if (details.held_item) return `Trade w/ ${details.held_item.name.replace('-', ' ')}`;
            return 'Trade';
        }
        if (trigger === 'use-item') {
            return details.item ? details.item.name.replace('-', ' ') : 'Use item';
        }
        if (trigger === 'shed') return 'Shedinja method';
        if (trigger === 'spin') return 'Spin with Sweet';
        if (trigger === 'tower-of-darkness') return 'Tower of Darkness';
        if (trigger === 'tower-of-waters') return 'Tower of Waters';
        if (trigger === 'three-critical-hits') return '3 Critical Hits';
        if (trigger === 'take-damage') return 'Take 49+ damage';

        return trigger.replace(/-/g, ' ') || '???';
    }
}
