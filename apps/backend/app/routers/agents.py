"""
Real estate agents router - agent verification, ratings, transactions
"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging

from app.core.database import get_db
from app.models import Agent, User, UserRole
from app.schemas import AgentCreate, AgentResponse
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/register",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register as real estate agent"
)
async def register_agent(
    agent_data: AgentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register user as real estate agent"""
    
    # Check if already an agent
    result = await db.execute(
        select(Agent).where(Agent.user_id == current_user.id)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered as agent"
        )
    
    new_agent = Agent(
        user_id=current_user.id,
        ministry_registration_number=agent_data.ministry_registration_number,
        wallet_address=agent_data.wallet_address
    )
    
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    
    logger.info(f"New agent registered: {new_agent.id}")
    
    return new_agent


@router.get(
    "/me",
    response_model=AgentResponse,
    summary="Get current agent profile"
)
async def get_agent_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get authenticated agent's profile"""
    result = await db.execute(
        select(Agent).where(Agent.user_id == current_user.id)
    )
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found"
        )
    
    return agent


@router.get(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="Get agent profile by ID"
)
async def get_agent(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get agent profile (public information)"""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return agent
