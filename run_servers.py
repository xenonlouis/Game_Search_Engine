import subprocess
import sys
import os
from threading import Thread
import time

def run_frontend():
    """Run the React frontend"""
    try:
        # Change to frontend directory
        frontend_dir = os.path.join(os.getcwd(), 'frontend')
        os.chdir(frontend_dir)
        
        # Run npm start
        if sys.platform == 'win32':
            subprocess.run('npm run start', shell=True)
        else:
            subprocess.run(['npm', 'run', 'start'])
    except Exception as e:
        print(f"Error starting frontend: {str(e)}")

def run_backend():
    """Run the FastAPI backend"""
    try:
        # Change back to root directory
        root_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(root_dir)
        
        # Run uvicorn
        if sys.platform == 'win32':
            subprocess.run('cd backend && uvicorn api:app --reload', shell=True)
        else:
            os.chdir('backend')
            subprocess.run(['uvicorn', 'api:app', '--reload'])
    except Exception as e:
        print(f"Error starting backend: {str(e)}")

def main():
    print("Starting Game Search Engine...")
    
    # Start frontend in a separate thread
    frontend_thread = Thread(target=run_frontend)
    frontend_thread.daemon = True
    
    try:
        # Start frontend
        print("Starting frontend at http://localhost:3000")
        frontend_thread.start()
        
        # Give frontend a moment to start
        time.sleep(2)
        
        # Start backend in main thread
        print("Starting backend at http://localhost:8000")
        run_backend()
        
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 