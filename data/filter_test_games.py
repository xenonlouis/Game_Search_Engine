import json

# List of games we want to keep for testing
TARGET_GAMES = [
    # Action RPG 2023
    "Sea of Stars",
    "Lies of P",
    "Diablo IV",
    "Final Fantasy XVI",
    "Octopath Traveler II",
    
    # Nintendo Switch Exclusive
    "The Legend of Zelda: Tears of the Kingdom",
    "Super Mario Bros. Wonder",
    "Pikmin 4",
    "Fire Emblem Engage",
    "Bayonetta 3",
    
    # High Rated Racing
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
    "Marvel's Spider-Man 2",
    
    # Additional relevant games
    "God of War",
    "Baldur's Gate 3",
    "Cyberpunk 2077",
    "Resident Evil 4",
    "Star Wars Jedi: Survivor",
    "Street Fighter 6",
    "Monster Hunter Rise",
    "Persona 5 Royal",
    "It Takes Two",
    "Death Stranding",
    "Ghost of Tsushima",
    "Hollow Knight",
    "The Witcher 3: Wild Hunt",
    "Sekiro: Shadows Die Twice",
    "Celeste",
    "Stardew Valley",
    "Portal 2",
    "NieR: Automata",
    "Dark Souls III",
    "Monster Hunter: World",
    "Undertale",
    "The Last of Us",
    "Mass Effect Legendary Edition",
    "Final Fantasy VII Remake",
    "Bloodborne"
]

def filter_games():
    # Load the full dataset
    with open('data/games_1000.json', 'r', encoding='utf-8') as f:
        games_data = json.load(f)
    
    # Filter games
    filtered_games = []
    found_games = set()
    
    for game in games_data:
        if game['name'] in TARGET_GAMES:
            filtered_games.append(game)
            found_games.add(game['name'])
    
    # Create test dataset structure
    test_dataset = {
        "test_queries": [
            {
                "query": "action rpg 2023",
                "expected_results": [
                    "Sea of Stars",
                    "Lies of P",
                    "Diablo IV",
                    "Final Fantasy XVI",
                    "Octopath Traveler II"
                ]
            },
            {
                "query": "nintendo switch exclusive",
                "expected_results": [
                    "The Legend of Zelda: Tears of the Kingdom",
                    "Super Mario Bros. Wonder",
                    "Pikmin 4",
                    "Fire Emblem Engage",
                    "Bayonetta 3"
                ]
            },
            {
                "query": "high rated racing games",
                "expected_results": [
                    "Forza Horizon 5",
                    "Gran Turismo 7",
                    "F1 23",
                    "Need for Speed Unbound",
                    "Hot Wheels Unleashed"
                ]
            },
            {
                "query": "indie roguelike",
                "expected_results": [
                    "Hades",
                    "Dead Cells",
                    "Enter the Gungeon",
                    "Rogue Legacy 2",
                    "Vampire Survivors"
                ]
            },
            {
                "query": "open world adventure",
                "expected_results": [
                    "The Legend of Zelda: Tears of the Kingdom",
                    "Red Dead Redemption 2",
                    "Elden Ring",
                    "Horizon Forbidden West",
                    "Marvel's Spider-Man 2"
                ]
            }
        ],
        "games": filtered_games
    }
    
    # Save filtered dataset
    with open('data/games_50.json', 'w', encoding='utf-8') as f:
        json.dump(test_dataset, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully filtered {len(filtered_games)} games")
    
    # Print missing games
    missing_games = set(TARGET_GAMES) - found_games
    if missing_games:
        print("\nWarning: The following games were not found in the original dataset:")
        for game in missing_games:
            print(f"- {game}")

if __name__ == "__main__":
    filter_games() 