import requests
import time
import json

BASE_URL = "http://localhost:4005/api/auth"
HEALTH_URL = "http://localhost:4005/"

def test_health():
    try:
        response = requests.get(HEALTH_URL)
        print(f"Health Check: {response.status_code}")
        print(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Health Check Failed: {e}")
        return False

def test_signup(email, password, name):
    url = f"{BASE_URL}/sign-up/email"
    payload = {
        "email": email,
        "password": password,
        "name": name,
        "role": "user"
    }
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Signup Status: {response.status_code}")
        print(response.text)
        return response.status_code == 200 or "User already exists" in response.text
    except Exception as e:
        print(f"Signup Failed: {e}")
        return False

def test_signin(email, password):
    url = f"{BASE_URL}/sign-in/email"
    payload = {
        "email": email,
        "password": password
    }
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Signin Status: {response.status_code}")
        # print(response.text) # Can be long
        return response.status_code == 200
    except Exception as e:
        print(f"Signin Failed: {e}")
        return False

if __name__ == "__main__":
    print("Verifying Auth Server...")
    if test_health():
        ts = int(time.time())
        test_email = f"test_{ts}@example.com"
        test_password = "Password123!"
        test_name = "Test User"
        
        print(f"\nTesting Signup with {test_email}...")
        if test_signup(test_email, test_password, test_name):
            print("\nTesting Signin...")
            if test_signin(test_email, test_password):
                print("\nSUCCESS: Auth flows verified!")
            else:
                print("\nFAILURE: Signin failed.")
        else:
            print("\nFAILURE: Signup failed.")
    else:
        print("\nFAILURE: Auth server not healthy.")
