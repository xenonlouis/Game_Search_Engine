from pymongo import MongoClient
import json
from datetime import datetime
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import math

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')


class GameDataProcessor:
    def __init__(self):
        # MongoDB connection
        self.client = MongoClient('mongodb://localhost:27017/')
        self.db = self.client['game_search_engine']
        self.games_collection = self.db['games']
        self.inverted_index = self.db['inverted_index']
        self.collection_stats = self.db['collection_stats']

        # Text processing tools
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))

        # Field weights for different types of content
        self.field_weights = {
            'name': 2.0,      # Game names are most important
            'description': 1.5,  # Description has high weight but less than name
            'tag': 1.0,       # Tags have normal weight
            'genre': 1.0,     # Genres have normal weight
            'platform': 0.8   # Platforms have slightly lower weight
        }

        # Batch size for processing
        self.batch_size = 100

    def normalize_text(self, text):
        if not text:
            return []
        # Convert to lowercase
        text = text.lower()
        # Remove special characters but keep hyphens for compound words
        text = re.sub(r'[^a-zA-Z0-9\s-]', '', text)
        # Replace hyphens with spaces to handle hyphenated words
        text = text.replace('-', ' ')
        # Tokenize
        tokens = word_tokenize(text)
        # Remove stop words and stem
        normalized_tokens = []
        for token in tokens:
            if token not in self.stop_words:
                # Add both original and stemmed versions for better matching
                stemmed = self.stemmer.stem(token)
                if len(token) > 3:  # Only add original if it's not too short
                    normalized_tokens.append(token)
                normalized_tokens.append(stemmed)
                
                # Handle common gaming plural/singular variations
                if token.endswith('s'):
                    singular = token[:-1]
                    if len(singular) > 3:
                        normalized_tokens.append(singular)
                        normalized_tokens.append(self.stemmer.stem(singular))
                else:
                    plural = token + 's'
                    normalized_tokens.append(plural)
                    normalized_tokens.append(self.stemmer.stem(plural))
        
        return list(set(normalized_tokens))  # Remove duplicates

    def calculate_tf_idf(self, tf, df, total_docs):
        """
        Calculate TF-IDF score
        tf: term frequency in the document
        df: document frequency (number of documents containing the term)
        total_docs: total number of documents in collection
        """
        if df == 0 or total_docs == 0:
            return 0.0
        
        # Calculate TF using log normalization
        tf_score = 1 + math.log(tf) if tf > 0 else 0
        
        # Calculate IDF using smooth IDF formula
        idf_score = math.log(1 + (total_docs / df))
        
        return tf_score * idf_score

    def create_inverted_index(self, game_id, text, field):
        tokens = self.normalize_text(text)
        doc_length = len(tokens)

        # Count term frequency
        term_freq = {}
        for position, token in enumerate(tokens):
            if token not in term_freq:
                term_freq[token] = {
                    'count': 1,
                    'positions': [position]
                }
            else:
                term_freq[token]['count'] += 1
                term_freq[token]['positions'].append(position)

        # Calculate field weight
        field_weight = self.field_weights.get(field, 1.0)

        # Get total number of documents
        total_docs = self.games_collection.count_documents({})

        # Update inverted index with tf-idf scores
        for token, data in term_freq.items():
            # Get current document frequency
            term_doc = self.inverted_index.find_one({'term': token}) or {'game_refs': []}
            df = len(term_doc['game_refs'])
            
            # Calculate TF-IDF score
            tf_idf = self.calculate_tf_idf(data['count'], df, total_docs)
            
            # Apply field weight to tf-idf
            weighted_score = tf_idf * field_weight

            self.inverted_index.update_one(
                {'term': token},
                {
                    '$push': {
                        'game_refs': {
                            'game_id': game_id,
                            'field': field,
                            'tf': data['count'],
                            'tf_idf': weighted_score,
                            'positions': data['positions'],
                            'doc_length': doc_length
                        }
                    },
                    '$inc': {
                        'total_occurrences': data['count'],
                        'document_frequency': 1
                    }
                },
                upsert=True
            )

    def update_tf_idf_scores(self):
        """
        Update TF-IDF scores for all terms in the inverted index
        This should be called after all documents are processed
        """
        total_docs = self.games_collection.count_documents({})
        
        # Update all documents in inverted index
        for term_doc in self.inverted_index.find():
            df = len(term_doc['game_refs'])
            
            # Update each game reference
            for ref in term_doc['game_refs']:
                tf = ref['tf']
                field_weight = self.field_weights.get(ref['field'], 1.0)
                tf_idf = self.calculate_tf_idf(tf, df, total_docs) * field_weight
                
                self.inverted_index.update_one(
                    {
                        'term': term_doc['term'],
                        'game_refs.game_id': ref['game_id']
                    },
                    {
                        '$set': {
                            'game_refs.$.tf_idf': tf_idf
                        }
                    }
                )

    def generate_description(self, game_data):
        """
        Generate a description for a game using available metadata
        """
        try:
            name = game_data.get('name', '')
            genres = [g.get('name', '') for g in game_data.get('genres', []) if g and isinstance(g, dict)]
            tags = [t.get('name', '') for t in game_data.get('tags', []) if t and isinstance(t, dict)]
            platforms = [
                p.get('platform', {}).get('name', '')
                for p in game_data.get('platforms', [])
                if p and isinstance(p, dict) and p.get('platform')
            ]
            rating = game_data.get('rating', 0)
            metacritic = game_data.get('metacritic', 0)
            released = game_data.get('released', '')

            # Filter out empty strings
            genres = [g for g in genres if g]
            tags = [t for t in tags if t]
            platforms = [p for p in platforms if p]

            # Start with the game name and basic info
            description_parts = []
            if genres:
                description_parts.append(f"{name} is a {' and '.join(genres[:2])} game")
            else:
                description_parts.append(f"{name} is a game")
            
            # Add release info
            if released:
                description_parts.append(f"released on {released}")
            
            # Add platforms
            if platforms:
                platform_text = f"available on {', '.join(platforms[:3])}"
                if len(platforms) > 3:
                    platform_text += f" and {len(platforms) - 3} other platforms"
                description_parts.append(platform_text)
            
            # First sentence
            description = ' '.join(description_parts) + '.'
            
            # Add rating info
            rating_parts = []
            if rating > 0:
                rating_parts.append(f"The game has received a user rating of {rating:.1f}/5")
            if metacritic:
                rating_parts.append(f"and a Metacritic score of {metacritic}")
            if rating_parts:
                description += ' ' + ' '.join(rating_parts) + '.'
            
            # Add gameplay elements from tags
            if tags:
                gameplay_tags = tags[:5]  # Use up to 5 most relevant tags
                description += f" The gameplay features {', '.join(gameplay_tags[:-1])}"
                if len(gameplay_tags) > 1:
                    description += f" and {gameplay_tags[-1]}"
                description += "."
            
            return description
            
        except Exception as e:
            print(f"Error generating description: {str(e)}")
            return f"{game_data.get('name', 'Unknown Game')} is a video game."  # Fallback description

    def process_game(self, game_data):
        """Process a game entry with safe handling of missing or None values"""
        try:
            if not game_data:
                print("Skipping empty game data")
                return None

            # Generate description first
            description = self.generate_description(game_data)

            # Helper function to safely get nested values
            def safe_get(obj, *keys):
                for key in keys:
                    if not isinstance(obj, dict):
                        return None
                    obj = obj.get(key)
                return obj

            # Process platforms data
            platforms = []
            for platform_data in game_data.get('platforms', []):
                if not isinstance(platform_data, dict):
                    continue
                    
                platform = platform_data.get('platform', {})
                if not isinstance(platform, dict):
                    continue

                platforms.append({
                    'id': platform.get('id'),
                    'name': platform.get('name', 'Unknown Platform'),
                    'slug': platform.get('slug', ''),
                    'released_at': platform_data.get('released_at'),
                    'requirements': {
                        'minimum': safe_get(platform_data, 'requirements_en', 'minimum'),
                        'recommended': safe_get(platform_data, 'requirements_en', 'recommended')
                    }
                })

            # Create comprehensive game document
            game_doc = {
                'game_id': game_data.get('id'),
                'slug': game_data.get('slug', ''),
                'name': game_data.get('name', 'Unknown Game'),
                'description': description,
                'released': datetime.strptime(game_data['released'], '%Y-%m-%d') if game_data.get('released') else None,
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
                
                # Simplified platform structure
                'platforms': platforms,
                
                # Parent platforms with safe handling
                'parent_platforms': [
                    safe_get(p, 'platform', 'name')
                    for p in game_data.get('parent_platforms', [])
                    if p and isinstance(p, dict) and p.get('platform')
                ],
                
                # Genre information with safe handling
                'genres': [
                    genre.get('name', 'Unknown Genre')
                    for genre in game_data.get('genres', [])
                    if genre and isinstance(genre, dict)
                ],
                
                # Store information with safe handling
                'stores': [
                    {
                        'store_name': safe_get(store, 'store', 'name', 'Unknown Store'),
                        'store_slug': safe_get(store, 'store', 'slug', ''),
                        'url': safe_get(store, 'store', 'domain', '')
                    }
                    for store in game_data.get('stores', [])
                    if store and isinstance(store, dict) and store.get('store')
                ],
                
                # Tags with safe handling
                'tags': [
                    {
                        'name': tag.get('name', 'Unknown Tag'),
                        'slug': tag.get('slug', ''),
                        'language': tag.get('language', 'en'),
                        'games_count': tag.get('games_count', 0)
                    }
                    for tag in game_data.get('tags', [])
                    if tag and isinstance(tag, dict)
                ],
                
                # ESRB rating with safe handling
                'esrb_rating': safe_get(game_data, 'esrb_rating', 'name'),
                
                # Screenshots with safe handling
                'screenshots': [
                    screenshot.get('image')
                    for screenshot in game_data.get('short_screenshots', [])
                    if screenshot and isinstance(screenshot, dict) and screenshot.get('image')
                ],
                
                # Search optimization fields
                'normalized_name': ' '.join(self.normalize_text(game_data.get('name', ''))),
                'search_terms': self.generate_search_terms(game_data)
            }
            
            # Remove None values from the document
            game_doc = {k: v for k, v in game_doc.items() if v is not None}
            
            return game_doc
            
        except Exception as e:
            print(f"Error processing game {game_data.get('id', 'unknown')}: {str(e)}")
            return None

    def generate_search_terms(self, game_data):
        """Generate searchable terms from various game fields with safe handling"""
        try:
            search_terms = []
            
            # Add name variations
            if game_data.get('name'):
                search_terms.extend(self.normalize_text(game_data['name']))
            
            # Add genres
            for genre in game_data.get('genres', []):
                if genre and isinstance(genre, dict) and genre.get('name'):
                    search_terms.extend(self.normalize_text(genre['name']))
            
            # Add tags
            for tag in game_data.get('tags', []):
                if tag and isinstance(tag, dict) and tag.get('name'):
                    search_terms.extend(self.normalize_text(tag['name']))
            
            # Add platforms
            for platform in game_data.get('platforms', []):
                if platform and isinstance(platform, dict) and platform.get('platform', {}).get('name'):
                    search_terms.extend(self.normalize_text(platform['platform']['name']))
            
            return list(set(search_terms))  # Remove duplicates
            
        except Exception as e:
            print(f"Error generating search terms: {str(e)}")
            return []

    def process_game_batch(self, games_batch):
        game_docs = []
        for game_data in games_batch:
            game_doc = self.process_game(game_data)
            if game_doc:
                game_docs.append(game_doc)
                
                # Create inverted index for searchable fields
                self.create_inverted_index(game_data['id'], game_data['name'], 'name')
                
                # Create inverted index for description
                self.create_inverted_index(game_data['id'], game_doc['description'], 'description')

                # Create inverted index for tags
                for tag in game_data.get('tags', []):
                    self.create_inverted_index(game_data['id'], tag['name'], 'tag')

                # Create inverted index for genres
                for genre in game_data.get('genres', []):
                    self.create_inverted_index(game_data['id'], genre['name'], 'genre')

                # Create inverted index for platforms
                for platform in game_data.get('platforms', []):
                    self.create_inverted_index(game_data['id'], platform['platform']['name'], 'platform')

        if game_docs:
            self.games_collection.insert_many(game_docs)

    def cleanup_database(self):
        """
        Clean up the database by removing old collections and their indexes
        """
        try:
            print("Starting database cleanup...")
            
            # List of collections to clean
            collections_to_clean = [
                self.games_collection,
                self.inverted_index,
                self.collection_stats
            ]
            
            # Drop each collection
            for collection in collections_to_clean:
                try:
                    collection.drop()
                    print(f"Dropped collection: {collection.name}")
                except Exception as e:
                    print(f"Error dropping collection {collection.name}: {str(e)}")
            
            print("Database cleanup completed successfully!")
            
        except Exception as e:
            print(f"Error during database cleanup: {str(e)}")

    def process_json_file(self, file_path):
        try:
            # Clean up old collections first
            self.cleanup_database()

            # Create new collections and indexes
            self.games_collection = self.db['games']
            self.inverted_index = self.db['inverted_index']
            self.collection_stats = self.db['collection_stats']

            # Create indexes
            self.games_collection.create_index('game_id', unique=True)
            self.games_collection.create_index('normalized_name')
            self.inverted_index.create_index('term')
            self.inverted_index.create_index([('game_refs.game_id', 1)])
            self.inverted_index.create_index([('game_refs.tf_idf', -1)])

            # Process the JSON file in batches
            with open(file_path, 'r', encoding='utf-8') as file:
                games_data = json.load(file)
                total_games = len(games_data)
                
                for i in range(0, total_games, self.batch_size):
                    batch = games_data[i:i + self.batch_size]
                    self.process_game_batch(batch)
                    print(f"Processed {min(i + self.batch_size, total_games)}/{total_games} games")

            # Update TF-IDF scores after all documents are processed
            print("Updating TF-IDF scores...")
            self.update_tf_idf_scores()
            print("TF-IDF scores updated successfully!")
            
            # Store collection statistics
            self.collection_stats.insert_one({
                'timestamp': datetime.now(),
                'total_games': total_games,
                'total_terms': self.inverted_index.count_documents({}),
                'avg_terms_per_game': self.inverted_index.aggregate([
                    {'$unwind': '$game_refs'},
                    {'$group': {'_id': None, 'avg': {'$avg': '$game_refs.tf'}}}
                ]).next()['avg']
            })
            
            print("Data processing completed successfully!")
            
        except FileNotFoundError:
            print(f"Error: JSON file not found at {file_path}")
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON format in file {file_path}")
        except Exception as e:
            print(f"Error processing JSON file: {str(e)}")
        finally:
            # Ensure indexes are created even if processing fails
            self.games_collection.create_index('game_id', unique=True)
            self.games_collection.create_index('normalized_name')
            self.inverted_index.create_index('term')
            self.inverted_index.create_index([('game_refs.game_id', 1)])
            self.inverted_index.create_index([('game_refs.tf_idf', -1)])


def main():
    processor = GameDataProcessor()
    processor.process_json_file('./data/games_1000.json')
    print("Data processing completed!")


if __name__ == "__main__":
    main()
