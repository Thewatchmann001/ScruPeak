import hashlib
import json
import logging
import os
import time
from datetime import datetime
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import base58
import boto3

from solana.rpc.api import Client
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.system_program import TransferParams, transfer
from solders.instruction import Instruction
from solana.rpc.types import TxOpts
from anchorpy import Program, Provider, Wallet, Context, Idl

from app.core.config import get_settings
# Import TaxService to enforce Revenue Engine
from app.services.tax_service import TaxService

logger = logging.getLogger(__name__)

class BlockchainService:
    """
    Service for interacting with the Solana Blockchain.
    Interacts with the LandTitleRegistry custom program.
    """

    _program: Optional[Program] = None
    MEMO_PROGRAM_ID = Pubkey.from_string("MemoSq4gqABmAn9kSuhD1Bt6WMgvBEJvGH646PsaVe")

    @staticmethod
    def get_client():
        settings = get_settings()
        return Client(settings.SOLANA_RPC_URL)

    @staticmethod
    def _get_secret(secret_name: str):
        """Fetch secret from AWS Secrets Manager"""
        session = boto3.session.Session()
        client = session.client(service_name='secretsmanager', region_name=os.getenv("AWS_REGION", "us-east-1"))
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        return get_secret_value_response['SecretString']

    @staticmethod
    def get_wallet() -> Optional[Keypair]:
        try:
            # Fetch from Secret Manager instead of Env
            secret_name = os.getenv("BLOCKCHAIN_SECRET_NAME", "scrupeak/solana/main-wallet")
            secret_data = BlockchainService._get_secret(secret_name)
            
            secret_list = json.loads(secret_data)
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
    async def send_transaction(cls, data_hash: str) -> str:
        """
        Send a transaction to Solana with the hash in the Memo field.
        Returns the transaction signature (tx_hash).
        """
        client = cls.get_client()
        wallet_kp = cls.get_wallet()
        
        if not wallet_kp:
            raise ValueError("Solana wallet not configured")

        try:
            logger.info(f"Preparing Solana transaction for hash: {data_hash}")
            
            # Create Memo Instruction
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
                wallet_kp.pubkey(),
                [wallet_kp],
                recent_blockhash
            )
            
            # Send Transaction
            logger.info("Sending transaction to Solana...")
            response = client.send_transaction(tx, opts=TxOpts(skip_preflight=False))
            
            tx_signature = str(response.value)
            logger.info(f"Transaction sent! Signature: {tx_signature}")
            
            return tx_signature
        except Exception as e:
            logger.error(f"Solana transaction failed: {e}")
            raise

    @classmethod
    async def get_program(cls) -> Program:
        """
        Initialize and return the Anchor Program client.
        """
        if cls._program is None:
            settings = get_settings()
            client = cls.get_client()
            wallet_kp = cls.get_wallet()
            if not wallet_kp:
                raise ValueError("Solana wallet not configured")
            
            wallet = Wallet(wallet_kp)
            provider = Provider(client, wallet)
            
            # Load IDL from assets
            idl_path = os.getenv("SOLANA_IDL_PATH", "app/assets/land_title_registry.json")
            with open(idl_path, "r") as f:
                idl_data = json.load(f)
            
            idl = Idl.from_json(idl_data)
            program_id = Pubkey.from_string(settings.LAND_TITLE_PROGRAM_ID)
            cls._program = Program(idl, program_id, provider)
        return cls._program

    @classmethod
    async def register_property_on_chain(
        cls, 
        land_id: str, 
        owner_pubkey: str, 
        area: int, 
        location: str, 
        papss_id: Optional[str] = None,
        db=None
    ) -> str:
        """
        Interact with LandTitleRegistry program to initialize property record.
        ENFORCES NATIONAL REVENUE ENGINE: Checks tax compliance and records PAPSS ID.
        """
        # NATIONAL REVENUE ENGINE LOGIC
        if db:
            try:
                # Convert land_id back to UUID for DB lookup
                from uuid import UUID
                is_compliant = await TaxService.check_tax_compliance(db, UUID(land_id))
                if not is_compliant:
                    raise ValueError("REVENUE ENGINE REJECTION: Outstanding taxes must be settled via PAPSS before on-chain title execution.")
            except Exception as e:
                logger.error(f"Tax compliance check failed: {e}")
                raise

        program = await cls.get_program()
        try:
            # Execute Anchor RPC call
            tx_hash = await program.rpc["initialize_property"](
                land_id,
                Pubkey.from_string(owner_pubkey),
                area,
                location,
                papss_id or "",
                ctx=Context(
                    accounts={
                        "property": Keypair.generate().pubkey(), # Mock: replace with actual property account PDA
                        "signer": program.provider.wallet.public_key,
                        "system_program": Pubkey.from_string("11111111111111111111111111111111"),
                    }
                )
            )
            return str(tx_hash)
        except Exception as e:
            logger.error(f"Solana transaction failed: {e}")
            raise

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
    def prepare_land_data(cls, land_id: str, owner_id: str, title: str, location: Dict, papss_id: Optional[str] = None) -> Dict:
        """Format land data for blockchain storage"""
        return {
            "asset_type": "LAND_TITLE",
            "version": "1.0",
            "id": str(land_id),
            "owner": str(owner_id),
            "title": title,
            "location": location,
            "papss_id": papss_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
