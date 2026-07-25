class SpatialServiceError(Exception):
    """Base exception for all spatial service errors."""
    pass

class ParcelNotFoundError(SpatialServiceError):
    """Raised when a parcel code or ID does not exist in the registry."""
    pass

class InvalidGeometryError(SpatialServiceError):
    """Raised when a provided geometry is not a valid closed polygon."""
    pass

class SpatialConflictError(SpatialServiceError):
    """Raised when a spatial operation (like registration) violates overlap rules."""
    pass

class LineageError(SpatialServiceError):
    """Raised when lineage constraints (e.g. invalid subdivision) are violated."""
    pass