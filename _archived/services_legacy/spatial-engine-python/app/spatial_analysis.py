"""
Spatial Analysis Engine

Pure functions for spatial relationships, overlap detection, subdivision validation.
Grid-first queries. No unnecessary abstractions.
"""

from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass
from enum import Enum
from parcel_identity import ParcelIdentity
from shapely.geometry import Polygon
import math


class SpatialRelation(Enum):
    """Spatial relationship type"""
    IDENTICAL = "identical"       # Same geometry
    OVERLAP = "overlap"           # Partial overlap
    CONTAINED = "contained"       # A inside B
    CONTAINS = "contains"         # A encloses B
    DISJOINT = "disjoint"         # No intersection
    TOUCH = "touch"               # Boundary only


@dataclass
class SpatialResult:
    """Result of spatial analysis"""
    relation: SpatialRelation
    overlap_area_sqm: float
    overlap_pct_a: float  # overlap as % of parcel A
    overlap_pct_b: float  # overlap as % of parcel B


def poly_to_shapely(polygon: List[Tuple[float, float]]) -> Polygon:
    """Convert polygon list to Shapely Polygon"""
    coords = polygon[:-1] if polygon[0] == polygon[-1] else polygon
    return Polygon(coords)


def analyze_spatial_relation(
    parcel_a: ParcelIdentity,
    parcel_b: ParcelIdentity
) -> SpatialResult:
    """
    Deterministic spatial relationship analysis.
    
    Returns:
        SpatialResult with relation type and overlap metrics
    """
    try:
        poly_a = poly_to_shapely(parcel_a.polygon)
        poly_b = poly_to_shapely(parcel_b.polygon)
        
        if not poly_a.is_valid or not poly_b.is_valid:
            return SpatialResult(
                relation=SpatialRelation.DISJOINT,
                overlap_area_sqm=0,
                overlap_pct_a=0,
                overlap_pct_b=0
            )
        
        # Compute intersection
        intersection = poly_a.intersection(poly_b)
        overlap_area = intersection.area
        
        # Compute percentages
        area_a = poly_a.area
        area_b = poly_b.area
        pct_a = (overlap_area / area_a * 100) if area_a > 0 else 0
        pct_b = (overlap_area / area_b * 100) if area_b > 0 else 0
        
        # Classify relation
        if overlap_area == 0:
            relation = SpatialRelation.DISJOINT
        elif poly_a.equals(poly_b):
            relation = SpatialRelation.IDENTICAL
        elif poly_a.contains(poly_b):
            relation = SpatialRelation.CONTAINS
        elif poly_b.contains(poly_a):
            relation = SpatialRelation.CONTAINED
        else:
            relation = SpatialRelation.OVERLAP
        
        # Convert from decimal degree area to sqm
        overlap_sqm = overlap_area * 111000 * 111000
        
        return SpatialResult(
            relation=relation,
            overlap_area_sqm=overlap_sqm,
            overlap_pct_a=pct_a,
            overlap_pct_b=pct_b
        )
    
    except Exception:
        return SpatialResult(
            relation=SpatialRelation.DISJOINT,
            overlap_area_sqm=0,
            overlap_pct_a=0,
            overlap_pct_b=0
        )


def detect_conflicts(
    subject: ParcelIdentity,
    others: List[ParcelIdentity]
) -> List[Tuple[ParcelIdentity, SpatialResult]]:
    """
    Find all spatial conflicts for subject parcel.
    
    Returns list of (other_parcel, spatial_result) for conflicts.
    """
    conflicts = []
    
    for other in others:
        result = analyze_spatial_relation(subject, other)
        
        # Conflict if any overlap
        if result.relation != SpatialRelation.DISJOINT:
            conflicts.append((other, result))
    
    return conflicts


def is_valid_subdivision(
    parent: ParcelIdentity,
    children: List[ParcelIdentity],
    tolerance_pct: float = 1.0
) -> Tuple[bool, str]:
    """
    Validate if children form valid subdivision of parent.
    
    Rules:
    1. Each child fully contained in parent
    2. Children don't overlap each other
    3. Combined area ≈ parent area (within tolerance)
    
    Returns:
        (is_valid, reason)
    """
    if not children:
        return False, "No children provided"
    
    parent_poly = poly_to_shapely(parent.polygon)
    parent_area = parent.area_sqm
    
    # Rule 1: Each child contained in parent
    for child in children:
        child_poly = poly_to_shapely(child.polygon)
        if not parent_poly.contains(child_poly):
            return False, f"Child {child.parcel_id} not fully contained in parent"
    
    # Rule 2: Children don't overlap each other
    for i, child_a in enumerate(children):
        for child_b in children[i+1:]:
            result = analyze_spatial_relation(child_a, child_b)
            if result.relation != SpatialRelation.DISJOINT:
                return False, f"Child {child_a.parcel_id} overlaps with {child_b.parcel_id}"
    
    # Rule 3: Area conservation (with tolerance)
    total_child_area = sum(c.area_sqm for c in children)
    area_diff_pct = abs(total_child_area - parent_area) / parent_area * 100
    
    if area_diff_pct > tolerance_pct:
        return False, (
            f"Area mismatch: parent={parent_area:.0f}sqm, "
            f"children={total_child_area:.0f}sqm, "
            f"diff={area_diff_pct:.1f}%"
        )
    
    return True, "Valid subdivision"


def grid_bounded_query(
    parcels: List[ParcelIdentity],
    grid_key: str
) -> List[ParcelIdentity]:
    """
    Grid-bounded spatial query: return parcels in grid cell.
    
    Optimization: Cache by grid_key in governance layer.
    """
    return [p for p in parcels if p.grid_ref.key() == grid_key]


def find_overlaps_in_grid(
    parcel: ParcelIdentity,
    grid_parcels: List[ParcelIdentity]
) -> List[Tuple[ParcelIdentity, SpatialResult]]:
    """
    Find all overlaps with parcel in same grid cell.
    
    Optimization: Query only grid-bounded parcels, not all.
    """
    return detect_conflicts(parcel, grid_parcels)
