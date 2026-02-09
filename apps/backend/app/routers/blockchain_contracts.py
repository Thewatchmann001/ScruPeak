"""
Blockchain Router
Smart contract deployment and transaction management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
from typing import Optional, List
import uuid
import json
import hashlib
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.blockchain_contracts import (
    SmartContractDeployment, BlockchainTransaction, BlockchainVerification,
    SmartContractEvent, BlockchainAuditTrail, BlockchainAddress,
    SmartContractType, BlockchainNetwork, ContractDeploymentStatus,
    BlockchainTransactionStatus
)
from app.utils.auth import get_current_user, get_current_admin
from app.models import User

router = APIRouter(prefix="/api/v1/blockchain")

# ============================================================================
# SCHEMAS
# ============================================================================

class DeployContractRequest(BaseModel):
    """Deploy a new smart contract"""
    contract_type: SmartContractType
    contract_name: str
    network: BlockchainNetwork = BlockchainNetwork.SOLANA_TESTNET
    source_code: str
    deployment_config: dict = {}
    description: Optional[str] = None


class RecordTransactionRequest(BaseModel):
    """Record transaction on blockchain"""
    land_id: str
    transaction_type: str
    data_to_record: dict
    from_address: str
    to_address: Optional[str] = None


class VerifyTitleRequest(BaseModel):
    """Verify title authenticity on blockchain"""
    land_id: str
    on_chain_hash: str


class TransactionResponse(BaseModel):
    """Response for blockchain transaction"""
    transaction_hash: str
    status: str
    land_id: str
    created_at: datetime


# ============================================================================
# ENDPOINTS: CONTRACT DEPLOYMENT & MANAGEMENT
# ============================================================================

@router.post("/contracts/deploy", status_code=status.HTTP_201_CREATED)
async def deploy_smart_contract(
    request: DeployContractRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Deploy a new smart contract"""
    try:
        # Generate contract address (simulated - in production use actual deployment)
        contract_address = f"0x{hashlib.sha256(request.source_code.encode()).hexdigest()[:40]}"
        source_hash = hashlib.sha256(request.source_code.encode()).hexdigest()
        
        # Create deployment record
        deployment = SmartContractDeployment(
            contract_type=request.contract_type,
            contract_name=request.contract_name,
            network=request.network,
            contract_address=contract_address,
            deployed_by=current_user.id,
            source_code_hash=source_hash,
            deployment_config=request.deployment_config,
            description=request.description,
            status=ContractDeploymentStatus.DEPLOYING
        )
        db.add(deployment)
        await db.flush()
        
        # Audit trail
        audit = BlockchainAuditTrail(
            contract_id=deployment.id,
            action="DEPLOYMENT_INITIATED",
            actor_id=current_user.id,
            actor_email=current_user.email,
            action_details={"network": request.network, "contract_type": request.contract_type},
            changes_description=f"Deploying {request.contract_type} contract to {request.network}"
        )
        db.add(audit)
        
        await db.commit()
        
        return {
            "contract_id": str(deployment.id),
            "contract_address": contract_address,
            "status": "deploying",
            "network": request.network,
            "created_at": deployment.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/contracts/{contract_id}/finalize-deployment")
async def finalize_deployment(
    contract_id: str,
    deployment_tx: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Finalize contract deployment after on-chain confirmation"""
    try:
        id = uuid.UUID(contract_id)
        result = await db.execute(
            select(SmartContractDeployment).where(SmartContractDeployment.id == id)
        )
        deployment = result.scalar_one_or_none()
        
        if not deployment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
        
        deployment.status = ContractDeploymentStatus.DEPLOYED
        deployment.deployment_tx_hash = deployment_tx
        deployment.deployed_at = datetime.utcnow()
        
        # Audit trail
        audit = BlockchainAuditTrail(
            contract_id=deployment.id,
            action="DEPLOYMENT_CONFIRMED",
            actor_id=current_user.id,
            actor_email=current_user.email,
            transaction_hash=deployment_tx,
            changes_description="Contract deployment confirmed on blockchain"
        )
        db.add(audit)
        await db.commit()
        
        return {
            "contract_id": str(deployment.id),
            "status": "deployed",
            "deployment_tx": deployment_tx
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract ID")


@router.get("/contracts/{contract_id}")
async def get_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get smart contract details"""
    try:
        id = uuid.UUID(contract_id)
        result = await db.execute(
            select(SmartContractDeployment).where(SmartContractDeployment.id == id)
        )
        contract = result.scalar_one_or_none()
        
        if not contract:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
        
        return {
            "id": str(contract.id),
            "name": contract.contract_name,
            "type": contract.contract_type,
            "address": contract.contract_address,
            "network": contract.network,
            "status": contract.status,
            "deployed_at": contract.deployed_at,
            "version": contract.version
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract ID")


@router.get("/contracts", response_model=List[dict])
async def list_contracts(
    contract_type: Optional[str] = Query(None),
    network: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List smart contracts"""
    query = select(SmartContractDeployment)
    
    if contract_type:
        query = query.where(SmartContractDeployment.contract_type == contract_type)
    if network:
        query = query.where(SmartContractDeployment.network == network)
    
    result = await db.execute(query.limit(100))
    contracts = result.scalars().all()
    
    return [
        {
            "id": str(c.id),
            "name": c.contract_name,
            "type": c.contract_type,
            "network": c.network,
            "status": c.status,
            "address": c.contract_address
        }
        for c in contracts
    ]


# ============================================================================
# ENDPOINTS: TRANSACTION RECORDING
# ============================================================================

@router.post("/transactions/record-title", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def register_title_on_blockchain(
    request: RecordTransactionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register land title on blockchain"""
    try:
        land_id = uuid.UUID(request.land_id)
        
        # Get or find appropriate contract
        contract_result = await db.execute(
            select(SmartContractDeployment).where(
                (SmartContractDeployment.contract_type == SmartContractType.LAND_TITLE) &
                (SmartContractDeployment.status == ContractDeploymentStatus.ACTIVE)
            ).limit(1)
        )
        contract = contract_result.scalar_one_or_none()
        
        if not contract:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title contract not deployed")
        
        # Generate transaction hash
        tx_hash = f"0x{hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()}"
        
        # Record transaction
        transaction = BlockchainTransaction(
            transaction_hash=tx_hash,
            land_id=land_id,
            contract_id=contract.id,
            network=contract.network,
            transaction_type="RegisterTitle",
            status=BlockchainTransactionStatus.PENDING,
            data_recorded=request.data_to_record,
            from_address=request.from_address,
            to_address=request.to_address,
            submitted_at=datetime.utcnow()
        )
        db.add(transaction)
        await db.commit()
        
        return TransactionResponse(
            transaction_hash=tx_hash,
            status=transaction.status,
            land_id=str(land_id),
            created_at=transaction.created_at
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/transactions/transfer-title")
async def transfer_title_on_blockchain(
    from_owner_id: str,
    to_owner_id: str,
    land_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record title transfer on blockchain"""
    try:
        land_id_uuid = uuid.UUID(land_id)
        
        # Get contract
        contract_result = await db.execute(
            select(SmartContractDeployment).where(
                SmartContractDeployment.contract_type == SmartContractType.LAND_TITLE
            ).limit(1)
        )
        contract = contract_result.scalar_one_or_none()
        
        if not contract:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title contract not found")
        
        # Create transaction
        tx_hash = f"0x{hashlib.sha256(f'{from_owner_id}{to_owner_id}{land_id}'.encode()).hexdigest()}"
        
        transaction = BlockchainTransaction(
            transaction_hash=tx_hash,
            land_id=land_id_uuid,
            contract_id=contract.id,
            network=contract.network,
            transaction_type="TransferTitle",
            status=BlockchainTransactionStatus.PENDING,
            data_recorded={
                "from_owner": from_owner_id,
                "to_owner": to_owner_id,
                "transfer_timestamp": datetime.utcnow().isoformat()
            },
            from_address=from_owner_id,
            to_address=to_owner_id,
            submitted_at=datetime.utcnow()
        )
        db.add(transaction)
        await db.commit()
        
        return {
            "transaction_hash": tx_hash,
            "status": "pending",
            "from": from_owner_id,
            "to": to_owner_id
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")


@router.get("/transactions/{tx_hash}")
async def get_transaction(
    tx_hash: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get blockchain transaction details"""
    result = await db.execute(
        select(BlockchainTransaction).where(BlockchainTransaction.transaction_hash == tx_hash)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    
    return {
        "transaction_hash": transaction.transaction_hash,
        "status": transaction.status,
        "type": transaction.transaction_type,
        "land_id": str(transaction.land_id),
        "network": transaction.network,
        "submitted_at": transaction.submitted_at,
        "confirmed_at": transaction.confirmed_at,
        "finalized_at": transaction.finalized_at,
        "confirmations": transaction.confirmation_count
    }


@router.post("/transactions/{tx_hash}/confirm")
async def confirm_transaction(
    tx_hash: str,
    confirmation_count: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Confirm blockchain transaction"""
    result = await db.execute(
        select(BlockchainTransaction).where(BlockchainTransaction.transaction_hash == tx_hash)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    
    transaction.confirmation_count = confirmation_count
    if confirmation_count >= transaction.required_confirmations:
        transaction.status = BlockchainTransactionStatus.FINALIZED
        transaction.finalized_at = datetime.utcnow()
    else:
        transaction.status = BlockchainTransactionStatus.CONFIRMED
        transaction.confirmed_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        "transaction_hash": tx_hash,
        "status": transaction.status,
        "confirmations": confirmation_count
    }


# ============================================================================
# ENDPOINTS: VERIFICATION
# ============================================================================

@router.post("/verify-title", status_code=status.HTTP_201_CREATED)
async def verify_title_on_blockchain(
    request: VerifyTitleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify land title authenticity on blockchain"""
    try:
        land_id = uuid.UUID(request.land_id)
        
        # Perform verification
        off_chain_hash = hashlib.sha256(str(land_id).encode()).hexdigest()
        hashes_match = off_chain_hash == request.on_chain_hash
        
        verification = BlockchainVerification(
            land_id=land_id,
            verification_type="title_authenticity",
            is_valid=hashes_match,
            on_chain_hash=request.on_chain_hash,
            off_chain_hash=off_chain_hash,
            hashes_match=hashes_match,
            verified_by=current_user.id,
            verification_result={
                "authentic": hashes_match,
                "verification_date": datetime.utcnow().isoformat()
            }
        )
        db.add(verification)
        await db.commit()
        
        return {
            "verification_id": str(verification.id),
            "is_valid": verification.is_valid,
            "hashes_match": hashes_match,
            "verified_at": verification.verified_at
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid land ID")


@router.get("/verify-title/{land_id}")
async def get_title_verification(
    land_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get title verification status"""
    try:
        id = uuid.UUID(land_id)
        result = await db.execute(
            select(BlockchainVerification).where(
                BlockchainVerification.land_id == id
            ).order_by(BlockchainVerification.verified_at.desc()).limit(1)
        )
        verification = result.scalar_one_or_none()
        
        if not verification:
            return {"verified": False, "message": "No verification found"}
        
        return {
            "verified": verification.is_valid,
            "verification_type": verification.verification_type,
            "verified_at": verification.verified_at,
            "next_due": verification.next_verification_due
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid land ID")


# ============================================================================
# ENDPOINTS: WALLET MANAGEMENT
# ============================================================================

@router.post("/wallet/register", status_code=status.HTTP_201_CREATED)
async def register_blockchain_address(
    address: str,
    network: BlockchainNetwork,
    label: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register blockchain wallet address for user"""
    # Check if already exists
    existing = await db.execute(
        select(BlockchainAddress).where(
            (BlockchainAddress.user_id == current_user.id) &
            (BlockchainAddress.address == address) &
            (BlockchainAddress.network == network)
        )
    )
    
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Address already registered")
    
    wallet = BlockchainAddress(
        user_id=current_user.id,
        address=address,
        network=network,
        label=label
    )
    db.add(wallet)
    await db.commit()
    
    return {
        "address": address,
        "network": network,
        "status": "registered",
        "requires_verification": True
    }


@router.get("/wallet/my-addresses")
async def get_my_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get my registered blockchain addresses"""
    result = await db.execute(
        select(BlockchainAddress).where(BlockchainAddress.user_id == current_user.id)
    )
    addresses = result.scalars().all()
    
    return [
        {
            "address": a.address,
            "network": a.network,
            "label": a.label,
            "verified": a.is_verified,
            "verified_at": a.verified_at
        }
        for a in addresses
    ]


# ============================================================================
# ENDPOINTS: STATISTICS & MONITORING
# ============================================================================

@router.get("/statistics")
async def get_blockchain_statistics(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get blockchain system statistics"""
    # Get contract counts
    contracts_result = await db.execute(select(SmartContractDeployment))
    contracts = contracts_result.scalars().all()
    
    # Get transaction counts
    tx_result = await db.execute(select(BlockchainTransaction).limit(1000))
    transactions = tx_result.scalars().all()
    
    total_contracts = len(contracts)
    deployed_contracts = len([c for c in contracts if c.status == ContractDeploymentStatus.DEPLOYED])
    
    total_transactions = len(transactions)
    confirmed_tx = len([t for t in transactions if t.status == BlockchainTransactionStatus.CONFIRMED])
    finalized_tx = len([t for t in transactions if t.status == BlockchainTransactionStatus.FINALIZED])
    
    return {
        "total_contracts": total_contracts,
        "deployed_contracts": deployed_contracts,
        "total_transactions": total_transactions,
        "confirmed_transactions": confirmed_tx,
        "finalized_transactions": finalized_tx,
        "success_rate": f"{(finalized_tx/total_transactions*100):.1f}%" if total_transactions > 0 else "0%"
    }
