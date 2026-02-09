
import requests
import uuid
import sys

BASE_URL = "http://localhost:8000"

def print_result(name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"   {details}")

def verify_backend():
    print("Starting Backend Verification...\n")
    
    # 1. Health Check
    try:
        resp = requests.get(f"{BASE_URL}/health")
        if resp.status_code == 200:
            print_result("Health Check", True, f"Status: {resp.json().get('status')}")
        else:
            print_result("Health Check", False, f"Code: {resp.status_code}")
    except Exception as e:
        print_result("Health Check", False, f"Error: {e}")
        return

    # 2. Check Land Classifications (Seeded Data)
    try:
        resp = requests.get(f"{BASE_URL}/api/v1/registry/classifications")
        if resp.status_code == 200:
            data = resp.json()
            count = len(data)
            if count > 0:
                print_result("Land Classifications", True, f"Found {count} classifications")
            else:
                print_result("Land Classifications", False, "No classifications found (Seeding failed?)")
        else:
            print_result("Land Classifications", False, f"Code: {resp.status_code}")
    except Exception as e:
        print_result("Land Classifications", False, f"Error: {e}")

    # 3. Auth - Register
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "Password123!"
    user_data = {
        "email": email,
        "name": "Test User",
        "password": password,
        "role": "buyer",
        "phone": "1234567890"
    }
    
    token = None
    
    try:
        resp = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
        if resp.status_code == 201:
            data = resp.json()
            token = data.get("access_token")
            print_result("Auth Registration", True, f"User: {email}")
        else:
            print_result("Auth Registration", False, f"Code: {resp.status_code}, Body: {resp.text}")
    except Exception as e:
        print_result("Auth Registration", False, f"Error: {e}")

    # 4. Auth - Login
    print("Testing Auth Login...")
    try:
        login_data = {"email": email, "password": password}
        resp = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
        if resp.status_code == 200:
            data = resp.json()
            if "access_token" in data:
                print_result("Auth Login", True, "Login successful, token received")
            else:
                print_result("Auth Login", False, "No access_token in response")
        else:
            print_result("Auth Login", False, f"Code: {resp.status_code}, Body: {resp.text}")
    except Exception as e:
        print_result("Auth Login", False, f"Error: {e}")

    # 5. Verify Token works (if we have protected endpoints)
    # Skipping for now as we don't have a clear protected endpoint to test without setting up more data
    
    print("\nVerification Complete.")

if __name__ == "__main__":
    verify_backend()
