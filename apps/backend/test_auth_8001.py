import requests
import sys

# Configuration
BASE_URL = "http://localhost:8001/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login"
REGISTER_URL = f"{BASE_URL}/auth/register"

def test_register():
    print(f"Testing Registration at {REGISTER_URL}...")
    payload = {
        "email": "test_user_8001@example.com",
        "password": "Password123!",
        "full_name": "Test User 8001",
        "role": "buyer"
    }
    try:
        response = requests.post(REGISTER_URL, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code in [200, 201]:
            print("Registration SUCCESS")
            return True
        elif response.status_code == 400 and "already exists" in response.text:
            print("User already exists (Expected if run multiple times)")
            return True
        else:
            print("Registration FAILED")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login():
    print(f"\nTesting Login at {LOGIN_URL}...")
    payload = {
        "username": "test_user_8001@example.com",  # OAuth2 password flow uses 'username' for email
        "password": "Password123!"
    }
    try:
        response = requests.post(LOGIN_URL, data=payload) # OAuth2 expects form data, not JSON
        print(f"Status Code: {response.status_code}")
        # print(f"Response: {response.text}")
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"Login SUCCESS. Token: {token[:20]}...")
            return True
        else:
            print("Login FAILED")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Checking backend health...")
    try:
        requests.get("http://localhost:8001/health")
        print("Backend is reachable.")
    except:
        print("Backend is NOT reachable on port 8001.")
        sys.exit(1)
        
    reg_success = test_register()
    if reg_success:
        test_login()
