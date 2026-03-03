"""
Grid Reference System

Divides national land space into fixed spatial grids.
Each grid cell is identified by a deterministic grid_id.

Grid Rule (enforce):
- If a polygon spans multiple grids, the grid containing the first vertex
  is the reference grid.
- Parcel code = reference_grid_key + sequence_number
"""

import math
from dataclasses import dataclass
from origin import GRID_SIZE_METERS, TOTAL_GRIDS_EAST, ORIGIN_LAT, ORIGIN_LON
from projection import latlon_to_utm


@dataclass
class GridReference:
    """Grid placement for a parcel"""
    grid_id: int
    grid_x: int
    grid_y: int
    reference_vertex_index: int = 0  # vertex index that defines the grid

    def canonical_key(self) -> str:
        """Deterministic grid key for parcel coding"""
        # Using 5 digits for grid_id to accommodate range up to ~34,000 (200x171)
        return f"{self.formatted_grid_id()}{self.grid_x:02d}{self.grid_y:02d}"

    def formatted_grid_id(self) -> str:
        """Return the zero-padded grid ID (e.g., 00001)"""
        return f"{self.grid_id:05d}"


def compute_grid_id(lat: float, lon: float):
    """
    Compute grid ID and position from lat/lon.
    
    Args:
        lat: latitude
        lon: longitude
    
    Returns:
        (grid_id, grid_x, grid_y)
    """
    land_e, land_n = latlon_to_utm(lon, lat)
    origin_e, origin_n = latlon_to_utm(ORIGIN_LON, ORIGIN_LAT)

    dx = land_e - origin_e
    dy = land_n - origin_n

    # Apply tolerance for points slightly outside due to projection
    if dx < 0 and dx > -50.0: dx = 0
    if dy < 0 and dy > -50.0: dy = 0

    if dx < 0 or dy < 0:
        raise ValueError(f"Point ({lat}, {lon}) lies outside defined national grid (dx={dx:.2f}, dy={dy:.2f})")

    grid_x = math.floor(dx / GRID_SIZE_METERS)
    grid_y = math.floor(dy / GRID_SIZE_METERS)

    grid_id = grid_y * TOTAL_GRIDS_EAST + grid_x

    return grid_id, grid_x, grid_y


def determine_reference_grid(geometry: list) -> tuple:
    """
    Determine reference grid from a polygon geometry.
    
    Grid Rule: The grid containing the first vertex is the reference grid.
    
    Args:
        geometry: List of (lat, lon) tuples representing closed polygon
    
    Returns:
        (grid_id, grid_x, grid_y, reference_vertex_index=0)
    """
    if not geometry or len(geometry) < 2:
        raise ValueError("Geometry must have at least 2 vertices")
    
    # First vertex determines the reference grid
    first_vertex = geometry[0]
    lat, lon = first_vertex
    
    grid_id, grid_x, grid_y = compute_grid_id(lat, lon)
    
    return grid_id, grid_x, grid_y
