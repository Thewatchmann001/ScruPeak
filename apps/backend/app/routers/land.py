"""
Land properties router - CRUD operations, search, filtering
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from uuid import UUID
import logging
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models import Land, User, LandStatus, UserRole
from app.schemas import (
    LandCreate, LandUpdate, LandResponse, LandDetailResponse,
    LandSearchFilters, PaginatedResponse, MarketInsightsResponse
)
from app.utils.auth import get_current_user
from app.tasks import (
    sync_land_to_search,
    generate_title_document,
    process_blockchain_hash
)
from app.services.search_service import SearchService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    response_model=LandResponse,
    status_code=status.HTTP_201_CREATED,
    summary="List new land property"
)
async def create_land(
    land_data: LandCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new land property listing"""
    
    # Check permissions: Only Sellers (Owners), Agents, and Admins can list land
    if current_user.role not in [UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered Sellers, Agents, and Admins can list land properties."
        )

    if not current_user.kyc_verified:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="KYC verification is required to list land."
        )
    
    new_land = Land(
        owner_id=current_user.id,
        title=land_data.title,
        description=land_data.description,
        size_sqm=land_data.size_sqm,
        price=land_data.price,
        region=land_data.region,
        district=land_data.district,
        latitude=land_data.location.latitude,
        longitude=land_data.location.longitude
    )
    
    db.add(new_land)
    await db.commit()
    await db.refresh(new_land)
    
    logger.info(f"New land listed: {new_land.id} by user {current_user.id}")

    # Trigger background tasks (Non-blocking)
    land_dict = {
        "id": str(new_land.id),
        "title": new_land.title,
        "description": new_land.description,
        "price": float(new_land.price),
        "region": new_land.region,
        "district": new_land.district,
        "size_sqm": float(new_land.size_sqm),
        "status": new_land.status,
        "owner_id": str(new_land.owner_id),
        "latitude": float(new_land.latitude),
        "longitude": float(new_land.longitude)
    }

    # 1. Sync to Search Engine
    sync_land_to_search.delay(land_dict)

    # 2. Generate PDF Title Deed (Long running)
    generate_title_document.delay(str(new_land.id), current_user.full_name)

    # 3. Process Blockchain Verification (Long running)
    process_blockchain_hash.delay(str(new_land.id))
    
    return new_land


@router.get(
    "/my-listings",
    response_model=PaginatedResponse,
    summary="Get current user's land listings"
)
async def get_my_lands(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all lands listed by the current user"""
    query = select(Land).where(Land.owner_id == current_user.id)
    
    # Get total count
    count_result = await db.execute(query)
    total = len(count_result.scalars().all())
    
    # Apply pagination
    result = await db.execute(
        query.offset((page - 1) * page_size).limit(page_size)
    )
    items = result.scalars().all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "has_next": page * page_size < total,
        "has_prev": page > 1
    }


@router.get(
    "/insights",
    response_model=MarketInsightsResponse,
    summary="Get market insights and statistics"
)
async def get_market_insights(
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated market statistics (public endpoint)"""
    
    # 1. District Stats
    # Group by district, calculate avg price and count
    district_stmt = select(
        Land.district,
        func.avg(Land.price).label("avg_price"),
        func.count(Land.id).label("count")
    ).where(
        Land.status == LandStatus.AVAILABLE
    ).group_by(Land.district).limit(10)
    
    district_result = await db.execute(district_stmt)
    districts = district_result.all()
    
    district_stats = []
    for d in districts:
        district_stats.append({
            "district": d.district,
            "avg_price": float(d.avg_price) if d.avg_price else 0,
            "listing_count": d.count,
            "trend_percent": 0.0  # Placeholder for complex trend calc
        })
        
    # 2. Price Trends (Last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    trend_stmt = select(
        func.date_trunc('month', Land.created_at).label("month"),
        func.avg(Land.price).label("avg_price"),
        func.count(Land.id).label("count")
    ).where(
        Land.created_at >= six_months_ago
    ).group_by("month").order_by("month")
    
    trend_result = await db.execute(trend_stmt)
    trends = trend_result.all()
    
    price_trends = []
    for t in trends:
        price_trends.append({
            "month": t.month.strftime("%b"),
            "avg_price": float(t.avg_price) if t.avg_price else 0,
            "listing_volume": t.count
        })
        
    # 3. General Stats
    status_stmt = select(Land.status, func.count(Land.id)).group_by(Land.status)
    status_result = await db.execute(status_stmt)
    status_counts = dict(status_result.all())
    
    total_listings = sum(status_counts.values())
    active_listings = status_counts.get(LandStatus.AVAILABLE, 0)
    sold_listings = status_counts.get(LandStatus.SOLD, 0)
    
    return {
        "district_stats": district_stats,
        "price_trends": price_trends,
        "total_listings": total_listings,
        "active_listings": active_listings,
        "sold_listings": sold_listings
    }


@router.get(
    "/{land_id}",
    response_model=LandDetailResponse,
    summary="Get land property details"
)
async def get_land(
    land_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get land property details with all related data"""
    result = await db.execute(
        select(Land).where(Land.id == land_id)
    )
    land = result.scalars().first()
    
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land property not found"
        )
    
    return land


@router.put(
    "/{land_id}",
    response_model=LandResponse,
    summary="Update land property"
)
async def update_land(
    land_id: UUID,
    land_update: LandUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update land property (owner only)"""
    result = await db.execute(
        select(Land).where(Land.id == land_id)
    )
    land = result.scalars().first()
    
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land property not found"
        )
    
    if land.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only land owner can update"
        )
    
    # Update fields
    if land_update.title:
        land.title = land_update.title
    if land_update.description:
        land.description = land_update.description
    if land_update.price:
        land.price = land_update.price
    if land_update.status:
        land.status = land_update.status
    
    await db.commit()
    await db.refresh(land)
    
    logger.info(f"Land property updated: {land_id}")

    # Sync updates to search engine
    land_dict = {
        "id": str(land.id),
        "title": land.title,
        "description": land.description,
        "price": float(land.price),
        "region": land.region,
        "district": land.district,
        "size_sqm": float(land.size_sqm),
        "status": land.status,
        "owner_id": str(land.owner_id),
        "latitude": float(land.latitude),
        "longitude": float(land.longitude)
    }
    sync_land_to_search.delay(land_dict)
    
    return land


@router.delete(
    "/{land_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete land property"
)
async def delete_land(
    land_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete land property (owner only)"""
    result = await db.execute(
        select(Land).where(Land.id == land_id)
    )
    land = result.scalars().first()
    
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land property not found"
        )
    
    if land.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only land owner can delete"
        )
    
    await db.delete(land)
    await db.commit()
    
    logger.info(f"Land property deleted: {land_id}")


@router.get(
    "",
    response_model=PaginatedResponse,
    summary="Search land properties"
)
async def search_land(
    q: str = Query(None, description="Search term for full-text search"),
    status: LandStatus = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    region: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Search and filter land properties"""
    
    # Use MeiliSearch if query is provided (High performance)
    if q:
        try:
            search_service = SearchService()
            
            # Build filter string
            filters_list = []
            if status:
                filters_list.append(f'status = "{status}"')
            if region:
                filters_list.append(f'region = "{region}"')
            if min_price is not None:
                filters_list.append(f'price >= {min_price}')
            if max_price is not None:
                filters_list.append(f'price <= {max_price}')
            
            filter_str = " AND ".join(filters_list) if filters_list else None
            
            results = search_service.search(
                query=q,
                filter_str=filter_str,
                limit=page_size,
                offset=(page - 1) * page_size
            )
            
            # Hybrid Search: Get IDs from Search Engine -> Fetch full objects from DB
            ids = [hit["id"] for hit in results["hits"]]
            
            if not ids:
                return {
                    "items": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": 0,
                    "has_next": False,
                    "has_prev": False
                }
                
            # Fetch from DB
            stmt = select(Land).where(Land.id.in_(ids))
            db_results = await db.execute(stmt)
            lands = db_results.scalars().all()
            
            # Reorder to match search results relevance
            land_map = {str(land.id): land for land in lands}
            ordered_lands = [land_map[id] for id in ids if id in land_map]
            
            total_hits = results.get("estimatedTotalHits", 0)
            
            return {
                "items": ordered_lands,
                "total": total_hits,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_hits + page_size - 1) // page_size,
                "has_next": page * page_size < total_hits,
                "has_prev": page > 1
            }

        except Exception as e:
            logger.error(f"Search engine error: {e}. Fallback to DB.")
            # Fallback to DB search below
            pass
    
    query = select(Land)
    
    # Build filters
    filters = []
    if status:
        filters.append(Land.status == status)
    if min_price is not None:
        filters.append(Land.price >= min_price)
    if max_price is not None:
        filters.append(Land.price <= max_price)
    if region:
        filters.append(Land.region == region)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Get total count
    # Note: This count method is inefficient for large tables, but standard for SQL.
    # MeiliSearch count above is much faster (estimated).
    count_result = await db.execute(select(Land).where(and_(*filters)) if filters else select(Land))
    total = len(count_result.scalars().all())
    
    # Apply pagination
    result = await db.execute(
        query.offset((page - 1) * page_size).limit(page_size)
    )
    items = result.scalars().all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "has_next": page * page_size < total,
        "has_prev": page > 1
    }
