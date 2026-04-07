
import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    db_path = "apps/backend/landbiznes.db"
    if not os.path.exists(db_path):
        logger.error(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("platform_fee_amount", "NUMERIC(18, 2)"),
        ("seller_payout_amount", "NUMERIC(18, 2)")
    ]

    for col_name, col_type in columns_to_add:
        try:
            # Check if column exists
            cursor.execute(f"PRAGMA table_info(escrow)")
            columns = [info[1] for info in cursor.fetchall()]

            if col_name not in columns:
                logger.info(f"Adding column {col_name} to escrow table...")
                cursor.execute(f"ALTER TABLE escrow ADD COLUMN {col_name} {col_type}")
                logger.info(f"Column {col_name} added successfully.")
            else:
                logger.info(f"Column {col_name} already exists in escrow table.")
        except Exception as e:
            logger.error(f"Error adding column {col_name}: {e}")

    conn.commit()
    conn.close()
    logger.info("Migration completed.")

if __name__ == "__main__":
    migrate()
