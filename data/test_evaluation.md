# Search Engine Evaluation Plan

## Test Queries and Expected Outcomes

### 1. "action rpg 2023"
**Purpose:** Test genre and year-specific search
**Expected Results:**
- Primary: Lies of P, Diablo IV, Final Fantasy XVI
- Secondary: Octopath Traveler II, Sea of Stars
**Success Metrics:**
- Should find recent (2023) games
- Must have both Action and RPG genres
- Should prioritize games with high ratings

### 2. "nintendo switch exclusive"
**Purpose:** Test platform-specific search
**Expected Results:**
- Primary: Zelda: Tears of the Kingdom, Super Mario Bros. Wonder
- Secondary: Pikmin 4, Fire Emblem Engage, Bayonetta 3
**Success Metrics:**
- Must only show Nintendo Switch games
- Should prioritize actual exclusives
- Should consider release date recency

### 3. "high rated racing games"
**Purpose:** Test rating-based filtering with genre
**Expected Results:**
- Primary: Forza Horizon 5, Gran Turismo 7
- Secondary: F1 23, Need for Speed Unbound, Hot Wheels Unleashed
**Success Metrics:**
- Must have Racing genre
- Should prioritize games with rating > 4.0
- Should consider metacritic scores

### 4. "indie roguelike"
**Purpose:** Test specific genre combination
**Expected Results:**
- Primary: Hades, Dead Cells
- Secondary: Enter the Gungeon, Rogue Legacy 2, Vampire Survivors
**Success Metrics:**
- Must include indie games
- Should identify roguelike mechanics
- Should consider user ratings

### 5. "open world adventure"
**Purpose:** Test descriptive keyword search
**Expected Results:**
- Primary: Zelda: TOTK, Red Dead Redemption 2
- Secondary: Elden Ring, Horizon Forbidden West, Spider-Man 2
**Success Metrics:**
- Should identify open-world games from description
- Must include Adventure genre
- Should prioritize highly rated games

## Evaluation Metrics

For each query, we'll calculate:
1. **Precision:** (relevant results) / (total results returned)
2. **Recall:** (relevant results found) / (total relevant results)
3. **F1-Score:** 2 * (precision * recall) / (precision + recall)

### Expected Minimum Performance
- Precision: ≥ 0.8 (80%)
- Recall: ≥ 0.7 (70%)
- F1-Score: ≥ 0.75 (75%)

## Test Dataset Composition
- Total Games: 50
- Genre Distribution:
  - Action/RPG: 15 games
  - Racing: 8 games
  - Adventure: 12 games
  - Indie: 10 games
  - Other: 5 games
- Platform Distribution:
  - Nintendo Switch: 10 games
  - PC: 15 games
  - PlayStation: 15 games
  - Xbox: 10 games 