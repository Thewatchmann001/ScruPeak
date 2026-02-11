import uvicorn
import logging
import sys

# Configure logging to file
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='startup_log_2.txt',
    filemode='w'
)

logger = logging.getLogger(__name__)

print("Starting debug_run.py...")
logger.info("Starting debug_run.py...")

try:
    from app.main import app
    logger.info("App imported successfully")
    print("App imported successfully")
except Exception as e:
    logger.error(f"Failed to import app: {e}", exc_info=True)
    print(f"Failed to import app: {e}")
    sys.exit(1)

if __name__ == "__main__":
    try:
        logger.info("Starting uvicorn on port 8001...")
        print("Starting uvicorn on port 8001...")
        uvicorn.run(app, host="0.0.0.0", port=8001)
    except Exception as e:
        logger.error(f"Uvicorn crashed: {e}", exc_info=True)
        print(f"Uvicorn crashed: {e}")
