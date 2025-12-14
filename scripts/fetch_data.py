import requests
import json
import time

# Function to fetch data for a single Pokemon
def fetch_pokemon_data(id):
    try:
        url = f"https://pokeapi.co/api/v2/pokemon/{id}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            
            # Minimize data to keep file size reasonable
            # We need: id, name, types, stats, height, weight, abilities, sprites (front_default), species-url
            
            # Fetch species for flavor text and evolution url
            species_url = data['species']['url']
            species_res = requests.get(species_url)
            species_data = species_res.json() if species_res.status_code == 200 else {}
            
            flavor_text = "No description."
            if 'flavor_text_entries' in species_data:
                for entry in species_data['flavor_text_entries']:
                    if entry['language']['name'] == 'en':
                        flavor_text = entry['flavor_text'].replace('\n', ' ').replace('\f', ' ')
                        break
            
            # Evolution Chain URL
            evo_url = species_data.get('evolution_chain', {}).get('url')
            
            # Simplified Object
            pokemon = {
                'id': data['id'],
                'name': data['name'],
                'types': data['types'],
                'stats': data['stats'],
                'height': data['height'],
                'weight': data['weight'],
                'abilities': data['abilities'],
                'sprites': {
                    'front_default': data['sprites']['front_default'],
                    'other': {
                        'official-artwork': {
                            'front_default': data['sprites']['other']['official-artwork']['front_default']
                        }
                    }
                },
                'flavor_text': flavor_text,
                'evolution_chain_url': evo_url
            }
            return pokemon
        else:
            print(f"Failed to fetch {id}")
            return None
    except Exception as e:
        print(f"Error fetching {id}: {e}")
        return None

# Evolution Chains Cache to avoid re-fetching same chain multiple times
evo_cache = {}

def fetch_evolution_chain(url):
    if not url: return None
    if url in evo_cache: return evo_cache[url]
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            evo_cache[url] = data
            return data
    except:
        return None
    return None

def main():
    print("Starting download for Gen 1-3 (386 Pokemon)...")
    all_data = []
    
    # Gen 1-3 Range: 1 to 386
    # For testing, let's do 1 to 386. 
    # Use ThreadPoolExecutor? No, simple loop to be safe with rate limits or just simple requests.
    # It might take a minute.
    
    for i in range(1, 387):
        print(f"Fetching {i}/386...")
        p_data = fetch_pokemon_data(i)
        if p_data:
            # Pre-fetch evolution chain if we can? 
            # Actually, let's NOT embed the chain in every pokemon object, that duplicates data massively.
            # Instead, we should just let the app logic try to find evolutions or maybe download unique chains.
            # BUT, to be truly offline, we need the chains.
            # Let's add a separate object for "evolution_chains" in the JS file.
            
            if p_data['evolution_chain_url']:
                fetch_evolution_chain(p_data['evolution_chain_url'])
            
            all_data.append(p_data)
        
        # Be nice to API?
        # time.sleep(0.05) 

    # Prepare JS output
    # We will output: window.POKEMON_DATA = [...]; window.EVOLUTION_CHAINS = {...};
    
    js_content = "window.POKEMON_DATA = " + json.dumps(all_data) + ";\n"
    js_content += "window.EVOLUTION_CHAINS = " + json.dumps(evo_cache) + ";\n"
    
    with open('js/pokedex-data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print("Done! Saved to js/pokedex-data.js")

if __name__ == "__main__":
    main()
