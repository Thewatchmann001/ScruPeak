"""
Blockchain Integration System
Solana-based smart contracts for immutable land title and transaction records
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Enum, JSON, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class BlockchainNetwork(str, enum.Enum):
    """Supported blockchain networks"""
    SOLANA_MAINNET = "solana_mainnet"
    SOLANA_TESTNET = "solana_testnet"
    ETHEREUM_MAINNET = "ethereum_mainnet"
    POLYGON_MAINNET = "polygon_mainnet"


class SmartContractType(str, enum.Enum):
    """Types of smart contracts"""
    LAND_TITLE = "land_title"  # Register and transfer land titles
    DISPUTE_RESOLUTION = "dispute_resolution"  # Record disputes on chain
    ESCROW_MANAGEMENT = "escrow_management"  # Manage escrow funds
    COMPLIANCE_AUDIT = "compliance_audit"  # Record compliance checks
    FRAUD_FLAG = "fraud_flag"  # Record fraud incidents


class ContractDeploymentStatus(str, enum.Enum):
    """Status of smart contract deployment"""
    DRAFT = "draft"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    FAILED = "failed"


class BlockchainTransactionStatus(str, enum.Enum):
    """Status of blockchain transaction"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FINALIZED = "finalized"
    FAILED = "failed"
    REVERTED = "reverted"


class SmartContractDeployment(Base):
    """Deployed smart contracts on blockchain"""
    __tablename__ = "smart_contract_deployments"
    __table_args__ = (
        Index("idx_scd_contract_type", "contract_type"),
        Index("idx_scd_network", "network"),
        Index("idx_scd_status", "status"),
        Index("idx_scd_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Contract metadata
    contract_type = Column(Enum(SmartContractType), nullable=False)
    contract_name = Column(String(255), nullable=False)
    network = Column(Enum(BlockchainNetwork), default=BlockchainNetwork.SOLANA_TESTNET, nullable=False)
    
    # Contract addresses and references
    contract_address = Column(String(255), nullable=False, unique=True)
    program_id = Column(String(255), nullable=True)  # For Solana programs
    deployment_tx_hash = Column(String(255), nullable=True)
    
    # Deployment details
    deployed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ContractDeploymentStatus), default=ContractDeploymentStatus.DRAFT, nullable=False)
    
    # Code and configuration
    source_code_hash = Column(String(255), nullable=False)  # SHA-256 hash of contract code
    abi = Column(JSON, nullable=True)  # Contract ABI for interaction
    deployment_config = Column(JSON, nullable=False)  # Deployment parameters
    
    # Verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    verification_url = Column(String(255), nullable=True)
    
    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    deployed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Metadata
    description = Column(Text, nullable=True)
    version = Column(String(50), default="1.0.0", nullable=False)
    contract_metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<SmartContractDeployment {self.contract_name} - {self.status}>"


class BlockchainTransaction(Base):
    """Blockchain transactions recorded"""
    __tablename__ = "blockchain_transactions"
    __table_args__ = (
        Index("idx_bt_land_id", "land_id"),
        Index("idx_bt_status", "status"),
        Index("idx_bt_created_at", "created_at"),
        Index("idx_bt_tx_hash", "transaction_hash"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Transaction reference
    transaction_hash = Column(String(255), nullable=False, unique=True)
    block_hash = Column(String(255), nullable=True)
    block_number = Column(Integer, nullable=True)
    
    # Related entities
    land_id = Column(UUID(as_uuid=True), ForeignKey("land.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("escrow.id"), nullable=True)
    dispute_id = Column(UUID(as_uuid=True), nullable=True)  # Optional dispute reference
    
    # Contract and network
    contract_id = Column(UUID(as_uuid=True), ForeignKey("smart_contract_deployments.id"), nullable=False)
    network = Column(Enum(BlockchainNetwork), nullable=False)
    
    # Transaction details
    transaction_type = Column(String(100), nullable=False)  # RegisterTitle, TransferTitle, RecordDispute
    status = Column(Enum(BlockchainTransactionStatus), default=BlockchainTransactionStatus.PENDING, nullable=False)
    
    # Data recorded on chain
    data_recorded = Column(JSON, nullable=False)
    
    # Parties involved
    from_address = Column(String(255), nullable=False)
    to_address = Column(String(255), nullable=True)
    
    # Execution details
    gas_used = Column(Integer, nullable=True)
    gas_price = Column(String(255), nullable=True)
    transaction_fee = Column(String(255), nullable=True)
    
    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    finalized_at = Column(DateTime, nullable=True)
    
    # Status tracking
    confirmation_count = Column(Integer, default=0, nullable=False)
    required_confirmations = Column(Integer, default=32, nullable=False)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    revert_reason = Column(Text, nullable=True)
    
    transaction_metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<BlockchainTransaction {self.transaction_hash[:8]}... - {self.status}>"


class BlockchainVerification(Base):
    """Verification of blockchain records"""
    __tablename__ = "blockchain_verifications"
    __table_args__ = (
        Index("idx_bv_land_id", "land_id"),
        Index("idx_bv_verified_at", "verified_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    land_id = Column(UUID(as_uuid=True), ForeignKey("land.id"), nullable=False)
    
    # Verification details
    verification_type = Column(String(100), nullable=False)  # title_authenticity, ownership_chain, etc.
    is_valid = Column(Boolean, default=False, nullable=False)
    
    # On-chain data
    on_chain_hash = Column(String(255), nullable=False)
    off_chain_hash = Column(String(255), nullable=False)
    hashes_match = Column(Boolean, default=False, nullable=False)
    
    # Verification results
    verification_result = Column(JSON, nullable=False)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Timeline
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    next_verification_due = Column(DateTime, nullable=True)
    
    # Audit
    verification_details = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<BlockchainVerification {self.verification_type} - {'Valid' if self.is_valid else 'Invalid'}>"


class SmartContractEvent(Base):
    """Events emitted by smart contracts"""
    __tablename__ = "smart_contract_events"
    __table_args__ = (
        Index("idx_sce_contract_id", "contract_id"),
        Index("idx_sce_event_type", "event_type"),
        Index("idx_sce_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Contract and transaction
    contract_id = Column(UUID(as_uuid=True), ForeignKey("smart_contract_deployments.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("blockchain_transactions.id"), nullable=True)
    
    # Event details
    event_type = Column(String(100), nullable=False)  # TitleRegistered, TitleTransferred, etc.
    event_name = Column(String(255), nullable=False)
    
    # Data from event
    event_data = Column(JSON, nullable=False)
    indexed_fields = Column(JSON, nullable=True)  # Fields used for filtering
    
    # Position in block
    log_index = Column(Integer, nullable=True)
    block_number = Column(Integer, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Parsed data
    parsed_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<SmartContractEvent {self.event_type}>"


class BlockchainAuditTrail(Base):
    """Audit trail for blockchain operations"""
    __tablename__ = "blockchain_audit_trails"
    __table_args__ = (
        Index("idx_bat_contract_id", "contract_id"),
        Index("idx_bat_action", "action"),
        Index("idx_bat_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("smart_contract_deployments.id"), nullable=False)
    
    # Action tracking
    action = Column(String(100), nullable=False)  # Deployed, Updated, Verified, Called
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    actor_email = Column(String(255), nullable=False)
    
    # Details
    action_details = Column(JSON, nullable=True)
    transaction_hash = Column(String(255), nullable=True)
    
    # Changes
    changes_description = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<BlockchainAuditTrail {self.action}>"


class BlockchainAddress(Base):
    """Blockchain wallet addresses for users"""
    __tablename__ = "blockchain_addresses"
    __table_args__ = (
        Index("idx_ba_user_id", "user_id"),
        Index("idx_ba_network", "network"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Address details
    address = Column(String(255), nullable=False)
    network = Column(Enum(BlockchainNetwork), nullable=False)
    label = Column(String(100), nullable=True)  # Personal, Business, etc.
    
    # Verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_signature = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Activity
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<BlockchainAddress {self.address[:8]}... - {self.network}>"
