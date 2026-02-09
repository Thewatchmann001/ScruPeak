
import asyncio
import json
import os
import sys
from dotenv import load_dotenv
from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey
from solders.keypair import Keypair

# Load env from parent directory
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

async def fund_wallet():
    rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
    secret = os.getenv("SOLANA_WALLET_SECRET")
    
    if not secret:
        print("Error: SOLANA_WALLET_SECRET not found in .env")
        return

    try:
        secret_list = json.loads(secret)
        kp = Keypair.from_bytes(bytes(secret_list))
        pubkey = kp.pubkey()
        
        print(f"Connecting to {rpc_url}...")
        async with AsyncClient(rpc_url) as client:
            print(f"Requesting airdrop for {pubkey}...")
            # Request 0.5 SOL (500_000_000 lamports)
            resp = await client.request_airdrop(pubkey, 500_000_000)
            
            print(f"Airdrop signature: {resp.value}")
            print("Waiting for confirmation...")
            
            await client.confirm_transaction(resp.value)
            
            balance = await client.get_balance(pubkey)
            print(f"New Balance: {balance.value / 1_000_000_000} SOL")
            print("Wallet funded successfully!")

    except Exception as e:
        print(f"Failed to fund wallet: {e}")

if __name__ == "__main__":
    asyncio.run(fund_wallet())
