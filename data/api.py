from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from typing import List, Optional
import math
from datetime import datetime
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import nltk
from pydantic import BaseModel

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')

app = FastAPI(title="Game Search API")

# Configure CORS with more specific settings
origins = [
    "http://localhost:3000",      # React development server
    "http://127.0.0.1:3000",
    "http://localhost:5000",      # Production build
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# MongoDB connection
try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['game_search_engine']
    # Test the connection
    client.server_info()
except Exception as e:
    print(f"Failed to connect to MongoDB: {str(e)}")
    raise HTTPException(status_code=500, detail="Database connection failed")

# Models


class PlatformResponse(BaseModel):
    id: Optional[int]
    name: str
    slug: Optional[str]
    released_at: Optional[str]
    requirements: Optional[dict]


class GameResponse(BaseModel):
    id: int
    name: str
    description: str
    released: Optional[str]
    rating: Optional[float]
    background_image: Optional[str]
    platforms: List[PlatformResponse]
    genres: List[str]
    metacritic: Optional[int]
    relevance_score: float
    matched_terms: List[str]


class SearchEngine:
    def __init__(self):
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))

    def normalize_text(self, text: str) -> List[str]:
        text = text.lower()
        tokens = word_tokenize(text)
        return [self.stemmer.stem(token) for token in tokens if token not in self.stop_words]

    async def search(self, query: str, platform: Optional[str] = None,
                     genre: Optional[str] = None, min_rating: Optional[float] = None,
                     sort_by: str = "relevance") -> List[GameResponse]:
        if not query:
            return []

        # Pipeline stages for MongoDB aggregation
        pipeline = []

        # Match stage to find documents containing any query term
        pipeline.append({
            '$match': {
                'term': {'$in': query.lower().split()}
            }
        })

        # Unwind game references to work with individual game entries
        pipeline.append({'$unwind': '$game_refs'})

        # Group by game_id to combine scores from different terms
        pipeline.append({
            '$group': {
                '_id': '$game_refs.game_id',
                'total_score': {'$sum': '$game_refs.tf_idf'},
                'matched_terms': {'$addToSet': '$term'}
            }
        })

        # Sort by total TF-IDF score
        pipeline.append({'$sort': {'total_score': -1}})

        # Get the ranked game IDs
        ranked_results = list(db.inverted_index.aggregate(pipeline))

        if not ranked_results:
            return []

        # Get game IDs in ranked order
        game_ids = [result['_id'] for result in ranked_results]

        # Build MongoDB query for filtering
        query_filter = {"game_id": {"$in": game_ids}}
        
        if platform:
            query_filter["platforms.name"] = platform
        if genre:
            query_filter["genres"] = genre
        if min_rating:
            query_filter["rating"] = {"$gte": min_rating}

        # Get games from database
        games = list(db.games.find(query_filter))
        
        # Create a mapping of game_id to score
        scores = {result['_id']: {
            'score': result['total_score'],
            'matched_terms': result['matched_terms']
        } for result in ranked_results}

        # Prepare response
        results = []
        for game in games:
            game_score = scores.get(game["game_id"], {'score': 0, 'matched_terms': []})
            
            try:
                # Convert platform data to PlatformResponse objects
                platform_responses = []
                for platform_data in game.get('platforms', []):
                    if isinstance(platform_data, dict):
                        try:
                            platform_responses.append(PlatformResponse(
                                id=platform_data.get('id'),
                                name=platform_data.get('name', 'Unknown Platform'),
                                slug=platform_data.get('slug'),
                                released_at=platform_data.get('released_at'),
                                requirements=platform_data.get('requirements', {})
                            ))
                        except Exception as e:
                            print(f"Error processing platform data: {str(e)}")
                            continue

                game_response = GameResponse(
                    id=game["game_id"],
                    name=game["name"],
                    description=game.get("description", ""),
                    released=game["released"].strftime("%Y-%m-%d") if game.get("released") else None,
                    rating=game.get("rating"),
                    background_image=game.get("background_image"),
                    platforms=platform_responses,  # Use the processed platform responses
                    genres=game.get("genres", []),
                    metacritic=game.get("metacritic"),
                    relevance_score=game_score['score'],
                    matched_terms=list(game_score['matched_terms'])
                )
                results.append(game_response)
            except Exception as e:
                print(f"Error creating game response for game {game.get('game_id')}: {str(e)}")
                continue

        # Sort results based on the specified criteria
        if sort_by == "rating":
            results.sort(key=lambda x: x.rating or 0, reverse=True)
        elif sort_by == "release_date":
            results.sort(key=lambda x: x.released or "", reverse=True)
        else:  # sort by relevance (TF-IDF score)
            results.sort(key=lambda x: x.relevance_score or 0, reverse=True)

        return results


# Initialize search engine
search_engine = SearchEngine()

# API endpoints


@app.get("/search/", response_model=List[GameResponse])
async def search_games(
    q: str = Query(..., min_length=1),
    platform: Optional[str] = None,
    genre: Optional[str] = None,
    min_rating: Optional[float] = None,
    sort_by: str = Query("relevance", enum=[
                         "relevance", "rating", "release_date"])
):
    return await search_engine.search(q, platform, genre, min_rating, sort_by)


@app.get("/platforms/")
async def get_platforms():
    try:
        # Get unique platforms from the database
        platforms = db.games.distinct("platforms.name")
        return JSONResponse(
            content={"platforms": sorted(filter(None, platforms))},
            headers={
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/genres/")
async def get_genres():
    try:
        # Get unique genres from the database
        genres = db.games.distinct("genres")
        return JSONResponse(
            content={"genres": sorted(filter(None, genres))},
            headers={
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/game/{game_id}")
async def get_game(game_id: int):
    try:
        game = db.games.find_one({"game_id": game_id})
        if game:
            game["_id"] = str(game["_id"])  # Convert ObjectId to string
            if game.get("released"):
                game["released"] = game["released"].strftime("%Y-%m-%d")
            return JSONResponse(
                content=game,
                headers={
                    "Access-Control-Allow-Origin": "http://localhost:3000",
                    "Access-Control-Allow-Credentials": "true",
                }
            )
        raise HTTPException(status_code=404, detail="Game not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
