import asyncio
import logging
from app.services.ml_training_pipeline import MLModelTrainer, ProductionDataPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    trainer = MLModelTrainer()
    pipeline = ProductionDataPipeline()
    
    logger.info("Starting ML Training Pipeline...")
    
    # 1. Collect and Train Fraud Detection
    X_fraud, y_fraud, _ = await pipeline.collect_fraud_detection_data()
    metrics = await pipeline.validate_data_quality(X_fraud, y_fraud)
    
    if metrics.data_quality_score > 80:
        results, version = await trainer.train_fraud_detection_model(X_fraud, y_fraud)
        logger.info(f"Fraud Model Updated: {version.version} (F1: {version.f1_score})")
    
    # 2. Collect and Train Price Prediction
    X_price, y_price, _ = await pipeline.collect_price_prediction_data()
    results, version = await trainer.train_price_prediction_model(X_price, y_price)
    logger.info(f"Price Model Updated: {version.version} (RMSE: {version.rmse})")

    logger.info("Pipeline Execution Complete.")

if __name__ == "__main__":
    asyncio.run(main())