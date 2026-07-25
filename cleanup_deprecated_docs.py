import os
import glob
import logging
import zipfile
import argparse
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def cleanup_deprecated_md(dry_run: bool = False):
    """
    Scans, archives, and removes deprecated documentation files as identified in PROMPT_ENGINEERING.md.
    Targeting fragmented docs in extensions and vertex optimizer paths.
    """
    # Use script location as root to avoid hardcoded paths
    root_path = Path(__file__).parent.resolve()
    
    deprecated_patterns = [
        str(root_path / "vertex/prompt_optimizer/docs/*.md"),
        str(root_path / "extensions/**/*.md")
    ]
    
    archive_dir = root_path / "legacy_docs"
    archive_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"deprecated_docs_{timestamp}.zip"
    zip_path = archive_dir / zip_filename

    removed_count = 0
    files_to_cleanup = []

    # Identify files
    for pattern in deprecated_patterns:
        for file_path in glob.glob(pattern, recursive=True):
            if "PROMPT_ENGINEERING.md" not in file_path and os.path.isfile(file_path):
                files_to_cleanup.append(file_path)

    if not files_to_cleanup:
        logger.info("No deprecated documents found to clean up.")
        return

    # Archive and then remove
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in files_to_cleanup:
                # Store with relative path to maintain structure
                arcname = os.path.relpath(file_path, str(root_path))
                zipf.write(file_path, arcname=arcname)
                logger.info(f"Archived: {arcname}")

        # Verification step before deletion
        if not zip_path.exists() or zip_path.stat().st_size == 0:
            raise Exception("ZIP archive creation failed or file is empty.")

        if dry_run:
            logger.info(f"[DRY RUN] Would remove {len(files_to_cleanup)} files. Archive created at {zip_path}")
            return

        for file_path in files_to_cleanup:
            try:
                os.remove(file_path)
                removed_count += 1
                # Log relative path for cleaner output
                rel_path = os.path.relpath(file_path, str(root_path))
                logger.info(f"Removed: {rel_path}")
            except Exception as e:
                logger.error(f"Failed to remove {file_path}: {e}")
    except Exception as e:
        logger.error(f"Archival failed, skipping deletion: {e}")
        return

    logger.info(f"Cleanup complete. Archived in {zip_path}. Total files removed: {removed_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cleanup deprecated markdown documentation.")
    parser.add_argument('--dry-run', action='store_true', help="Perform a trial run with no changes made.")
    args = parser.parse_args()

    cleanup_deprecated_md(dry_run=args.dry_run)