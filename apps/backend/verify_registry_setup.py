import sys
import os
# Ensure app module can be found
sys.path.append(os.getcwd())

try:
    from app.main import app
    from app.models.registry import LandClassification
    
    print("Checking router registration...")
    found = False
    for route in app.routes:
        if hasattr(route, 'path') and route.path == "/api/v1/registry/classifications":
            found = True
            print(f"Found route: {route.path}")
            break
            
    if found:
        print("SUCCESS: Registry router is registered.")
    else:
        print("FAILURE: Registry router not found.")
        # List all routes to help debug
        # for route in app.routes:
        #     if hasattr(route, 'path'):
        #         print(route.path)
        sys.exit(1)

    print("Checking model definition...")
    if LandClassification.__tablename__ == 'land_classifications':
        print("SUCCESS: LandClassification model is defined.")
    else:
        print("FAILURE: LandClassification model issue.")
        sys.exit(1)

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
