class UI {
    constructor() {
        this.grid = document.getElementById('pokedex-grid');
        this.searchInput = document.getElementById('search-input');

        // Modal elements
        this.modal = document.getElementById('pokemon-modal');
        this.modalCloseBtn = document.getElementById('close-modal');
        this.modalName = document.getElementById('modal-name');
        this.modalImg = document.getElementById('modal-img');
        this.modalTypes = document.getElementById('modal-types');
        this.modalStats = document.getElementById('modal-stats');
        this.modalDesc = document.getElementById('modal-desc');
        this.modalVisuals = document.getElementById('modal-visuals');
        this.modalEvolutions = document.getElementById('modal-evolutions');
        this.modalForms = document.getElementById('modal-forms');

        this.currentForms = []; // Store forms for switching
        this.api = null; // Will be set by app.js

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.modalCloseBtn.addEventListener('click', () => this.closeModal());

        // Close on clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('open')) {
                this.closeModal();
            }
        });
    }

    clearGrid() {
        this.grid.innerHTML = '';
    }

    renderCards(pokemonList) {
        this.clearGrid();

        if (pokemonList.length === 0) {
            this.grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; font-size: 1.2rem; color: var(--clr-text-muted);">No Pokemon found.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        pokemonList.forEach(pokemon => {
            const card = this.createCardElement(pokemon);
            fragment.appendChild(card);
        });

        this.grid.appendChild(fragment);
    }

    createCardElement(pokemon) {
        const div = document.createElement('div');
        div.className = 'pokemon-card glass-panel';

        // Dynamic border color based on primary type
        const primaryType = pokemon.types[0];
        div.style.setProperty('--type-color', `var(--type-${primaryType})`);

        // Initial border top (keeps existing design but uses variable)
        div.style.borderTop = `4px solid var(--type-color)`;

        div.innerHTML = `
            <span class="card-id">#${pokemon.id.toString().padStart(3, '0')}</span>
            <div class="card-img-wrapper">
                <img src="${pokemon.image}" alt="${pokemon.name}" class="pokemon-img" loading="lazy">
            </div>
            <div class="card-info">
                <h3 class="pokemon-name">${pokemon.name}</h3>
                <div class="pokemon-types">
                    ${pokemon.types.map(type =>
            `<span class="type-badge" style="background-color: var(--type-${type}); color: white;">${type}</span>`
        ).join('')}
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            // Trigger an event that App.js can listen to, or callback. 
            // For simplicity, we can dispatch a custom event.
            div.dispatchEvent(new CustomEvent('pokemon-click', {
                bubbles: true,
                detail: pokemon
            }));
        });

        return div;
    }

    showLoading() {
        this.grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 3rem; color: var(--clr-accent);"></i>
                <p style="margin-top: 1rem; color: var(--clr-text-muted);">Catching 'em all...</p>
            </div>
        `;
    }

    // Modal Methods
    openModal(pokemon, flavorText) {
        this.modalName.textContent = pokemon.name;
        this.modalImg.src = pokemon.image;
        this.modalDesc.textContent = flavorText;

        // Reset types
        this.modalTypes.innerHTML = pokemon.types.map(type =>
            `<span class="type-badge" style="background-color: var(--type-${type}); color: white; padding: 0.5rem 1.2rem; font-size: 1rem;">${type}</span>`
        ).join('');

        // Reset stats
        const bst = pokemon.stats.reduce((sum, s) => sum + s.value, 0);
        const statRows = pokemon.stats.map(stat => {
            const percentage = Math.min((stat.value / 255) * 100, 100);
            return `
                <div class="stat-row">
                    <span class="stat-name">${this.formatStatName(stat.name)}</span>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-fill" style="width: ${percentage}%; background-color: var(--type-${pokemon.types[0]})"></div>
                    </div>
                    <span style="font-weight: bold; width: 30px; text-align: right;">${stat.value}</span>
                </div>
            `;
        }).join('');

        // Add Total row
        const totalRow = `
            <div class="stat-row" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--glass-border);">
                <span class="stat-name" style="color: var(--clr-accent);">TOT</span>
                <div class="stat-bar-bg" style="visibility: hidden;"></div>
                <span style="font-weight: bold; width: 30px; text-align: right; color: var(--clr-accent);">${bst}</span>
            </div>
        `;

        this.modalStats.innerHTML = statRows + totalRow;

        // Visuals background
        const primaryType = pokemon.types[0];
        this.modalVisuals.style.background = `radial-gradient(circle at center, var(--type-${primaryType}) 0%, transparent 70%)`;

        this.modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    renderEvolutionChain(branches) {
        if (!branches || branches.length === 0) {
            this.modalEvolutions.innerHTML = '<p style="color: var(--clr-text-muted);">No evolution data.</p>';
            return;
        }

        // Each branch is a complete evolution path (array of pokemon)
        let html = '';
        branches.forEach((branch, branchIndex) => {
            html += `<div style="display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.75rem; flex-wrap: wrap; justify-content: center;">`;

            branch.forEach((evo, index) => {
                // Add arrow with method before each evolution (except first)
                if (index > 0) {
                    html += `
                        <div style="display: flex; flex-direction: column; align-items: center; margin: 0 0.25rem;">
                            <i class="fa-solid fa-arrow-right" style="font-size: 1rem; color: var(--clr-text-muted);"></i>
                            ${evo.method ? `<span style="font-size: 0.65rem; color: var(--clr-accent); text-align: center; max-width: 65px;">${evo.method}</span>` : ''}
                        </div>
                    `;
                }

                html += `
                    <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                        <img src="${evo.image}" alt="${evo.name}" style="width: 50px; height: 50px; object-fit: contain;" loading="lazy">
                        <span style="font-size: 0.7rem; text-transform: capitalize; color: var(--clr-text-main);">${evo.name}</span>
                    </div>
                `;
            });

            html += `</div>`;
        });

        this.modalEvolutions.innerHTML = html;
    }

    closeModal() {
        this.modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    formatStatName(name) {
        // hp, attack, defense, special-attack, special-defense, speed
        const map = {
            'hp': 'HP',
            'attack': 'ATK',
            'defense': 'DEF',
            'special-attack': 'SpA',
            'special-defense': 'SpD',
            'speed': 'SPD'
        };
        return map[name] || name;
    }

    renderForms(forms) {
        this.currentForms = forms;

        if (!forms || forms.length <= 1) {
            // Only one form (or none), hide the tabs
            this.modalForms.innerHTML = '';
            return;
        }

        let html = '';
        forms.forEach((form, index) => {
            const isActive = index === 0 ? 'background: var(--clr-accent); color: #000;' : 'background: rgba(255,255,255,0.1); color: var(--clr-text-main);';
            html += `
                <button class="form-tab" data-form-index="${index}" 
                    style="padding: 0.4rem 0.8rem; border: none; border-radius: 20px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: all 0.2s; ${isActive}">
                    ${form.name}
                </button>
            `;
        });

        this.modalForms.innerHTML = html;

        // Add click listeners - use arrow function to preserve 'this' context
        const self = this;
        this.modalForms.querySelectorAll('.form-tab').forEach(btn => {
            btn.onclick = function () {
                const idx = parseInt(this.getAttribute('data-form-index'));
                console.log('Switching to form index:', idx);
                self.switchToForm(idx);
            };
        });
    }

    switchToForm(index) {
        const form = this.currentForms[index];
        console.log('switchToForm called with index:', index, 'form:', form);
        if (!form) {
            console.log('No form found at index', index);
            return;
        }

        // Update active tab styling
        this.modalForms.querySelectorAll('.form-tab').forEach((btn, i) => {
            if (i === index) {
                btn.style.background = 'var(--clr-accent)';
                btn.style.color = '#000';
            } else {
                btn.style.background = 'rgba(255,255,255,0.1)';
                btn.style.color = 'var(--clr-text-main)';
            }
        });

        // Update image
        console.log('Setting image to:', form.image);
        document.getElementById('modal-img').src = form.image;

        // Update types
        this.modalTypes.innerHTML = form.types.map(type =>
            `<span class="type-badge" style="background-color: var(--type-${type}); color: white; padding: 0.5rem 1.2rem; font-size: 1rem;">${type}</span>`
        ).join('');

        // Update stats
        const bst = form.stats.reduce((sum, s) => sum + s.value, 0);
        const statRows = form.stats.map(stat => {
            const percentage = Math.min((stat.value / 255) * 100, 100);
            return `
                <div class="stat-row">
                    <span class="stat-name">${this.formatStatName(stat.name)}</span>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-fill" style="width: ${percentage}%; background-color: var(--type-${form.types[0]})"></div>
                    </div>
                    <span style="font-weight: bold; width: 30px; text-align: right;">${stat.value}</span>
                </div>
            `;
        }).join('');

        const totalRow = `
            <div class="stat-row" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--glass-border);">
                <span class="stat-name" style="color: var(--clr-accent);">TOT</span>
                <div class="stat-bar-bg" style="visibility: hidden;"></div>
                <span style="font-weight: bold; width: 30px; text-align: right; color: var(--clr-accent);">${bst}</span>
            </div>
        `;

        this.modalStats.innerHTML = statRows + totalRow;

        // Update visuals background
        const primaryType = form.types[0];
        this.modalVisuals.style.background = `radial-gradient(circle at center, var(--type-${primaryType}) 0%, transparent 70%)`;

        // Fetch and update evolution chain for this form
        if (this.api && form.pokemonId) {
            this.modalEvolutions.innerHTML = '<p style="color: var(--clr-text-muted);">Loading evolutions...</p>';

            // Detect region from form name
            let region = null;
            const formNameLower = form.fullName ? form.fullName.toLowerCase() : '';
            if (formNameLower.includes('-galar')) region = 'galar';
            else if (formNameLower.includes('-alola')) region = 'alola';
            else if (formNameLower.includes('-hisui')) region = 'hisui';
            else if (formNameLower.includes('-paldea')) region = 'paldea';

            this.api.getEvolutionChain(form.pokemonId, region).then(evoChain => {
                this.renderEvolutionChain(evoChain);
            }).catch(() => {
                this.modalEvolutions.innerHTML = '<p style="color: var(--clr-text-muted);">Evolution data unavailable.</p>';
            });
        }
    }

    setApi(api) {
        this.api = api;
    }
}
