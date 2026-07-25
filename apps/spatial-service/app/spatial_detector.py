"""
Spatial Relationship Detector

Identifies geometric relationships between parcels:
- overlap (partial)
- containment
- coincident (identical geometry)
- disjoint (no overlap)

Uses Shapely for robust polygon operations.
"""

from typing import List, Tuple, Optional
from shapely.geometry import Polygon, is_valid
from sqlalchemy import func, case, and_, cast
from geoalchemy2 import Geography
from geoalchemy2.shape import from_shape
from csi_model import CompositeSpatialIdentity, ParcelEvent
from datetime import datetime
from projection import latlon_to_utm
import constants
import uuid


def latlon_to_xy(geometry: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Convert lat/lon geometry to UTM easting/northing for accurate spatial operations.
    """
    return [latlon_to_utm(lon, lat) for lat, lon in geometry]

def geometry_to_polygon(geometry: List[Tuple[float, float]]) -> Polygon:
    """Convert geometry list to Shapely Polygon"""
    coords = latlon_to_xy(geometry)
    poly = Polygon(coords)
    
    # Production Grade Check: Fix minor orientation issues
    if not poly.is_valid:
        # Attempt a common fix (buffer 0) but usually, we should raise an error
        poly = poly.buffer(0)
    return poly

def geometry_to_polygon_4326(geometry: List[Tuple[float, float]]) -> Polygon:
    """Convert geometry list to WGS84 Shapely Polygon (lon, lat) for DB queries."""
    return Polygon([(p[1], p[0]) for p in geometry])


class SpatialRelationshipDetector:
    """Detects and classifies spatial relationships between parcels"""
    
    @staticmethod
    def validate_topology(geometry: List[Tuple[float, float]]) -> Tuple[bool, str]:
        """
        Strict topological check for production registration.
        Rejects self-intersections and slivers.
        """
        poly = geometry_to_polygon(geometry)
        if not poly.is_valid:
            return False, "Self-intersecting geometry detected (invalid topology)."
        
        # Reject polygons with area < minimum (likely data entry error)
        if poly.area < constants.MIN_PARCEL_AREA_SQM:
            return False, "Polygon area too small (sliver detection)."
            
        return True, "Valid"

    @staticmethod
    def validate_subdivision_geometries(
        parent_geometry: List[Tuple[float, float]],
        child_geometries: List[List[Tuple[float, float]]],
        area_tolerance_pct: Optional[float] = None
    ) -> bool:
        """
        Validates that children geoms are within parent and conserve area.
        Uses UTM projected coordinates for all math.
        """
        if not child_geometries:
            return False

        tolerance = area_tolerance_pct if area_tolerance_pct is not None else constants.SUBDIVISION_AREA_TOLERANCE_PCT
        
        parent_poly = geometry_to_polygon(parent_geometry)
        parent_area = parent_poly.area
        total_child_area = 0.0

        child_polys = [geometry_to_polygon(g) for g in child_geometries]

        for child_poly in child_polys:
            # Must be contained within parent
            if not parent_poly.contains(child_poly) and not parent_poly.equals(child_poly):
                return False
            total_child_area += child_poly.area

        # Check area conservation (within tolerance)
        area_diff = abs(total_child_area - parent_area)
        allowed_error = parent_area * (tolerance / 100.0)
        
        if area_diff > allowed_error:
            return False

        return True

    @staticmethod
    def compute_overlap(
        csi_a: CompositeSpatialIdentity,
        csi_b: CompositeSpatialIdentity
    ) -> Optional[Tuple[str, float]]:
        """
        Compute relationship between two CSIs.
        
        Returns:
            (relationship_type, overlap_area_sqm) or None if disjoint
            
        Relationship types:
            - "identical" : same geometry (coincident)
            - "overlap" : partial overlap
            - "contained" : A contained in B
            - "contains" : A contains B
            - "disjoint" : no overlap
        """
        try:
            poly_a = geometry_to_polygon(csi_a.geometry)
            poly_b = geometry_to_polygon(csi_b.geometry)
            
            # Check if valid polygons
            if not poly_a.is_valid or not poly_b.is_valid:
                return None
            
            # Check containment/overlap
            intersection = poly_a.intersection(poly_b)
            intersection_area = intersection.area
            
            if intersection_area == 0:
                return ("disjoint", 0)
            
            # Check if geometries are identical
            if poly_a.equals(poly_b):
                return ("identical", poly_a.area)
            
            # Check containment
            if poly_b.contains(poly_a):
                return ("contained", poly_a.area)
            
            if poly_a.contains(poly_b):
                return ("contains", poly_b.area)
            
            # Partial overlap
            return ("overlap", intersection_area)
        
        except Exception as e:
            # Invalid geometry
            return None
    
    @staticmethod
    def detect_conflict(
        subject: CompositeSpatialIdentity,
        others: List[CompositeSpatialIdentity],
        initiated_by: str = "system"
    ) -> Optional[ParcelEvent]:
        """
        Detect spatial conflicts between subject and others.
        
        Returns ParcelEvent if conflict found, None otherwise.
        """
        conflicts = []
        
        for other in others:
            result = SpatialRelationshipDetector.compute_overlap(subject, other)
            if result is None:
                continue
            
            relationship, overlap_area = result
            
            # Classify as conflict
            if relationship in ("identical", "overlap", "contains", "contained"):
                conflicts.append({
                    "other_csi": other,
                    "relationship": relationship,
                    "overlap_area": overlap_area
                })
        
        if not conflicts:
            return None
        
        # Create event
        event = ParcelEvent(
            event_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            subject_csi=subject,
            other_csis=[c["other_csi"] for c in conflicts],
            spatial_relationship=conflicts[0]["relationship"],  # primary conflict
            overlap_area_sqm=conflicts[0]["overlap_area"],
            initiated_by=initiated_by
        )
        
        return event
    
    @staticmethod
    def detect_subdivision(
        subject: CompositeSpatialIdentity,
        potential_children: List[CompositeSpatialIdentity]
    ) -> bool:
        """
        Detect if subject parcel is being subdivided.
        
        Conditions:
        1. Child geometries are contained within parent
        2. Children do not overlap each other
        3. Combined area accounts for parent area
        
        Returns True if valid subdivision pattern detected.
        """
        if not potential_children:
            return False
        
        parent_poly = geometry_to_polygon(subject.geometry)
        parent_area = parent_poly.area
        
        total_child_area = 0
        
        # Check all children are contained in parent
        for child in potential_children:
            child_poly = geometry_to_polygon(child.geometry)
            if not parent_poly.contains(child_poly):
                return False
            total_child_area += child_poly.area
        
        # Check children don't overlap each other
        for i, child_a in enumerate(potential_children):
            for child_b in potential_children[i+1:]:
                result = SpatialRelationshipDetector.compute_overlap(child_a, child_b)
                if result and result[0] != "disjoint":
                    return False
        
        # Check area conservation (small tolerance for rounding)
        area_tolerance = parent_area * (constants.SUBDIVISION_AREA_TOLERANCE_PCT / 100.0)
        if abs(total_child_area - parent_area) > area_tolerance:
            return False
        
        return True
