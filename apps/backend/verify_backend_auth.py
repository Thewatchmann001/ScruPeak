import jwt
from app.utils.auth import jwt_handler
from app.core.config import get_settings

def test_token_decoding():
    settings = get_settings()
    secret = settings.SECRET_KEY
    algorithm = settings.ALGORITHM

    print(f"Testing with Secret: {secret[:5]}...{secret[-5:]}")
    print(f"Algorithm: {algorithm}")

    # Simulate a token from better-auth (might not have 'type')
    payload = {
        "sub": "user-123",
        "email": "test@example.com",
        "aud": "scrupeak-frontend" # Different audience
    }

    token = jwt.encode(payload, secret, algorithm=algorithm)
    print(f"Generated Token: {token[:20]}...")

    decoded = jwt_handler.decode_token(token)

    if decoded and decoded.get("sub") == "user-123":
        print("✅ Token decoding successful (Better-auth format support verified)")
    else:
        print("❌ Token decoding failed")
        print(f"Decoded: {decoded}")

if __name__ == "__main__":
    test_token_decoding()
