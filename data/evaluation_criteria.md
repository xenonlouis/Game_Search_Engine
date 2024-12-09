# Search Engine Evaluation Criteria

## Query 1: "action rpg 2023"
**Description:** Tests the engine's ability to filter by both genre and release year
**Expected Results (in order):**
1. Sea of Stars
   - Must be released in 2023
   - Must have RPG elements
   - Should have action elements or real-time combat

**Ranking Criteria:**
- Release date in 2023 (+2 points)
- RPG genre tag (+2 points)
- Action genre tag (+1 point)
- Rating above 4.0 (+1 point)
- Metacritic score above 85 (+1 point)

## Query 2: "nintendo switch exclusive"
**Description:** Tests platform-specific filtering and exclusive content identification
**Expected Results (in order):**
1. The Legend of Zelda: Tears of the Kingdom
2. Super Mario Bros. Wonder
3. Pikmin 4
4. Fire Emblem Engage
5. Bayonetta 3

**Ranking Criteria:**
- Nintendo Switch as only platform (+3 points)
- Released in 2022-2023 (+2 points)
- Has "exclusive" tag (+2 points)
- Metacritic score above 85 (+1 point)
- Rating above 4.0 (+1 point)

## Query 3: "high rated racing games"
**Description:** Tests combination of genre filtering and rating-based sorting
**Expected Results (in order):**
1. Forza Horizon 5 (Highest rated, open world)
2. Gran Turismo 7 (Simulation focused)
3. F1 23 (Latest F1 title)
4. Need for Speed Unbound
5. Hot Wheels Unleashed

**Ranking Criteria:**
- Racing genre tag (+2 points)
- User rating above 4.0 (+2 points)
- Metacritic score above 80 (+2 points)
- Released in last 3 years (+1 point)
- Has multiplayer features (+1 point)

## Query 4: "indie roguelike"
**Description:** Tests specific genre combination and indie game identification
**Expected Results (in order):**
1. Hades
2. Enter the Gungeon
3. Rogue Legacy 2
4. Vampire Survivors

**Ranking Criteria:**
- Has "roguelike" or "roguelite" tag (+3 points)
- Indie genre tag (+2 points)
- Rating above 4.0 (+2 points)
- Procedural generation features (+1 point)
- Pixel art style (+1 point)

## Query 5: "open world adventure"
**Description:** Tests semantic understanding of game features and genre combinations
**Expected Results (in order):**
1. The Legend of Zelda: Tears of the Kingdom
2. Red Dead Redemption 2
3. Elden Ring
4. Horizon Forbidden West
5. Marvel's Spider-Man 2

**Ranking Criteria:**
- "Open World" tag (+3 points)
- Adventure genre (+2 points)
- World size and exploration features (+2 points)
- Rating above 4.0 (+1 point)
- Released in last 3 years (+1 point)

## Overall Evaluation Metrics

### Precision
- Perfect match with expected order: 1.0
- All expected games present but wrong order: 0.8
- Some expected games missing: (matches / expected_count)

### Recall
- All relevant games found: 1.0
- Missing relevant games: (found / total_relevant)

### Ranking Accuracy
- Correct order of first 3 results: +0.3
- Correct order of all results: +0.2
- No irrelevant results in top 5: +0.2
- Relevant but unexpected results in correct position: +0.1

### Response Time
- Under 100ms: Excellent
- 100-300ms: Good
- 300-500ms: Acceptable
- Over 500ms: Needs optimization

## Additional Considerations
1. **Genre Accuracy:**
   - Primary genre must match
   - Secondary genres should be relevant
   - Genre tags should be consistent

2. **Release Date Relevance:**
   - Recent games should be prioritized
   - Historic titles should only appear if highly relevant

3. **Platform Compatibility:**
   - Platform-specific queries must be accurate
   - Multi-platform availability should be clearly indicated

4. **Rating Influence:**
   - Higher rated games should generally rank better
   - Both user ratings and metacritic scores considered

5. **Content Relevance:**
   - Game description should match query terms
   - Tags should align with search intent
   - Screenshots and media should be relevant 