import sys
import os

# Ensure project root (backend) is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

print("--- Testing App Factory ---")
try:
    from app import create_app
    print("Imported create_app successfully.")
    
    app = create_app('development')
    print("Successfully created Flask app instance.")
    
    if app:
        print("App object is not None.")
    else:
        print("App object is None.")

    print("--- App Factory Test Complete ---")

except Exception as e:
    import traceback
    print(f"AN ERROR OCCURRED: {e}")
    traceback.print_exc()



