
import requests
import time

BASE_URL = "http://localhost:8001/api/auth"

def test_health():
    try:
        response = requests.get("http://localhost:8001/api/health")
        print(f"Health Check: {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_signup():
    email = f"testuser_{int(time.time())}@example.com"
    password = "password123"
    name = "Test User"
    
    payload = {
        "email": email,
        "password": password,
        "name": name,
        "role": "buyer"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=payload)
        print(f"Signup Status: {response.status_code}")
        if response.status_code == 200 or response.status_code == 201:
            print("Signup Successful")
            return email, password
        else:
            print(f"Signup Failed: {response.text}")
            return None, None
    except Exception as e:
        print(f"Signup Request Error: {e}")
        return None, None

def test_login(email, password):
    if not email:
        print("Skipping login test due to signup failure")
        return

    # OAuth2PasswordRequestForm expects form data, not JSON
    payload = {
        "username": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/token", data=payload)
        print(f"Login Status: {response.status_code}")
        if response.status_code == 200:
            print("Login Successful")
            print(f"Token: {response.json().get('access_token')[:20]}...")
        else:
            print(f"Login Failed: {response.text}")
    except Exception as e:
        print(f"Login Request Error: {e}")

if __name__ == "__main__":
    print("Testing Backend Endpoints...")
    test_health()
    email, password = test_signup()
    test_login(email, password)
