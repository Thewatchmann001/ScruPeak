import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("Successfully imported app.main:app")
except Exception as e:
    print(f"Failed to import app.main: {e}")
    import traceback
    traceback.print_exc()
