import asyncio
import aiohttp
import json
from datetime import datetime

API_KEY = "14c15b22b0644fbea8a2661465017610"

# List of games we want
GAMES = [
    # Action RPG 2023
    "Sea of Stars",
    "Lies of P",
    "Diablo IV",
    "Final Fantasy 16",
    "Octopath Traveler II",
    
    # Nintendo Switch Exclusive
    "The Legend of Zelda: Tears of the Kingdom",
    "Super Mario Bros. Wonder",
    "Pikmin 4",
    "Fire Emblem Engage",
    "Bayonetta 3",
    
    # Racing Games
    "Forza Horizon 5",
    "Gran Turismo 7",
    "F1 23",
    "Need for Speed Unbound",
    "Hot Wheels Unleashed",
    
    # Indie Roguelike
    "Hades",
    "Dead Cells",
    "Enter the Gungeon",
    "Rogue Legacy 2",
    "Vampire Survivors",
    
    # Open World Adventure
    "Red Dead Redemption 2",
    "Elden Ring",
    "Horizon Forbidden West",
    "Marvel's Spider-Man 2"
]

def safe_get(obj, *keys):
    """Safely get nested dictionary values"""
    for key in keys:
        if not isinstance(obj, dict):
            return None
        obj = obj.get(key)
    return obj

async def fetch_game(session: aiohttp.ClientSession, game_name: str):
    """Fetch a single game's data from RAWG"""
    try:
        # Search for the game
        search_url = "https://api.rawg.io/api/games"
        search_params = {
            'key': str(API_KEY),
            'search': str(game_name),
            'search_exact': 'true',
            'page_size': '1'
        }
        
        async with session.get(search_url, params=search_params) as response:
            search_data = await response.json()
            if not search_data.get('results'):
                print(f"Game not found: {game_name}")
                return None
            
            game_id = search_data['results'][0]['id']
            
            # Get detailed game data
            details_url = f"https://api.rawg.io/api/games/{game_id}"
            params = {'key': str(API_KEY)}
            
            async with session.get(details_url, params=params) as response:
                game_data = await response.json()
                
                # Process platforms data
                platforms = []
                for platform_data in game_data.get('platforms', []):
                    if isinstance(platform_data, dict) and platform_data.get('platform'):
                        platforms.append({
                            'platform': {
                                'id': safe_get(platform_data, 'platform', 'id'),
                                'name': safe_get(platform_data, 'platform', 'name'),
                                'slug': safe_get(platform_data, 'platform', 'slug')
                            },
                            'released_at': platform_data.get('released_at'),
                            'requirements_en': platform_data.get('requirements_en'),
                            'requirements_ru': platform_data.get('requirements_ru')
                        })
                
                # Create game document with exact structure
                return {
                    'id': game_data.get('id'),
                    'slug': game_data.get('slug', ''),
                    'name': game_data.get('name', 'Unknown Game'),
                    'released': game_data.get('released'),
                    'tba': game_data.get('tba', False),
                    'background_image': game_data.get('background_image'),
                    'rating': game_data.get('rating'),
                    'rating_top': game_data.get('rating_top'),
                    'ratings': game_data.get('ratings', []),
                    'ratings_count': game_data.get('ratings_count', 0),
                    'reviews_text_count': game_data.get('reviews_text_count', 0),
                    'added': game_data.get('added', 0),
                    'added_by_status': game_data.get('added_by_status', {}),
                    'metacritic': game_data.get('metacritic'),
                    'playtime': game_data.get('playtime', 0),
                    'suggestions_count': game_data.get('suggestions_count', 0),
                    'updated': game_data.get('updated'),
                    'reviews_count': game_data.get('reviews_count', 0),
                    'saturated_color': game_data.get('saturated_color'),
                    'dominant_color': game_data.get('dominant_color'),
                    'platforms': platforms,
                    'parent_platforms': game_data.get('parent_platforms', []),
                    'genres': game_data.get('genres', []),
                    'stores': game_data.get('stores', []),
                    'tags': game_data.get('tags', []),
                    'esrb_rating': game_data.get('esrb_rating'),
                    'short_screenshots': game_data.get('short_screenshots', [])
                }
                
    except Exception as e:
        print(f"Error fetching {game_name}: {str(e)}")
        return None

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_game(session, game) for game in GAMES]
        results = []
        
        # Fetch in batches of 5 to avoid rate limits
        for i in range(0, len(tasks), 5):
            batch = tasks[i:i+5]
            batch_results = await asyncio.gather(*batch)
            results.extend([r for r in batch_results if r])
            await asyncio.sleep(1)  # Rate limiting
        
        # Save results
        with open('data/rawg_games.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully fetched {len(results)} games")
        print(f"Missing games: {len(GAMES) - len(results)}")

if __name__ == "__main__":
    asyncio.run(main()) 