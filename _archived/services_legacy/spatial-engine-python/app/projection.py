from pyproj import Transformer

transformer = Transformer.from_crs(
    "EPSG:4326",  # WGS84
    "EPSG:32628", # UTM Zone 28N
    always_xy=True
)

def latlon_to_utm(lon: float, lat: float):
    easting, northing = transformer.transform(lon, lat)
    return easting, northing
