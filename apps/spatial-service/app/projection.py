import math
from pyproj import Transformer, CRS

# Cache for transformers to avoid expensive re-initialization
_transformer_cache = {}

def get_transformer(lon: float) -> Transformer:
    """Determine UTM zone from longitude and return cached transformer."""
    # UTM zones are 6 degrees wide. Zone 1 starts at 180W.
    zone = int((lon + 180) / 6) + 1
    epsg = f"EPSG:326{zone}" # 326xx for Northern Hemisphere
    
    if epsg not in _transformer_cache:
        _transformer_cache[epsg] = Transformer.from_crs(
            "EPSG:4326",
            epsg,
            always_xy=True
        )
    return _transformer_cache[epsg]

def latlon_to_utm(lon: float, lat: float) -> tuple[float, float]:
    """
    Convert lat/lon to UTM using a dynamically calculated zone.
    Ensures accuracy across West African borders.
    """
    transformer = get_transformer(lon)
    easting, northing = transformer.transform(lon, lat)
    return easting, northing
