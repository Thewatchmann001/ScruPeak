import hashlib
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional
import base58

from solana.rpc.api import Client
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.system_program import TransferParams, transfer
from solders.instruction import Instruction

from app.core.config import get_settings

logger = logging.getLogger(__name__)

class BlockchainService:
    """
    Service for interacting with the Solana Blockchain.
    Stores land data hashes on-chain using the Memo Program.
    """
    
    # Memo Program ID on Solana
    MEMO_PROGRAM_ID = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcQb")

    @staticmethod
    def get_client():
        settings = get_settings()
        return Client(settings.SOLANA_RPC_URL)

    @staticmethod
    def get_wallet() -> Optional[Keypair]:
        settings = get_settings()
        if not settings.SOLANA_WALLET_SECRET:
            logger.error("SOLANA_WALLET_SECRET not configured")
            return None
        try:
            secret_list = json.loads(settings.SOLANA_WALLET_SECRET)
            return Keypair.from_bytes(bytes(secret_list))
        except Exception as e:
            logger.error(f"Failed to load wallet: {e}")
            return None

    @staticmethod
    def generate_hash(data: Dict[str, Any]) -> str:
        """Generate SHA-256 hash of the data"""
        # Sort keys to ensure consistent hashing
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()

    @classmethod
    def send_transaction(cls, data_hash: str) -> str:
        """
        Send a transaction to Solana with the hash in the Memo field.
        Returns the transaction signature (tx_hash).
        """
        settings = get_settings()
        if not settings.BLOCKCHAIN_ENABLED:
            logger.warning("Blockchain disabled, returning mock hash")
            return f"mock_tx_{hashlib.sha256(str(time.time()).encode()).hexdigest()[:16]}"

        client = cls.get_client()
        wallet = cls.get_wallet()
        
        if not wallet:
            raise ValueError("Solana wallet not configured")

        try:
            logger.info(f"Preparing Solana transaction for hash: {data_hash}")
            
            # Create Memo Instruction
            # The Memo program expects the data as bytes
            memo_data = data_hash.encode("utf-8")
            memo_ix = Instruction(
                program_id=cls.MEMO_PROGRAM_ID,
                accounts=[],
                data=memo_data
            )
            
            # Get latest blockhash
            recent_blockhash = client.get_latest_blockhash().value.blockhash
            
            # Create Transaction
            tx = Transaction.new_signed_with_payer(
                [memo_ix],
                wallet.pubkey(),
                [wallet],
                recent_blockhash
            )
            
            # Send Transaction
            logger.info("Sending transaction to Solana...")
            response = client.send_transaction(tx)
            
            tx_signature = str(response.value)
            logger.info(f"Transaction sent! Signature: {tx_signature}")
            
            # Confirm Transaction (optional but good for verification)
            # In a background task, we might not want to wait too long, 
            # but for data integrity it's good to know it landed.
            # For now we return the signature immediately.
            
            return tx_signature

        except Exception as e:
            logger.error(f"Solana transaction failed: {e}")
            raise e

    # Alias for backward compatibility if needed, or we update the task to call send_transaction
    simulate_transaction = send_transaction

    @staticmethod
    def verify_transaction(tx_hash: str) -> bool:
        """Verify if a transaction is confirmed on the blockchain"""
        try:
            client = BlockchainService.get_client()
            # Convert string signature to Solders signature if needed, or pass string
            # get_transaction usually expects Signature object or string depending on version
            # For now assuming string works or we convert
            
            # Note: get_transaction might require specific config to return full details
            resp = client.get_transaction(
                base58.b58decode(tx_hash) if isinstance(tx_hash, str) else tx_hash, 
                "json"
            )
            return resp.value is not None
        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return False

    @classmethod
    def prepare_land_data(cls, land_id: str, owner_id: str, title: str, location: Dict) -> Dict:
        """Format land data for blockchain storage"""
        return {
            "asset_type": "LAND_TITLE",
            "version": "1.0",
            "id": str(land_id),
            "owner": str(owner_id),
            "title": title,
            "location": location,
            "timestamp": datetime.utcnow().isoformat()
        }
