"""
Spatial utilities for LandBiznes backend
Handles grid ID calculation and coordinate projection
"""
import math
import random
from pyproj import Transformer

# Constants from spatial-service/origin.py
ORIGIN_LAT = 6.90
ORIGIN_LON = -13.30
GRID_SIZE_METERS = 2000
TOTAL_GRIDS_EAST = 200  # Updated to match optimized width

# Transformer for WGS84 to UTM Zone 28N (Sierra Leone)
_transformer = None

def get_transformer():
    global _transformer
    if _transformer is None:
        _transformer = Transformer.from_crs(
            "EPSG:4326",  # WGS84
            "EPSG:32628", # UTM Zone 28N
            always_xy=True
        )
    return _transformer

def latlon_to_utm(lon: float, lat: float):
    """Convert Lat/Lon to UTM Easting/Northing"""
    transformer = get_transformer()
    easting, northing = transformer.transform(lon, lat)
    return easting, northing

def compute_grid_id(lat: float, lon: float):
    """
    Compute grid ID from lat/lon.
    Returns: (grid_id, grid_x, grid_y)
    """
    land_e, land_n = latlon_to_utm(lon, lat)
    origin_e, origin_n = latlon_to_utm(ORIGIN_LON, ORIGIN_LAT)

    dx = land_e - origin_e
    dy = land_n - origin_n

    # Allow slight negative tolerance or clamp to 0 if very close
    # But strictly, points outside are invalid. For robustness, we might handle it.
    if dx < 0 or dy < 0:
        # Fallback or error? For now, let's assume valid points or clamp to 0
        if dx > -100: dx = 0
        if dy > -100: dy = 0
        # If still negative, it's outside
    
    grid_x = math.floor(dx / GRID_SIZE_METERS)
    grid_y = math.floor(dy / GRID_SIZE_METERS)
    
    # Ensure non-negative
    grid_x = max(0, grid_x)
    grid_y = max(0, grid_y)

    grid_id = grid_y * TOTAL_GRIDS_EAST + grid_x

    return grid_id, grid_x, grid_y

def generate_parcel_id(grid_id: int, sequence: int) -> str:
    """
    Generate the formatted Parcel ID
    Format: SL-{4_RANDOM}-{GRID_ID}-{SEQUENCE}
    Example: SL-1652-00564-0023
    """
    # Random 4-digit number (1000-9999) to simulate ULID random part
    random_part = random.randint(1000, 9999)
    
    return f"SL-{random_part}-{grid_id:05d}-{sequence:04d}"
