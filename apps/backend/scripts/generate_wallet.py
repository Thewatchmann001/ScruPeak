
import json
from solders.keypair import Keypair

def generate_keypair():
    """Generates a new Solana keypair and prints credentials."""
    kp = Keypair()
    
    # Public Key (Address)
    pubkey = str(kp.pubkey())
    
    # Secret Key (as list of integers, standard format for .env)
    # bytes(kp) returns the 64-byte secret key
    secret_key = list(bytes(kp))
    
    print("\n=== SOLANA KEYPAIR GENERATED ===")
    print(f"Public Key (Address): {pubkey}")
    print(f"Secret Key (JSON format for .env): {json.dumps(secret_key)}")
    print("================================")
    print("\nAdd this to your .env file:")
    print(f"SOLANA_WALLET_SECRET={json.dumps(secret_key)}")
    print("SOLANA_RPC_URL=https://api.devnet.solana.com")
    print("================================")

if __name__ == "__main__":
    generate_keypair()
