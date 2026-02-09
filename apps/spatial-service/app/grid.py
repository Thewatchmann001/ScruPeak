import math
from origin import GRID_SIZE_METERS, TOTAL_GRIDS_EAST
from projection import latlon_to_utm

def compute_grid_id(lat: float, lon: float):
    land_e, land_n = latlon_to_utm(lon, lat)
    origin_e, origin_n = latlon_to_utm(ORIGIN_LON, ORIGIN_LAT)

    dx = land_e - origin_e
    dy = land_n - origin_n

    if dx < 0 or dy < 0:
        raise ValueError("Point lies outside defined national grid")

    grid_x = math.floor(dx / GRID_SIZE_METERS)
    grid_y = math.floor(dy / GRID_SIZE_METERS)

    grid_id = grid_y * TOTAL_GRIDS_EAST + grid_x

    return grid_id, grid_x, grid_y
