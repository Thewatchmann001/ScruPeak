
import logging
import sys
import os
import time
from dotenv import load_dotenv

# Load env from parent directory
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

# Mock settings
from app.core import config
# Force reload settings to pick up env vars
import importlib
importlib.reload(config)

from app.services.blockchain import BlockchainService

# Setup logging
logging.basicConfig(level=logging.INFO)

def test_blockchain():
    print("Testing Blockchain Service...")
    
    # Generate a dummy hash
    data = {"test": "data", "time": time.time()}
    data_hash = BlockchainService.generate_hash(data)
    print(f"Generated Hash: {data_hash}")
    
    try:
        print("Attempting to send transaction...")
        tx_sig = BlockchainService.send_transaction(data_hash)
        print(f"SUCCESS! Transaction Signature: {tx_sig}")
    except Exception as e:
        print(f"FAILURE: {e}")
        # Check if it's the expected insufficient funds error
        if "Attempt to debit an account but found no record of a prior credit" in str(e):
            print("\nNOTE: This failure is EXPECTED if the wallet has 0 SOL.")
            print("The code is correctly trying to interact with the Solana blockchain.")
            print("You need to fund the wallet: DJAYwHf2VtcrDvvFEYukzb5BAeqZXkN8XMvpbHaMDP6p")

if __name__ == "__main__":
    test_blockchain()
