from fastapi import APIRouter, HTTPException, status
from celery.result import AsyncResult
from app.core.celery_app import celery
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/{task_id}", summary="Get background task status")
async def get_task_status(task_id: str):
    """
    Check the status of a background task (e.g., PDF generation, Blockchain sync)
    """
    try:
        task_result = AsyncResult(task_id, app=celery)
        
        response = {
            "task_id": task_id,
            "status": task_result.status,
            "result": task_result.result if task_result.ready() else None
        }
        
        if task_result.failed():
            response["error"] = str(task_result.result)
            
        return response
    except Exception as e:
        logger.error(f"Error fetching task status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
