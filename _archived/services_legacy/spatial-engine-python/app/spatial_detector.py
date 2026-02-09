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
from shapely.geometry import Polygon
from csi_model import CompositeSpatialIdentity, ParcelEvent
from datetime import datetime
import uuid


def latlon_to_xy(geometry: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Convert lat/lon geometry to cartesian for spatial operations.
    For now, treat as projected (assumes small area, no distortion).
    In production: use proper projection (UTM).
    """
    return geometry  # Direct use; in real system, apply projection


def geometry_to_polygon(geometry: List[Tuple[float, float]]) -> Polygon:
    """Convert geometry list to Shapely Polygon"""
    coords = latlon_to_xy(geometry)
    return Polygon(coords)


class SpatialRelationshipDetector:
    """Detects and classifies spatial relationships between parcels"""
    
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
        area_tolerance = parent_area * 0.01  # 1% tolerance
        if abs(total_child_area - parent_area) > area_tolerance:
            return False
        
        return True
