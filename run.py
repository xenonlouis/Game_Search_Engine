import uvicorn
import nltk
import sys
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionError
import time

def check_mongodb():
    """Check if MongoDB is running and accessible"""
    print("Checking MongoDB connection...")
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
    try:
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        db = client['game_search_engine']
        games_count = db.games.count_documents({})
        print(f"MongoDB connection successful! Found {games_count} games in database.")
        return True
    except ConnectionError:
        print("Error: Could not connect to MongoDB. Please make sure MongoDB is running on localhost:27017")
        return False

def download_nltk_data():
    """Download required NLTK data if not already present"""
    print("Checking NLTK data...")
    try:
        required_packages = ['punkt', 'stopwords']
        for package in required_packages:
            try:
                nltk.data.find(f'tokenizers/{package}')
                print(f"NLTK {package} already downloaded")
            except LookupError:
                print(f"Downloading NLTK {package}...")
                nltk.download(package, quiet=True)
        return True
    except Exception as e:
        print(f"Error downloading NLTK data: {str(e)}")
        return False

def check_data_files():
    """Check if necessary data files exist"""
    required_files = [
        ('data/mongo.py', 'MongoDB processor script'),
        ('data/api.py', 'API implementation'),
        ('requirements.txt', 'Dependencies file')
    ]
    
    all_present = True
    for file_path, description in required_files:
        if not os.path.exists(file_path):
            print(f"Error: Missing {description} at {file_path}")
            all_present = False
        else:
            print(f"Found {description} at {file_path}")
    
    return all_present

def main():
    """Main function to run the API"""
    print("Starting Game Search Engine API...")
    
    # Check all prerequisites
    checks = [
        ("Checking required files", check_data_files),
        ("Setting up NLTK", download_nltk_data),
        ("Connecting to MongoDB", check_mongodb)
    ]
    
    all_passed = True
    for message, check_func in checks:
        print(f"\n{message}...")
        try:
            if not check_func():
                all_passed = False
                break
        except Exception as e:
            print(f"Error during {message.lower()}: {str(e)}")
            all_passed = False
            break
    
    if not all_passed:
        print("\nPrerequisite checks failed. Please fix the issues above and try again.")
        sys.exit(1)
    
    print("\nAll checks passed! Starting the API server...")
    
    # Configure uvicorn
    config = {
        "app": "api:app",
        "host": "0.0.0.0",
        "port": 8000,
        "reload": True,  # Enable auto-reload on code changes
        "workers": 1,    # Number of worker processes
        "log_level": "info"
    }
    
    try:
        print(f"\nAPI will be available at:")
        print(f"- Documentation: http://localhost:{config['port']}/docs")
        print(f"- Alternative docs: http://localhost:{config['port']}/redoc")
        print(f"- API root: http://localhost:{config['port']}")
        print("\nPress Ctrl+C to stop the server")
        
        # Run the server
        uvicorn.run(**config)
        
    except KeyboardInterrupt:
        print("\nShutting down API server...")
    except Exception as e:
        print(f"\nError starting API server: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 